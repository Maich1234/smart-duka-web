import test from 'node:test';
import assert from 'node:assert/strict';
import { buildReceiptHtml } from '../src/utils/receiptHtml.ts';

test('receipt escapes data from shops, payment methods and sale lines', () => {
  const payload = '<img src=x onerror=alert(1)>';
  const html = buildReceiptHtml({ _id:'1', invoiceNumber: payload, totalAmount: 2, paymentMethod: payload, createdAt:'2026-10-01', items:[{name:payload, quantity:payload, subtotal:2}] }, payload, payload, payload, payload, payload, `https://example.test/a" onerror="alert(1)`, payload);
  assert.ok(!html.includes(payload));
  assert.ok(!html.includes('onerror="alert(1)"'));
  assert.ok(html.includes('&lt;img'));
  assert.ok(html.includes('&lt;IMG'));
  assert.ok(!html.includes('<IMG SRC=X')); 
  assert.match(html, /Content-Security-Policy/);
  assert.match(html, /referrerpolicy="no-referrer"/);
});
