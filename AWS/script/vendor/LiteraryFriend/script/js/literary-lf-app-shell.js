(function (global) {
  'use strict';
  const LF = global.LiteraryFriend;
  const U = LF.util;
  const router = LF.services.router;
  const projects = LF.services.projects;

  const defaultRoutes = [
    'projects','dashboard','manuscript','outline','characters','world','timeline','languages',
    'continuity','editor','organizer','imports','art-studio','book-builder','search','publish','settings'
  ];

  class AppShell {
    init() {
      defaultRoutes.forEach(route => router.register(route, params => this.loadSurface(route, params)));
      this.bind();
      LF.events.on('project:switched', ({ project }) => this.renderProject(project));
      LF.events.on('projects:list', list => this.renderProjectOptions(list));
      LF.events.on('status', status => this.renderStatus(status));
      router.init();
    }

    bind() {
      document.addEventListener('change', event => {
        const switcher = event.target.closest('[data-project-switcher]');
        if (!switcher?.value) return;
        projects.switch(switcher.value).catch(error => U.status(error.message, 'error'));
      });
      document.addEventListener('click', event => {
        const button = event.target.closest('[data-shell-action]');
        if (!button) return;
        if (button.dataset.shellAction === 'command-palette') LF.services.search?.openCommandPalette?.();
        if (button.dataset.shellAction === 'refresh-workspace') projects.loadWorkspace().catch(error => U.status(error.message, 'error'));
      });
    }

    async loadSurface(route, params) {
      if (!LF.services.identity?.authenticated?.()) return;
      if (route !== 'projects' && route !== 'settings' && !projects.id()) return router.go('projects');
      const map = {
        dashboard: 'projectHub', manuscript: 'manuscript', outline: 'outline', characters: 'world', world: 'world', timeline: 'timeline',
        languages: 'languages', continuity: 'continuity', editor: 'editors', organizer: 'organizer', imports: 'imports',
        'art-studio': 'art', 'book-builder': 'books', search: 'search', publish: 'publish', settings: 'settings', projects: 'projectHub'
      };
      const module = LF.modules[map[route]];
      if (module?.load) await module.load({ route, params });
    }

    renderProject(project) {
      U.qsa('[data-active-project-name]').forEach(node => node.textContent = project?.title || 'Choose project');
      U.qsa('[data-project-required]').forEach(node => node.hidden = !project);
      const switcher = U.qs('[data-project-switcher]');
      if (switcher && project?.id) switcher.value = project.id;
    }

    renderProjectOptions(list) {
      U.qsa('[data-project-switcher]').forEach(select => {
        const current = projects.id();
        select.innerHTML = '<option value="">Choose project</option>' + (list || []).filter(p => !p.archivedAt && p.status !== 'archived').map(p => `<option value="${U.escapeHTML(p.id)}">${U.escapeHTML(p.title)}</option>`).join('');
        if (current) select.value = current;
      });
    }

    renderStatus({ message, kind }) {
      const node = U.id('lf-status');
      if (!node) return;
      node.textContent = message;
      node.dataset.kind = kind;
    }
  }

  LF.services.shell = new AppShell();
})(window);
