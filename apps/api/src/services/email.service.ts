import { Resend } from 'resend';
import { config } from '../config';

const resend = config.resendApiKey ? new Resend(config.resendApiKey) : null;

async function send(to: string, subject: string, html: string): Promise<void> {
  if (!resend) {
    console.log(`[EMAIL-DEV] To: ${to} | Subject: ${subject}`);
    return;
  }
  await resend.emails.send({
    from: config.emailFrom,
    to,
    subject,
    html,
  });
}

export class EmailService {
  static async sendWelcome(email: string, firstName: string): Promise<void> {
    await send(
      email,
      `Welcome to ${config.platformName}, ${firstName}!`,
      `<h1>Welcome, ${firstName}!</h1>
       <p>Thanks for joining ${config.platformName}. Start browsing phone numbers today.</p>
       <p><a href="${config.platformUrl}/search">Browse Numbers</a></p>`,
    );
  }

  static async sendPasswordReset(email: string, resetToken: string): Promise<void> {
    const resetUrl = `${config.platformUrl}/reset-password?token=${resetToken}`;
    await send(
      email,
      `Reset Your ${config.platformName} Password`,
      `<h2>Password Reset</h2>
       <p>Click the link below to reset your password. This link expires in 1 hour.</p>
       <p><a href="${resetUrl}">Reset Password</a></p>
       <p>If you didn't request this, you can safely ignore this email.</p>`,
    );
  }

  static async sendEmailVerification(email: string, verifyToken: string): Promise<void> {
    const verifyUrl = `${config.platformUrl}/verify-email?token=${verifyToken}`;
    await send(
      email,
      `Verify Your Email — ${config.platformName}`,
      `<h2>Verify Your Email</h2>
       <p>Click the link below to verify your email address.</p>
       <p><a href="${verifyUrl}">Verify Email</a></p>`,
    );
  }

  static async sendOfferReceived(sellerEmail: string, phoneNumber: string, amount: number): Promise<void> {
    await send(
      sellerEmail,
      `New Offer Received — ${phoneNumber}`,
      `<h2>You've received an offer!</h2>
       <p>Someone offered <strong>$${amount.toFixed(2)}</strong> for <strong>${phoneNumber}</strong>.</p>
       <p><a href="${config.platformUrl}/seller/offers">View Offers</a></p>`,
    );
  }

  static async sendOfferAccepted(buyerEmail: string, phoneNumber: string, amount: number): Promise<void> {
    await send(
      buyerEmail,
      `Offer Accepted — ${phoneNumber}`,
      `<h2>Your offer was accepted!</h2>
       <p>Your offer of <strong>$${amount.toFixed(2)}</strong> for <strong>${phoneNumber}</strong> has been accepted.</p>
       <p><a href="${config.platformUrl}/account/orders">View Orders</a></p>`,
    );
  }

  static async sendOfferDeclined(buyerEmail: string, phoneNumber: string): Promise<void> {
    await send(
      buyerEmail,
      `Offer Declined — ${phoneNumber}`,
      `<h2>Your offer was declined</h2>
       <p>Unfortunately, the seller declined your offer for <strong>${phoneNumber}</strong>.</p>
       <p><a href="${config.platformUrl}/search">Browse Other Numbers</a></p>`,
    );
  }

  static async sendOfferCountered(buyerEmail: string, phoneNumber: string, counterAmount: number): Promise<void> {
    await send(
      buyerEmail,
      `Counter-Offer Received — ${phoneNumber}`,
      `<h2>You've received a counter-offer</h2>
       <p>The seller has countered with <strong>$${counterAmount.toFixed(2)}</strong> for <strong>${phoneNumber}</strong>.</p>
       <p><a href="${config.platformUrl}/account/orders">Review Counter-Offer</a></p>`,
    );
  }

  static async sendOrderConfirmation(email: string, orderNumber: string, total: number): Promise<void> {
    await send(
      email,
      `Order Confirmed — #${orderNumber}`,
      `<h2>Order Confirmed!</h2>
       <p>Your order <strong>#${orderNumber}</strong> for <strong>$${total.toFixed(2)}</strong> has been confirmed.</p>
       <p><a href="${config.platformUrl}/account/orders">View Order</a></p>`,
    );
  }

  static async sendSaleCompleted(sellerEmail: string, phoneNumber: string, earnings: number): Promise<void> {
    await send(
      sellerEmail,
      `Sale Completed — ${phoneNumber}`,
      `<h2>Your number has been sold!</h2>
       <p><strong>${phoneNumber}</strong> sold for <strong>$${earnings.toFixed(2)}</strong> (your earnings).</p>
       <p><a href="${config.platformUrl}/seller/earnings">View Earnings</a></p>`,
    );
  }

  static async sendPayoutReady(sellerEmail: string, amount: number): Promise<void> {
    await send(
      sellerEmail,
      `Payout Ready — $${amount.toFixed(2)}`,
      `<h2>Your payout is ready!</h2>
       <p>A payout of <strong>$${amount.toFixed(2)}</strong> is being processed.</p>
       <p><a href="${config.platformUrl}/seller/payouts">View Payouts</a></p>`,
    );
  }

  static async sendBrokerApproved(email: string): Promise<void> {
    await send(
      email,
      `Broker Application Approved — ${config.platformName}`,
      `<h2>You're approved!</h2>
       <p>Your broker application has been approved. You can now start listing numbers.</p>
       <p><a href="${config.platformUrl}/seller">Go to Seller Dashboard</a></p>`,
    );
  }

  static async sendBrokerRejected(email: string, reason: string): Promise<void> {
    await send(
      email,
      `Broker Application Update — ${config.platformName}`,
      `<h2>Application Update</h2>
       <p>Unfortunately, your broker application was not approved.</p>
       <p><strong>Reason:</strong> ${reason}</p>
       <p>You may reapply after addressing the feedback.</p>`,
    );
  }
}
