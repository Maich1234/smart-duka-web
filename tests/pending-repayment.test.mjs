import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parsePendingRepayment, mayRetryRepayment } from '../src/lib/pendingRepayment.ts';
const valid={key:'sale-123',customerId:'customer-a',data:{amount:50,paymentMethod:'cash'},createdAt:1000};
test('a saved repayment is recovered exactly for the same customer',()=>{assert.deepEqual(parsePendingRepayment(JSON.stringify(valid),'customer-a'),{kind:'pending',value:valid});});
test('corrupt, cross-customer and invalid amounts are blocked',()=>{for(const raw of ['{',JSON.stringify({...valid,customerId:'customer-b'}),JSON.stringify({...valid,data:{amount:-1,paymentMethod:'cash'}}),JSON.stringify({...valid,data:{amount:10,paymentMethod:'credit'}})]) assert.equal(parsePendingRepayment(raw,'customer-a').kind,'invalid');});
test('retry is allowed only inside the bounded window',()=>{assert.equal(mayRetryRepayment(1000,1000),true);assert.equal(mayRetryRepayment(1000,1000+72*60*60*1000),false);assert.equal(mayRetryRepayment(1000,999),false);});
test('missing saved state is distinguished from invalid data',()=>assert.equal(parsePendingRepayment(null,'customer-a').kind,'empty'));
