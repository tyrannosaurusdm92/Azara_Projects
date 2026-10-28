(function (global) {
  'use strict';
  const LF = global.LiteraryFriend;
  const U = LF.util;
  const api = LF.services.api;
  const projects = LF.services.projects;

  const outline = {
    threads: [], nodes: [],
    async load() {
      const projectId = projects.require();
      const [nodes, threads] = await Promise.all([
        api.request('nodes.list', { projectId, limit: 500 }),
        api.request('story.threads.list', { projectId, limit: 500 })
      ]);
      this.nodes = nodes.nodes || [];
      this.threads = threads.threads || [];
      LF.events.emit('outline:loaded', { nodes: this.nodes, threads: this.threads, matrix: this.matrix() });
      return { nodes: this.nodes, threads: this.threads };
    },
    sceneNodes() { return this.nodes.filter(n => ['scene','beat','chapter','act'].includes(n.nodeType)); },
    matrix() {
      const scenes = this.sceneNodes().filter(n => n.nodeType === 'scene' || n.nodeType === 'chapter');
      return {
        rows: scenes.map(scene => ({ id: scene.id, title: scene.title, pov: scene.metadata?.scene?.pov || '', status: scene.metadata?.scene?.status || '' })),
        columns: this.threads.map(thread => ({ id: thread.id, name: thread.name, type: thread.threadType, status: thread.status })),
        cells: scenes.flatMap(scene => this.threads.map(thread => ({ sceneId: scene.id, threadId: thread.id, present: (scene.metadata?.scene?.threadIds || []).includes(thread.id) || (thread.beatNodeIds || []).includes(scene.id) })))
      };
    },
    gaps(threadId) {
      const scenes = this.sceneNodes().filter(n => n.nodeType === 'scene');
      let last = -1;
      const gaps = [];
      scenes.forEach((scene, index) => {
        const present = (scene.metadata?.scene?.threadIds || []).includes(threadId);
        if (present) { if (last >= 0 && index - last > 1) gaps.push({ from: last, to: index, length: index - last - 1 }); last = index; }
      });
      return gaps;
    },
    characterPresence(characterId) {
      return this.sceneNodes().filter(n => (n.metadata?.scene?.participantIds || []).includes(characterId)).map((n, i) => ({ node: n, ordinal: i }));
    },
    async generate(scope = {}) { return api.request('outline.generate', { projectId: projects.require(), ...scope }); },
    async saveThread(data) { const result = await api.request('story.threads.save', { projectId: projects.require(), ...data }); await this.load(); return result.thread; },
    async deleteThread(id) { const result = await api.request('story.threads.delete', { projectId: projects.require(), id, threadId: id }); await this.load(); return result; }
  };
  LF.register('outline', outline);
})(window);
