(function (global) {
  'use strict';
  const LF = global.LiteraryFriend;
  const U = LF.util;
  const api = LF.services.api;
  const projects = LF.services.projects;

  const search = {
    lastQuery: '', results: [], saved: [],
    async load({ params } = {}) {
      if (params?.q) await this.run(params.q);
      this.saved = (await api.request('search.saved.list', { projectId: projects.id() || '' })).searches || [];
      return this.results;
    },
    async run(query, filters = {}) {
      const data = { query, q: query, projectId: filters.crossProject ? '' : projects.id(), ...filters };
      const result = await api.request('search.global', data);
      this.lastQuery = query;
      this.results = result.results || [];
      LF.events.emit('search:results', { query, filters, results: this.results });
      this.render();
      return this.results;
    },
    async save(name, query = this.lastQuery, filters = {}) {
      const result = await api.request('search.saved.save', { projectId: projects.id() || '', name, query, filters });
      this.saved = (await api.request('search.saved.list', { projectId: projects.id() || '' })).searches || [];
      return result.search;
    },
    async deleteSaved(id) { await api.request('search.saved.delete', { id, searchId: id }); return this.load(); },
    focus() { const input = U.id('lf-global-search'); input?.focus(); input?.select(); },
    openCommandPalette() { U.id('lf-command-palette')?.showModal?.(); U.id('lf-command-input')?.focus(); },
    render() {
      const host = U.id('lf-search-results'); if (!host) return;
      host.innerHTML = this.results.map(item => `<article><h3>${U.escapeHTML(item.title || item.name || item.type || 'Result')}</h3><p>${U.escapeHTML(item.snippet || item.plainText || item.description || '')}</p><small>${U.escapeHTML(item.type || item.category || '')}</small></article>`).join('') || '<p>No matches.</p>';
    },
    bind() {
      document.addEventListener('submit', event => {
        const form = event.target.closest('[data-global-search-form]'); if (!form) return;
        event.preventDefault(); const data = Object.fromEntries(new FormData(form)); this.run(data.q || '').catch(error => U.status(error.message, 'error'));
      });
      document.addEventListener('keydown', event => {
        if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); this.openCommandPalette(); }
      });
    }
  };
  search.bind();
  LF.services.search = search;
  LF.register('search', search);
})(window);
