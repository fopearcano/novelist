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

import { allScenes, initialProject, migrateProject } from '../app.js';

test('flattens the nested manuscript hierarchy', () => {
  assert.equal(allScenes(initialProject).length, 7);
});

test('migrates prototype saves and supplies durable scene metadata', () => {
  const legacy = structuredClone(initialProject);
  legacy.acts[0].chapters[0].scenes[0] = { id: 'arrival', title: 'Arrival', words: 10, color: '#fff' };
  legacy.sceneContent = { arrival: '<p>Legacy prose</p>' };
  const migrated = migrateProject(legacy);
  const arrival = allScenes(migrated).find(item => item.id === 'arrival');
  assert.equal(arrival.content, '<p>Legacy prose</p>');
  assert.deepEqual(arrival.tags, []);
  assert.equal(arrival.status, 'Draft');
});
