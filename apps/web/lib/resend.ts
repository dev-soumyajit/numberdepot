import { Resend } from 'resend';

function getResendClient(): Resend {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error('RESEND_API_KEY is not configured');
  }
  return new Resend(apiKey);
}

const FROM_EMAIL = 'NumberDepot <noreply@devsoumyajit.in>';

export async function sendOTP(email: string, otp: string) {
  await getResendClient().emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: 'Your NumberDepot Verification Code',
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
        <h2 style="color: #002664;">Verify Your Email</h2>
        <p>Your verification code is:</p>
        <div style="font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #002664; background: #f5f7fa; padding: 16px 24px; border-radius: 8px; text-align: center; margin: 24px 0;">
          ${otp}
        </div>
        <p style="color: #666;">This code expires in 10 minutes. If you didn't request this, please ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
        <p style="color: #999; font-size: 12px;">NumberDepot — The premier phone number marketplace</p>
      </div>
    `,
  });
}

export async function sendPasswordReset(email: string, resetUrl: string) {
  await getResendClient().emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: 'Reset Your NumberDepot Password',
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
        <h2 style="color: #002664;">Reset Your Password</h2>
        <p>Click the button below to reset your password:</p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${resetUrl}" style="background: #002664; color: #fff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block;">
            Reset Password
          </a>
        </div>
        <p style="color: #666;">This link expires in 1 hour. If you didn't request a password reset, please ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
        <p style="color: #999; font-size: 12px;">NumberDepot — The premier phone number marketplace</p>
      </div>
    `,
  });
}
