import { test } from 'node:test';
import assert from 'node:assert/strict';
import { saleLinePreview } from '../src/lib/salePricing.ts';
const promotion={buyQty:2,freeQty:1};
test('buy two get one free prices six units as four',()=>assert.equal(saleLinePreview('standard',[promotion],6,80).subtotal,320));
test('chooses best promotion and ignores disabled offers',()=>{const r=saleLinePreview('variable',[promotion,{buyQty:1,freeQty:1},{buyQty:1,freeQty:5,isActive:false}],6,10);assert.equal(r.subtotal,30);assert.equal(r.saved,30)});
test('bundle and configurable types do not apply product promotions',()=>{for(const type of ['bundle','configurable'])assert.equal(saleLinePreview(type,[promotion],3,80).subtotal,240)});
