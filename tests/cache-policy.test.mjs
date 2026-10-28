import test from 'node:test';
import assert from 'node:assert/strict';
import { isCacheableBuildAsset } from '../src/lib/cachePolicy.ts';
test('only same-origin versioned Next assets enter the runtime cache', () => {
  assert.equal(isCacheableBuildAsset(true,'/_next/static/chunks/app.js'),true);
  for(const path of ['/api/v1/sales','/owner/customers','/q/token','/r/token','/_next/data/build/owner.json','/download/private.pdf']) assert.equal(isCacheableBuildAsset(true,path),false);
  assert.equal(isCacheableBuildAsset(false,'/_next/static/chunks/app.js'),false);
});
