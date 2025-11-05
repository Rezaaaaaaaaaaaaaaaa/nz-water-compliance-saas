/**
 * Email Service
 *
 * Supports multiple email providers:
 * - AWS SES (recommended for production)
 * - SendGrid (alternative provider)
 * - Console (development/testing)
 */

import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { logger } from '../config/logger.js';
import { retryOperation } from '../utils/retry.util.js';

// Email provider configuration
const EMAIL_PROVIDER = process.env.EMAIL_PROVIDER || 'console'; // 'ses', 'sendgrid', or 'console'
const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@compliance-saas.nz';
const FROM_NAME = process.env.FROM_NAME || 'NZ Water Compliance';

// AWS SES client
let sesClient: SESClient | null = null;
if (EMAIL_PROVIDER === 'ses') {
  sesClient = new SESClient({
    region: process.env.AWS_SES_REGION || 'ap-southeast-2',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    },
  });
}

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Send email via AWS SES with retry logic
 */
async function sendViaSES(options: EmailOptions): Promise<void> {
  if (!sesClient) {
    throw new Error('SES client not initialized');
  }

  await retryOperation(
    async () => {
      const command = new SendEmailCommand({
        Source: `${FROM_NAME} <${FROM_EMAIL}>`,
        Destination: {
          ToAddresses: [options.to],
        },
        Message: {
          Subject: {
            Data: options.subject,
            Charset: 'UTF-8',
          },
          Body: {
            Html: {
              Data: options.html,
              Charset: 'UTF-8',
            },
            Text: options.text
              ? {
                  Data: options.text,
                  Charset: 'UTF-8',
                }
              : undefined,
          },
        },
      });

      await sesClient!.send(command);
      logger.info({ to: options.to, subject: options.subject }, 'Email sent via SES');
    },
    {
      maxAttempts: 3,
      delayMs: 1000,
      exponentialBackoff: true,
      onRetry: (attempt, error) => {
        logger.warn({ attempt, to: options.to, err: error }, 'Retrying SES email send...');
      },
    }
  );
}

/**
 * Send email via SendGrid with retry logic
 */
async function sendViaSendGrid(options: EmailOptions): Promise<void> {
  const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
  if (!SENDGRID_API_KEY) {
    throw new Error('SENDGRID_API_KEY not configured');
  }

  await retryOperation(
    async () => {
      const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${SENDGRID_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personalizations: [
            {
              to: [{ email: options.to }],
              subject: options.subject,
            },
          ],
          from: {
            email: FROM_EMAIL,
            name: FROM_NAME,
          },
          content: [
            {
              type: 'text/html',
              value: options.html,
            },
            options.text
              ? {
                  type: 'text/plain',
                  value: options.text,
                }
              : null,
          ].filter(Boolean),
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        const customError: any = new Error(`SendGrid error: ${error}`);
        customError.statusCode = response.status;
        throw customError;
      }

      logger.info({ to: options.to, subject: options.subject }, 'Email sent via SendGrid');
    },
    {
      maxAttempts: 3,
      delayMs: 1000,
      exponentialBackoff: true,
      onRetry: (attempt, error) => {
        logger.warn({ attempt, to: options.to, err: error }, 'Retrying SendGrid email send...');
      },
    }
  );
}

/**
 * Log email to console (development mode)
 */
function sendViaConsole(options: EmailOptions): void {
  logger.info(
    {
      provider: 'console',
      to: options.to,
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      subject: options.subject,
      bodyPreview: options.text?.substring(0, 100) || options.html.substring(0, 100),
    },
    '📧 Email would be sent (console mode)'
  );
}

/**
 * Send email using configured provider
 */
export async function sendEmail(options: EmailOptions): Promise<void> {
  try {
    switch (EMAIL_PROVIDER) {
      case 'ses':
        await sendViaSES(options);
        break;
      case 'sendgrid':
        await sendViaSendGrid(options);
        break;
      case 'console':
        sendViaConsole(options);
        break;
      default:
        throw new Error(`Unknown email provider: ${EMAIL_PROVIDER}`);
    }
  } catch (error) {
    logger.error({ err: error, options }, 'Failed to send email');
    throw error;
  }
}

