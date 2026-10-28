(function (global) {
  'use strict';
  const LF = global.LiteraryFriend, U = LF.util, api = LF.services.api, projects = LF.services.projects;
  const TAXONOMY = ['temporal-contradiction','state-contradiction','possession-contradiction','location-contradiction','knowledge-contradiction','memory-contradiction','ability-contradiction','world-rule-contradiction','causal-hole','motivational-hole','dangling-thread','setup-payoff-problem','reveal-order-error','continuity-detail','pov-leak'];
  const ACTIONS = ['fix','intentional','update-canon','false-positive','review-later'];
  const continuity = {
    taxonomy: TAXONOMY, actions: ACTIONS, issues: [],
    async list(filters = {}) { const r = await api.request('plotissues.list', { projectId: projects.require(), ...filters }); this.issues = r.issues || r.plotIssues || []; this.render(); return this.issues; },
    async scan(options = {}) { const r = await api.request('plotissues.scan', { projectId: projects.require(), analyzers: options.analyzers || TAXONOMY, scope: options.scope || 'project', ...options }, { timeoutMs: 240000 }); await this.list(); return r; },
    async save(issue) { return api.request('plotissues.save', { projectId: projects.require(), ...issue }); },
    async action(id, action, data = {}) {
      if (!ACTIONS.includes(action)) throw new Error('Unknown Issue Center action.');
      const r = await api.request('plotissues.action', { projectId: projects.require(), id, issueId: id, action, ...data });
      await this.list(); return r;
    },
    async applyFix(id, proposal, options = {}) {
      // Fixes are never applied implicitly: this method must be called from an explicit user action.
      if (!options.confirmed) throw new Error('Confirm the proposed manuscript/canon change before applying it.');
      const r = await api.request('plotissues.applyfix', { projectId: projects.require(), id, issueId: id, proposal, confirmed: true, createRevision: true });
      await this.list(); return r;
    },
    async resolve(id, resolution = {}) { const r = await api.request('plotissues.resolve', { projectId: projects.require(), id, issueId: id, ...resolution }); await this.list(); return r; },
    async delete(id) { const r = await api.request('plotissues.delete', { projectId: projects.require(), id, issueId: id }); await this.list(); return r; },
    render() {
      const host = U.id('lf-continuity-list'); if (!host) return;
      host.innerHTML = this.issues.map(issue => `<article data-issue-id="${U.escapeHTML(issue.id)}"><header><strong>${U.escapeHTML(issue.title || issue.category || 'Continuity finding')}</strong><span>${U.escapeHTML(issue.severity || '')}</span><span>${U.escapeHTML(issue.confidence ?? '')}</span></header><p>${U.escapeHTML(issue.explanation || issue.description || '')}</p><div>${(issue.evidence || []).map(ev => `<blockquote>${U.escapeHTML(ev.text || ev.excerpt || String(ev))}</blockquote>`).join('')}</div><div>${ACTIONS.map(a => `<button type="button" data-issue-action="${a}" data-issue-id="${U.escapeHTML(issue.id)}">${U.escapeHTML(a.replaceAll('-',' '))}</button>`).join('')}</div></article>`).join('') || '<p>No continuity findings.</p>';
    },
    bind() { document.addEventListener('click', e => { const b=e.target.closest('[data-issue-action][data-issue-id]'); if (b) return void this.action(b.dataset.issueId,b.dataset.issueAction).catch(err=>U.status(err.message,'error')); const scan=e.target.closest('[data-continuity-action="scan"]'); if(scan)this.scan().catch(err=>U.status(err.message,'error')); }); }
  };
  continuity.bind(); LF.register('continuity', continuity);
})(window);
