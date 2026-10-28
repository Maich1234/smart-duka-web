import test from 'node:test';
import assert from 'node:assert/strict';
import { fetchJson } from '../src/lib/fetchJson.ts';
test('stalled response body is timed out and the transport is aborted',async()=>{
 const original=globalThis.fetch;
 globalThis.fetch=async(_url,{signal})=>({ok:true,json:()=>new Promise((_resolve,reject)=>signal.addEventListener('abort',()=>reject(new Error('aborted')),{once:true}))});
 try { await assert.rejects(fetchJson('https://example.test',{timeoutMs:10}),/taking too long/); } finally { globalThis.fetch=original; }
});
test('caller cancellation aborts the request',async()=>{
 const original=globalThis.fetch;const controller=new AbortController();
 globalThis.fetch=async(_url,{signal})=>new Promise((_resolve,reject)=>signal.addEventListener('abort',()=>reject(new Error('cancelled')),{once:true}));
 try { const request=fetchJson('https://example.test',{signal:controller.signal});controller.abort();await assert.rejects(request,/cancelled/); } finally {globalThis.fetch=original;}
});
test('valid data returns and missing quotation is reported',async()=>{
 const original=globalThis.fetch;
 try {globalThis.fetch=async()=>({ok:true,json:async()=>({data:{quoteNumber:'Q1'}})});assert.deepEqual(await fetchJson('https://example.test'),{data:{quoteNumber:'Q1'}});globalThis.fetch=async()=>({ok:false,status:404});await assert.rejects(fetchJson('https://example.test'),/not found/);}finally{globalThis.fetch=original;}
});
