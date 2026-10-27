import test from 'node:test';
import assert from 'node:assert/strict';
import { parseCreditLimit, parseCollectionDays } from '../src/lib/creditSettings.ts';
test('credit limits accept only bounded amounts at currency precision', () => {
  for (const [input, expected] of [['0', 0], ['123.45', 123.45], ['10000000', 10000000], ['', null], ['-1', null], ['1.001', null], ['10000000.01', null], ['Infinity', null]]) assert.equal(parseCreditLimit(input), expected);
});
test('collection periods require whole days in range', () => {
  for (const [input, expected] of [['0', 0], ['365', 365], ['366', null], ['1.5', null], ['-1', null], ['', null]]) assert.equal(parseCollectionDays(input), expected);
});
