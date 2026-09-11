import test from 'node:test';
import assert from 'node:assert/strict';
import { countWords, projectProgress, modes } from '../app.js';

test('counts manuscript words including contractions', () => {
  assert.equal(countWords("Mara's light can't fade."), 4);
  assert.equal(countWords('   '), 0);
});

test('calculates and caps draft progress', () => {
  assert.equal(projectProgress(36000, 72000), 50);
  assert.equal(projectProgress(80000, 72000), 100);
});

test('offers all three writing modes', () => {
  assert.deepEqual(Object.keys(modes), ['novel', 'screenplay', 'graphic']);
});
