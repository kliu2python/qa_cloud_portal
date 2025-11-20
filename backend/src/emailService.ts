import nodemailer from 'nodemailer';
import Mail from 'nodemailer/lib/mailer';

export interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

export interface ErrorReportEmail {
  title: string;
  content: string;
  category: string;
  recipient: string;
  senderInfo?: {
    ip?: string;
    userAgent?: string;
    timestamp?: string;
  };
}

export class EmailService {
  private transporter: Mail;
  private fromEmail: string;

  constructor(config: EmailConfig) {
    this.fromEmail = config.auth.user;

    this.transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure, // true for 465, false for 587
      auth: {
        user: config.auth.user,
        pass: config.auth.pass,
      },
      tls: {
        rejectUnauthorized: false // For development, set to true in production
      }
    });
  }

  /**
   * Verify SMTP connection configuration
   */
  async verifyConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      console.log('✓ SMTP connection verified successfully');
      return true;
    } catch (error) {
      console.error('✗ SMTP connection verification failed:', error);
      return false;
    }
  }

  /**
   * Generate HTML email template for error reports
   */
  private generateErrorReportHTML(report: ErrorReportEmail): string {
    const timestamp = report.senderInfo?.timestamp || new Date().toISOString();

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Error Report</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f5f5f5;
    }
    .email-container {
      background-color: #ffffff;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      padding: 30px;
    }
    .header {
      border-bottom: 3px solid #dc3545;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .header h1 {
      margin: 0;
      color: #dc3545;
      font-size: 28px;
    }
    .category-badge {
      display: inline-block;
      background-color: #007bff;
      color: white;
      padding: 6px 12px;
      border-radius: 4px;
      font-size: 14px;
      font-weight: 500;
      margin-top: 10px;
    }
    .section {
      margin-bottom: 25px;
    }
    .section-title {
      font-size: 16px;
      font-weight: 600;
      color: #495057;
      margin-bottom: 10px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .content-box {
      background-color: #f8f9fa;
      border-left: 4px solid #007bff;
      padding: 15px;
      border-radius: 4px;
      white-space: pre-wrap;
      word-wrap: break-word;
    }
    .metadata {
      background-color: #e9ecef;
      padding: 15px;
      border-radius: 4px;
      font-size: 13px;
      color: #6c757d;
    }
    .metadata-item {
      margin-bottom: 8px;
    }
    .metadata-label {
      font-weight: 600;
      color: #495057;
    }
    .footer {
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #dee2e6;
      font-size: 12px;
      color: #6c757d;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <h1>🚨 QA Cloud Portal - Error Report</h1>
      <span class="category-badge">${this.escapeHtml(report.category)}</span>
    </div>

    <div class="section">
      <div class="section-title">Error Title</div>
      <h2 style="margin: 10px 0; color: #212529; font-size: 22px;">${this.escapeHtml(report.title)}</h2>
    </div>

    <div class="section">
      <div class="section-title">Error Description</div>
      <div class="content-box">${this.escapeHtml(report.content)}</div>
    </div>

    <div class="section">
      <div class="section-title">Report Metadata</div>
      <div class="metadata">
        <div class="metadata-item">
          <span class="metadata-label">Timestamp:</span> ${timestamp}
        </div>
        <div class="metadata-item">
          <span class="metadata-label">Category:</span> ${this.escapeHtml(report.category)}
        </div>
        ${report.senderInfo?.ip ? `
        <div class="metadata-item">
          <span class="metadata-label">IP Address:</span> ${this.escapeHtml(report.senderInfo.ip)}
        </div>
        ` : ''}
        ${report.senderInfo?.userAgent ? `
        <div class="metadata-item">
          <span class="metadata-label">User Agent:</span> ${this.escapeHtml(report.senderInfo.userAgent)}
        </div>
        ` : ''}
      </div>
    </div>

    <div class="footer">
      <p>This is an automated message from QA Cloud Portal Error Reporting System.</p>
      <p>Please do not reply to this email.</p>
    </div>
  </div>
</body>
</html>
    `;
  }

  /**
   * Generate plain text version of error report
   */
  private generateErrorReportText(report: ErrorReportEmail): string {
    const timestamp = report.senderInfo?.timestamp || new Date().toISOString();

    let text = `
QA CLOUD PORTAL - ERROR REPORT
================================

CATEGORY: ${report.category}

ERROR TITLE:
${report.title}

ERROR DESCRIPTION:
${report.content}

REPORT METADATA:
----------------
Timestamp: ${timestamp}
Category: ${report.category}
`;

    if (report.senderInfo?.ip) {
      text += `IP Address: ${report.senderInfo.ip}\n`;
    }

    if (report.senderInfo?.userAgent) {
      text += `User Agent: ${report.senderInfo.userAgent}\n`;
    }

    text += `
================================
This is an automated message from QA Cloud Portal Error Reporting System.
Please do not reply to this email.
`;

    return text;
  }

  /**
   * Escape HTML special characters
   */
  private escapeHtml(text: string): string {
    const map: { [key: string]: string } = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, (m) => map[m]);
  }

  /**
   * Send error report email
   */
  async sendErrorReport(report: ErrorReportEmail): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      // Add timestamp if not provided
      if (!report.senderInfo?.timestamp) {
        report.senderInfo = {
          ...report.senderInfo,
          timestamp: new Date().toISOString()
        };
      }

      const mailOptions = {
        from: `"QA Cloud Portal" <${this.fromEmail}>`,
        to: report.recipient,
        subject: `[${report.category}] ${report.title}`,
        text: this.generateErrorReportText(report),
        html: this.generateErrorReportHTML(report),
        headers: {
          'X-Priority': '1',
          'X-MSMail-Priority': 'High',
          'Importance': 'high'
        }
      };

      const info = await this.transporter.sendMail(mailOptions);

      console.log('✓ Error report email sent successfully');
      console.log('  Message ID:', info.messageId);
      console.log('  To:', report.recipient);
      console.log('  Subject:', mailOptions.subject);

      return {
        success: true,
        messageId: info.messageId
      };
    } catch (error) {
      console.error('✗ Failed to send error report email:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Send test email to verify configuration
   */
  async sendTestEmail(recipient: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const mailOptions = {
        from: `"QA Cloud Portal" <${this.fromEmail}>`,
        to: recipient,
        subject: 'QA Cloud Portal - Email Service Test',
        text: 'This is a test email from QA Cloud Portal Email Service. If you received this, the email service is working correctly!',
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px;">
            <h2 style="color: #28a745;">✓ Email Service Test Successful</h2>
            <p>This is a test email from <strong>QA Cloud Portal Email Service</strong>.</p>
            <p>If you received this message, the email service is configured and working correctly!</p>
            <hr style="margin: 20px 0; border: none; border-top: 1px solid #ddd;">
            <p style="color: #6c757d; font-size: 12px;">
              Sent at: ${new Date().toISOString()}<br>
              From: ${this.fromEmail}
            </p>
          </div>
        `
      };

      const info = await this.transporter.sendMail(mailOptions);

      console.log('✓ Test email sent successfully');
      console.log('  Message ID:', info.messageId);

      return {
        success: true,
        messageId: info.messageId
      };
    } catch (error) {
      console.error('✗ Failed to send test email:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
}
