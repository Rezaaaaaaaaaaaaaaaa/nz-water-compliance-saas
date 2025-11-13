/**
 * WebSocket Plugin for Real-Time Updates
 *
 * Provides real-time notifications and dashboard updates
 */

import { FastifyInstance, FastifyRequest } from 'fastify';
import { SocketStream } from '@fastify/websocket';
import { logger } from '../config/logger.js';

export interface WebSocketMessage {
  type: string;
  data: any;
  timestamp: string;
}

export interface WebSocketClient {
  id: string;
  userId?: string;
  organizationId?: string;
  socket: SocketStream;
  subscriptions: Set<string>;
}

/**
 * WebSocket Manager
 */
export class WebSocketManager {
  private clients: Map<string, WebSocketClient> = new Map();
  private channels: Map<string, Set<string>> = new Map();

  /**
   * Add client
   */
  addClient(client: WebSocketClient): void {
    this.clients.set(client.id, client);
    logger.info({ clientId: client.id, userId: client.userId }, 'WebSocket client connected');
  }

  /**
   * Remove client
   */
  removeClient(clientId: string): void {
    const client = this.clients.get(clientId);
    if (client) {
      // Unsubscribe from all channels
      client.subscriptions.forEach(channel => {
        this.unsubscribe(clientId, channel);
      });

      this.clients.delete(clientId);
      logger.info({ clientId }, 'WebSocket client disconnected');
    }
  }

  /**
   * Subscribe client to channel
   */
  subscribe(clientId: string, channel: string): void {
    const client = this.clients.get(clientId);
    if (!client) {
      return;
    }

    client.subscriptions.add(channel);

    if (!this.channels.has(channel)) {
      this.channels.set(channel, new Set());
    }
    this.channels.get(channel)!.add(clientId);

    logger.debug({ clientId, channel }, 'Client subscribed to channel');
  }

  /**
   * Unsubscribe client from channel
   */
  unsubscribe(clientId: string, channel: string): void {
    const client = this.clients.get(clientId);
    if (client) {
      client.subscriptions.delete(channel);
    }

    const subscribers = this.channels.get(channel);
    if (subscribers) {
      subscribers.delete(clientId);
      if (subscribers.size === 0) {
        this.channels.delete(channel);
      }
    }

    logger.debug({ clientId, channel }, 'Client unsubscribed from channel');
  }

  /**
   * Broadcast message to channel
   */
  broadcast(channel: string, message: WebSocketMessage): void {
    const subscribers = this.channels.get(channel);
    if (!subscribers || subscribers.size === 0) {
      return;
    }

    const messageStr = JSON.stringify(message);
    let sent = 0;
    let failed = 0;

    subscribers.forEach(clientId => {
      const client = this.clients.get(clientId);
      if (client) {
        try {
          client.socket.socket.send(messageStr);
          sent++;
        } catch (error) {
          logger.error({ error, clientId, channel }, 'Error sending WebSocket message');
          failed++;
          // Remove disconnected client
          this.removeClient(clientId);
        }
      }
    });

    logger.debug({ channel, sent, failed }, 'Broadcast message to channel');
  }

  /**
   * Send message to specific client
   */
  send(clientId: string, message: WebSocketMessage): void {
    const client = this.clients.get(clientId);
    if (!client) {
      return;
    }

    try {
      client.socket.socket.send(JSON.stringify(message));
    } catch (error) {
      logger.error({ error, clientId }, 'Error sending WebSocket message');
      this.removeClient(clientId);
    }
  }

  /**
   * Send to all clients in organization
   */
  broadcastToOrganization(organizationId: string, message: WebSocketMessage): void {
    this.broadcast(`org:${organizationId}`, message);
  }

  /**
   * Send to specific user
   */
  sendToUser(userId: string, message: WebSocketMessage): void {
    this.broadcast(`user:${userId}`, message);
  }

