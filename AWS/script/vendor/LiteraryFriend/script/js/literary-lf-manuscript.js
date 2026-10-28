(function (global) {
  'use strict';
  const LF = global.LiteraryFriend;
  const U = LF.util;
  const api = LF.services.api;
  const projects = LF.services.projects;
  const store = LF.services.store;

  const manuscript = {
    nodes: [], selected: null, autosaveDelay: 900,

    async load() {
      const projectId = projects.require();
      const result = await api.request('nodes.list', { projectId, includeDeleted: false, limit: 500 });
      this.nodes = result.nodes || [];
      this.renderTree();
      LF.events.emit('manuscript:loaded', this.nodes);
      return this.nodes;
    },

    tree() {
      const byParent = U.groupBy(this.nodes, node => node.parentId || 'root');
      const walk = parentId => (byParent[parentId || 'root'] || []).sort((a,b) => Number(a.sortOrder || 0) - Number(b.sortOrder || 0)).map(node => ({ ...node, children: walk(node.id) }));
      return walk('root');
    },

    async open(id) {
      const result = await api.request('nodes.get', { projectId: projects.require(), id, nodeId: id });
      this.selected = result.node;
      const draft = await store.getDraft(projects.require(), id);
      if (draft?.payload?.updatedAt && Date.parse(draft.payload.updatedAt) > Date.parse(this.selected.updatedAt || 0)) {
        this.selected = { ...this.selected, ...draft.payload, localDraft: true };
      }
      LF.events.emit('manuscript:selected', this.selected);
      this.renderEditor();
      return this.selected;
    },

    async create({ parentId = '', nodeType = 'scene', title = 'Untitled', content = '', metadata = {}, tags = [] } = {}) {
      const result = await api.request('nodes.save', { projectId: projects.require(), parentId, nodeType, title, content, plainText: U.plainText(content), metadata, tags });
      if (result.node) this.nodes.push(result.node);
      this.renderTree();
      return result.node;
    },

    async save(patch = {}, options = {}) {
      const node = { ...(this.selected || {}), ...patch };
      if (!node.id && !options.allowCreate) throw new Error('Open a manuscript item first.');
      const payload = {
        projectId: projects.require(), id: node.id, nodeId: node.id, parentId: node.parentId || '', nodeType: node.nodeType || 'document',
        title: node.title || 'Untitled', content: node.content || '', plainText: node.plainText ?? U.plainText(node.content || ''),
        metadata: node.metadata || {}, tags: node.tags || [], links: node.links || [], sortOrder: node.sortOrder || 0
      };
      await store.saveDraft(projects.require(), node.id || 'new', { ...payload, updatedAt: U.now() });
      try {
        const result = await api.request('nodes.save', payload);
        this.selected = result.node || node;
        const index = this.nodes.findIndex(item => item.id === this.selected.id);
        if (index >= 0) this.nodes[index] = this.selected; else this.nodes.push(this.selected);
        await store.delete('drafts', `${projects.require()}:${node.id || 'new'}`);
        LF.events.emit('manuscript:saved', this.selected);
        if (!options.quiet) U.status('Saved.', 'success');
        return this.selected;
      } catch (error) {
        if (!navigator.onLine || error.code === 'REQUEST_ABORTED') {
          await store.enqueue('nodes.save', payload, { kind: 'manuscript-save' });
          U.status('Saved locally; LiteraryFriend will sync when the connection returns.');
          return node;
        }
        throw error;
      }
    },

    scheduleSave: null,

    async move(id, parentId, sortOrder) {
      const result = await api.request('nodes.move', { projectId: projects.require(), id, nodeId: id, parentId, sortOrder });
      await this.load();
      return result;
    },

    async remove(id) { const result = await api.request('nodes.delete', { projectId: projects.require(), id, nodeId: id }); await this.load(); return result; },
    async restore(id) { const result = await api.request('nodes.restore', { projectId: projects.require(), id, nodeId: id }); await this.load(); return result; },

    sceneMetadata(patch) {
      const current = this.selected?.metadata || {};
      const metadata = U.deepMerge(current, {
        scene: {
          pov: patch.pov ?? current.scene?.pov ?? '', status: patch.status ?? current.scene?.status ?? 'draft',
          worldDate: patch.worldDate ?? current.scene?.worldDate ?? '', narrativeOrder: patch.narrativeOrder ?? current.scene?.narrativeOrder ?? '',
          revelationOrder: patch.revelationOrder ?? current.scene?.revelationOrder ?? '', locationId: patch.locationId ?? current.scene?.locationId ?? '',
          participantIds: patch.participantIds ?? current.scene?.participantIds ?? [], threadIds: patch.threadIds ?? current.scene?.threadIds ?? [],
          purpose: patch.purpose ?? current.scene?.purpose ?? '', conflict: patch.conflict ?? current.scene?.conflict ?? '', outcome: patch.outcome ?? current.scene?.outcome ?? '',
          revisionState: patch.revisionState ?? current.scene?.revisionState ?? ''
        }
      });
      return metadata;
    },

    async revisions(id = this.selected?.id) { return (await api.request('revisions.list', { projectId: projects.require(), targetType: 'node', targetId: id })).revisions || []; },
    async revision(id) { return api.request('revisions.get', { id, revisionId: id }); },

    renderTree() {
      const host = U.id('lf-manuscript-tree');
      if (!host) return;
      const render = list => `<ul>${list.map(node => `<li><button type="button" data-node-open="${U.escapeHTML(node.id)}">${U.escapeHTML(node.title || 'Untitled')}</button>${node.children?.length ? render(node.children) : ''}</li>`).join('')}</ul>`;
      host.innerHTML = render(this.tree());
    },

    renderEditor() {
      const title = U.id('lf-manuscript-title');
      const editor = U.id('lf-manuscript-editor');
      if (title) title.value = this.selected?.title || '';
      if (editor) {
        if ('value' in editor) editor.value = this.selected?.content || '';
        else editor.innerHTML = this.selected?.content || '';
      }
    },

    bind() {
      this.scheduleSave = U.debounce(() => {
        if (!this.selected) return;
        const editor = U.id('lf-manuscript-editor');
        const title = U.id('lf-manuscript-title');
        const content = editor ? ('value' in editor ? editor.value : editor.innerHTML) : this.selected.content;
        this.save({ title: title?.value || this.selected.title, content, plainText: editor ? ('value' in editor ? editor.value : editor.textContent) : this.selected.plainText }, { quiet: true }).catch(error => U.status(error.message, 'error'));
      }, this.autosaveDelay);
      document.addEventListener('click', event => {
        const open = event.target.closest('[data-node-open]');
        if (open) this.open(open.dataset.nodeOpen).catch(error => U.status(error.message, 'error'));
      });
      document.addEventListener('input', event => {
        if (event.target.matches('#lf-manuscript-editor,#lf-manuscript-title')) this.scheduleSave();
      });
    }
  };

  manuscript.bind();
  LF.register('manuscript', manuscript);
})(window);
