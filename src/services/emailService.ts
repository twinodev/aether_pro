/**
 * Service for interacting with the backend Resend email integration.
 */

interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
}

export const emailService = {
  /**
   * Sends an email via the backend proxy.
   */
  async sendEmail(options: SendEmailOptions) {
    try {
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(options),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to send email');
      }

      return result;
    } catch (error) {
      console.error('Email service error:', error);
      throw error;
    }
  },

  /**
   * Sends a standard welcome email.
   */
  async sendWelcomeEmail(email: string, name: string) {
    return this.sendEmail({
      to: email,
      subject: 'Welcome to Aether Intelligence',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h1 style="color: #f43f5e; text-transform: uppercase; letter-spacing: -0.05em;">Aether Access Granted</h1>
          <p>Hello <strong>${name}</strong>,</p>
          <p>Your identity has been verified. You now have full access to the Aether operational environment.</p>
          <div style="margin: 30px 0; padding: 20px; bg-color: #f9f9f9; border-radius: 8px;">
            <p style="font-size: 12px; color: #666; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 5px;">Security Protocol</p>
            <p style="font-weight: bold; margin: 0;">Operational Tier: Standard Tier</p>
          </div>
          <p>Go to your dashboard to start using the smart tools.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
          <p style="font-size: 10px; color: #999; text-transform: uppercase; letter-spacing: 0.1em;">Aether Pro Intelligence Platform • v3.8.4</p>
        </div>
      `
    });
  }
};
