import { FastifyPluginAsync } from 'fastify';
import crypto from 'crypto';
import { config } from '../config';

/**
 * ValorOdds ⇄ DiamondDraft Single Sign-On
 *
 * Flow:
 *   1. User is signed in on valorodds.com.
 *   2. User clicks "Open Fantasy" on the ValorOdds dashboard.
 *   3. valorodds.com mints a short-lived HS256 JWT using the shared
 *      VALORODDS_SSO_SECRET with claims: { sub, email, displayName, tier,
 *      iat, exp, aud:"diamonddraft", jti }.
 *   4. Browser POSTs that token to DiamondDraft's /api/auth/sso/valorodds.
 *   5. DiamondDraft verifies the signature + expiry, upserts the user
 *      (linking via valorOddsUserId), and returns a normal DiamondDraft
 *      JWT + user record.
 *   6. Frontend stores the DD token like any other login.
 *
 * Entitlement is re-derived from the raw ValorOdds tier every handoff,
 * so a Stripe upgrade on ValorOdds takes effect the next time the user
 * opens fantasy (no separate webhook needed — though we also expose one
 * below for instant propagation).
 */

// ─── helpers ─────────────────────────────────────────────────────────
function base64UrlDecode(input: string): Buffer {
  // convert base64url → base64, pad, decode
  const b64 = input.replace(/-/g, '+').replace(/_/g, '/');
  const pad = b64.length % 4 === 0 ? '' : '='.repeat(4 - (b64.length % 4));
  return Buffer.from(b64 + pad, 'base64');
}

