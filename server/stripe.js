// Stripe Checkout + webhook verification using the REST API (works with test-mode keys).
import { createHmac, timingSafeEqual } from 'node:crypto';
import { HttpError } from './http.js';

const form = (obj, prefix = '', out = new URLSearchParams()) => {
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}[${k}]` : k;
    if (v === undefined || v === null) continue;
    if (typeof v === 'object') form(v, key, out); else out.append(key, String(v));
  }
  return out;
};

export async function createPoolCheckout(env, { companyId, companyName, month, userId, email, origin }, fetchImpl = fetch) {
  if (!env.stripeSecretKey) throw new HttpError(503, 'Stripe is not configured.', 'not_configured');
  if (!/^sk_test_/.test(env.stripeSecretKey) && env.raw?.STRIPE_ALLOW_LIVE !== '1') {
    throw new HttpError(503, 'Use a Stripe test-mode key (sk_test_…) or set STRIPE_ALLOW_LIVE=1.', 'not_configured');
  }
  const site = env.appUrl || origin;
  const body = form({
    mode: 'payment',
    success_url: `${site}/?pool=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${site}/?pool=cancelled`,
    client_reference_id: companyId,
    customer_email: email,
    'line_items': { 0: { quantity: 1, price_data: { currency: 'thb', unit_amount: env.poolPriceThb * 100,
      product_data: { name: `Meow Pool early access · ${month.slice(0, 7)}`, description: `Top 50 students for ${companyName}` } } } },
    metadata: { company_id: companyId, month, user_id: userId, product: 'meow_pool' }
  });
  const res = await fetchImpl('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.stripeSecretKey}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body, signal: AbortSignal.timeout(15000)
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new HttpError(502, 'Stripe could not start checkout.', 'stripe_error');
  return { id: data.id, url: data.url };
}

/** Verifies a Stripe-Signature header (v1 scheme). Returns the parsed event or throws. */
export function verifyStripeEvent(payload, header, secret, { toleranceSec = 300, now = Date.now() } = {}) {
  if (!secret) throw new HttpError(503, 'STRIPE_WEBHOOK_SECRET is not set.', 'not_configured');
  const parts = Object.fromEntries((header || '').split(',').map(p => p.split('=')).filter(p => p.length === 2).map(([k, v]) => [k.trim(), v]));
  const signatures = (header || '').split(',').filter(p => p.startsWith('v1=')).map(p => p.slice(3));
  const t = Number(parts.t);
  if (!t || !signatures.length) throw new HttpError(400, 'Missing Stripe signature.');
  if (Math.abs(now / 1000 - t) > toleranceSec) throw new HttpError(400, 'Stripe signature is too old.');
  const expected = createHmac('sha256', secret).update(`${t}.${payload}`).digest('hex');
  const ok = signatures.some(sig => sig.length === expected.length && timingSafeEqual(Buffer.from(sig), Buffer.from(expected)));
  if (!ok) throw new HttpError(400, 'Invalid Stripe signature.');
  return JSON.parse(payload);
}
export const signForTest = (payload, secret, t = Math.floor(Date.now() / 1000)) =>
  `t=${t},v1=${createHmac('sha256', secret).update(`${t}.${payload}`).digest('hex')}`;

export async function retrieveCheckout(env, id, fetchImpl = fetch) {
  if (!env.stripeSecretKey) throw new HttpError(503, 'Stripe is not configured.', 'not_configured');
  if (!/^cs_[A-Za-z0-9_]+$/.test(id || '')) throw new HttpError(400, 'Invalid checkout session.');
  const res = await fetchImpl(`https://api.stripe.com/v1/checkout/sessions/${id}`, { headers: { Authorization: `Bearer ${env.stripeSecretKey}` }, signal: AbortSignal.timeout(15000) });
  if (!res.ok) throw new HttpError(502, 'Could not verify the payment with Stripe.');
  return res.json();
}
