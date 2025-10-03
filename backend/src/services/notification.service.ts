/**
 * Notification Service
 *
 * Handles sending email and in-app notifications
 */

import { PrismaClient } from '@prisma/client';
import { logger } from '../config/logger.js';
import { config } from '../config/index.js';
import * as emailService from './email.service.js';

const prisma = new PrismaClient();

export interface SendNotificationParams {
  userId: string;
  type: 'email' | 'in_app' | 'both';
  subject: string;
  message: string;
  metadata?: any;
}

/**
 * Send notification to user
 */
export async function sendNotification(params: SendNotificationParams) {
  const { userId, type, subject, message, metadata } = params;

  // Get user details
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      notificationPreferences: true,
    },
  });

  if (!user) {
    logger.warn({ userId }, 'User not found for notification');
    return;
  }

  // Check user notification preferences
  const prefs = user.notificationPreferences as any;
  const emailEnabled = prefs?.email !== false;
  const inAppEnabled = prefs?.inApp !== false;

  // Send email notification
  if ((type === 'email' || type === 'both') && emailEnabled) {
    await sendEmailNotification({
      to: user.email,
      subject,
      message,
      userName: `${user.firstName} ${user.lastName}`,
      metadata,
    });
  }

  // Create in-app notification
  if ((type === 'in_app' || type === 'both') && inAppEnabled) {
    await createInAppNotification({
      userId: user.id,
      title: subject,
      message,
      metadata,
    });
  }

  logger.info({ userId, type, subject }, 'Notification sent');
}

/**
 * Send email notification
 */
async function sendEmailNotification(params: {
  to: string;
  subject: string;
  message: string;
  userName: string;
  metadata?: any;
}) {
  const { to, subject, message, userName, metadata } = params;

  // Check if this is a specialized notification type with custom template
  if (metadata?.notificationType === 'deadline_reminder' && metadata?.deadline) {
    await emailService.sendDeadlineReminderEmail(to, userName, metadata.deadline);
  } else if (metadata?.notificationType === 'regulation_review' && metadata?.review) {
    await emailService.sendRegulationReviewEmail(to, userName, metadata.review);
  } else if (metadata?.notificationType === 'dwsp_submission' && metadata?.dwsp) {
    await emailService.sendDWSPSubmissionEmail(to, userName, metadata.dwsp);
  } else {
    // Generic notification email
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #1e40af; color: white; padding: 20px; border-radius: 5px 5px 0 0; }
          .content { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
          .footer { background: #f3f4f6; padding: 15px; font-size: 12px; color: #6b7280; text-align: center; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>💧 NZ Water Compliance</h1>
          </div>
          <div class="content">
            <h2>Hello ${userName},</h2>
            <p>${message.replace(/\n/g, '<br>')}</p>
          </div>
          <div class="footer">
            <p>NZ Water Compliance SaaS - Taumata Arowai Regulatory Compliance</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await emailService.sendEmail({
      to,
      subject,
      html,
      text: message,
    });
  }

  logger.info({ to, subject }, 'Email notification sent');
}

/**
 * Create in-app notification
 */
async function createInAppNotification(params: {
  userId: string;
  title: string;
  message: string;
  metadata?: any;
}) {
  const { userId, title, message, metadata } = params;

  await prisma.notification.create({
    data: {
      userId,
      title,
      message,
      metadata: metadata || {},
      isRead: false,
    },
  });

  logger.info({ userId, title }, 'In-app notification created');
}

/**
 * Get unread notifications for user
 */
export async function getUnreadNotifications(userId: string) {
  return await prisma.notification.findMany({
    where: {
      userId,
      isRead: false,
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 50,
  });
}

/**
 * Mark notification as read
 */
export async function markAsRead(notificationId: string, userId: string) {
  return await prisma.notification.updateMany({
    where: {
      id: notificationId,
      userId, // Ensure user owns the notification
    },
    data: {
      isRead: true,
      readAt: new Date(),
    },
  });
}

/**
 * Mark all notifications as read for user
 */
export async function markAllAsRead(userId: string) {
  return await prisma.notification.updateMany({
    where: {
      userId,
      isRead: false,
    },
    data: {
      isRead: true,
      readAt: new Date(),
    },
  });
}

/**
 * Delete old read notifications (cleanup)
 */
export async function deleteOldNotifications(olderThanDays: number = 30) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

  const result = await prisma.notification.deleteMany({
    where: {
      isRead: true,
      readAt: {
        lt: cutoffDate,
      },
    },
  });

  logger.info({ deleted: result.count, olderThanDays }, 'Old notifications deleted');

  return result;
}