function safeEqual(a: Buffer, b: Buffer): boolean {
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

interface HandoffClaims {
  sub: string; // ValorOdds user id
  email: string;
  displayName?: string;
  username?: string;
  tier: string; // "free" | "beta" | "premium" | "vip"
  iat: number;
  exp: number;
  aud?: string;
  jti?: string;
}

/**
 * Verify an HS256 JWT produced by ValorOdds.
 * Returns claims on success, throws with a readable message on failure.
 */
function verifyValorOddsToken(token: string, secret: string): HandoffClaims {
  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('malformed_token');

  const [headerB64, payloadB64, signatureB64] = parts;

  // Header
  let header: { alg?: string; typ?: string };
  try {
    header = JSON.parse(base64UrlDecode(headerB64).toString('utf8'));
  } catch {
    throw new Error('malformed_header');
  }
  if (header.alg !== 'HS256') throw new Error('bad_alg');

  // Signature
  const expectedSig = crypto
    .createHmac('sha256', secret)
    .update(`${headerB64}.${payloadB64}`)
    .digest();
  const providedSig = base64UrlDecode(signatureB64);
  if (!safeEqual(providedSig, expectedSig)) throw new Error('bad_signature');

  // Payload
  let payload: HandoffClaims;
  try {
    payload = JSON.parse(base64UrlDecode(payloadB64).toString('utf8'));
  } catch {
    throw new Error('malformed_payload');
  }

  const now = Math.floor(Date.now() / 1000);
  if (typeof payload.exp !== 'number' || payload.exp < now) {
    throw new Error('token_expired');
  }
  if (payload.aud && payload.aud !== 'diamonddraft') {
    throw new Error('bad_audience');
  }
  if (!payload.sub || !payload.email || !payload.tier) {
    throw new Error('missing_claims');
  }
  return payload;
}

function tierToDDTier(rawTier: string): 'FREE' | 'PRO' | 'COMMISSIONER_PLUS' {
  const t = (rawTier || '').toLowerCase();
  if (config.valorOdds.commissionerPlusTiers.includes(t)) return 'COMMISSIONER_PLUS';
  if (config.valorOdds.proTiers.includes(t)) return 'PRO';
  return 'FREE';
}

// Simple in-memory jti cache to block token replay. For multi-instance
// deployments swap for Redis, but single-container (current Railway setup)
// is fine with a process-local set + TTL.
const usedJtis = new Map<string, number>();
function rememberJti(jti: string, expSec: number) {
  usedJtis.set(jti, expSec * 1000);
  // GC anything already past its exp
  const now = Date.now();
  for (const [k, v] of usedJtis) {
    if (v < now) usedJtis.delete(k);
  }
}
function jtiAlreadyUsed(jti: string): boolean {
  const exp = usedJtis.get(jti);
  if (!exp) return false;
  if (exp < Date.now()) {
    usedJtis.delete(jti);
    return false;
  }
  return true;
}

// ─── routes ──────────────────────────────────────────────────────────
const ssoRoutes: FastifyPluginAsync = async (fastify) => {
  /**
   * POST /api/auth/sso/valorodds
   * body: { token: "<handoff jwt from valorodds.com>" }
   * returns: { user, token, refreshToken, entitlement }
   */
  fastify.post('/api/auth/sso/valorodds', async (request, reply) => {
    if (!config.valorOdds.ssoSecret) {
      return reply.status(503).send({
        error: 'SSO is not configured on this deployment.',
        code: 'sso_not_configured',
      });
    }

    const { token } = (request.body as { token?: string }) || {};
    if (!token || typeof token !== 'string') {
      return reply.status(400).send({ error: 'token is required', code: 'token_required' });
    }

    let claims: HandoffClaims;
    try {
      claims = verifyValorOddsToken(token, config.valorOdds.ssoSecret);
    } catch (err: any) {
      return reply.status(401).send({
        error: 'Invalid SSO token',
        code: err?.message || 'invalid_token',
      });
    }

    if (claims.jti && jtiAlreadyUsed(claims.jti)) {
      return reply.status(401).send({ error: 'Token already used', code: 'replay' });
    }
    if (claims.jti) rememberJti(claims.jti, claims.exp);

    const email = claims.email.toLowerCase().trim();
    const displayName = claims.displayName || claims.username || email.split('@')[0];
    const newTier = tierToDDTier(claims.tier);

    // Upsert: match by valorOddsUserId first, then email.
    let user = await fastify.prisma.user.findFirst({
      where: {
        OR: [
          { valorOddsUserId: claims.sub },
          { email },
        ],
      },
    });

    if (user) {
      user = await fastify.prisma.user.update({
        where: { id: user.id },
        data: {
          valorOddsUserId: claims.sub,
          valorOddsTier: claims.tier.toLowerCase(),
          valorOddsLinkedAt: new Date(),
          tier: newTier,
          lastLoginAt: new Date(),
          // Only set displayName if the user hasn't customized it away from their email.
          ...(user.displayName === user.email.split('@')[0] && { displayName }),
        },
      });
    } else {
      // Generate a unique username from the email + ValorOdds sub prefix.
      const baseUsername = (claims.username || email.split('@')[0] || 'fan')
        .replace(/[^a-zA-Z0-9_]/g, '')
        .slice(0, 14) || 'fan';
      let username = baseUsername;
      let suffix = 0;
      while (await fastify.prisma.user.findUnique({ where: { username } })) {
        suffix += 1;
        username = `${baseUsername}${suffix}`.slice(0, 20);
        if (suffix > 50) {
          username = `${baseUsername}${claims.sub.slice(0, 6)}`.slice(0, 20);
          break;
        }
      }

      user = await fastify.prisma.user.create({
        data: {
          email,
          username,
          displayName,
          valorOddsUserId: claims.sub,
          valorOddsTier: claims.tier.toLowerCase(),
          valorOddsLinkedAt: new Date(),
          tier: newTier,
          lastLoginAt: new Date(),
          // No passwordHash — this user can only log in via SSO until they set one.
        },
      });
    }

    const ddToken = fastify.jwt.sign({ userId: user.id, email: user.email, tier: user.tier });
    const refreshToken = fastify.jwt.sign(
      { userId: user.id, email: user.email, tier: user.tier },
      { expiresIn: '30d' },
    );

    return reply.send({
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        displayName: user.displayName,
        tier: user.tier,
        avatarUrl: user.avatarUrl,
      },
      token: ddToken,
      refreshToken,
      entitlement: {
        ddTier: user.tier,
        valorOddsTier: user.valorOddsTier,
        viaValorOdds: true,
      },
    });
  });

  /**
   * POST /api/webhooks/valorodds/entitlement
   * Called by ValorOdds' Stripe webhook whenever a subscription tier changes.
   * Lets us update PRO status instantly instead of waiting for the next SSO handoff.
   *
   * Auth: HMAC-SHA256 signature of the raw body sent in X-Valorodds-Signature,
   * computed with the same VALORODDS_SSO_SECRET.
   *
   * body: { valorOddsUserId, email, tier }
   */
  fastify.post('/api/webhooks/valorodds/entitlement', {
    config: { rawBody: true } as any,
  }, async (request, reply) => {
    if (!config.valorOdds.ssoSecret) {
      return reply.status(503).send({ error: 'SSO not configured', code: 'sso_not_configured' });
    }

    const provided = request.headers['x-valorodds-signature'];
    if (!provided || typeof provided !== 'string') {
      return reply.status(401).send({ error: 'Missing signature' });
    }

    // Recompute the signature over the JSON body
    const raw = JSON.stringify(request.body);
    const expected = crypto
      .createHmac('sha256', config.valorOdds.ssoSecret)
      .update(raw)
      .digest('hex');

    try {
      if (!safeEqual(Buffer.from(provided, 'hex'), Buffer.from(expected, 'hex'))) {
        return reply.status(401).send({ error: 'Bad signature' });
      }
    } catch {
      return reply.status(401).send({ error: 'Bad signature' });
    }

    const { valorOddsUserId, email, tier } = (request.body as any) || {};
    if (!tier || (!valorOddsUserId && !email)) {
      return reply.status(400).send({ error: 'tier and (valorOddsUserId or email) required' });
    }

    const user = await fastify.prisma.user.findFirst({
      where: {
        OR: [
          valorOddsUserId ? { valorOddsUserId: String(valorOddsUserId) } : undefined,
          email ? { email: String(email).toLowerCase() } : undefined,
        ].filter(Boolean) as any,
      },
    });

    if (!user) {
      // Not linked yet — that's fine. First SSO handoff will create them.
      return reply.send({ updated: false, reason: 'user_not_linked' });
    }

    const newTier = tierToDDTier(String(tier));
    await fastify.prisma.user.update({
      where: { id: user.id },
      data: {
        tier: newTier,
        valorOddsTier: String(tier).toLowerCase(),
      },
    });

    return reply.send({ updated: true, ddTier: newTier });
  });

  /**
   * GET /api/me/entitlement
   * Returns the current user's DD entitlement + linkage status.
   */
  fastify.get('/api/me/entitlement', { preHandler: [fastify.authenticate] }, async (request) => {
    const user = await fastify.prisma.user.findUnique({
      where: { id: request.user.userId },
      select: {
        tier: true,
        valorOddsUserId: true,
        valorOddsTier: true,
        valorOddsLinkedAt: true,
      },
    });
    return {
      ddTier: user?.tier || 'FREE',
      valorOddsLinked: !!user?.valorOddsUserId,
      valorOddsTier: user?.valorOddsTier || null,
      valorOddsLinkedAt: user?.valorOddsLinkedAt || null,
    };
  });
};

export default ssoRoutes;