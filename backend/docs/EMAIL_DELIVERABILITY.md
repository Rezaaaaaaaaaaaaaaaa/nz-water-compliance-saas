# Email Deliverability Setup Guide

This guide covers setting up email deliverability for the NZ Water Compliance SaaS system using AWS SES or SendGrid.

## Overview

The system supports three email providers:
- **AWS SES** (Recommended for production)
- **SendGrid** (Alternative commercial provider)
- **Console** (Development/testing only)

## Provider Comparison

| Feature | AWS SES | SendGrid | Console |
|---------|---------|----------|---------|
| Cost | $0.10 per 1,000 emails | $14.95/month (15K emails) | Free (no sending) |
| Setup Complexity | Medium | Easy | None |
| Deliverability | Excellent | Excellent | N/A |
| Bounce Handling | Built-in | Built-in | N/A |
| SPF/DKIM | Required | Required | N/A |
| Production Ready | ✅ Yes | ✅ Yes | ❌ No |

---

## AWS SES Setup (Recommended)

### Prerequisites
- AWS Account
- Verified domain
- AWS access credentials

### Step 1: Verify Your Domain

1. **Sign in to AWS Console** → Navigate to SES (Simple Email Service)

2. **Verify Domain**:
   ```
   SES Console → Verified identities → Create identity → Domain
   ```

3. **Add DNS Records**:
   AWS will provide DNS records to add to your domain:
   - **TXT record** for domain verification
   - **CNAME records** for DKIM signing
   - **MX record** (optional, for receiving bounces)

   Example DNS records for `compliance-saas.nz`:
   ```
   _amazonses.compliance-saas.nz    TXT    "abcd1234verification"
   abcd._domainkey.compliance-saas.nz    CNAME    abcd.dkim.amazonses.com
   efgh._domainkey.compliance-saas.nz    CNAME    efgh.dkim.amazonses.com
   ijkl._domainkey.compliance-saas.nz    CNAME    ijkl.dkim.amazonses.com
   ```

4. **Wait for Verification** (can take up to 72 hours, usually <30 minutes)

### Step 2: Configure SPF

Add SPF record to your DNS:

```dns
Type: TXT
Name: compliance-saas.nz
Value: "v=spf1 include:amazonses.com ~all"
```

If you already have an SPF record:
```dns
"v=spf1 include:amazonses.com include:_spf.google.com ~all"
```

### Step 3: Request Production Access

By default, SES is in "Sandbox Mode" (limited to verified emails).

**Request Production Access**:
```
SES Console → Account dashboard → Request production access
```

Fill out the request form:
- **Use case**: Transactional emails for compliance management system
- **Website URL**: Your application URL
- **Expected volume**: Estimate based on user count
- **Bounce/complaint handling**: Describe your process

Approval typically takes 24-48 hours.

### Step 4: Create IAM User

Create dedicated IAM user for email sending:

```bash
# Create IAM policy (ses-send-policy.json)
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ses:SendEmail",
        "ses:SendRawEmail"
      ],
      "Resource": "*"
    }
  ]
}

# Create IAM user
aws iam create-user --user-name compliance-saas-emailer

# Attach policy
aws iam put-user-policy --user-name compliance-saas-emailer \
  --policy-name SES-Send-Only --policy-document file://ses-send-policy.json

# Create access keys
aws iam create-access-key --user-name compliance-saas-emailer
```

### Step 5: Configure Environment Variables

Update your `.env` file:

```env
# Email Configuration
EMAIL_PROVIDER=ses
FROM_EMAIL=noreply@compliance-saas.nz
FROM_NAME=NZ Water Compliance

# AWS SES Configuration
AWS_SES_REGION=ap-southeast-2
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
```

**Region Options**:
- `ap-southeast-2` (Sydney) - Recommended for NZ
- `us-east-1` (N. Virginia) - Lowest cost
- `eu-west-1` (Ireland)

### Step 6: Test Email Sending

```bash
# From backend directory
npm run test -- src/__tests__/services/email.service.test.ts
```

Or test via API:
```bash
curl -X POST http://localhost:5000/api/v1/test/send-email \
  -H "Content-Type: application/json" \
  -d '{"to":"your-email@example.com","subject":"Test","html":"<p>Test</p>"}'
```

### Step 7: Configure Bounce Handling (Optional but Recommended)

