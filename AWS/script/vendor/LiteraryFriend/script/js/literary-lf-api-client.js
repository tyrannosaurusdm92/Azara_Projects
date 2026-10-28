(function (global) {
  'use strict';
  const LF = global.LiteraryFriend;
  const U = LF.util;

  class LiteraryFriendAPIError extends Error {
    constructor(message, details = {}) {
      super(message || 'LiteraryFriend request failed.');
      this.name = 'LiteraryFriendAPIError';
      this.code = details.code || 'REQUEST_FAILED';
      this.status = Number(details.status || 0);
      this.details = details;
    }
  }

  class APIClient {
    constructor(config = LF.backend) {
      this.config = config;
      this.token = this._readStoredToken();
      this._mirrorSessionToken(this.token);
      this.aborters = new Map();
      this.clientConfig = null;
    }

    _readStoredToken() {
      const sessionKeys = [this.config.tokenStorageKey, 'literaryfriend.session.token', 'literaryfriend-book-token', 'lf.auth.token'];
      const persistentKeys = [this.config.tokenStorageKey, 'literaryfriend.session.token', 'lf.auth.token'];
      try { for (const key of sessionKeys) { const value = sessionStorage.getItem(key); if (value) return value; } } catch (_) {}
      try { for (const key of persistentKeys) { const value = localStorage.getItem(key); if (value) return value; } } catch (_) {}
      return '';
    }

    _mirrorSessionToken(token) {
      const value = String(token || '');
      const keys = [this.config.tokenStorageKey, 'literaryfriend.session.token', 'literaryfriend-book-token', 'lf.auth.token'];
      try { for (const key of keys) value ? sessionStorage.setItem(key, value) : sessionStorage.removeItem(key); } catch (_) {}
    }

    setToken(token) {
      this.token = String(token || '');
      this._mirrorSessionToken(this.token);
      LF.events.emit('auth:token', { present: Boolean(this.token) });
    }

    clearToken() { this.setToken(''); }
    hasToken() { return Boolean(this.token); }

    async health() {
      if (LF.services.guest?.active?.()) return LF.services.guest.request('health', {});
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), this.config.healthTimeoutMs);
      try {
        const response = await fetch(this.config.endpoint + this.config.healthPath, { signal: controller.signal, cache: 'no-store' });
        return await this._decode(response);
      } finally { clearTimeout(timer); }
    }

    async loadClientConfig(force = false) {
      if (LF.services.guest?.active?.()) return LF.services.guest.request('client.config', {});
      if (this.clientConfig && !force) return this.clientConfig;
      const response = await fetch(this.config.endpoint + this.config.clientConfigPath, { cache: 'no-store' });
      this.clientConfig = await this._decode(response);
      return this.clientConfig;
    }

    async request(action, data = {}, options = {}) {
      if (LF.services.guest?.active?.() && options.local !== false && !['auth.login','auth.register','auth.google','auth.password.reset.request','auth.password.reset.complete','auth.recovery.code.login','auth.contact.code.verify','auth.2fa.verify','auth.2fa.resend'].includes(action)) return LF.services.guest.request(action, data);
      if (!action) throw new LiteraryFriendAPIError('Action is required.', { code: 'MISSING_ACTION' });
      const requestId = options.requestId || U.uid('request');
      const controller = new AbortController();
      this.aborters.set(requestId, controller);
      const timeoutMs = Number(options.timeoutMs || this.config.requestTimeoutMs);
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      const payload = {
        action,
        data: data || {},
        ...(this.token && options.auth !== false ? { token: this.token } : {})
      };
      LF.events.emit('api:start', { action, requestId, data: options.redact ? '[redacted]' : data });
      try {
        // text/plain avoids an unnecessary CORS preflight against Apps Script while still carrying JSON.
        const response = await fetch(this.config.endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
          body: JSON.stringify(payload),
          signal: controller.signal,
          cache: 'no-store',
          credentials: 'omit'
        });
        const body = await this._decode(response);
        if (body?.token && options.captureToken !== false) this.setToken(body.token);
        if (body?.ok === false) throw this._fromEnvelope(body, response.status);
        LF.events.emit('api:success', { action, requestId, body });
        return body;
      } catch (error) {
        const wrapped = error?.name === 'AbortError'
          ? new LiteraryFriendAPIError('The request timed out or was cancelled.', { code: 'REQUEST_ABORTED' })
          : error instanceof LiteraryFriendAPIError ? error : new LiteraryFriendAPIError(error?.message, { cause: error });
        LF.events.emit('api:error', { action, requestId, error: wrapped });
        throw wrapped;
      } finally {
        clearTimeout(timer);
        this.aborters.delete(requestId);
      }
    }

    cancel(requestId) { this.aborters.get(requestId)?.abort(); }
    cancelAll() { for (const controller of this.aborters.values()) controller.abort(); this.aborters.clear(); }

    async get(action, query = {}) {
      if (LF.services.guest?.active?.()) return LF.services.guest.get(action, query);
      const url = new URL(this.config.endpoint);
      url.searchParams.set('action', action);
      for (const [key, value] of Object.entries(query || {})) if (value != null) url.searchParams.set(key, typeof value === 'object' ? JSON.stringify(value) : String(value));
      if (this.token) url.searchParams.set('token', this.token);
      const response = await fetch(url, { cache: 'no-store' });
      return this._decode(response);
    }

    async _decode(response) {
      const text = await response.text();
      let body;
      try { body = JSON.parse(text); } catch (_) {
        throw new LiteraryFriendAPIError('The backend returned an unreadable response.', { code: 'INVALID_RESPONSE', status: response.status, preview: text.slice(0, 500) });
      }
      if (!response.ok || body?.ok === false) throw this._fromEnvelope(body, response.status);
      return body;
    }

    _fromEnvelope(body, status = 0) {
      const error = body?.error || body || {};
      return new LiteraryFriendAPIError(error.message || error.publicMessage || 'LiteraryFriend request failed.', {
        code: error.code || 'BACKEND_ERROR', status: error.status || status, data: error.data, envelope: body
      });
    }
  }

  LF.APIError = LiteraryFriendAPIError;
  LF.services.api = new APIClient();
})(window);
