import test from 'node:test';
import assert from 'node:assert/strict';
import { parsePendingCreditSale, mayRetryCreditSale } from '../src/lib/pendingCreditSale.ts';
const sale = { key: 'sale-123', createdAt: 1000, customerName: 'Amina', data: { items: [{ productId: 'p', quantity: 1 }], paymentMethod: 'credit', customerId: 'c', requireCreditBooking: true } };
test('recovers the exact credit request for an idempotent retry', () => assert.deepEqual(parsePendingCreditSale(JSON.stringify(sale)), sale));
test('rejects corrupted or unsafe saved requests', () => {
  for (const value of ['{', JSON.stringify({ ...sale, data: { ...sale.data, paymentMethod: '' } }), JSON.stringify({ ...sale, data: { ...sale.data, items: [] } }), JSON.stringify({ ...sale, createdAt: 0 })]) assert.throws(() => parsePendingCreditSale(value));
});
test('only retries within the idempotency window and never with a future timestamp', () => {
  assert.equal(mayRetryCreditSale(1000, 1000), true);
  assert.equal(mayRetryCreditSale(1000, 999), false);
  assert.equal(mayRetryCreditSale(1000, 1000 + 72 * 60 * 60 * 1000), false);
});

test('recovers ordinary cash sales without assigning customer credit', () => { const cash = { ...sale, data:{items:[{productId:'p',quantity:1}],paymentMethod:'cash'} }; assert.deepEqual(parsePendingCreditSale(JSON.stringify(cash)), cash); });
