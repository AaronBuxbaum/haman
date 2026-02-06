import * as nodemailer from 'nodemailer';
import { LotteryResult } from '../lotteryAutomation';

export interface EmailConfig {
  host?: string;
  port?: number;
  secure?: boolean;
  auth?: {
    user: string;
    pass: string;
  };
  from: string;
}

/**
 * Email notification service for lottery results
 */
export class EmailNotifier {
  private transporter: nodemailer.Transporter;
  private fromAddress: string;

  constructor(config: EmailConfig) {
    this.fromAddress = config.from;
    
    this.transporter = nodemailer.createTransport({
      host: config.host || process.env.SMTP_HOST || 'smtp.gmail.com',
      port: config.port || parseInt(process.env.SMTP_PORT || '587'),
      secure: config.secure !== undefined ? config.secure : false,
      auth: config.auth || {
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || ''
      }
    });
  }

  /**
   * Send lottery results email to user
   */
  async sendLotteryResults(
    recipientEmail: string,
    recipientName: string,
    results: LotteryResult[]
  ): Promise<void> {
    const successfulApplications = results.filter(r => r.success);
    const failedApplications = results.filter(r => !r.success);

    const htmlContent = this.buildResultsEmail(
      recipientName,
      successfulApplications,
      failedApplications
    );

    const plainText = this.buildPlainTextEmail(
      recipientName,
      successfulApplications,
      failedApplications
    );

    await this.transporter.sendMail({
      from: this.fromAddress,
      to: recipientEmail,
      subject: `Broadway Lottery Update - ${successfulApplications.length} Applications Submitted`,
      text: plainText,
      html: htmlContent
    });
  }

  /**
   * Send welcome email to new user
   */
  async sendWelcomeEmail(
    recipientEmail: string,
    recipientName: string
  ): Promise<void> {
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a1a1a;">Welcome to Haman Broadway Lottery!</h2>
        <p>Hi ${recipientName},</p>
        <p>Thank you for joining Haman! We're excited to help you win Broadway lottery tickets.</p>
        <p>Here's what happens next:</p>
        <ul>
          <li>We'll automatically apply to lotteries based on your preferences</li>
          <li>You'll receive email updates when applications are submitted</li>
          <li>You can update your preferences anytime through your dashboard</li>
        </ul>
        <p>Good luck with your Broadway adventures!</p>
        <p>Best regards,<br>The Haman Team</p>
      </div>
    `;

    await this.transporter.sendMail({
      from: this.fromAddress,
      to: recipientEmail,
      subject: 'Welcome to Haman Broadway Lottery!',
      html: htmlContent
    });
  }

  private buildResultsEmail(
    name: string,
    successful: LotteryResult[],
    failed: LotteryResult[]
  ): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a1a1a;">Your Broadway Lottery Update</h2>
        <p>Hi ${name},</p>
        <p>Here's a summary of today's lottery applications:</p>
        
        ${successful.length > 0 ? `
          <div style="margin: 20px 0;">
            <h3 style="color: #28a745;">✓ Successfully Submitted (${successful.length})</h3>
            <ul style="list-style: none; padding: 0;">
              ${successful.map(r => `
                <li style="padding: 8px; margin: 4px 0; background: #f0f9f4; border-left: 3px solid #28a745;">
                  <strong>${r.showName}</strong> on ${r.platform}
                </li>
              `).join('')}
            </ul>
          </div>
        ` : ''}
        
        ${failed.length > 0 ? `
          <div style="margin: 20px 0;">
            <h3 style="color: #dc3545;">✗ Failed Applications (${failed.length})</h3>
            <ul style="list-style: none; padding: 0;">
              ${failed.map(r => `
                <li style="padding: 8px; margin: 4px 0; background: #fef0f0; border-left: 3px solid #dc3545;">
                  <strong>${r.showName}</strong> on ${r.platform}
                  ${r.error ? `<br><small style="color: #666;">${r.error}</small>` : ''}
                </li>
              `).join('')}
            </ul>
          </div>
        ` : ''}
        
        <p style="margin-top: 30px; color: #666;">
          We'll continue to monitor lotteries and apply based on your preferences.
          You can update your preferences anytime through your dashboard.
        </p>
        
        <p>Best of luck!<br>The Haman Team</p>
      </div>
    `;
  }

  private buildPlainTextEmail(
    name: string,
    successful: LotteryResult[],
    failed: LotteryResult[]
  ): string {
    let text = `Hi ${name},\n\nHere's a summary of today's lottery applications:\n\n`;
    
    if (successful.length > 0) {
      text += `Successfully Submitted (${successful.length}):\n`;
      successful.forEach(r => {
        text += `- ${r.showName} on ${r.platform}\n`;
      });
      text += '\n';
    }
    
    if (failed.length > 0) {
      text += `Failed Applications (${failed.length}):\n`;
      failed.forEach(r => {
        text += `- ${r.showName} on ${r.platform}\n`;
        if (r.error) {
          text += `  Error: ${r.error}\n`;
        }
      });
      text += '\n';
    }
    
    text += `We'll continue to monitor lotteries and apply based on your preferences.\n\n`;
    text += `Best of luck!\nThe Haman Team`;
    
    return text;
  }
}
