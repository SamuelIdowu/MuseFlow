import { PaymentProvider } from './types';
import { PaystackPaymentProvider } from './providers/paystack';
import { PaddlePaymentsProvider } from './providers/paddle';
import { DodoPaymentsProvider } from './providers/dodo';
import { PolarPaymentsProvider } from './providers/polar';
import { CreemPaymentsProvider } from './providers/creem';
import { StripePaymentProvider } from './providers/stripe';
import { FlutterwavePaymentProvider } from './providers/flutterwave';
import { MockPaymentProvider } from './providers/mock';

export * from './types';
export * from './config';
export * from './guards';

const providers: Partial<Record<string, PaymentProvider>> = {};

export function getPaymentProvider(providerOverride?: string): PaymentProvider {
  const providerName = (
    providerOverride ||
    process.env.PAYMENT_PROVIDER ||
    (process.env.PAYSTACK_SECRET_KEY
      ? 'paystack'
      : process.env.PADDLE_API_KEY
      ? 'paddle'
      : process.env.DODO_PAYMENTS_API_KEY
      ? 'dodo'
      : process.env.POLAR_ACCESS_TOKEN
      ? 'polar'
      : process.env.CREEM_API_KEY
      ? 'creem'
      : process.env.STRIPE_SECRET_KEY
      ? 'stripe'
      : process.env.FLUTTERWAVE_SECRET_KEY
      ? 'flutterwave'
      : 'mock')
  ).toLowerCase();

  if (providers[providerName]) {
    return providers[providerName]!;
  }

  let provider: PaymentProvider;
  switch (providerName) {
    case 'paystack':
      provider = new PaystackPaymentProvider();
      break;
    case 'paddle':
      provider = new PaddlePaymentsProvider();
      break;
    case 'dodo':
    case 'dodopayments':
      provider = new DodoPaymentsProvider();
      break;
    case 'polar':
    case 'polarsh':
      provider = new PolarPaymentsProvider();
      break;
    case 'creem':
      provider = new CreemPaymentsProvider();
      break;
    case 'stripe':
      provider = new StripePaymentProvider();
      break;
    case 'flutterwave':
      provider = new FlutterwavePaymentProvider();
      break;
    case 'mock':
    default:
      provider = new MockPaymentProvider();
      break;
  }

  providers[providerName] = provider;
  return provider;
}
