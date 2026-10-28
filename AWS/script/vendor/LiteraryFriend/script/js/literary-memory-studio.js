(function (global) {
  'use strict';

  const SB = global.Superbot = global.Superbot || {};
  const U = SB.util;

  function scoreMemory(memory, queryWords) {
    const haystack = `${memory.text || ''} ${(memory.tags || []).join(' ')} ${memory.kind || ''}`.toLowerCase();
    let score = Number(memory.importance || 0.5) * 0.6;
    for (const word of queryWords) {
      if (haystack.includes(word)) score += haystack.startsWith(word) ? 2 : 1;
    }
    if (memory.updatedAt) {
      const ageDays = Math.max(0, (Date.now() - new Date(memory.updatedAt).getTime()) / 86400000);
      score += Math.max(0, 0.35 - ageDays / 3650);
    }
    return score;
  }

  const memory = SB.memory = {
    localRemember(input) {
      const text = String(input && (input.text || input.content) || '').trim();
      if (!text) throw new Error('Memory text is required.');
      const kind = String(input.kind || 'fact');
      const tags = Array.from(new Set((input.tags || U.keywords(text, 8)).map(v => String(v).trim().toLowerCase()).filter(Boolean))).slice(0, 20);
      const normalized = text.toLowerCase().replace(/\s+/g, ' ');
      let existing = SB.store.state.localMemories.find(item => item.normalized === normalized && item.kind === kind);
      if (!existing) {
        existing = {
          id: U.uid('memory'),
          text,
          normalized,
          kind,
          tags,
          importance: U.clamp(Number(input.importance == null ? 0.6 : input.importance), 0, 1),
          createdAt: U.nowIso(),
          updatedAt: U.nowIso()
        };
        SB.store.state.localMemories.unshift(existing);
      } else {
        existing.text = text;
        existing.tags = tags;
        existing.importance = U.clamp(Number(input.importance == null ? existing.importance : input.importance), 0, 1);
        existing.updatedAt = U.nowIso();
      }
      SB.store.state.localMemories = SB.store.state.localMemories.slice(0, SB.CONFIG.maxLocalMemories);
      SB.store.save();
      return existing;
    },

    localSearch(query, limit = 12) {
      const words = U.keywords(query, 20);
      return SB.store.state.localMemories
        .map(item => ({ item, score: scoreMemory(item, words) }))
        .filter(result => !words.length || result.score > 0.65)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
        .map(result => result.item);
    },

    localForget(id) {
      const before = SB.store.state.localMemories.length;
      SB.store.state.localMemories = SB.store.state.localMemories.filter(item => item.id !== id);
      SB.store.save();
      return SB.store.state.localMemories.length < before;
    },

    saveSkill(input) {
      const name = String(input && input.name || '').trim();
      const instructions = String(input && input.instructions || '').trim();
      if (!name || !instructions) throw new Error('Skill name and instructions are required.');
      let skill = SB.store.state.savedSkills.find(item => item.name.toLowerCase() === name.toLowerCase());
      if (!skill) {
        skill = { id: U.uid('skill'), name, instructions, enabled: true, createdAt: U.nowIso(), updatedAt: U.nowIso() };
        SB.store.state.savedSkills.unshift(skill);
      } else {
        skill.instructions = instructions;
        skill.updatedAt = U.nowIso();
      }
      SB.store.save();
      return skill;
    },

    removeSkill(id) {
      SB.store.state.savedSkills = SB.store.state.savedSkills.filter(item => item.id !== id);
      SB.store.save();
    },

    toggleSkill(id) {
      const skill = SB.store.state.savedSkills.find(item => item.id === id);
      if (skill) {
        skill.enabled = !skill.enabled;
        skill.updatedAt = U.nowIso();
        SB.store.save();
      }
      return skill;
    },

    buildContext(query) {
      const local = this.localSearch(query, 12);
      const skills = SB.store.state.savedSkills.filter(skill => skill.enabled).slice(0, 20);
      const sections = [];
      if (local.length) {
        sections.push('Relevant local memories:\n' + local.map(item => `- [${item.kind}] ${item.text}`).join('\n'));
      }
      if (skills.length) {
        sections.push('Enabled local reusable skills:\n' + skills.map(item => `- ${item.name}: ${item.instructions}`).join('\n'));
      }
      return sections.join('\n\n');
    },

    suggestFromTurn(userText) {
      const text = String(userText || '').trim();
      if (text.length < 12 || text.length > 800) return [];
      const candidates = [];
      const patterns = [
        { re: /\b(?:remember|always|from now on|going forward)\b[: ,]*(.+)$/i, kind: 'preference', importance: 0.9 },
        { re: /\b(?:my preference is|i prefer|i like|i dislike|i do not want|never)\b(.+)$/i, kind: 'preference', importance: 0.75 },
        { re: /\b(?:the rule is|must always|must never|required structure)\b(.+)$/i, kind: 'project-rule', importance: 0.85 },
        { re: /\b(?:we decided|the decision is|final choice)\b(.+)$/i, kind: 'decision', importance: 0.85 }
      ];
      for (const pattern of patterns) {
        const match = text.match(pattern.re);
        if (match) candidates.push({ text: U.normalizeWhitespace(match[0]), kind: pattern.kind, importance: pattern.importance });
      }
      return candidates.slice(0, 2);
    }
  };
})(window);
