import test from 'node:test';
import assert from 'node:assert/strict';
import { EMPTY_PRODUCT_FORM, productToForm, toPayload } from '../src/lib/productForm.ts';
test('weighted stock and a zero alert threshold survive serialization',()=>{
 const payload=toPayload({...EMPTY_PRODUCT_FORM,productType:'weighted',quantity:'2.75',lowStockAlert:'0'});
 assert.equal(payload.quantity,2.75);assert.equal(payload.lowStockAlert,0);
});
test('editing a variant preserves its immutable identifier',()=>{
 const form=productToForm({_id:'p',name:'T',productType:'configurable',variants:[{_id:'v',name:'Large',quantity:1,sellingPrice:200,costPrice:100,lowStockAlert:0}]});
 const payload=toPayload(form);
 assert.equal(payload.variants[0]._id,'v');assert.equal(payload.variants[0].lowStockAlert,0);
});
