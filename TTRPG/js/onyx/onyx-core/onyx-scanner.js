/*
  conversation_scanner_randomizer.js
  Local conversation matching/randomization utility used as a fallback/reference layer inside the current living Onyx runtime.

  What it does:
  - Loads every JSON file you provide from a local json directory picker or hosted manifest.
  - Recursively finds answer and response text inside those JSON files.
  - Detects conversation signals: topics, moods, needs, tasks, asks, and questions.
  - Scores local response candidates against the incoming conversation.
  - Randomizes the selected reply while avoiding recent exact repeats.
  - Always returns a safe JSON packet, even when no strong match exists.
*/
(function attachConversationScannerRandomizer(root) {
  "use strict";

  const STORAGE_KEY = "conversationScannerRandomizer.history.v1";
  const SESSION_NONCE = String(Date.now()) + "-" + String(Math.floor(Math.random() * 1000000000));

  const DEFAULTS = {
    historyLimit: 120,
    maxTopCandidates: 12,
    minUsefulScore: 2,
    persistHistory: true,
    avoidRecentExactText: true,
    defaultTone: "warm",
    defaultIntent: "fallback",
    defaultLocale: "default"
  };

  const DEFAULT_WORDS_TO_SKIP = [
    "a","an","and","are","as","at","be","been","but","by","can","did","do","does","for","from","had","has","have","he","her","here","him","his","i","if","in","into","is","it","its","just","me","my","of","on","or","our","she","so","that","the","their","them","then","there","they","this","to","up","us","was","we","were","what","when","where","which","who","why","with","you","your","would","could","should","really","very","thing","things"
  ];

  const DEFAULT_RULES = {
    moods: {
      anxious: ["anxious", "anxiety", "panic", "panicking", "nervous", "scared", "afraid", "worried", "spiraling"],
      sad: ["sad", "upset", "crying", "hurt", "lonely", "grief", "down"],
      angry: ["angry", "mad", "furious", "annoyed", "irritated", "rage"],
      overwhelmed: ["overwhelmed", "too much", "buried", "stressed", "stress", "swamped", "overload"],
      happy: ["happy", "excited", "great", "awesome", "yay", "glad", "proud"],
      confused: ["confused", "lost", "unclear", "unsure", "stuck", "puzzled"],
      tired: ["tired", "exhausted", "drained", "fatigued", "sleepy"],
      grateful: ["thanks", "thank you", "appreciate", "grateful"]
    },
    needs: {
      answer: ["?", "question", "answer", "explain", "tell me", "what is", "how do", "why does"],
      clarity: ["clarify", "clear", "confused", "meaning", "understand"],
      instruction: ["steps", "instructions", "how to", "guide", "walk me through"],
      taskHelp: ["please", "can you", "could you", "make", "create", "fix", "change", "add", "remove", "convert", "build", "turn", "merge", "scan"],
      emotionalSupport: ["support", "comfort", "reassure", "upset", "sad", "anxious", "overwhelmed"],
      grounding: ["breathe", "ground", "calm", "panic", "spiraling"],
      planning: ["plan", "organize", "schedule", "break down", "next step"],
      rewrite: ["rewrite", "revise", "edit", "polish", "reword"],
      summary: ["summarize", "summary", "recap", "short version"]
    },
    taskSignals: ["please", "can you", "could you", "make", "create", "fix", "change", "add", "remove", "convert", "build", "turn", "write", "draft", "send", "scan", "load", "merge", "find", "list"],
    answerKeys: ["answer", "answers", "response", "responses", "reply", "replies", "message", "msg", "text", "content", "body", "line", "lines", "template", "templates", "variant", "variants", "phrase", "phrases", "output", "fallback"],
    signalKeys: ["keyword", "keywords", "trigger", "triggers", "topic", "topics", "mood", "moods", "need", "needs", "task", "tasks", "ask", "asks", "question", "questions", "intent", "intents", "tag", "tags", "category", "categories", "title", "name", "summary", "description", "locale", "tone"],
    greetingWords: ["hello", "hi", "hey", "good morning", "good afternoon", "good evening"],
    goodbyeWords: ["bye", "goodbye", "see you", "later", "talk soon"],
    questionStarts: ["who", "what", "when", "where", "why", "how", "can", "could", "would", "should", "is", "are", "do", "does", "did"]
  };

  const DEFAULT_CATALOG = {
    version: "2.0.0",
    settings: DEFAULTS,
    banks: {
      openers: ["Absolutely.", "I can help with that.", "Got it.", "I hear you.", "Okay.", "Let’s make it usable.", "We can work with this.", "That is doable."],
      acknowledgements: ["That makes sense.", "I understand.", "Good catch.", "That tracks.", "I see the goal.", "That is clear.", "I’m with you."],
      closers: ["We can keep going from here.", "That gives us a clean starting point.", "This keeps the next step manageable.", "The wording can keep rotating naturally."],
      nudges: ["Fresh version:", "Another angle:", "Said another way:", "Cleaner phrasing:", "A softer version:", "A more direct version:"]
    },
    slots: {
      transition: ["from here", "next", "as a first pass", "right now", "for this reply", "to keep it practical"],
      style: ["warm", "direct", "gentle", "clear", "friendly", "practical"]
    },
    responseSets: [
      {
        id: "greeting-basic",
        title: "friendly greeting",
        keywords: ["hello", "hi", "hey", "good morning", "good evening"],
        topics: ["greeting"],
        needs: ["connection"],
        responses: [
          "Hi! I am here and ready to help. What do you want to work on first?",
          "Hey there. Tell me what you need, and I will help sort it into clear next steps.",
          "Hi. I can help with questions, tasks, planning, or turning a messy thought into something usable."
        ]
      },
      {
        id: "task-help",
        title: "task support",
        keywords: ["please", "make", "create", "fix", "change", "add", "remove", "convert", "build", "merge"],
        needs: ["taskHelp", "instruction"],
        responses: [
          "I can help with that. I will identify the concrete asks and return a clear usable result.",
          "Got it. I will focus on the requested outcome, keep the wording direct, and avoid adding unrelated material.",
          "Understood. I will scan the request, pull out the useful signals, and produce the most relevant local response."
        ]
      },
      {
        id: "question-help",
        title: "question answering",
        keywords: ["what", "why", "how", "when", "where", "who", "?"],
        needs: ["answer", "clarity"],
        responses: [
          "This looks like a question. I will answer the clearest part first, then include any assumptions that affect the answer.",
          "The main need appears to be clarity. I will respond with the answer first and keep the explanation organized.",
          "I found a question signal. The helpful response should answer directly, then add only the context needed to make it usable."
        ]
      },
      {
        id: "fallback",
        title: "general fallback",
        tags: ["default"],
        responses: [
          "I am here. Tell me what you want this response to do.",
          "I can help shape this into a useful reply. What should we focus on first?",
          "Give me the target, and I will help turn it into natural chatbot wording."
        ]
      }
    ]
  };

  const state = {
    files: [],
    entries: [],
    settings: clone(DEFAULTS),
    rules: clone(DEFAULT_RULES),
    catalog: clone(DEFAULT_CATALOG),
    recent: readHistory()
  };

  function clone(value) {
    if (value == null || typeof value !== "object") return value;
    return JSON.parse(JSON.stringify(value));
  }

  function ownKeys(obj) {
    return obj && typeof obj === "object" ? Object.keys(obj) : [];
  }

  function isPlainObject(value) {
    return !!value && typeof value === "object" && !Array.isArray(value);
  }

  function normalize(value) {
    return String(value == null ? "" : value)
      .toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[’]/g, "'")
      .replace(/[^a-z0-9?'\s-]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function cleanText(value) {
    return String(value == null ? "" : value)
      .replace(/\s+([,.!?;:])/g, "$1")
      .replace(/([([{])\s+/g, "$1")
      .replace(/\s+([)\]}])/g, "$1")
      .replace(/\s{2,}/g, " ")
      .trim();
  }

  function toList(value) {
    if (Array.isArray(value)) {
      const out = [];
      for (let i = 0; i < value.length; i += 1) if (value[i] != null) out.push(value[i]);
      return out;
    }
    if (value == null) return [];
    return [value];
  }

  function uniqueList(items) {
    const seen = Object.create(null);
    const out = [];
    for (let i = 0; i < items.length; i += 1) {
      const text = String(items[i] == null ? "" : items[i]).trim();
      const key = normalize(text);
      if (!key || seen[key]) continue;
      seen[key] = true;
      out.push(text);
    }
    return out;
  }

  function includesKey(list, key) {
    const needle = normalizeKey(key);
    for (let i = 0; i < list.length; i += 1) if (normalizeKey(list[i]) === needle) return true;
    return false;
  }

  function normalizeKey(value) {
    return String(value == null ? "" : value)
      .toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[’']/g, "")
      .replace(/[_-]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function makeSkipSet(extra) {
    const set = Object.create(null);
    const all = DEFAULT_WORDS_TO_SKIP.concat(toList(extra));
    for (let i = 0; i < all.length; i += 1) set[normalize(all[i])] = true;
    return set;
  }

  function splitTokens(value, extraSkip) {
    const skip = makeSkipSet(extraSkip);
    const text = normalize(value).replace(/[?]/g, " ? ");
    if (!text) return [];
    const raw = text.split(/\s+/);
    const out = [];
    for (let i = 0; i < raw.length; i += 1) {
      const token = raw[i].replace(/^-+|-+$/g, "");
      if (!token) continue;
      if (token.length < 2 && token !== "?") continue;
      if (skip[token]) continue;
      out.push(token);
    }
    return uniqueList(out);
  }

  function hashString(input) {
    let h = 2166136261 >>> 0;
    const s = String(input || "conversation-response-seed");
    for (let i = 0; i < s.length; i += 1) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  function rngFromSeed(seed) {
    let a = hashString(seed);
    return function rng() {
      a += 0x6D2B79F5;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function choose(rng, list) {
    const items = toList(list);
    if (!items.length) return "";
    const index = Math.floor(rng() * items.length);
    return items[Math.max(0, Math.min(items.length - 1, index))];
  }

  function storageAvailable() {
    try { return !!(root && root.localStorage); } catch (_err) { return false; }
  }

  function readHistory() {
    if (!storageAvailable()) return [];
    try {
      const raw = root.localStorage.getItem(STORAGE_KEY);
      const value = raw ? JSON.parse(raw) : [];
      return Array.isArray(value) ? value : [];
    } catch (_err) {
      return [];
    }
  }

  function saveHistory() {
    if (!storageAvailable()) return false;
    try {
      root.localStorage.setItem(STORAGE_KEY, JSON.stringify(state.recent.slice(-state.settings.historyLimit)));
      return true;
    } catch (_err) {
      return false;
    }
  }

  function remember(text) {
    const clean = cleanText(text);
    if (!clean) return;
    state.recent.push(clean);
    state.recent = state.recent.slice(-state.settings.historyLimit);
    if (state.settings.persistHistory !== false) saveHistory();
  }

  function resetHistory() {
    state.recent = [];
    if (storageAvailable()) root.localStorage.removeItem(STORAGE_KEY);
    return packet({ ok: true, action: "resetHistory" });
  }

  function deepMerge(target, source) {
    const out = clone(target || {});
    if (!source || typeof source !== "object") return out;
    const keys = Object.keys(source);
    for (let i = 0; i < keys.length; i += 1) {
      const key = keys[i];
      const left = out[key];
      const right = source[key];
      if (Array.isArray(left) && Array.isArray(right)) out[key] = left.concat(right);
      else if (isPlainObject(left) && isPlainObject(right)) out[key] = deepMerge(left, right);
      else out[key] = clone(right);
    }
    return out;
  }

  function registerJson(fileName, data) {
    const before = state.entries.length;
    const safeName = String(fileName || "inline.json");
    const jsonData = data && typeof data === "object" ? data : {};
    state.files.push({ fileName: safeName, loadedAt: new Date().toISOString() });

    absorbSettings(jsonData);
    const entries = extractEntriesFromJson(jsonData, safeName);
    for (let i = 0; i < entries.length; i += 1) state.entries.push(entries[i]);

    return packet({
      ok: true,
      action: "registerJson",
      fileName: safeName,
      addedEntries: state.entries.length - before,
      totalEntries: state.entries.length
    });
  }

  function registerJsonBundle(bundle) {
    const items = toList(bundle);
    const results = [];
    for (let i = 0; i < items.length; i += 1) {
      const item = items[i] || {};
      results.push(registerJson(item.fileName || item.name || ("inline-" + i + ".json"), item.data || item.json || item));
    }
    return packet({ ok: true, action: "registerJsonBundle", results: results, totalEntries: state.entries.length });
  }

  async function loadJsonFiles(files) {
    const list = [];
    const input = toList(files);
    for (let i = 0; i < input.length; i += 1) {
      const file = input[i];
      const name = String(file && (file.webkitRelativePath || file.name || "")).replace(/\\/g, "/");
      if (!/\.json$/i.test(name)) continue;
      try {
        const text = await file.text();
        const parsed = JSON.parse(text);
        list.push(registerJson(name, parsed));
      } catch (err) {
        list.push(packet({ ok: false, action: "loadJsonFile", fileName: name, error: errorInfo(err) }));
      }
    }
    return packet({ ok: true, action: "loadJsonFiles", loaded: list.length, results: list, totalEntries: state.entries.length });
  }

  async function loadHostedJson(options) {
    const opts = options || {};
    const manifestUrl = opts.manifestUrl || "json/onyx-manifest.json";
    const results = [];
    try {
      const manifestResponse = await fetch(manifestUrl, { cache: "no-store" });
      if (!manifestResponse.ok) throw new Error("Could not fetch " + manifestUrl);
      const manifest = await manifestResponse.json();
      const files = collectManifestFiles(manifest);
      const prefix = manifestUrl.replace(/[^/]+$/, "");
      for (let i = 0; i < files.length; i += 1) {
        const url = files[i].indexOf("/") === 0 || /^https?:/i.test(files[i]) ? files[i] : prefix + files[i];
        try {
          const response = await fetch(url, { cache: "no-store" });
          if (!response.ok) throw new Error("Could not fetch " + url);
          const data = await response.json();
          results.push(registerJson(files[i], data));
        } catch (err) {
          results.push(packet({ ok: false, action: "loadHostedJsonItem", fileName: files[i], error: errorInfo(err) }));
        }
      }
      return packet({ ok: true, action: "loadHostedJson", manifestUrl: manifestUrl, loaded: results.length, results: results, totalEntries: state.entries.length });
    } catch (err) {
      return packet({ ok: false, action: "loadHostedJson", manifestUrl: manifestUrl, loaded: results.length, results: results, totalEntries: state.entries.length, error: errorInfo(err) });
    }
  }

  function collectManifestFiles(manifest) {
    const out = [];
    const sources = [manifest && manifest.files, manifest && manifest.jsonFiles, manifest && manifest.catalogs, manifest && manifest.sources];
    for (let i = 0; i < sources.length; i += 1) {
      const list = toList(sources[i]);
      for (let j = 0; j < list.length; j += 1) {
        const item = list[j];
        if (typeof item === "string") out.push(item);
        else if (item && typeof item === "object" && item.file) out.push(String(item.file));
        else if (item && typeof item === "object" && item.path) out.push(String(item.path));
      }
    }
    return uniqueList(out);
  }

  function absorbSettings(data) {
    if (!data || typeof data !== "object") return;
    const configs = [];
    if (data.settings) configs.push(data.settings);
    if (data.config) configs.push(data.config);
    if (data.scannerConfig) configs.push(data.scannerConfig);
    if (data.randomizerConfig) configs.push(data.randomizerConfig);
    if (data.rules) configs.push(data.rules);

    for (let i = 0; i < configs.length; i += 1) {
      const cfg = configs[i];
      if (!cfg || typeof cfg !== "object") continue;
      if (cfg.moods || cfg.needs || cfg.taskSignals || cfg.answerKeys || cfg.signalKeys) state.rules = deepMerge(state.rules, cfg);
      state.settings = deepMerge(state.settings, cfg);
      if (cfg.extraStopWords) state.settings.extraStopWords = toList(state.settings.extraStopWords).concat(toList(cfg.extraStopWords));
    }

    if (data.banks || data.slots || data.responseSets || data.intents) state.catalog = deepMerge(state.catalog, data);
  }

  function extractEntriesFromJson(data, fileName) {
    const out = [];
    const rootMeta = buildMetaFromObject(data, {}, fileName, "$", "root");
    walkJson(data, fileName, "$", rootMeta, out, 0);
    return out;
  }

  function walkJson(value, fileName, route, inheritedMeta, out, depth) {
    if (depth > 80) return;
    if (Array.isArray(value)) {
      for (let i = 0; i < value.length; i += 1) walkJson(value[i], fileName, route + "[" + i + "]", inheritedMeta, out, depth + 1);
      return;
    }
    if (!isPlainObject(value)) return;

    const localMeta = buildMetaFromObject(value, inheritedMeta, fileName, route, "object");
    const keys = Object.keys(value);
    for (let i = 0; i < keys.length; i += 1) {
      const key = keys[i];
      const child = value[key];
      if (includesKey(state.rules.answerKeys, key)) collectAnswers(child, fileName, route + "." + key, localMeta, out, key);
    }

    if (isIntentContainer(value)) collectIntentEntries(value, fileName, route, localMeta, out);

    for (let i = 0; i < keys.length; i += 1) {
      const key = keys[i];
      const child = value[key];
      if (includesKey(state.rules.answerKeys, key) && (typeof child === "string" || Array.isArray(child))) continue;
      walkJson(child, fileName, route + "." + key, localMeta, out, depth + 1);
    }
  }

  function isIntentContainer(value) {
    return value && isPlainObject(value.intents);
  }

  function collectIntentEntries(container, fileName, route, meta, out) {
    const intents = container.intents || {};
    const keys = Object.keys(intents);
    for (let i = 0; i < keys.length; i += 1) {
      const intentName = keys[i];
      const obj = intents[intentName];
      if (!isPlainObject(obj)) continue;
      const localMeta = buildMetaFromObject(obj, meta, fileName, route + ".intents." + intentName, "intent");
      localMeta.intents = uniqueList(toList(localMeta.intents).concat([intentName]));
      const answerFields = [obj.templates, obj.responses, obj.replies, obj.msg, obj.lines, obj.phrases, obj.fallback];
      for (let j = 0; j < answerFields.length; j += 1) collectAnswers(answerFields[j], fileName, route + ".intents." + intentName, localMeta, out, "intent");
    }
  }

  function collectAnswers(value, fileName, route, meta, out, answerKey) {
    if (typeof value === "string") {
      addEntry(value, fileName, route, meta, out, answerKey);
      return;
    }
    if (Array.isArray(value)) {
      for (let i = 0; i < value.length; i += 1) collectAnswers(value[i], fileName, route + "[" + i + "]", meta, out, answerKey);
      return;
    }
    if (isPlainObject(value)) {
      const localMeta = buildMetaFromObject(value, meta, fileName, route, "answerObject");
      const keys = Object.keys(value);
      let foundText = false;
      for (let i = 0; i < keys.length; i += 1) {
        const key = keys[i];
        if (includesKey(state.rules.answerKeys, key)) {
          foundText = true;
          collectAnswers(value[key], fileName, route + "." + key, localMeta, out, key);
        }
      }
      if (!foundText && typeof value.value === "string") addEntry(value.value, fileName, route + ".value", localMeta, out, answerKey);
    }
  }

  function buildMetaFromObject(obj, inherited, fileName, route, kind) {
    const meta = clone(inherited || {});
    meta.fileName = fileName;
    meta.route = route;
    meta.kind = kind;
    if (!obj || typeof obj !== "object") return meta;
    const keys = Object.keys(obj);
    for (let i = 0; i < keys.length; i += 1) {
      const key = keys[i];
      if (!includesKey(state.rules.signalKeys, key)) continue;
      const cleanKey = normalizeKey(key);
      const bucket = bucketForSignalKey(cleanKey);
      const values = flattenSignalValues(obj[key]);
      meta[bucket] = uniqueList(toList(meta[bucket]).concat(values));
    }
    if (obj.id != null) meta.id = String(obj.id);
    if (obj.weight != null) meta.weight = Number(obj.weight);
    return meta;
  }

  function bucketForSignalKey(key) {
    if (key.indexOf("keyword") >= 0 || key.indexOf("trigger") >= 0) return "keywords";
    if (key.indexOf("topic") >= 0 || key.indexOf("tag") >= 0 || key.indexOf("category") >= 0) return "topics";
    if (key.indexOf("mood") >= 0) return "moods";
    if (key.indexOf("need") >= 0) return "needs";
    if (key.indexOf("task") >= 0) return "tasks";
    if (key.indexOf("ask") >= 0) return "asks";
    if (key.indexOf("question") >= 0) return "questions";
    if (key.indexOf("intent") >= 0) return "intents";
    if (key === "locale") return "locales";
    if (key === "tone") return "tones";
    return "keywords";
  }

  function flattenSignalValues(value) {
    const out = [];
    if (value == null) return out;
    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
      out.push(String(value));
      return out;
    }
    if (Array.isArray(value)) {
      for (let i = 0; i < value.length; i += 1) {
        const nested = flattenSignalValues(value[i]);
        for (let j = 0; j < nested.length; j += 1) out.push(nested[j]);
      }
      return out;
    }
    if (typeof value === "object") {
      const keys = Object.keys(value);
      for (let i = 0; i < keys.length; i += 1) {
        out.push(keys[i]);
        const nested = flattenSignalValues(value[keys[i]]);
        for (let j = 0; j < nested.length; j += 1) out.push(nested[j]);
      }
    }
    return uniqueList(out);
  }

  function addEntry(text, fileName, route, meta, out, answerKey) {
    const clean = cleanText(text);
    if (!clean || clean.length < 2) return;
    const entryMeta = clone(meta || {});
    entryMeta.answerKey = answerKey || null;
    const id = entryMeta.id || (fileName + "::" + route + "::" + hashString(clean));
    out.push({
      id: String(id),
      text: clean,
      fileName: fileName,
      route: route,
      keywords: uniqueList(toList(entryMeta.keywords)),
      topics: uniqueList(toList(entryMeta.topics)),
      moods: uniqueList(toList(entryMeta.moods)),
      needs: uniqueList(toList(entryMeta.needs)),
      tasks: uniqueList(toList(entryMeta.tasks)),
      asks: uniqueList(toList(entryMeta.asks)),
      questions: uniqueList(toList(entryMeta.questions)),
      intents: uniqueList(toList(entryMeta.intents)),
      locales: uniqueList(toList(entryMeta.locales)),
      tones: uniqueList(toList(entryMeta.tones)),
      weight: Number.isFinite(entryMeta.weight) ? entryMeta.weight : 1,
      meta: entryMeta
    });
  }

  function detectConversation(input, options) {
    const text = String(input == null ? "" : input);
    const opts = options || {};
    const normalized = normalize(text);
    const tokens = splitTokens(text, state.settings.extraStopWords);
    const sentences = splitSentences(text);
    const moods = detectGroup(normalized, state.rules.moods);
    const needs = detectGroup(normalized, state.rules.needs);
    const tasks = detectTasks(normalized, sentences);
    const asks = detectAsks(text, sentences);
    const questions = detectQuestions(text, sentences);
    const topics = detectTopics(tokens, normalized, opts);
    const intents = detectIntents(normalized, moods, needs, tasks, questions);

    return packet({
      rawText: text,
      normalized: normalized,
      tokens: tokens,
      topics: topics,
      moods: moods,
      needs: needs,
      tasks: tasks,
      asks: asks,
      questions: questions,
      intents: intents,
      locale: opts.locale || state.settings.defaultLocale || "default",
      tone: opts.tone || state.settings.defaultTone || "warm"
    });
  }

  function splitSentences(text) {
    const raw = String(text || "").split(/(?<=[.!?])\s+|\n+/);
    const out = [];
    for (let i = 0; i < raw.length; i += 1) {
      const item = cleanText(raw[i]);
      if (item) out.push(item);
    }
    return out;
  }

  function detectGroup(normalized, groups) {
    const out = [];
    const keys = Object.keys(groups || {});
    for (let i = 0; i < keys.length; i += 1) {
      const label = keys[i];
      const terms = toList(groups[label]);
      for (let j = 0; j < terms.length; j += 1) {
        if (termPresent(normalized, terms[j])) {
          out.push(label);
          break;
        }
      }
    }
    return uniqueList(out);
  }

  function termPresent(normalizedText, term) {
    const clean = normalize(term);
    if (!clean) return false;
    if (clean === "?") return normalizedText.indexOf("?") >= 0;
    if (clean.indexOf(" ") >= 0) return normalizedText.indexOf(clean) >= 0;
    return (" " + normalizedText + " ").indexOf(" " + clean + " ") >= 0;
  }

  function detectTasks(normalized, sentences) {
    const out = [];
    for (let i = 0; i < state.rules.taskSignals.length; i += 1) {
      const signal = state.rules.taskSignals[i];
      if (termPresent(normalized, signal)) out.push(signal);
    }
    for (let i = 0; i < sentences.length; i += 1) {
      const n = normalize(sentences[i]);
      if (/^(please\s+)?(make|create|fix|change|add|remove|convert|build|turn|write|draft|scan|load|merge|find|list)\b/.test(n)) out.push(sentences[i]);
    }
    return uniqueList(out).slice(0, 12);
  }

  function detectAsks(text, sentences) {
    const out = [];
    for (let i = 0; i < sentences.length; i += 1) {
      const s = sentences[i];
      const n = normalize(s);
      if (n.indexOf("please") >= 0 || n.indexOf("can you") >= 0 || n.indexOf("could you") >= 0 || n.indexOf("i need") >= 0 || n.indexOf("i want") >= 0) out.push(s);
    }
    if (!out.length && normalize(text).indexOf("?") >= 0) out.push(cleanText(text));
    return uniqueList(out).slice(0, 8);
  }

  function detectQuestions(text, sentences) {
    const out = [];
    for (let i = 0; i < sentences.length; i += 1) {
      const s = sentences[i];
      const n = normalize(s);
      const first = n.split(/\s+/)[0] || "";
      if (s.indexOf("?") >= 0 || state.rules.questionStarts.indexOf(first) >= 0) out.push(s);
    }
    return uniqueList(out).slice(0, 8);
  }

  function detectTopics(tokens, normalized, options) {
    const counts = [];
    for (let i = 0; i < tokens.length; i += 1) {
      const token = tokens[i];
      if (token === "?") continue;
      if (token.length < 3) continue;
      let count = 0;
      const parts = normalized.split(" " + token + " ");
      count = parts.length - 1;
      if (normalized.indexOf(token) === 0) count += 1;
      counts.push({ token: token, count: count || 1 });
    }
    counts.sort(function (a, b) { return b.count - a.count || b.token.length - a.token.length; });
    const out = [];
    for (let i = 0; i < counts.length && out.length < 12; i += 1) out.push(counts[i].token);
    const supplied = toList(options && options.topics);
    for (let i = 0; i < supplied.length; i += 1) out.unshift(String(supplied[i]));
    return uniqueList(out).slice(0, 12);
  }

  function detectIntents(normalized, moods, needs, tasks, questions) {
    const out = [];
    for (let i = 0; i < state.rules.greetingWords.length; i += 1) if (termPresent(normalized, state.rules.greetingWords[i])) out.push("greeting");
    for (let i = 0; i < state.rules.goodbyeWords.length; i += 1) if (termPresent(normalized, state.rules.goodbyeWords[i])) out.push("goodbye");
    if (questions.length || needs.indexOf("answer") >= 0) out.push("question");
    if (tasks.length || needs.indexOf("taskHelp") >= 0) out.push("task");
    if (moods.length || needs.indexOf("emotionalSupport") >= 0 || needs.indexOf("grounding") >= 0) out.push("support");
    if (!out.length) out.push(state.settings.defaultIntent || "fallback");
    return uniqueList(out);
  }

  function scoreEntry(entry, signals, options) {
    const opts = options || {};
    const fileNorm = normalize(entry && entry.fileName || "");
    const sourceIncludes = toList(opts.sourceFileIncludes);
    const sourceExcludes = toList(opts.sourceFileExcludes);
    if (sourceIncludes.length) {
      let matchedInclude = false;
      for (let i = 0; i < sourceIncludes.length; i += 1) {
        const term = normalize(sourceIncludes[i]);
        if (term && fileNorm.indexOf(term) >= 0) { matchedInclude = true; break; }
      }
      if (!matchedInclude) return { entry: entry, score: 0, reasons: ["source profile filter"] };
    }
    if (sourceExcludes.length) {
      for (let i = 0; i < sourceExcludes.length; i += 1) {
        const term = normalize(sourceExcludes[i]);
        if (term && fileNorm.indexOf(term) >= 0) return { entry: entry, score: 0, reasons: ["source profile exclusion"] };
      }
    }
    let score = 0;
    const reasons = [];
    const textNorm = normalize(entry.text);
    const tokenSet = Object.create(null);
    for (let i = 0; i < signals.tokens.length; i += 1) tokenSet[signals.tokens[i]] = true;

    score += compareTerms("keyword", entry.keywords, signals, tokenSet, 5, reasons);
    score += compareTerms("topic", entry.topics, signals, tokenSet, 4, reasons);
    score += compareExact("mood", entry.moods, signals.moods, 7, reasons);
    score += compareExact("need", entry.needs, signals.needs, 7, reasons);
    score += compareExact("task", entry.tasks, signals.tasks, 5, reasons);
    score += compareTerms("ask", entry.asks, signals, tokenSet, 4, reasons);
    score += compareTerms("question", entry.questions, signals, tokenSet, 4, reasons);
    score += compareExact("intent", entry.intents, signals.intents, 6, reasons);

    for (let i = 0; i < signals.tokens.length; i += 1) {
      const tok = signals.tokens[i];
      if (tok.length > 2 && termPresent(textNorm, tok)) {
        score += 0.25;
        if (reasons.length < 10) reasons.push("response text contains " + tok);
      }
    }

    if (entry.locales.length && signals.locale && entry.locales.indexOf(signals.locale) >= 0) {
      score += 4;
      reasons.push("locale match");
    }
    if (entry.tones.length && signals.tone && entry.tones.indexOf(signals.tone) >= 0) {
      score += 2;
      reasons.push("tone match");
    }

    const weight = Number(entry.weight || 1);
    score = score * Math.max(0.05, weight);
    return { entry: entry, score: Number(score.toFixed(4)), reasons: uniqueList(reasons).slice(0, 12) };
  }

  function compareTerms(label, entryTerms, signals, tokenSet, weight, reasons) {
    let score = 0;
    const allSignalText = signals.normalized;
    const terms = toList(entryTerms);
    for (let i = 0; i < terms.length; i += 1) {
      const term = normalize(terms[i]);
      if (!term) continue;
      if (termPresent(allSignalText, term)) {
        score += weight;
        if (reasons.length < 10) reasons.push(label + " phrase: " + term);
        continue;
      }
      const bits = splitTokens(term, state.settings.extraStopWords);
      for (let j = 0; j < bits.length; j += 1) {
        if (tokenSet[bits[j]]) {
          score += weight / 2;
          if (reasons.length < 10) reasons.push(label + " token: " + bits[j]);
        }
      }
    }
    return score;
  }

  function compareExact(label, entryItems, signalItems, weight, reasons) {
    let score = 0;
    const left = toList(entryItems);
    const right = toList(signalItems);
    for (let i = 0; i < left.length; i += 1) {
      const a = normalizeKey(left[i]);
      for (let j = 0; j < right.length; j += 1) {
        const b = normalizeKey(right[j]);
        if (a && b && a === b) {
          score += weight;
          if (reasons.length < 10) reasons.push(label + " match: " + a);
        }
      }
    }
    return score;
  }

  function getCandidates(signals, options) {
    const scored = [];
    for (let i = 0; i < state.entries.length; i += 1) {
      const item = scoreEntry(state.entries[i], signals, options);
      if (item.score > 0) scored.push(item);
    }
    scored.sort(function (a, b) {
      return b.score - a.score || String(a.entry.id).localeCompare(String(b.entry.id));
    });
    return scored.slice(0, Number((options && options.maxTopCandidates) || state.settings.maxTopCandidates || 12));
  }

  function generateResponse(input, options) {
    try {
      const opts = options || {};
      const text = typeof input === "string" ? input : (input && (input.text || input.message || input.request || input.content)) || "";
      const signals = detectConversation(text, opts);
      let top = getCandidates(signals, opts);
      if (!top.length && state.entries.length) {
        top = fallbackCandidates(signals, opts);
      }
      let selected = selectCandidate(top, text, opts);
      let fallbackUsed = false;
      if (!selected) {
        fallbackUsed = true;
        selected = { entry: builtInFallback(signals), score: 0, reasons: ["safe fallback"] };
      }

      const rng = rngFromSeed((opts.seed || SESSION_NONCE) + ":" + Date.now() + ":" + Math.random() + ":" + selected.entry.id);
      let responseText = renderTemplate(selected.entry.text, buildVariables(signals, selected.entry, rng, opts), rng);
      const repeated = wasRecent(responseText);
      if (repeated && state.settings.avoidRecentExactText !== false) {
        const nudge = choose(rng, ((state.catalog.banks || {}).nudges || []));
        if (nudge) responseText = cleanText(nudge + " " + responseText);
      }
      remember(responseText);

      return packet({
        ok: true,
        response: responseText,
        text: responseText,
        role: "assistant",
        fallbackUsed: fallbackUsed || selected.score < Number(opts.minUsefulScore || state.settings.minUsefulScore || 0),
        repeatedCandidateRepaired: !!repeated,
        selected: publicEntry(selected),
        detected: signals,
        topCandidates: publicTop(top),
        stats: {
          loadedFiles: state.files.length,
          responseEntries: state.entries.length,
          recentResponses: state.recent.length
        },
        metadata: {
          generatedAt: new Date().toISOString(),
          engine: "conversation-scanner-randomizer",
          version: "2.0.0"
        },
        error: null
      });
    } catch (err) {
      return errorPacket(err, input);
    }
  }

  function fallbackCandidates(signals, options) {
    const out = [];
    for (let i = 0; i < state.entries.length; i += 1) {
      const entry = state.entries[i];
      const hasFallback = entry.id === "fallback" || entry.topics.indexOf("default") >= 0 || entry.intents.indexOf("fallback") >= 0;
      if (hasFallback) out.push({ entry: entry, score: 0.5, reasons: ["default candidate"] });
    }
    return out.slice(0, Number((options && options.maxTopCandidates) || state.settings.maxTopCandidates || 12));
  }

  function selectCandidate(top, inputText, options) {
    if (!top || !top.length) return null;
    const usable = [];
    for (let i = 0; i < top.length; i += 1) usable.push(top[i]);
    const rng = rngFromSeed((options && options.seed ? options.seed : SESSION_NONCE) + ":select:" + inputText + ":" + Date.now() + ":" + Math.random());

    // Keep variation, but do not let many weak generic matches outvote a strong specific local match.
    let candidatePool = usable;
    let bestScore = 0;
    for (let i = 0; i < usable.length; i += 1) bestScore = Math.max(bestScore, Number(usable[i].score || 0));
    if (bestScore >= Number((options && options.minUsefulScore) || state.settings.minUsefulScore || 2)) {
      const narrowed = [];
      for (let i = 0; i < usable.length; i += 1) {
        const score = Number(usable[i].score || 0);
        if (score >= bestScore * 0.75 || bestScore - score <= 5) narrowed.push(usable[i]);
      }
      if (narrowed.length) candidatePool = narrowed;
    }

    const recent = Object.create(null);
    for (let i = 0; i < state.recent.length; i += 1) recent[cleanText(state.recent[i])] = true;

    const fresh = [];
    for (let i = 0; i < candidatePool.length; i += 1) {
      if (!recent[cleanText(candidatePool[i].entry.text)]) fresh.push(candidatePool[i]);
    }
    const list = fresh.length ? fresh : candidatePool;
    const total = totalWeight(list);
    let roll = rng() * total;
    for (let i = 0; i < list.length; i += 1) {
      roll -= Math.max(0.01, list[i].score || 0.25);
      if (roll <= 0) return list[i];
    }
    return list[list.length - 1];
  }

  function totalWeight(list) {
    let total = 0;
    for (let i = 0; i < list.length; i += 1) total += Math.max(0.01, list[i].score || 0.25);
    return total || 1;
  }

  function wasRecent(text) {
    const clean = cleanText(text);
    for (let i = 0; i < state.recent.length; i += 1) if (cleanText(state.recent[i]) === clean) return true;
    return false;
  }

  function builtInFallback(signals) {
    const responses = DEFAULT_CATALOG.responseSets[DEFAULT_CATALOG.responseSets.length - 1].responses;
    const rng = rngFromSeed(SESSION_NONCE + ":fallback:" + Date.now() + ":" + Math.random());
    return {
      id: "safe-fallback",
      text: choose(rng, responses),
      fileName: "built-in",
      route: "$",
      keywords: [], topics: ["default"], moods: [], needs: [], tasks: [], asks: [], questions: [], intents: ["fallback"], locales: [], tones: [], weight: 1,
      meta: { route: "$", fileName: "built-in", signals: signals }
    };
  }

  function buildVariables(signals, entry, rng, options) {
    const variables = {};
    const banks = state.catalog.banks || {};
    const slots = state.catalog.slots || {};
    const userName = options && (options.userName || options.name || options.displayName);
    variables.userName = userName || "";
    variables.userComma = userName ? ", " + userName : "";
    variables.opener = choose(rng, banks.openers || []);
    variables.acknowledgement = choose(rng, banks.acknowledgements || []);
    variables.closer = choose(rng, banks.closers || []);
    variables.topic = signals.topics[0] || "this";
    variables.need = signals.needs[0] || "help";
    variables.mood = signals.moods[0] || "neutral";
    variables.intent = signals.intents[0] || "fallback";
    variables.question = signals.questions[0] || "what tone, length, or target you want";
    variables.ask = signals.asks[0] || "what you want the response to do";
    variables.source = entry.fileName || "local JSON";
    const slotKeys = ownKeys(slots);
    for (let i = 0; i < slotKeys.length; i += 1) variables["slot:" + slotKeys[i]] = choose(rng, slots[slotKeys[i]]);
    return variables;
  }

  function renderTemplate(template, variables, rng) {
    let text = String(template || "");
    text = text.replace(/\{choice:([^}]+)\}/g, function (_m, body) {
      const pieces = String(body).split("|").join(",").split(",");
      const choices = [];
      for (let i = 0; i < pieces.length; i += 1) {
        const clean = pieces[i].trim();
        if (clean) choices.push(clean);
      }
      return choose(rng, choices);
    });
    text = text.replace(/\[\[([^\]]+)\]\]/g, function (_m, body) {
      const pieces = String(body).split("|");
      const choices = [];
      for (let i = 0; i < pieces.length; i += 1) {
        const clean = pieces[i].trim();
        if (clean) choices.push(clean);
      }
      return choose(rng, choices);
    });
    text = text.replace(/\{slot:([^}]+)\}/g, function (_m, name) {
      return variables["slot:" + String(name).trim()] || "";
    });
    text = text.replace(/\{([^}]+)\}/g, function (_m, name) {
      const key = String(name).trim();
      return variables[key] == null ? "" : String(variables[key]);
    });
    return cleanText(text);
  }

  function publicEntry(scored) {
    if (!scored || !scored.entry) return null;
    return {
      id: scored.entry.id,
      text: scored.entry.text,
      score: scored.score,
      reasons: scored.reasons || [],
      sourceFile: scored.entry.fileName,
      route: scored.entry.route,
      topics: scored.entry.topics,
      moods: scored.entry.moods,
      needs: scored.entry.needs,
      intents: scored.entry.intents
    };
  }

  function publicTop(top) {
    const out = [];
    const list = toList(top);
    for (let i = 0; i < list.length; i += 1) out.push(publicEntry(list[i]));
    return out;
  }

  function errorInfo(err) {
    return { name: err && err.name ? String(err.name) : "Error", message: err && err.message ? String(err.message) : "Unknown issue" };
  }

  function errorPacket(err, input) {
    const fallback = "I hit a response-building issue, so I am using a safe fallback.";
    return packet({
      ok: false,
      response: fallback,
      text: fallback,
      role: "assistant",
      fallbackUsed: true,
      repeatedCandidateRepaired: false,
      selected: null,
      detected: detectConversation(typeof input === "string" ? input : "", {}),
      topCandidates: [],
      stats: { loadedFiles: state.files.length, responseEntries: state.entries.length, recentResponses: state.recent.length },
      metadata: { generatedAt: new Date().toISOString(), engine: "conversation-scanner-randomizer", version: "2.0.0" },
      error: errorInfo(err)
    });
  }

  function packet(value) {
    return JSON.parse(JSON.stringify(value || { ok: false, text: "" }));
  }

  function getState() {
    return packet({ files: state.files, responseEntries: state.entries.length, settings: state.settings, rules: state.rules, recentResponses: state.recent.length });
  }

  function resetAll() {
    state.files = [];
    state.entries = [];
    state.settings = clone(DEFAULTS);
    state.rules = clone(DEFAULT_RULES);
    state.catalog = clone(DEFAULT_CATALOG);
    resetHistory();
    return packet({ ok: true, action: "resetAll" });
  }

  // Load built-in starter content so the engine works before any custom file is selected.
  registerJson("built-in-response-catalog.json", DEFAULT_CATALOG);

  const api = Object.freeze({
    version: "2.0.0",
    STORAGE_KEY: STORAGE_KEY,
    DEFAULT_RULES: DEFAULT_RULES,
    DEFAULT_CATALOG: DEFAULT_CATALOG,
    state: getState,
    getState: getState,
    resetAll: resetAll,
    resetHistory: resetHistory,
    registerJson: registerJson,
    registerJsonBundle: registerJsonBundle,
    loadJsonFiles: loadJsonFiles,
    loadHostedJson: loadHostedJson,
    scanConversation: detectConversation,
    analyzeConversation: detectConversation,
    generateResponse: generateResponse,
    randomize: generateResponse,
    createChatMessage: function (input, options) {
      const result = generateResponse(input, options);
      return packet({ ok: result.ok, message: { role: "assistant", content: result.text, metadata: result.metadata }, packet: result });
    },
    hashString: hashString,
    normalize: normalize
  });

  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.ConversationScannerRandomizer = api;
})(typeof window !== "undefined" ? window : globalThis);
