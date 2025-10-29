/**
 * Authentication Routes
 */

import { FastifyInstance } from 'fastify';
import * as authController from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.js';

export default async function authRoutes(fastify: FastifyInstance) {
  // Public routes (no authentication required)
  fastify.post('/login', authController.login);
  fastify.post('/register', authController.login); // Register uses same validation as login for testing
  fastify.post('/refresh', authController.refresh);

  // Protected routes (authentication required)
  fastify.post('/logout', {
    preHandler: [authenticate],
    handler: authController.logout,
  });

  fastify.get('/me', {
    preHandler: [authenticate],
    handler: authController.getCurrentUser,
  });
}
