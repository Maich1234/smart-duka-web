import test from 'node:test';
import assert from 'node:assert/strict';
import { sameSessionIdentity } from '../src/lib/sessionIdentity.ts';
const user = { _id:'u1', shop:{_id:'s1'}, role:'staff', permissions:['record_sale','view_products'] };
test('account, shop, role and permissions changes invalidate identity', () => {
  for (const changed of [null, {...user,_id:'u2'}, {...user,shop:{_id:'s2'}}, {...user,role:'owner'}, {...user,permissions:['view_products']}]) assert.equal(sameSessionIdentity(user,changed), false);
});
test('permission ordering and duplicates do not change identity', () => {
  assert.equal(sameSessionIdentity(user,{...user,permissions:['view_products','record_sale','record_sale']}),true);
  assert.equal(sameSessionIdentity(null,null),true);
});
