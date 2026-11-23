import test from 'node:test';
import assert from 'node:assert/strict';
import * as preview from '../public/admin/film-preview.mjs';
import * as media from '../public/media.mjs';
import { cmsConfiguration } from '../lib/cms-config.mjs';

const ratios = [4/3, 1, 3/2, 2/3, 9/16, 16/9, 4/3, 16/9, 3/2];

test('mixed frames form compact rows in reading order with each ratio intact', async () => {
  const layout = await import('../public/film-layout.mjs').catch(error => {
    if (error.code !== 'ERR_MODULE_NOT_FOUND') throw error;
    return {};
  });
  assert.equal(typeof layout.filmRows, 'function');
  const rows = layout.filmRows(ratios);
  assert.deepEqual(rows.flatMap(row => row.columns), ratios);
  assert.ok(rows.every(row => row.columns.length >= 2 && row.width >= .9));
  assert.ok(layout.filmRows([9/16])[0].width < .5);
});

test('auto arrange balances rows while preserving every image, including repeats', async () => {
  const { autoFilmOrder, filmRows } = await import('../public/film-layout.mjs');
  const grouped = [2.4, 2.4, 2.4, 2.4, .6, .6, .6, .6, .6];
  const order = autoFilmOrder(grouped);
  assert.deepEqual([...order].sort((a,b) => a-b), grouped.map((_,i) => i));
  const range = rows => {
    const heights = rows.map(row => row.width / row.columns.reduce((a,b) => a+b,0));
    return Math.max(...heights) - Math.min(...heights);
  };
  assert.ok(range(filmRows(order.map(i => grouped[i]))) < range(filmRows(grouped)));
});

test('reordering stills writes to the existing photos field and leaves legacy cover entries in place', () => {
  assert.equal(typeof media.reorderFilmStills, 'function');
  const project = {cover:'cover', images:['a','cover','b','a','c']};
  assert.deepEqual(media.reorderFilmStills(project, [3, 1, 2, 0]), ['c','cover','b','a','a']);
  assert.deepEqual(media.reorderFilmStills({images:['lead','a','b']}, [1,0]), ['lead','b','a']);
  assert.equal(media.reorderFilmStills(project, [0, 0, 1, 2]), null);
  const fields = cmsConfiguration({}, true).config.collections.find(c => c.name === 'projects').fields;
  assert.equal(fields.find(field => field.name === 'images').widget, 'project-images');
  assert.equal(typeof preview.filmStillsEditor, 'function');
});
