import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  host: process.env.HOST || '0.0.0.0',
  nodeEnv: process.env.NODE_ENV || 'development',

  database: {
    url: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/diamonddraft',
  },

  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'diamonddraft-dev-secret',
    expiresIn: '7d',
    refreshExpiresIn: '30d',
  },

  cors: {
    // In prod, prefer an explicit comma-separated allow-list over `*`
    origin: process.env.CORS_ORIGIN || (process.env.NODE_ENV === 'production' ? true : 'http://localhost:5173'),
  },

  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY || '',
  },

  // ─── VALORODDS CROSS-PLATFORM ──────────────────────────────────────
  // Shared HS256 secret between valorodds.com and diamonddraft.app.
  // Used to verify handoff tokens and entitlement webhook signatures.
  valorOdds: {
    ssoSecret: process.env.VALORODDS_SSO_SECRET || '',
    // Base URL of the ValorOdds API (used when we proxy injury/news feeds).
    // e.g. https://valorodds.com or https://valorodds-production.up.railway.app
    apiUrl: process.env.VALORODDS_API_URL || '',
    // How tiers from ValorOdds map to DiamondDraft entitlements.
    // Any ValorOdds user whose tier is in this set gets DiamondDraft PRO free.
    proTiers: (process.env.VALORODDS_PRO_TIERS || 'beta,premium,vip')
      .split(',')
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean),
    // Tiers that additionally unlock Commissioner+.
    commissionerPlusTiers: (process.env.VALORODDS_COMMISSIONER_TIERS || 'vip')
      .split(',')
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean),
  },
};