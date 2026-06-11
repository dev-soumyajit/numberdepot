import { config } from '../config';

// Mock Stripe service - logs to console for development
export class StripeService {
  static async createCustomer(email: string, name: string): Promise<string> {
    const mockId = `cus_mock_${Date.now()}`;
    console.log(`💳 [STRIPE] Created customer: ${mockId} for ${email}`);
    return mockId;
  }

  static async createPaymentIntent(amount: number, currency: string = 'usd', customerId?: string): Promise<{ id: string; clientSecret: string }> {
    const mockId = `pi_mock_${Date.now()}`;
    console.log(`💳 [STRIPE] Created payment intent: ${mockId} for $${amount / 100}`);
    return { id: mockId, clientSecret: `${mockId}_secret_mock` };
  }

  static async confirmPayment(paymentIntentId: string): Promise<{ status: string }> {
    console.log(`💳 [STRIPE] Payment confirmed: ${paymentIntentId}`);
    return { status: 'succeeded' };
  }

  static async createConnectAccount(email: string): Promise<string> {
    const mockId = `acct_mock_${Date.now()}`;
    console.log(`💳 [STRIPE] Created Connect account: ${mockId} for ${email}`);
    return mockId;
  }

  static async createTransfer(amount: number, connectedAccountId: string): Promise<string> {
    const mockId = `tr_mock_${Date.now()}`;
    console.log(`💳 [STRIPE] Transfer: $${amount / 100} to ${connectedAccountId}`);
    return mockId;
  }

  static async createRefund(chargeId: string, amount?: number): Promise<string> {
    const mockId = `re_mock_${Date.now()}`;
    console.log(`💳 [STRIPE] Refund: ${chargeId}, amount: ${amount ? `$${amount / 100}` : 'full'}`);
    return mockId;
  }

  static async createSubscription(customerId: string, priceId: string): Promise<string> {
    const mockId = `sub_mock_${Date.now()}`;
    console.log(`💳 [STRIPE] Subscription: ${mockId} for customer ${customerId}`);
    return mockId;
  }

  static async cancelSubscription(subscriptionId: string): Promise<void> {
    console.log(`💳 [STRIPE] Cancelled subscription: ${subscriptionId}`);
  }
}
