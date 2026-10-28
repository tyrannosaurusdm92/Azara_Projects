(function () {
  'use strict';
  const KEY = 'literaryfriend.studio.projects.v2';
  const LEGACY_KEY = 'literaryfriend.studio.projects.v1';
  const DRAFT_KEY = 'literaryfriend.studio.activeDraft.v2';
  const LEGACY_DRAFT_KEY = 'literaryfriend.studio.activeDraft.v1';

  function parse(value, fallback) { try { return JSON.parse(value || '') || fallback; } catch (_) { return fallback; } }
  function safeGet(key) { try { return localStorage.getItem(key); } catch (_) { return null; } }
  function readProjects() {
    const current = parse(safeGet(KEY), null);
    const legacy = parse(safeGet(LEGACY_KEY), []);
    const projects = Array.isArray(current) ? current.slice() : (Array.isArray(legacy) ? legacy.slice() : []);
    const draft = parse(safeGet(DRAFT_KEY), null) || parse(safeGet(LEGACY_DRAFT_KEY), null);
    if (draft && draft.id && !projects.some((project) => project?.id === draft.id)) projects.unshift(draft);
    if (!Array.isArray(current) && projects.length) { try { localStorage.setItem(KEY, JSON.stringify(projects)); } catch (_) {} }
    return projects;
  }
  function writeProjects(projects) {
    const value = Array.isArray(projects) ? projects : [];
    localStorage.setItem(KEY, JSON.stringify(value));
    return value;
  }
  function compactRecord(project) {
    const record = { ...project };
    // Outer-shell snapshots are launch records. The integrated Book/Art studios keep
    // their own editable state, so a huge PNG must not make the launcher unsavable.
    if (typeof record.canvasData === 'string' && record.canvasData.length > 1800000) {
      record.canvasData = null;
      record.canvasStoredByIntegratedStudio = true;
    }
    return record;
  }
  function upsert(project) {
    const projects = readProjects();
    const index = projects.findIndex((p) => p.id === project.id);
    const record = compactRecord({ ...project, updatedAt: new Date().toISOString() });
    if (index >= 0) projects[index] = record; else projects.unshift(record);
    try {
      writeProjects(projects);
      localStorage.setItem(DRAFT_KEY, JSON.stringify(record));
    } catch (error) {
      // Preserve at least the launch metadata if the browser storage quota is tight.
      const fallback = compactRecord({ ...record, canvasData: null, pages: Array.isArray(record.pages) ? record.pages.map((p) => ({ id:p.id, name:p.name })) : [] });
      const lean = readProjects().filter((p) => p.id !== fallback.id);
      lean.unshift(fallback);
      try { writeProjects(lean.slice(0, 40)); localStorage.setItem(DRAFT_KEY, JSON.stringify(fallback)); } catch (_) {}
      return fallback;
    }
    return record;
  }
  function get(id) { return readProjects().find((p) => p.id === id) || null; }
  function setDraft(project) { try { localStorage.setItem(DRAFT_KEY, JSON.stringify(compactRecord(project))); } catch (_) {} }
  function getDraft() {
    const current = parse(safeGet(DRAFT_KEY), null);
    return current || parse(safeGet(LEGACY_DRAFT_KEY), null);
  }
  function remove(id) { return writeProjects(readProjects().filter((p) => p.id !== id)); }

  window.LFProjectStore = Object.freeze({ readProjects, upsert, get, remove, setDraft, getDraft });
})();