1. **Create SNS Topic**:
   ```bash
   aws sns create-topic --name ses-bounces-topic --region ap-southeast-2
   ```

2. **Configure SES to publish to SNS**:
   ```
   SES Console → Verified identities → Your domain → Notifications → Edit
   ```
   - Bounce feedback: Select your SNS topic
   - Complaint feedback: Select your SNS topic

3. **Subscribe to SNS topic** (email or webhook):
   ```bash
   aws sns subscribe --topic-arn arn:aws:sns:ap-southeast-2:123456789:ses-bounces-topic \
     --protocol email --notification-endpoint admin@compliance-saas.nz
   ```

---

## SendGrid Setup (Alternative)

### Step 1: Create SendGrid Account

1. Sign up at [sendgrid.com](https://sendgrid.com)
2. Choose pricing tier (Free tier: 100 emails/day)

### Step 2: Verify Domain

1. **Settings** → **Sender Authentication** → **Authenticate Your Domain**

2. Add DNS records provided by SendGrid:
   ```
   em1234.compliance-saas.nz    CNAME    u1234.wl.sendgrid.net
   s1._domainkey.compliance-saas.nz    CNAME    s1.domainkey.u1234.wl.sendgrid.net
   s2._domainkey.compliance-saas.nz    CNAME    s2.domainkey.u1234.wl.sendgrid.net
   ```

3. **Configure SPF**:
   ```dns
   Type: TXT
   Name: compliance-saas.nz
   Value: "v=spf1 include:sendgrid.net ~all"
   ```

### Step 3: Create API Key

1. **Settings** → **API Keys** → **Create API Key**
2. Name: `compliance-saas-production`
3. Permissions: **Full Access** or **Mail Send** only
4. **Copy the API key** (shown only once!)

### Step 4: Configure Environment Variables

```env
# Email Configuration
EMAIL_PROVIDER=sendgrid
FROM_EMAIL=noreply@compliance-saas.nz
FROM_NAME=NZ Water Compliance

# SendGrid Configuration
SENDGRID_API_KEY=SG.abcdefg1234567890.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### Step 5: Test Email Sending

Same as AWS SES (Step 6 above).

---

## Development/Testing Setup

For local development, use console mode:

```env
EMAIL_PROVIDER=console
FROM_EMAIL=noreply@localhost
FROM_NAME=NZ Water Compliance (Dev)
```

Emails will be logged to console instead of sent.

---

## Email Best Practices

### 1. Domain Reputation

- **Use dedicated domain** for transactional emails (e.g., `mail.compliance-saas.nz`)
- **Never send marketing emails** from transactional domain
- **Monitor bounce rates** (keep below 5%)
- **Monitor complaint rates** (keep below 0.1%)

### 2. Email Content

- **Always include unsubscribe link** (required by law in many countries)
- **Use plain text alternative** (already implemented)
- **Avoid spam trigger words**: "free", "act now", "limited time"
- **Test emails with [Mail Tester](https://www.mail-tester.com)**

### 3. Authentication

- **SPF**: Required (prevents spoofing)
- **DKIM**: Required (verifies authenticity)
- **DMARC**: Recommended (policy for failed authentication)

Example DMARC record:
```dns
Type: TXT
Name: _dmarc.compliance-saas.nz
Value: "v=DMARC1; p=quarantine; rua=mailto:dmarc@compliance-saas.nz"
```

### 4. Monitoring

Track these metrics:
- **Delivery rate** (target: >99%)
- **Bounce rate** (hard bounces: <2%, soft bounces: <5%)
- **Open rate** (transactional: 40-60%)
- **Complaint rate** (<0.1%)

### 5. Email Templates

Current templates (already implemented):
- ✅ Deadline reminders
- ✅ Regulation review notifications
- ✅ DWSP submission confirmations

Template best practices:
- Responsive design (mobile-friendly)
- Clear call-to-action
- Professional branding
- Plain text fallback

---

## Troubleshooting

### Emails Not Sending

1. **Check logs**:
   ```bash
   tail -f logs/app.log | grep email
   ```

2. **Verify environment variables**:
   ```bash
   echo $EMAIL_PROVIDER
   echo $FROM_EMAIL
   ```

3. **Test provider credentials**:
   ```bash
   npm run test -- src/__tests__/services/email.service.test.ts
   ```

### Emails Going to Spam

1. **Check SPF/DKIM** at [MXToolbox](https://mxtoolbox.com/SuperTool.aspx)
2. **Test email content** at [Mail Tester](https://www.mail-tester.com)
3. **Check domain reputation** at [Sender Score](https://www.senderscore.org)
4. **Review email content**:
   - Avoid spam trigger words
   - Balance text/image ratio
   - Include unsubscribe link

### High Bounce Rate

1. **Validate email addresses** before sending (already implemented)
2. **Remove hard bounces** from database
3. **Investigate soft bounces** (temporary issues)
4. **Check email authentication** (SPF/DKIM)

---

## Email Queue System

The system uses BullMQ for email queuing (already implemented):

### Benefits
- **Retry logic**: Automatic retries with exponential backoff
- **Rate limiting**: Prevent overwhelming email provider
- **Monitoring**: Track email queue status
- **Scalability**: Handle high volume

### Configuration

```typescript
// Queue configuration in src/config/queue.ts
export const emailQueue = new Queue('emails', {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: true,
    removeOnFail: false,
  },
});
```

### Monitoring Email Queue

```bash
# View queue stats
curl http://localhost:5000/api/v1/monitoring/queue

