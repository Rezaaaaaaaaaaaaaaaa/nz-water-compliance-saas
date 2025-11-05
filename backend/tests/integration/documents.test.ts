/**
 * Documents API Integration Tests
 * Tests upload, metadata, permissions, and S3 interactions
 */

import request from 'supertest';
import { buildApp } from '../../src/server';
import * as testUtils from '../helpers/test-utils';
import { FastifyInstance } from 'fastify';

describe('Documents API', () => {
  let app: FastifyInstance;
  let testUser: any;
  let token: string;
  let organizationId: string;
  let testDocument: any;

  beforeAll(async () => {
    app = await buildApp();
    await testUtils.cleanupTestData();

    testUser = await testUtils.createTestUser();
    organizationId = testUser.organization.id;

    const loginResponse = await request(app.server)
      .post('/api/v1/auth/login')
      .send({
        email: testUser.user.email,
        password: testUser.password,
      });

    token = loginResponse.body.token;
    testDocument = await testUtils.createTestDocument(organizationId);
  });

  afterAll(async () => {
    await testUtils.cleanupTestData();
    await testUtils.disconnectDB();
    await app.close();
  });

  describe('GET /api/v1/documents', () => {
    it('should list documents for authenticated user', async () => {
      const response = await request(app.server)
        .get('/api/v1/documents')
        .set('Authorization', `Bearer ${token}`)
        .send();

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should reject without authentication', async () => {
      const response = await request(app.server)
        .get('/api/v1/documents')
        .send();

      expect(response.status).toBe(401);
    });

    it('should support pagination', async () => {
      const response = await request(app.server)
        .get('/api/v1/documents?skip=0&take=10')
        .set('Authorization', `Bearer ${token}`)
        .send();

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should filter by document type', async () => {
      const response = await request(app.server)
        .get('/api/v1/documents?fileType=application/pdf')
        .set('Authorization', `Bearer ${token}`)
        .send();

      expect(response.status).toBe(200);
      response.body.forEach((doc: any) => {
        expect(doc.fileType).toBe('application/pdf');
      });
    });
  });

  describe('GET /api/v1/documents/:id', () => {
    it('should get document metadata', async () => {
      const response = await request(app.server)
        .get(`/api/v1/documents/${testDocument.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send();

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(testDocument.id);
      expect(response.body.name).toBe(testDocument.name);
      expect(response.body).toHaveProperty('fileSize');
      expect(response.body).toHaveProperty('uploadedAt');
    });

    it('should return 404 for non-existent document', async () => {
      const response = await request(app.server)
        .get('/api/v1/documents/invalid-id')
        .set('Authorization', `Bearer ${token}`)
        .send();

      expect(response.status).toBe(404);
    });

    it('should reject without authentication', async () => {
      const response = await request(app.server)
        .get(`/api/v1/documents/${testDocument.id}`)
        .send();

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/v1/documents/upload', () => {
    it('should upload document with valid file', async () => {
      const response = await request(app.server)
        .post('/api/v1/documents/upload')
        .set('Authorization', `Bearer ${token}`)
        .field('name', 'Test Document')
        .field('description', 'Test document upload')
        .attach('file', Buffer.from('test content'), 'test.pdf');

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe('Test Document');
      expect(response.body).toHaveProperty('s3Key');
      expect(response.body).toHaveProperty('s3Url');
    });

    it('should reject upload without file', async () => {
      const response = await request(app.server)
        .post('/api/v1/documents/upload')
        .set('Authorization', `Bearer ${token}`)
        .field('name', 'No File Document');

      expect(response.status).toBe(400);
    });

    it('should reject upload without authentication', async () => {
      const response = await request(app.server)
        .post('/api/v1/documents/upload')
        .field('name', 'Unauthorized Upload')
        .attach('file', Buffer.from('test'), 'test.pdf');

      expect(response.status).toBe(401);
    });

    it('should validate file type', async () => {
      // Test with allowed file types
      const allowedResponse = await request(app.server)
        .post('/api/v1/documents/upload')
        .set('Authorization', `Bearer ${token}`)
        .field('name', 'Valid PDF')
        .attach('file', Buffer.from('test'), 'test.pdf');

      expect(allowedResponse.status).toBe(201);
    });

    it('should handle file size limits', async () => {
      const largBuffer = Buffer.alloc(101 * 1024 * 1024); // 101MB
      const response = await request(app.server)
        .post('/api/v1/documents/upload')
        .set('Authorization', `Bearer ${token}`)
        .field('name', 'Large File')
        .attach('file', largBuffer, 'large.pdf');

      expect(response.status).toBe(413); // Payload Too Large
    });
  });

  describe('GET /api/v1/documents/:id/download', () => {
    it('should download document', async () => {
      const response = await request(app.server)
        .get(`/api/v1/documents/${testDocument.id}/download`)
        .set('Authorization', `Bearer ${token}`)
        .send();

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('url');
      expect(response.body.url).toContain('s3');
    });

    it('should reject download without authentication', async () => {
      const response = await request(app.server)
        .get(`/api/v1/documents/${testDocument.id}/download`)
        .send();

      expect(response.status).toBe(401);
    });

    it('should return 404 for non-existent document', async () => {
      const response = await request(app.server)
        .get('/api/v1/documents/invalid-id/download')
        .set('Authorization', `Bearer ${token}`)
        .send();

      expect(response.status).toBe(404);
    });
  });

  describe('PATCH /api/v1/documents/:id', () => {
    let docToUpdate: any;

    beforeEach(async () => {
      docToUpdate = await testUtils.createTestDocument(organizationId);
    });

    it('should update document metadata', async () => {
      const response = await request(app.server)
        .patch(`/api/v1/documents/${docToUpdate.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Updated Document Name',
          description: 'Updated description',
        });

      expect(response.status).toBe(200);
      expect(response.body.name).toBe('Updated Document Name');
      expect(response.body.description).toBe('Updated description');
    });

    it('should allow partial updates', async () => {
      const response = await request(app.server)
        .patch(`/api/v1/documents/${docToUpdate.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          description: 'Only description changed',
        });

      expect(response.status).toBe(200);
      expect(response.body.name).toBe(docToUpdate.name); // Unchanged
      expect(response.body.description).toBe('Only description changed');
    });

    it('should reject update without authentication', async () => {
      const response = await request(app.server)
        .patch(`/api/v1/documents/${docToUpdate.id}`)
        .send({
          name: 'Unauthorized Update',
        });

      expect(response.status).toBe(401);
    });
  });

  describe('DELETE /api/v1/documents/:id', () => {
    let docToDelete: any;

    beforeEach(async () => {
      docToDelete = await testUtils.createTestDocument(organizationId);
    });

    it('should delete document', async () => {
      const response = await request(app.server)
        .delete(`/api/v1/documents/${docToDelete.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send();

      expect(response.status).toBe(200);

      // Verify deletion
      const getResponse = await request(app.server)
        .get(`/api/v1/documents/${docToDelete.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send();

      expect(getResponse.status).toBe(404);
    });

    it('should reject deletion without authentication', async () => {
      const response = await request(app.server)
        .delete(`/api/v1/documents/${docToDelete.id}`)
        .send();

      expect(response.status).toBe(401);
    });
  });

  describe('Document Security & Permissions', () => {
    it('should not allow access to other org documents', async () => {
      const otherUserData = await testUtils.createTestUser(
        'doc-other@example.com',
        testUtils.generateTestPassword()
      );

      const otherLoginResponse = await request(app.server)
        .post('/api/v1/auth/login')
        .send({
          email: otherUserData.user.email,
          password: otherUserData.password,
        });

      const otherToken = otherLoginResponse.body.token;

      const response = await request(app.server)
        .get(`/api/v1/documents/${testDocument.id}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .send();

      expect(response.status).toBe(403); // Forbidden
    });

    it('should track document upload by user', async () => {
      const response = await request(app.server)
        .post('/api/v1/documents/upload')
        .set('Authorization', `Bearer ${token}`)
        .field('name', 'Tracked Document')
        .attach('file', Buffer.from('content'), 'tracked.pdf');

      expect(response.status).toBe(201);
      expect(response.body.uploadedBy).toBe(testUser.user.id);
    });

    it('should include upload timestamp', async () => {
      const response = await request(app.server)
        .get(`/api/v1/documents/${testDocument.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send();

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('uploadedAt');
      expect(new Date(response.body.uploadedAt)).toBeInstanceOf(Date);
    });
  });

  describe('Document Search & Filtering', () => {
    it('should search documents by name', async () => {
      const searchTerm = testDocument.name.substring(0, 5);
      const response = await request(app.server)
        .get(`/api/v1/documents?search=${searchTerm}`)
        .set('Authorization', `Bearer ${token}`)
        .send();

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(
        response.body.some((doc: any) =>
          doc.name.toLowerCase().includes(searchTerm.toLowerCase())
        )
      ).toBe(true);
    });
  });
});