  /**
   * Get client count
   */
  getClientCount(): number {
    return this.clients.size;
  }

  /**
   * Get channel count
   */
  getChannelCount(): number {
    return this.channels.size;
  }

  /**
   * Get stats
   */
  getStats(): { clients: number; channels: number; subscriptions: number } {
    let subscriptions = 0;
    this.clients.forEach(client => {
      subscriptions += client.subscriptions.size;
    });

    return {
      clients: this.clients.size,
      channels: this.channels.size,
      subscriptions,
    };
  }
}

// Global WebSocket manager instance
export const wsManager = new WebSocketManager();

/**
 * WebSocket Plugin
 */
export async function websocketPlugin(fastify: FastifyInstance): Promise<void> {
  fastify.get('/ws', { websocket: true }, (connection: SocketStream, request: FastifyRequest) => {
    const clientId = request.id;
    const user = (request as any).user;

    // Create client
    const client: WebSocketClient = {
      id: clientId,
      userId: user?.id,
      organizationId: user?.organizationId,
      socket: connection,
      subscriptions: new Set(),
    };

    // Add to manager
    wsManager.addClient(client);

    // Auto-subscribe to organization and user channels
    if (client.organizationId) {
      wsManager.subscribe(clientId, `org:${client.organizationId}`);
    }
    if (client.userId) {
      wsManager.subscribe(clientId, `user:${client.userId}`);
    }

    // Send welcome message
    wsManager.send(clientId, {
      type: 'welcome',
      data: {
        clientId,
        message: 'Connected to FlowComply real-time updates',
      },
      timestamp: new Date().toISOString(),
    });

    // Handle incoming messages
    connection.socket.on('message', (messageBuffer: Buffer) => {
      try {
        const message = JSON.parse(messageBuffer.toString());

        if (message.type === 'subscribe' && message.channel) {
          wsManager.subscribe(clientId, message.channel);
        } else if (message.type === 'unsubscribe' && message.channel) {
          wsManager.unsubscribe(clientId, message.channel);
        } else if (message.type === 'ping') {
          wsManager.send(clientId, {
            type: 'pong',
            data: { timestamp: new Date().toISOString() },
            timestamp: new Date().toISOString(),
          });
        }
      } catch (error) {
        logger.error({ error, clientId }, 'Error processing WebSocket message');
      }
    });

    // Handle disconnect
    connection.socket.on('close', () => {
      wsManager.removeClient(clientId);
    });

    connection.socket.on('error', (error) => {
      logger.error({ error, clientId }, 'WebSocket error');
      wsManager.removeClient(clientId);
    });
  });

  // Health endpoint
  fastify.get('/ws/health', async () => {
    return {
      status: 'ok',
      ...wsManager.getStats(),
    };
  });

  logger.info('WebSocket plugin registered');
}

/**
 * Message Types for Real-Time Updates
 */
export enum MessageType {
  // Notifications
  NOTIFICATION = 'notification',

  // Asset updates
  ASSET_CREATED = 'asset:created',
  ASSET_UPDATED = 'asset:updated',
  ASSET_DELETED = 'asset:deleted',

  // Compliance plan updates
  PLAN_CREATED = 'plan:created',
  PLAN_UPDATED = 'plan:updated',
  PLAN_APPROVED = 'plan:approved',
  PLAN_SUBMITTED = 'plan:submitted',

  // Document updates
  DOCUMENT_UPLOADED = 'document:uploaded',
  DOCUMENT_DELETED = 'document:deleted',

  // Report updates
  REPORT_GENERATED = 'report:generated',
  REPORT_COMPLETED = 'report:completed',

  // Water quality updates
  TEST_RESULT_ADDED = 'test:added',
  ANOMALY_DETECTED = 'anomaly:detected',

  // Dashboard updates
  DASHBOARD_REFRESH = 'dashboard:refresh',
  STATS_UPDATED = 'stats:updated',
}