# Response:
{
  "queues": {
    "emails": {
      "waiting": 5,
      "active": 2,
      "completed": 1234,
      "failed": 12
    }
  }
}
```

---

## Production Checklist

Before going live:

- [ ] Domain verified (AWS SES or SendGrid)
- [ ] SPF record configured
- [ ] DKIM records configured
- [ ] DMARC record configured (optional but recommended)
- [ ] Production access approved (AWS SES only)
- [ ] Environment variables set correctly
- [ ] Bounce/complaint handling configured
- [ ] Email templates tested
- [ ] Unsubscribe mechanism implemented (future enhancement)
- [ ] Monitoring alerts configured
- [ ] Test emails sent successfully

---

## Cost Estimation

### AWS SES
- **First 62,000 emails/month**: Free (if sent from EC2)
- **Additional emails**: $0.10 per 1,000 emails
- **Example**: 500,000 emails/month = ~$50/month

### SendGrid
- **Free tier**: 100 emails/day
- **Essentials ($14.95/mo)**: 15,000 emails/month
- **Pro ($89.95/mo)**: 100,000 emails/month

### Recommendation
- **Small deployments** (<10,000 emails/month): SendGrid Free or AWS SES
- **Medium deployments** (<100,000 emails/month): AWS SES
- **Large deployments** (>100,000 emails/month): AWS SES (most cost-effective)

---

## Security Considerations

1. **Protect API Keys**:
   - Never commit to git
   - Use environment variables
   - Rotate keys regularly (every 90 days)

2. **Rate Limiting**:
   - Already implemented per-user rate limits
   - Prevents email bombing

3. **Input Validation**:
   - Email addresses validated (already implemented)
   - Content sanitized to prevent injection

4. **Audit Logging**:
   - All emails logged to audit trail
   - Track who sent what to whom

---

## Support Resources

### AWS SES
- [AWS SES Documentation](https://docs.aws.amazon.com/ses/)
- [SES Sending Limits](https://docs.aws.amazon.com/ses/latest/dg/quotas.html)
- [SES Email Authentication](https://docs.aws.amazon.com/ses/latest/dg/email-authentication-methods.html)

### SendGrid
- [SendGrid Documentation](https://docs.sendgrid.com/)
- [SendGrid API Reference](https://docs.sendgrid.com/api-reference)
- [Email Authentication Guide](https://docs.sendgrid.com/ui/account-and-settings/how-to-set-up-domain-authentication)

### Email Best Practices
- [Gmail Sender Guidelines](https://support.google.com/mail/answer/81126)
- [Microsoft Email Authentication](https://docs.microsoft.com/en-us/microsoft-365/security/office-365-security/email-authentication-about)
- [DMARC.org](https://dmarc.org/)

---

## Next Steps

1. Choose your email provider (AWS SES recommended)
2. Follow the setup steps for your chosen provider
3. Configure DNS records (SPF, DKIM, DMARC)
4. Test email sending in development
5. Request production access (if using AWS SES)
6. Configure bounce/complaint handling
7. Set up monitoring and alerts
8. Go live! 🚀

For questions or issues, consult the provider documentation or contact your system administrator.