/**
 * Send compliance deadline reminder email
 */
export async function sendDeadlineReminderEmail(
  userEmail: string,
  userName: string,
  deadline: {
    type: string;
    name: string;
    dueDate: Date;
    daysUntilDue: number;
  }
): Promise<void> {
  const subject =
    deadline.daysUntilDue <= 0
      ? `⚠️ OVERDUE: ${deadline.name}`
      : `🔔 Upcoming Deadline: ${deadline.name} (${deadline.daysUntilDue} days)`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #1e40af; color: white; padding: 20px; border-radius: 5px 5px 0 0; }
        .content { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
        .deadline-box { background: ${deadline.daysUntilDue <= 0 ? '#fef2f2' : '#eff6ff'};
                        border-left: 4px solid ${deadline.daysUntilDue <= 0 ? '#dc2626' : '#2563eb'};
                        padding: 15px; margin: 15px 0; }
        .footer { background: #f3f4f6; padding: 15px; font-size: 12px; color: #6b7280; text-align: center; }
        .btn { background: #2563eb; color: white; padding: 12px 24px; text-decoration: none;
               border-radius: 5px; display: inline-block; margin: 15px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>💧 NZ Water Compliance</h1>
        </div>
        <div class="content">
          <h2>Hello ${userName},</h2>
          <p>This is a ${deadline.daysUntilDue <= 0 ? '<strong>OVERDUE</strong>' : 'reminder'} notification about an upcoming compliance deadline.</p>

          <div class="deadline-box">
            <h3>${deadline.name}</h3>
            <p><strong>Type:</strong> ${deadline.type}</p>
            <p><strong>Due Date:</strong> ${deadline.dueDate.toLocaleDateString('en-NZ', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
            <p><strong>Status:</strong> ${
              deadline.daysUntilDue <= 0
                ? `<span style="color: #dc2626;">OVERDUE by ${Math.abs(deadline.daysUntilDue)} days</span>`
                : `Due in ${deadline.daysUntilDue} days`
            }</p>
          </div>

          ${
            deadline.daysUntilDue <= 0
              ? `<p style="color: #dc2626;"><strong>⚠️ URGENT ACTION REQUIRED:</strong> This deadline has passed. Please take immediate action to maintain regulatory compliance.</p>`
              : `<p>Please ensure this deadline is met to maintain compliance with Taumata Arowai requirements.</p>`
          }

          <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard/compliance" class="btn">
            View in Dashboard →
          </a>
        </div>
        <div class="footer">
          <p>NZ Water Compliance SaaS - Taumata Arowai Regulatory Compliance</p>
          <p>This is an automated notification. Please do not reply to this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
Hello ${userName},

This is a ${deadline.daysUntilDue <= 0 ? 'OVERDUE' : 'reminder'} notification about a compliance deadline.

${deadline.name}
Type: ${deadline.type}
Due Date: ${deadline.dueDate.toLocaleDateString('en-NZ')}
Status: ${deadline.daysUntilDue <= 0 ? `OVERDUE by ${Math.abs(deadline.daysUntilDue)} days` : `Due in ${deadline.daysUntilDue} days`}

${deadline.daysUntilDue <= 0 ? 'URGENT ACTION REQUIRED: This deadline has passed.' : 'Please ensure this deadline is met to maintain compliance.'}

View in dashboard: ${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard/compliance

---
NZ Water Compliance SaaS - Taumata Arowai Regulatory Compliance
  `.trim();

  await sendEmail({
    to: userEmail,
    subject,
    html,
    text,
  });
}

/**
 * Send quarterly regulation review email
 */
export async function sendRegulationReviewEmail(
  userEmail: string,
  userName: string,
  review: {
    quarter: number;
    year: number;
    tasks: Array<{
      category: string;
      description: string;
      url: string;
      priority: string;
    }>;
  }
): Promise<void> {
  const subject = `📋 Quarterly Regulation Review Required - Q${review.quarter} ${review.year}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #1e40af; color: white; padding: 20px; border-radius: 5px 5px 0 0; }
        .content { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
        .task { background: white; padding: 15px; margin: 10px 0; border-left: 4px solid #2563eb; }
        .priority-high { border-left-color: #dc2626; }
        .priority-medium { border-left-color: #f59e0b; }
        .footer { background: #f3f4f6; padding: 15px; font-size: 12px; color: #6b7280; text-align: center; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📋 Quarterly Regulation Review</h1>
        </div>
        <div class="content">
          <h2>Hello ${userName},</h2>
          <p>It's time for the quarterly review of Taumata Arowai regulations and requirements for <strong>Q${review.quarter} ${review.year}</strong>.</p>

          <p>Please review the following areas for any updates or changes:</p>

          ${review.tasks
            .map(
              (task, index) => `
            <div class="task priority-${task.priority.toLowerCase()}">
              <h3>${index + 1}. ${task.category} <span style="float: right; color: ${task.priority === 'HIGH' ? '#dc2626' : '#f59e0b'};">[${task.priority}]</span></h3>
              <p>${task.description}</p>
              <p><a href="${task.url}" style="color: #2563eb;">View Official Documentation →</a></p>
            </div>
          `
            )
            .join('')}

          <p style="margin-top: 20px;"><strong>Important:</strong> This review is critical to ensure our compliance system remains aligned with current regulatory requirements.</p>

          <p>Please document any changes or updates found and update the system accordingly.</p>
        </div>
        <div class="footer">
          <p>NZ Water Compliance SaaS - Taumata Arowai Regulatory Compliance</p>
          <p>This is an automated quarterly notification.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
Quarterly Regulation Review - Q${review.quarter} ${review.year}

Hello ${userName},

It's time for the quarterly review of Taumata Arowai regulations and requirements.

Please review the following areas:

${review.tasks
  .map(
    (task, index) => `
${index + 1}. ${task.category} [${task.priority}]
   ${task.description}
   ${task.url}
`
  )
  .join('\n')}

Please document any changes found and update the system accordingly.

---
NZ Water Compliance SaaS - Taumata Arowai Regulatory Compliance
  `.trim();

  await sendEmail({
    to: userEmail,
    subject,
    html,
    text,
  });
}

/**
 * Send DWSP submission confirmation email
 */
export async function sendDWSPSubmissionEmail(
  userEmail: string,
  userName: string,
  dwsp: {
    name: string;
    submittedAt: Date;
    submissionId: string;
  }
): Promise<void> {
  const subject = `✅ DWSP Submitted Successfully - ${dwsp.name}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #059669; color: white; padding: 20px; border-radius: 5px 5px 0 0; }
        .content { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
        .success-box { background: #d1fae5; border-left: 4px solid #059669; padding: 15px; margin: 15px 0; }
        .footer { background: #f3f4f6; padding: 15px; font-size: 12px; color: #6b7280; text-align: center; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>✅ DWSP Submitted</h1>
        </div>
        <div class="content">
          <h2>Hello ${userName},</h2>

          <div class="success-box">
            <h3>Your Drinking Water Safety Plan has been successfully submitted to Taumata Arowai.</h3>
            <p><strong>Plan Name:</strong> ${dwsp.name}</p>
            <p><strong>Submission ID:</strong> ${dwsp.submissionId}</p>
            <p><strong>Submitted:</strong> ${dwsp.submittedAt.toLocaleString('en-NZ')}</p>
          </div>

          <p>Your submission is now being processed by the regulator. You will receive updates on the status of your submission.</p>

          <p><strong>Next Steps:</strong></p>
          <ul>
            <li>Keep a record of your submission ID for reference</li>
            <li>Monitor for any feedback from Taumata Arowai</li>
            <li>Continue with operational compliance activities</li>
          </ul>
        </div>
        <div class="footer">
          <p>NZ Water Compliance SaaS - Taumata Arowai Regulatory Compliance</p>
        </div>
      </div>
    </body>
    </html>
  `;

  await sendEmail({
    to: userEmail,
    subject,
    html,
  });
}
