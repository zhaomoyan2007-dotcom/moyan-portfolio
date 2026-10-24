import test from 'node:test';
import assert from 'node:assert/strict';
import { guardBuild } from '../scripts/build.mjs';
test('CMS draft branches cannot produce a public Vercel preview',()=>{
  assert.throws(()=>guardBuild({VERCEL:'1',VERCEL_GIT_COMMIT_REF:'cms/projects/first-series'}),/草稿/);
  assert.doesNotThrow(()=>guardBuild({VERCEL:'1',VERCEL_GIT_COMMIT_REF:'main'}));
});
