import test from 'node:test';
import assert from 'node:assert/strict';
import { createState, verifyState, configuredOrigin, callbackPage } from '../lib/oauth.mjs';

const secret = 'test-only-secret-with-more-than-32-characters';
test('OAuth state is signed, short-lived and includes a PKCE verifier', () => {
  const state = createState(secret, 1000);
  const verified = verifyState(state.cookie, state.state, secret, 1001);
  assert.equal(verified.verifier.length >= 43, true);
  assert.equal(verified.state, state.state);
  assert.throws(() => verifyState(state.cookie + 'x', state.state, secret, 1001));
  assert.throws(() => verifyState(state.cookie, 'wrong-state', secret, 1001));
  assert.throws(() => verifyState(state.cookie, state.state, secret, 1000 + 601));
});
test('production origin must be an explicit HTTPS origin and cannot come from request parameters', () => {
  assert.equal(configuredOrigin('https://zhaomoyan.com'), 'https://zhaomoyan.com');
  for (const origin of ['', 'http://zhaomoyan.com', 'https://example.com/evil', 'https://user:pass@example.com', 'https://example.com?evil=1']) {
    assert.throws(() => configuredOrigin(origin));
  }
});
test('OAuth callback escapes scripts and only sends credentials to the configured opener origin', () => {
  const html = callbackPage('https://zhaomoyan.com', { token: '</script><script>bad()</script>', provider: 'github' });
  assert.equal(html.includes('</script><script>bad()'), false);
  assert.match(html, /event.source/);
  assert.match(html, /event.origin/);
  assert.equal(html.includes('postMessage(message, "*")'), false);
});
