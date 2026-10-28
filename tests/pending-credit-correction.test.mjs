import test from 'node:test';
import assert from 'node:assert/strict';
import { parseCreditCorrection, canRetryCorrection } from '../src/lib/pendingCreditCorrection.ts';
const p={key:'stable',createdAt:1000,kind:'opening',target:'customer',amount:50,note:'Old debt'};
test('preserves the exact opening-balance request for recovery',()=>assert.deepEqual(parseCreditCorrection(JSON.stringify(p),'opening','customer'),p));
test('rejects cross-target, malformed and invalid financial data',()=>{
 for(const q of [{...p,target:'other'},{...p,amount:-1},{...p,amount:1.001},{...p,key:''},{...p,kind:'reverse',reason:'x'}]) assert.throws(()=>parseCreditCorrection(JSON.stringify(q),'opening','customer'));
 assert.throws(()=>parseCreditCorrection('{','opening','customer'));
});
test('reversal requires a reason and retry window is bounded',()=>{
 const r={key:'stable',createdAt:1000,kind:'reverse',target:'tx',reason:'Wrong entry'};
 assert.deepEqual(parseCreditCorrection(JSON.stringify(r),'reverse','tx'),r);
 assert.equal(canRetryCorrection(r,1000),true);
 assert.equal(canRetryCorrection(r,999),false);
 assert.equal(canRetryCorrection(r,1000+72*60*60*1000),false);
});
