import test from 'node:test';
import assert from 'node:assert/strict';
import { QueryClient, onlineManager } from '@tanstack/react-query';
import { queryReadPolicy } from '../src/lib/queryPolicy.ts';
test('offline reads reach an error instead of remaining paused and do not retry',async()=>{
 const previous=onlineManager.isOnline();const client=new QueryClient({defaultOptions:{queries:queryReadPolicy}});let attempts=0;
 onlineManager.setOnline(false);
 try {await assert.rejects(client.fetchQuery({queryKey:['offline'],queryFn:async()=>{attempts++;throw new Error('Network unavailable');}}),/Network unavailable/);assert.equal(attempts,1);assert.equal(client.getQueryState(['offline']).status,'error');assert.equal(client.getQueryState(['offline']).fetchStatus,'idle');}finally{client.clear();onlineManager.setOnline(previous);}
});
