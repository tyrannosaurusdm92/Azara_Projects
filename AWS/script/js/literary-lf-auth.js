(function (global) {
  'use strict';
  const LF = global.LiteraryFriend;
  const U = LF.util;
  const api = LF.services.api;

  class IdentityService {
    constructor() {
      this.user = null;
      this.challenge = null;
      this.clientConfig = null;
      this.ready = false;
    }

    async init() {
      if (LF.services.session?.isGuest?.()) { this.user = LF.services.session.guestUser(); this.ready = true; this.bindUI(); this.renderState(); LF.events.emit('auth:ready',{user:this.user,authenticated:false,guest:true}); return this.user; }
      try { this.clientConfig = await api.loadClientConfig(); } catch (error) { LF.events.emit('backend:offline', error); }
      if (api.hasToken()) {
        try {
          const result = await api.request('auth.me', {});
          this.user = result.user || null;
          this.ready = Boolean(this.user);
        } catch (_) { api.clearToken(); }
      }
      this.bindUI();
      this.renderState();
      LF.events.emit('auth:ready', { user: this.user, authenticated: this.authenticated() });
      return this.user;
    }

    authenticated() { return Boolean(this.user && api.hasToken()); }
    guest() { return LF.services.session?.isGuest?.() === true; }
    hasAccess() { return this.authenticated() || this.guest(); }

    async login(credentials) {
      const data = {
        login: credentials.login || credentials.email || credentials.username || '',
        password: credentials.password || '',
        deviceId: this.deviceId(),
        deviceName: credentials.deviceName || this.deviceName(),
        platform: navigator.platform || '',
        userAgent: navigator.userAgent || ''
      };
      const result = await api.request('auth.login', data, { auth: false, redact: true });
      return this.consumeAuthResult(result);
    }

    async register(data) {
      if (data.passwordConfirm != null && data.password !== data.passwordConfirm) throw new Error('Passwords do not match.');
      const result = await api.request('auth.register', {
        username: data.username || '',
        email: data.email || data.primaryEmail || '',
        primaryEmail: data.email || data.primaryEmail || '',
        displayName: data.displayName || data.name || '',
        password: data.password || '',
        deviceId: this.deviceId(),
        deviceName: this.deviceName(),
        platform: navigator.platform || '',
        userAgent: navigator.userAgent || ''
      }, { auth: false, redact: true });
      return this.consumeAuthResult(result);
    }

    async google(credential, extra = {}) {
      const result = await api.request('auth.google', {
        credential,
        idToken: credential,
        ...extra,
        deviceId: this.deviceId(),
        deviceName: this.deviceName(),
        platform: navigator.platform || '',
        userAgent: navigator.userAgent || ''
      }, { auth: false, redact: true });
      return this.consumeAuthResult(result);
    }

    async consumeAuthResult(result) {
      if (result.twoFactorRequired) {
        this.challenge = {
          token: result.challengeToken,
          method: result.method,
          destination: result.destination,
          expiresAt: result.expiresAt
        };
        LF.events.emit('auth:2fa-required', this.challenge);
        this.showPanel('two-factor');
        U.status(`Verification code sent to ${result.destination || 'your recovery method'}.`);
        return { twoFactorRequired: true, challenge: this.challenge };
      }
      this.challenge = null;
      if (result.token) api.setToken(result.token);
      this.user = result.user || (await api.request('auth.me', {})).user;
      this.ready = true;
      LF.services.session?.markAccount?.();
      this.renderState();
      LF.events.emit('auth:signed-in', { user: this.user, session: result.session });
      U.status('Signed in.', 'success');
      return { user: this.user, session: result.session };
    }

    async verifyTwoFactor(code) {
      if (!this.challenge?.token) throw new Error('Start sign-in again to request a verification challenge.');
      const result = await api.request('auth.2fa.verify', {
        challengeToken: this.challenge.token,
        code,
        deviceId: this.deviceId(),
        deviceName: this.deviceName(),
        platform: navigator.platform || '',
        userAgent: navigator.userAgent || ''
      }, { auth: false, redact: true });
      return this.consumeAuthResult(result);
    }

    async resendTwoFactor() {
      if (!this.challenge?.token) throw new Error('There is no active verification challenge.');
      const result = await api.request('auth.2fa.resend', { challengeToken: this.challenge.token }, { auth: false, redact: true });
      this.challenge = { ...this.challenge, destination: result.destination, expiresAt: result.expiresAt, method: result.method };
      return this.challenge;
    }

    async requestPasswordReset(login) {
      const result = await api.request('auth.password.reset.request', { login }, { auth: false, redact: true });
      U.status(result.message || 'If the account exists, recovery instructions were sent.');
      return result;
    }

    async completePasswordReset(data) {
      const result = await api.request('auth.password.reset.complete', {
        login: data.login,
        code: data.code,
        newPassword: data.newPassword,
        deviceId: this.deviceId(), deviceName: this.deviceName(), platform: navigator.platform || '', userAgent: navigator.userAgent || ''
      }, { auth: false, redact: true });
      return result.token || result.user ? this.consumeAuthResult(result) : result;
    }

    async recoveryCodeLogin(login, code) {
      const result = await api.request('auth.recovery.code.login', {
        login, code, deviceId: this.deviceId(), deviceName: this.deviceName(), platform: navigator.platform || '', userAgent: navigator.userAgent || ''
      }, { auth: false, redact: true });
      return this.consumeAuthResult(result);
    }

    async logout() {
      const wasGuest=this.guest();
      try { if (api.hasToken()) await api.request('auth.logout', {}); } catch (_) {}
      api.clearToken();
      LF.services.session?.clear?.();
      this.user = null;
      this.ready = false;
      LF.services.projects.active = null;
      localStorage.removeItem(LF.backend.activeProjectKey);
      this.renderState();
      LF.events.emit('auth:signed-out');
      U.status(wasGuest ? 'Guest session ended.' : 'Signed out.');
      if (document.body?.dataset?.lfPage === 'app') location.replace('literaryfriend-login.html');
    }

    async changePassword(currentPassword, newPassword) { return api.request('auth.password.change', { currentPassword, newPassword }, { redact: true }); }
    async sessions() { return (await api.request('auth.sessions.list', {})).sessions || []; }
    async revokeSession(id) { return api.request('auth.sessions.revoke', { id, sessionId: id }); }
    async revokeOtherSessions() { return api.request('auth.sessions.revoke.others', {}); }
    async recoveryCodes() { return api.request('auth.recovery.codes.generate', {}); }
    async recoveryContacts() { return (await api.request('auth.recovery.contacts.list', {})).contacts || []; }
    async addRecoveryContact(kind, value, label = '') { return api.request('auth.recovery.contacts.add', { kind, value, label }); }
    async removeRecoveryContact(id) { return api.request('auth.recovery.contacts.remove', { id }); }
    async sendRecoveryContactCode(id) { return api.request('auth.recovery.contacts.sendcode', { id, contactId: id }); }
    async verifyRecoveryContactCode(data) { return api.request('auth.contact.code.verify', data, { auth: false, redact: true }); }
    async twoFactorStatus() { return api.request('auth.2fa.status', {}); }
    async enableTwoFactor(method, contactId) { return api.request('auth.2fa.enable', { method, contactId }); }
    async disableTwoFactor(code) { return api.request('auth.2fa.disable', { code }, { redact: true }); }
    async linkGoogle(credential) { return api.request('auth.google.link', { credential, idToken: credential }, { redact: true }); }

    deviceId() {
      let id = localStorage.getItem('literaryfriend.device.id');
      if (!id) { id = U.uid('device'); localStorage.setItem('literaryfriend.device.id', id); }
      return id;
    }
    deviceName() { return `${navigator.platform || 'Device'} · ${navigator.userAgentData?.brands?.[0]?.brand || 'Browser'}`; }

    revealPassword(button) {
      const target = document.getElementById(button.getAttribute('aria-controls')) || button.closest('label,div,form')?.querySelector('input[type="password"],input[data-password]');
      if (!target) return;
      const show = target.type === 'password';
      target.type = show ? 'text' : 'password';
      button.setAttribute('aria-pressed', String(show));
      button.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
    }

    showPanel(name) {
      const loginMap = { login: 'sign-in', register: 'sign-up', recovery: 'recovery', 'recovery-code': 'recovery', 'two-factor': 'two-factor' };
      const loginViews = U.qsa('[data-login-view]');
      if (loginViews.length) {
        const target = loginMap[name] || name;
        loginViews.forEach(node => { node.hidden = node.dataset.loginView !== target; });
        U.qs(`[data-login-view="${target}"] input`)?.focus();
        return;
      }
      U.qsa('[data-auth-panel]').forEach(node => { node.hidden = node.dataset.authPanel !== name; });
      U.qs(`[data-auth-panel="${name}"] input`)?.focus();
    }

    renderState() {
      const authRoot = U.id('lf-auth-screen');
      const appRoot = U.id('lf-app-shell');
      if (authRoot) authRoot.hidden = this.hasAccess();
      if (appRoot) appRoot.hidden = !this.hasAccess();
      U.qsa('[data-user-name]').forEach(node => node.textContent = this.user?.displayName || this.user?.username || 'Writer');
    }

    bindUI() {
      document.addEventListener('click', event => {
        const button = event.target.closest('[data-lf-auth-action]');
        if (!button) return;
        const action = button.dataset.lfAuthAction;
        if (action === 'show-login') this.showPanel('login');
        if (action === 'show-register') this.showPanel('register');
        if (action === 'show-recovery') this.showPanel('recovery');
        if (action === 'show-recovery-code') this.showPanel('recovery-code');
        if (action === 'password-toggle') this.revealPassword(button);
        if (action === 'logout') this.logout().catch(error => U.status(error.message, 'error'));
      });
      document.addEventListener('submit', event => {
        const form = event.target.closest('[data-lf-auth-form]');
        if (!form) return;
        event.preventDefault();
        const data = Object.fromEntries(new FormData(form));
        const kind = form.dataset.lfAuthForm;
        const task = kind === 'login' ? this.login(data)
          : kind === 'register' ? this.register(data)
          : kind === 'two-factor' ? this.verifyTwoFactor(data.code)
          : kind === 'recovery-request' ? this.requestPasswordReset(data.login)
          : kind === 'recovery-complete' ? this.completePasswordReset(data)
          : kind === 'recovery-code' ? this.recoveryCodeLogin(data.login, data.code)
          : Promise.resolve();
        buttonBusy(form, true);
        Promise.resolve(task).catch(error => U.status(error.message, 'error')).finally(() => buttonBusy(form, false));
      });
      function buttonBusy(form, busy) {
        const button = form.querySelector('[type="submit"]');
        if (button) { button.disabled = busy; button.setAttribute('aria-busy', String(busy)); }
      }
    }
  }

  LF.services.identity = new IdentityService();
})(window);
