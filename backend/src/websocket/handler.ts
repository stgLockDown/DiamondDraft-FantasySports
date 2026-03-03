import { FastifyInstance } from 'fastify';
import { WebSocket } from 'ws';

interface ConnectedClient {
  ws: WebSocket;
  userId: string;
  username: string;
  room: string; // leagueId or draftId
  roomType: 'draft' | 'chat' | 'scoring';
}

const clients: Map<string, ConnectedClient> = new Map();

export function setupWebSocket(fastify: FastifyInstance) {
  fastify.get('/ws', { websocket: true }, (socket, request) => {
    const clientId = `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    socket.on('message', async (rawMessage: Buffer) => {
      try {
        const message = JSON.parse(rawMessage.toString());
        await handleMessage(fastify, socket, clientId, message);
      } catch (err) {
        socket.send(JSON.stringify({ type: 'error', message: 'Invalid message format' }));
      }
    });

    socket.on('close', () => {
      const client = clients.get(clientId);
      if (client) {
        // Notify room that user left
        broadcastToRoom(client.room, {
          type: 'user_left',
          userId: client.userId,
          username: client.username,
          timestamp: new Date().toISOString(),
        }, clientId);
        clients.delete(clientId);
      }
    });

    socket.on('error', (err: Error) => {
      fastify.log.error(`WebSocket error for ${clientId}: ${err.message}`);
      clients.delete(clientId);
    });
  });
}

async function handleMessage(
  fastify: FastifyInstance,
  ws: WebSocket,
  clientId: string,
  message: any
) {
  switch (message.type) {
    // ─── JOIN ROOM ────────────────────────────────────────────
    case 'join': {
      const { room, roomType, token } = message;

      // Verify JWT token
      let user: any;
      try {
        user = fastify.jwt.verify(token);
      } catch {
        ws.send(JSON.stringify({ type: 'error', message: 'Invalid token' }));
        return;
      }

      const dbUser = await fastify.prisma.user.findUnique({
        where: { id: user.userId },
        select: { id: true, displayName: true, username: true, avatarUrl: true },
      });

      if (!dbUser) {
        ws.send(JSON.stringify({ type: 'error', message: 'User not found' }));
        return;
      }

      clients.set(clientId, {
        ws,
        userId: dbUser.id,
        username: dbUser.displayName,
        room,
        roomType: roomType || 'chat',
      });

      // Send join confirmation
      ws.send(JSON.stringify({
        type: 'joined',
        room,
        userId: dbUser.id,
        username: dbUser.displayName,
        onlineUsers: getRoomUsers(room),
      }));

      // Notify others
      broadcastToRoom(room, {
        type: 'user_joined',
        userId: dbUser.id,
        username: dbUser.displayName,
        avatarUrl: dbUser.avatarUrl,
        timestamp: new Date().toISOString(),
      }, clientId);
      break;
    }

    // ─── CHAT MESSAGE ─────────────────────────────────────────
    case 'chat_message': {
      const client = clients.get(clientId);
      if (!client) return;

      const { content, messageType = 'TEXT' } = message;

      // Save to database
      const chatMsg = await fastify.prisma.chatMessage.create({
        data: {
          leagueId: client.room,
          userId: client.userId,
          content,
          type: messageType,
        },
        include: {
          user: { select: { id: true, displayName: true, username: true, avatarUrl: true } },
        },
      });

      // Broadcast to room
      broadcastToRoom(client.room, {
        type: 'chat_message',
        message: chatMsg,
      });
      break;
    }

    // ─── DRAFT PICK ───────────────────────────────────────────
    case 'draft_pick': {
      const client = clients.get(clientId);
      if (!client) return;

      const { draftId, playerId } = message;

      // Broadcast pick to all in draft room
      broadcastToRoom(client.room, {
        type: 'draft_pick_made',
        draftId,
        playerId,
        userId: client.userId,
        username: client.username,
        timestamp: new Date().toISOString(),
      });
      break;
    }

    // ─── DRAFT TIMER UPDATE ───────────────────────────────────
    case 'draft_timer': {
      const client = clients.get(clientId);
      if (!client) return;

      broadcastToRoom(client.room, {
        type: 'draft_timer_update',
        ...message.data,
      });
      break;
    }

    // ─── TYPING INDICATOR ─────────────────────────────────────
    case 'typing': {
      const client = clients.get(clientId);
      if (!client) return;

      broadcastToRoom(client.room, {
        type: 'user_typing',
        userId: client.userId,
        username: client.username,
        isTyping: message.isTyping,
      }, clientId);
      break;
    }

    // ─── REACTION ─────────────────────────────────────────────
    case 'reaction': {
      const client = clients.get(clientId);
      if (!client) return;

      broadcastToRoom(client.room, {
        type: 'reaction_update',
        messageId: message.messageId,
        emoji: message.emoji,
        userId: client.userId,
        username: client.username,
      });
      break;
    }

    // ─── SCORE UPDATE (for live scoring) ──────────────────────
    case 'score_update': {
      const client = clients.get(clientId);
      if (!client) return;

      broadcastToRoom(client.room, {
        type: 'score_update',
        ...message.data,
        timestamp: new Date().toISOString(),
      });
      break;
    }

    // ─── PING ─────────────────────────────────────────────────
    case 'ping': {
      ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
      break;
    }

    default:
      ws.send(JSON.stringify({ type: 'error', message: `Unknown message type: ${message.type}` }));
  }
}

function broadcastToRoom(room: string, data: any, excludeClientId?: string) {
  const payload = JSON.stringify(data);
  for (const [id, client] of clients) {
    if (client.room === room && id !== excludeClientId && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(payload);
    }
  }
}

function getRoomUsers(room: string): Array<{ userId: string; username: string }> {
  const users: Array<{ userId: string; username: string }> = [];
  const seen = new Set<string>();
  for (const client of clients.values()) {
    if (client.room === room && !seen.has(client.userId)) {
      users.push({ userId: client.userId, username: client.username });
      seen.add(client.userId);
    }
  }
  return users;
}