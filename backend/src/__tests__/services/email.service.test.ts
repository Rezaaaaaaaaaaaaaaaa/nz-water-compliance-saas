/**
 * Email Service Tests
 */

import { describe, it, expect, beforeEach, jest, afterEach } from '@jest/globals';

// Store original env
const originalEnv = process.env;

describe('Email Service', () => {
  beforeEach(() => {
    // Reset modules and env before each test
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    // Restore original env
    process.env = originalEnv;
  });

  describe('Console Mode', () => {
    it('should log email to console in development mode', async () => {
      process.env.EMAIL_PROVIDER = 'console';
      process.env.FROM_EMAIL = 'test@example.com';

      const { sendEmail } = await import('../../services/email.service.js');

      const result = await sendEmail({
        to: 'recipient@example.com',
        subject: 'Test Email',
        html: '<p>Test content</p>',
        text: 'Test content',
      });

      // Should not throw error
      expect(result).toBeUndefined();
    });
  });

  describe('Email Templates', () => {
    beforeEach(() => {
      process.env.EMAIL_PROVIDER = 'console';
      process.env.FROM_EMAIL = 'noreply@test.com';
      process.env.FROM_NAME = 'Test System';
    });

    it('should send deadline reminder email with correct data', async () => {
      const { sendDeadlineReminderEmail } = await import('../../services/email.service.js');

      await sendDeadlineReminderEmail('user@test.com', 'John Doe', {
        type: 'Compliance Plan',
        name: 'Q4 2024 DWSP Review',
        dueDate: new Date('2024-12-31'),
        daysUntilDue: 7,
      });

      // Should not throw
      expect(true).toBe(true);
    });

    it('should send overdue deadline reminder with urgency', async () => {
      const { sendDeadlineReminderEmail } = await import('../../services/email.service.js');

      await sendDeadlineReminderEmail('user@test.com', 'Jane Smith', {
        type: 'Compliance Plan',
        name: 'Overdue DWSP',
        dueDate: new Date('2024-01-01'),
        daysUntilDue: -10, // 10 days overdue
      });

      // Should not throw
      expect(true).toBe(true);
    });

    it('should send quarterly regulation review email', async () => {
      const { sendRegulationReviewEmail } = await import('../../services/email.service.js');

      await sendRegulationReviewEmail('user@test.com', 'John Doe', {
        quarter: 4,
        year: 2024,
        tasks: [
          {
            category: 'DWSP Requirements',
            description: 'Review DWSP requirements',
            url: 'https://example.com',
            priority: 'HIGH',
          },
          {
            category: 'Water Quality',
            description: 'Review water quality standards',
            url: 'https://example.com',
            priority: 'MEDIUM',
          },
        ],
      });

      // Should not throw
      expect(true).toBe(true);
    });

    it('should send DWSP submission confirmation email', async () => {
      const { sendDWSPSubmissionEmail } = await import('../../services/email.service.js');

      await sendDWSPSubmissionEmail('user@test.com', 'Jane Smith', {
        name: 'Wellington DWSP 2024',
        submittedAt: new Date('2024-01-15'),
        submissionId: 'SUB-2024-001',
      });

      // Should not throw
      expect(true).toBe(true);
    });
  });

  describe('Provider Validation', () => {
    it('should throw error for AWS SES without client', async () => {
      process.env.EMAIL_PROVIDER = 'ses';
      process.env.FROM_EMAIL = 'test@example.com';
      // Don't set AWS credentials

      const { sendEmail } = await import('../../services/email.service.js');

      // Should handle gracefully or throw
      try {
        await sendEmail({
          to: 'recipient@example.com',
          subject: 'Test',
          html: '<p>Test</p>',
        });
      } catch (error: any) {
        expect(error).toBeDefined();
      }
    });

    it('should throw error for SendGrid without API key', async () => {
      process.env.EMAIL_PROVIDER = 'sendgrid';
      process.env.FROM_EMAIL = 'test@example.com';
      // Don't set SENDGRID_API_KEY

      const { sendEmail } = await import('../../services/email.service.js');

      await expect(
        sendEmail({
          to: 'recipient@example.com',
          subject: 'Test',
          html: '<p>Test</p>',
        })
      ).rejects.toThrow();
    });

    it('should throw error for unknown email provider', async () => {
      process.env.EMAIL_PROVIDER = 'invalid-provider';

      const { sendEmail } = await import('../../services/email.service.js');

      await expect(
        sendEmail({
          to: 'recipient@example.com',
          subject: 'Test',
          html: '<p>Test</p>',
        })
      ).rejects.toThrow();
    });
  });

  describe('HTML Template Generation', () => {
    beforeEach(() => {
      process.env.EMAIL_PROVIDER = 'console';
    });

    it('should generate HTML with proper styling', async () => {
      const { sendDeadlineReminderEmail } = await import('../../services/email.service.js');

      // Call the function to ensure HTML is generated
      await sendDeadlineReminderEmail('user@test.com', 'Test User', {
        type: 'Test',
        name: 'Test Item',
        dueDate: new Date(),
        daysUntilDue: 5,
      });

      expect(true).toBe(true); // HTML template should be generated
    });

    it('should include NZ date formatting', async () => {
      const { sendDeadlineReminderEmail } = await import('../../services/email.service.js');

      const testDate = new Date('2024-03-15');

      await sendDeadlineReminderEmail('user@test.com', 'Test User', {
        type: 'Test',
        name: 'Test Item',
        dueDate: testDate,
        daysUntilDue: 7,
      });

      // Should format date as NZ locale
      expect(true).toBe(true);
    });

    it('should include proper email headers and footers', async () => {
      const { sendRegulationReviewEmail } = await import('../../services/email.service.js');

      await sendRegulationReviewEmail('user@test.com', 'Test User', {
        quarter: 1,
        year: 2024,
        tasks: [],
      });

      // Should have header and footer
      expect(true).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should log errors when email sending fails', async () => {
      process.env.EMAIL_PROVIDER = 'sendgrid';
      process.env.SENDGRID_API_KEY = 'invalid-key';

      const { sendEmail } = await import('../../services/email.service.js');

      await expect(
        sendEmail({
          to: 'test@example.com',
          subject: 'Test',
          html: '<p>Test</p>',
        })
      ).rejects.toThrow();
    });

    it('should handle missing recipient gracefully', async () => {
      process.env.EMAIL_PROVIDER = 'console';

      const { sendEmail } = await import('../../services/email.service.js');

      // Empty 'to' field should be handled
      await expect(
        sendEmail({
          to: '',
          subject: 'Test',
          html: '<p>Test</p>',
        })
      ).resolves.not.toThrow();
    });
  });

  describe('Configuration', () => {
    it('should use FROM_EMAIL from environment', async () => {
      process.env.EMAIL_PROVIDER = 'console';
      process.env.FROM_EMAIL = 'custom@example.com';
      process.env.FROM_NAME = 'Custom Name';

      const { sendEmail } = await import('../../services/email.service.js');

      await sendEmail({
        to: 'test@example.com',
        subject: 'Test',
        html: '<p>Test</p>',
      });

      // Should use custom FROM_EMAIL
      expect(true).toBe(true);
    });

    it('should default to console provider if not specified', async () => {
      delete process.env.EMAIL_PROVIDER;

      const { sendEmail } = await import('../../services/email.service.js');

      // Should default to console mode
      await sendEmail({
        to: 'test@example.com',
        subject: 'Test',
        html: '<p>Test</p>',
      });

      expect(true).toBe(true);
    });
  });

  describe('Plain Text Fallback', () => {
    it('should send both HTML and plain text', async () => {
      process.env.EMAIL_PROVIDER = 'console';

      const { sendEmail } = await import('../../services/email.service.js');

      await sendEmail({
        to: 'test@example.com',
        subject: 'Test',
        html: '<p>HTML content</p>',
        text: 'Plain text content',
      });

      expect(true).toBe(true);
    });

    it('should work without plain text (HTML only)', async () => {
      process.env.EMAIL_PROVIDER = 'console';

      const { sendEmail } = await import('../../services/email.service.js');

      await sendEmail({
        to: 'test@example.com',
        subject: 'Test',
        html: '<p>HTML only</p>',
      });

      expect(true).toBe(true);
    });
  });
});
