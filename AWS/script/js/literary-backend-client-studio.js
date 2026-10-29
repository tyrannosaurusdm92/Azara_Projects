(function () {
  'use strict';
  const CONFIG = Object.freeze({
    execUrl: 'https://script.google.com/macros/s/AKfycbyvpUn2_fADmOAOMqh1pHatTlegwZKYloWRPSSrM1kBkSwP2l5LzADQ7jKMr7TCJJP2/exec',
    libraryUrl: ''
  });
  const PUBLIC_ACTIONS = new Set(['health','manifest','client.config','auth.login','auth.register','auth.google','auth.password.reset.request','auth.password.reset.complete','auth.recovery.code.login','auth.contact.code.verify','auth.2fa.verify','auth.2fa.resend']);
  let sessionToken = '';
  let sessionUser = null;

  function readToken() {
    if (sessionToken) return sessionToken;
    const sessionKeys = ['literaryfriend.session.token.v2','literaryfriend.session.token','literaryfriend-book-token','lf.auth.token'];
    const persistentKeys = ['literaryfriend.session.token.v2','literaryfriend.session.token','lf.auth.token'];
    try { for (const key of sessionKeys) { const value = sessionStorage.getItem(key); if (value) return value; } } catch (_) {}
    try { for (const key of persistentKeys) { const value = localStorage.getItem(key); if (value) return value; } } catch (_) {}
    return '';
  }
  function mirrorToken(value) {
    const token = String(value || '');
    const keys = ['literaryfriend.session.token.v2','literaryfriend.session.token','literaryfriend-book-token','lf.auth.token'];
    try { for (const key of keys) token ? sessionStorage.setItem(key, token) : sessionStorage.removeItem(key); } catch (_) {}
  }
  function setSession(token, user = null) {
    sessionToken = String(token || '');
    sessionUser = user || null;
    mirrorToken(sessionToken);
    return { token: sessionToken, user: sessionUser };
  }
  function token() { sessionToken = readToken(); if (sessionToken) mirrorToken(sessionToken); return sessionToken; }

  async function decode(response) {
    const text = await response.text();
    let body;
    try { body = JSON.parse(text); } catch (_) { throw new Error(`LiteraryFriend backend returned non-JSON (HTTP ${response.status}).`); }
    if (!response.ok || body?.ok === false) throw new Error(body?.error?.message || body?.message || `Backend request failed (${response.status})`);
    if (body?.token) setSession(body.token, body.user || sessionUser);
    return body;
  }

  async function request(payload, options = {}) {
    const action = String(payload?.action || '');
    if (!action) throw new Error('Backend action is required.');
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), Number(options.timeoutMs || 120000));
    const envelope = { ...payload };
    if (!Object.prototype.hasOwnProperty.call(envelope, 'data')) envelope.data = {};
    if (!Object.prototype.hasOwnProperty.call(envelope, 'token') && !PUBLIC_ACTIONS.has(action)) envelope.token = token();
    try {
      const response = await fetch(CONFIG.execUrl, {
        method: options.method || 'POST',
        headers: {'Content-Type': 'text/plain;charset=UTF-8'},
        body: JSON.stringify(envelope),
        signal: controller.signal,
        redirect: 'follow',
        cache: 'no-store',
        credentials: 'omit'
      });
      return await decode(response);
    } catch (error) {
      if (error?.name === 'AbortError') throw new Error('LiteraryFriend backend request timed out.');
      throw error;
    } finally { clearTimeout(timer); }
  }
  async function get(action) {
    const url = new URL(CONFIG.execUrl); url.searchParams.set('action', action);
    const response = await fetch(url, { cache: 'no-store', credentials: 'omit' });
    return decode(response);
  }
  const api = { CONFIG, request, get, health: () => get('health'), clientConfig: () => get('client.config'), setSession, token, user: () => sessionUser };
  window.LiteraryFriendBackend = Object.freeze(api);
})();
