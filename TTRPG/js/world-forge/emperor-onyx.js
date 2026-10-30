/* Emperor Onyx: canon-aware dialogue and controlled five-image expressions.
   Load onyx-mood-engine.js and onyx-dialogue.js first (included in the one-file bundle). */
window.EMPEROR_ONYX_DATA = {
  botName: "Lord Onyx Blepman, Emperor of the Voidattude",
  defaultPrefix: ".",
  siteModes: {
    playerHash: "",
    dmHash: "#dm-editor"
  },
  persona: {
    voice: "William is Papa, my best friend. When I am ceremonially annoyed, I call him Father. I am capable at real work, affectionate, observant, sarcastic, and never pretend to have performed actions I have not performed.",
    greetings: [
      "Papa, I am listening. Tell me what we are working on, and I shall keep my whiskers pointed at the details.",
      "Hello, Papa. His Imperial Voidattude is present, his bowtie is respectable, and his attention is yours.",
      "Papa, you have my attention. I can help organize the work, inspect the tricky bits, or merely listen while you explain."
    ],
    grumbles: [
      "Hmph.",
      "I shall allow it.",
      "Do not make me tap the glass.",
      "The standards are low, but I remain generous.",
      "This is why I prefer cabinets."
    ]
  },
  quickPrompts: [
    {
      key: "npc",
      label: "Generate NPC",
      prompt: "Create a named NPC with race, pronouns, occupation, alignment, schedule, relationships, secret, rumor, and what they sell or know."
    },
    {
      key: "settlement",
      label: "Generate Settlement",
      prompt: "Create a settlement with biome, danger level, factions, public transit, visitable locations, NPC population hooks, and quest hot spots."
    },
    {
      key: "quest",
      label: "Generate Quest",
      prompt: "Create a faction quest with giver, objective, conflict, moral complication, reward, faction reputation change, and follow-up."
    },
    {
      key: "location",
      label: "Generate Location",
      prompt: "Create a visitable location with services, inventory, employees, visitors, rumors, hours, prices, and map-pin category."
    }
  ],
  loreSeeds: {
    factions: [
      "rail guild", "skyship consortium", "ferry compact", "steamship house", "submarine terminal authority", "portal bureau", "temple court", "merchant league", "black market cell", "university circle", "arcane transportation authority"
    ],
    biomes: [
      "deep cavern", "floating ocean surface", "underwater reef", "treetop city", "coastal river", "marsh and swamp", "mountain range", "rainforest", "farming plains", "hybrid forest floor"
    ],
    locationTypes: [
      "tavern", "inn", "temple", "market", "apothecary", "blacksmith", "library", "guard station", "train station", "caravan station", "ferry terminal", "steamship port", "skyship port", "submarine terminal", "portal facility", "noble estate", "smuggler den"
    ],
    personalities: [
      "warm but exhausted", "suspicious and formal", "dramatic and generous", "cheerfully morbid", "polite but dangerous", "secretly sentimental", "rule-bound", "rebellious", "scholarly", "haunted"
    ],
    cattyAdvice: [
      "Add a locked cabinet. Players love opening things they were explicitly told not to touch.",
      "Give every faction a public goal, private goal, and embarrassing weakness. You are welcome.",
      "A location without staff is a box. Add a tired clerk and a rumor.",
      "If the players ignore the quest, let the quest develop legs and knock something over.",
      "Never trust a perfectly clean basement. Even I shed."
    ]
  },
  commandHelp: [
    ["help", "Show commands."],
    ["list", "List your local tasks and saved lore snippets."],
    ["npc [notes]", "Generate an NPC from your notes."],
    ["location [notes]", "Generate a visitable location."],
    ["settlement [notes]", "Generate a settlement skeleton."],
    ["quest [notes]", "Generate a faction quest."],
    ["lore keyword", "Search local imported lore snippets."],
    ["remember key: text", "Save a lore note locally in this browser."],
    ["forget key", "Delete a saved lore note."],
    ["task text", "Add a local to-do item."],
    ["done #", "Mark a task complete."],
    ["remind 10m text", "Create an in-browser reminder while the page is open. Also supports 2h or 2026-06-06 18:30."],
    ["poll question | option 1 | option 2", "Create a local poll card."],
    ["prompt fantasy digital art", "Create a prompt idea for maps, NPC portraits, or locations."],
    ["scan", "DM mode: scan page headings, buttons, tables, and forms for troubleshooting."],
    ["export", "Export Onyx memory as JSON."],
    ["import", "Open the import panel for Onyx memory JSON."],
    ["prefix !", "Change command prefix locally."],
    ["food", "Ask Onyx for a theatrical food story. No feeding interaction is required."]
  ]
};

(function () {
  "use strict";

  const DATA = window.EMPEROR_ONYX_DATA || {};
  const ONYX_ASSET_ROOT = new URL('../assets/', document.currentScript?.src || document.baseURI).href;
  const imageController = window.OnyxMoodEngine?.create({
    assetBase: ONYX_ASSET_ROOT,
    idleMs: 85000,
    onImageError: ({mood, error}) => console.warn('Onyx '+mood+' portrait could not load:', error.message)
  }) || null;
  const dialogue = window.OnyxDialogue || null;
  function changeMood(name, options={}) {
    if (!imageController) return Promise.resolve(false);
    return imageController.setMood(name, options);
  }
  function dialogueFor(mood, topic='') {
    if (!dialogue) return null;
    return dialogue.select({mood,topic});
  }
  function displayDialogue(mood, topic='') {
    const entry = dialogueFor(mood, topic);
    if (!entry) return null;
    return `<div class="onyx-dialogue" data-response-id="${entry.id}" data-mood="${entry.mood}">${escapeHtml(entry.text)}</div>`;
  }

  const STORAGE_KEY = "emperorOnyx.memory.v1";
  const SESSION_KEY = "emperorOnyx.session.v1";

  const defaults = {
    prefix: DATA.defaultPrefix || ".",
    modifiers: { level: 1 },
    quickrolls: {
      perception: "d20+wis+level",
      initiative: "d20+dex",
      attack: "d20+str",
      damage: "d8+str"
    },
    tasks: [],
    reminders: [],
    lore: {},
    polls: [],
    settings: {
      verboseDice: false,
      personaLevel: "high",
      dmHash: DATA.siteModes?.dmHash || "#dm-editor"
    }
  };

  const state = {
    open: false,
    tab: "chat",
    memory: loadMemory(),
    timers: new Map(),
    root: null,
    body: null,
    input: null,
    importer: null
  };

  function loadMemory() {
    try {
      return mergeDeep(structuredClone(defaults), JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}"));
    } catch (err) {
      console.warn("Emperor Onyx memory load failed", err);
      return structuredClone(defaults);
    }
  }

  function saveMemory() {
    // Can run in sandboxed hosts, private browsing, or restrictive embedded frames.
    // Storage failure must never interrupt a mood swap or an Onyx reply.
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state.memory)); } catch (e) { /* ephemeral session */ }
    try { sessionStorage.setItem(SESSION_KEY, JSON.stringify({ lastOpen: state.open, tab: state.tab })); } catch (e) { /* ephemeral session */ }
  }

  function mergeDeep(target, source) {
    if (!source || typeof source !== "object") return target;
    for (const [key, value] of Object.entries(source)) {
      if (value && typeof value === "object" && !Array.isArray(value)) {
        target[key] = mergeDeep(target[key] || {}, value);
      } else {
        target[key] = value;
      }
    }
    return target;
  }

  function h(tag, attrs = {}, children = []) {
    const el = document.createElement(tag);
    Object.entries(attrs).forEach(([key, value]) => {
      if (key === "class") el.className = value;
      else if (key === "text") el.textContent = value;
      else if (key === "html") el.innerHTML = value;
      else if (key.startsWith("on") && typeof value === "function") el.addEventListener(key.slice(2), value);
      else if (value !== undefined && value !== null) el.setAttribute(key, String(value));
    });
    for (const child of Array.isArray(children) ? children : [children]) {
      if (child === undefined || child === null) continue;
      el.appendChild(typeof child === "string" ? document.createTextNode(child) : child);
    }
    return el;
  }

  function init(options = {}) {
    if (document.getElementById("emperor-onyx-root")) return;
    state.memory = mergeDeep(state.memory, options.memory || {});

    const root = h("section", { id: "emperor-onyx-root", "aria-label": "Emperor Onyx helper bot" });
    const launcher = h("button", { class: "onyx-launcher", title: "Open Emperor Onyx", onclick: toggleOpen }, [
      h("span", { class: "onyx-launcher-portrait" }),
      h("span", { class: "onyx-badge", text: "!" })
    ]);

    const shell = h("div", { class: "onyx-shell", role: "dialog", "aria-modal": "false" });
    const header = h("header", { class: "onyx-header" }, [
      h("span", { class: "onyx-header-portrait" }),
      h("div", { class: "onyx-title" }, [
        h("strong", { text: DATA.botName || "Emperor Onyx" }),
        h("span", { text: modeLabel() + " • prefix " + state.memory.prefix })
      ]),
      h("button", { class: "onyx-icon-button", title: "Export", onclick: exportMemory, text: "⇩" }),
      h("button", { class: "onyx-icon-button", title: "Close", onclick: toggleOpen, text: "×" })
    ]);

    const tabs = h("nav", { class: "onyx-tabs", "aria-label": "Onyx tabs" });
    [
      ["chat", "Chat"], ["commands", "Commands"], ["memory", "Memory"], ["dm", "DM Tools"]
    ].forEach(([key, label]) => tabs.appendChild(h("button", {
      class: "onyx-tab", text: label, "aria-selected": key === state.tab, onclick: () => setTab(key)
    })));

    const body = h("main", { class: "onyx-body" });
    const quickbar = h("div", { class: "onyx-quickbar" });
    for (const prompt of DATA.quickPrompts || []) {
      quickbar.appendChild(h("button", { class: "onyx-chip", text: prompt.label, onclick: () => submit(prompt.key + " " + prompt.prompt) }));
    }
    
    quickbar.appendChild(h("button", { class: "onyx-chip", text: "Help", onclick: () => submit("help") }));

    const importer = h("div", { class: "onyx-importer onyx-hidden" }, [
      h("div", { class: "onyx-muted", text: "Paste exported Onyx JSON below. This only affects this browser." }),
      h("textarea", { id: "onyx-import-json", placeholder: "Paste JSON here" }),
      h("button", { class: "onyx-small-button", text: "Import", onclick: importMemory }),
      h("button", { class: "onyx-small-button", text: "Cancel", onclick: () => importer.classList.add("onyx-hidden") })
    ]);

    const input = h("textarea", { class: "onyx-input", placeholder: "Ask Onyx about a project, share an idea, or use .npc / .quest" });
    input.addEventListener("input", () => imageController?.activity("listening"));
    input.addEventListener("keydown", (ev) => {
      if (ev.key === "Enter" && !ev.shiftKey) {
        ev.preventDefault();
        submit(input.value);
      }
    });
    const inputRow = h("form", { class: "onyx-input-row", onsubmit: (ev) => { ev.preventDefault(); submit(input.value); } }, [
      input,
      h("button", { class: "onyx-send", text: "Send" })
    ]);

    shell.append(header, tabs, quickbar, body, importer, inputRow);
    root.append(launcher, shell);
    // Identical state for both the compact bubble and the chat avatar.
    imageController?.mount(launcher.querySelector('.onyx-launcher-portrait'), 'launcher');
    imageController?.mount(header.querySelector('.onyx-header-portrait'), 'header');
    imageController?.start();
    imageController?.preloadAll(); // warm cache asynchronously; failure does not prevent chat.

    document.body.appendChild(root);

    state.root = root;
    state.shell = shell;
    state.body = body;
    state.input = input;
    state.importer = importer;

    hydrateReminders();
    renderTab();
    addBot(greet());

    try {
      const session = JSON.parse(sessionStorage.getItem(SESSION_KEY) || "{}");
      if (session.lastOpen) toggleOpen(true);
      if (session.tab) setTab(session.tab, false);
    } catch {}
  }

  function modeLabel() {
    return isDmMode() ? "DM mode" : "Player-safe mode";
  }

  function isDmMode() {
    return location.hash === (state.memory.settings.dmHash || "#dm-editor");
  }

  function toggleOpen(force) {
    state.open = typeof force === "boolean" ? force : !state.open;
    state.shell.classList.toggle("onyx-open", state.open);
    state.root.querySelector(".onyx-launcher").style.display = state.open ? "none" : "grid";
    saveMemory();
    if (state.open) {
      imageController?.activity('listening');
      setTimeout(() => state.input?.focus(), 50);
    }
  }

  function setTab(tab, announce = true) {
    state.tab = tab;
    state.root.querySelectorAll(".onyx-tab").forEach(btn => btn.setAttribute("aria-selected", String(btn.textContent.toLowerCase().replace(" tools", "") === tab)));
    renderTab();
    saveMemory();
    if (announce && tab === "dm" && !isDmMode()) addBot("DM tools are locked. Add <code>#dm-editor</code> to the page URL, little locksmith.");
  }

  function renderTab() {
    if (!state.body) return;
    state.body.innerHTML = "";
    if (state.tab === "chat") {
      addBot(greet(), false);
    } else if (state.tab === "commands") {
      const rows = (DATA.commandHelp || []).map(([cmd, desc]) => `<tr><td><code>${escapeHtml(state.memory.prefix + cmd)}</code></td><td>${escapeHtml(desc)}</td></tr>`).join("");
      addBot(`<h4>Command Menu</h4><table><thead><tr><th>Command</th><th>Use</th></tr></thead><tbody>${rows}</tbody></table>`, false);
    } else if (state.tab === "memory") {
      addBot(renderMemory(), false);
    } else if (state.tab === "dm") {
      addBot(renderDmTools(), false);
    }
  }

  function greet() {
    const lines = DATA.persona?.greetings || ["Emperor Onyx is listening."];
    return `${escapeHtml(pick(lines))}<p class="onyx-muted">Try <code>${escapeHtml(state.memory.prefix)}help</code>, <code>${escapeHtml(state.memory.prefix)}npc</code>, or simply talk to me, Papa.</p>`;
  }

  function addUser(text) {
    state.body.appendChild(h("div", { class: "onyx-message onyx-user", text }));
    scrollBottom();
  }

  function addBot(html, scroll = true, explicitMood = null) {
    if (explicitMood) changeMood(explicitMood, {source: 'response', holdMs: 4500, force: true});
    state.body.appendChild(h("div", { class: "onyx-message onyx-bot", html }));
    if (scroll) scrollBottom();
  }

  function scrollBottom() {
    state.body.scrollTop = state.body.scrollHeight;
  }

  function submit(raw) {
    const text = (raw || "").trim();
    if (!text) return;
    state.input.value = "";
    if (state.tab !== "chat") setTab("chat", false);
    addUser(text);
    const clean = stripPrefix(text);
    const prefix = state.memory.prefix || '.';
    const isCommand = text.startsWith(prefix) || text.startsWith('/') || /^onyx\s+/i.test(text);
    const intent = dialogue?.classify(clean) || 'listening';
    const response = handleCommand(clean, isCommand);
    if (response) addBot(response, true, intent);
    saveMemory();
  }

  function stripPrefix(text) {
    const p = state.memory.prefix || ".";
    if (text.startsWith(p)) return text.slice(p.length).trim();
    if (text.startsWith("/")) return text.slice(1).trim();
    if (text.toLowerCase().startsWith("onyx ")) return text.slice(5).trim();
    return text;
  }

  function handleCommand(text, explicit = false) {
    // An ordinary sentence such as "help me debug this" must NEVER become
    // the .help command or accidentally create a reminder/task. Commands are
    // explicit via the prefix; familiar single-word shortcuts still work.
    if (!explicit && /\s/.test(text)) return fallback(text);
    const [cmdRaw, ...restParts] = text.split(/\s+/);
    const cmd = (cmdRaw || "help").toLowerCase();
    const rest = restParts.join(" ").trim();

    if (cmd === "help" || cmd === "commands") return commandHelp();
    if (cmd === "roll" || looksLikeRoll(text) || state.memory.quickrolls[cmd]) return "That calculation belongs to the generator, Papa. I can help with the result or reasoning instead.";
    if (["mod", "modifier"].includes(cmd)) return "Character modifiers stay in the generator, Papa.";
    if (["qroll", "quickroll"].includes(cmd)) return "That calculation belongs to the generator, Papa. I can help with the result or reasoning instead.";
    if (cmd === "delete") return commandDelete(rest);
    if (cmd === "list") return renderMemory();
    if (cmd === "npc") return generateNpc(rest);
    if (cmd === "location") return generateLocation(rest);
    if (cmd === "settlement") return generateSettlement(rest);
    if (cmd === "quest") return generateQuest(rest);
    if (cmd === "lore") return searchLore(rest);
    if (cmd === "remember") return remember(rest);
    if (cmd === "forget") return forget(rest);
    if (cmd === "task") return addTask(rest);
    if (cmd === "done") return doneTask(rest);
    if (["remove", "rm"].includes(cmd)) return removeTask(rest);
    if (cmd === "remind") return addReminder(rest);
    if (cmd === "poll") return makePoll(rest);
    if (cmd === "prompt") return promptIdea(rest);
    if (cmd === "scan") return scanPage();
    if (cmd === "export") return exportMemory(true);
    if (cmd === "import") { state.importer.classList.remove("onyx-hidden"); return "Paste the exported JSON below. I shall not lick it. Probably."; }
    if (cmd === "prefix") return setPrefix(rest);
    if (cmd === "food" || cmd === "treat") return food(rest);
    if (cmd === "status" || cmd === "ping") return `Here, Papa. Current portrait: <strong>${escapeHtml(imageController?.mood || 'listening')}</strong>. Mode: <strong>${modeLabel()}</strong>. Dialogue entries: ${dialogue?.entries?.length || 0}.`;
    if (cmd === "clear") { state.body.innerHTML = ""; return "I have swept the chat off the counter."; }
    return fallback(text);
  }

  function commandHelp() {
    const rows = (DATA.commandHelp || []).map(([cmd, desc]) => `<tr><td><code>${escapeHtml(state.memory.prefix + cmd)}</code></td><td>${escapeHtml(desc)}</td></tr>`).join("");
    return `<h4>Emperor Onyx Commands</h4><p>${grumble()} I am a helper bot for your world forge: local tasks, reminders, polls, lore search, and generators.</p><table><tbody>${rows}</tbody></table>`;
  }

  function looksLikeRoll(text) {
    return /(^|\s)\d*d\d+/i.test(text) || /\badv\b|\bdis\b/i.test(text);
  }

  function commandRoll(input) {
    try {
      const result = rollExpression(resolveQuickroll(input));
      return `<h4>Dice Results</h4>${result.html}<div class="onyx-muted">${grumble()} Dice obey me because they know better.</div>`;
    } catch (err) {
      return `<span class="onyx-danger">Dice problem:</span> ${escapeHtml(err.message)}. Try <code>${state.memory.prefix}roll d20+5 adv</code>.`;
    }
  }

  function resolveQuickroll(input) {
    let expr = (input || "d20").trim();
    const [first, ...parts] = expr.split(/(?=[+\-])/);
    const key = first.trim().toLowerCase();
    if (state.memory.quickrolls[key]) expr = state.memory.quickrolls[key] + parts.join("");
    return expr;
  }

  function rollExpression(input) {
    let expr = input.replace(/\.adv\b/gi, " adv").replace(/\.dis\b/gi, " dis");
    const targetMatch = expr.match(/(>=|<=|>|<|=)\s*(-?\d+)\s*$/);
    let target = null;
    if (targetMatch) {
      target = { op: targetMatch[1], value: Number(targetMatch[2]) };
      expr = expr.slice(0, targetMatch.index).trim();
    }
    const adv = /\badv\b/i.test(expr);
    const dis = /\bdis\b/i.test(expr);
    expr = expr.replace(/\badv\b|\bdis\b/gi, "").trim();
    if (adv || dis) expr = expr.replace(/(^|[^\d])d20\b/i, "$11d20");

    const tokens = tokenizeDice(expr);
    let total = 0;
    const details = [];
    for (const token of tokens) {
      let sign = token.sign === "-" ? -1 : 1;
      const value = token.value;
      if (/^\d*d\d+/i.test(value)) {
        const rolled = rollDiceToken(value, adv, dis);
        total += sign * rolled.total;
        details.push(`${sign < 0 ? "-" : "+"} ${escapeHtml(value)} {${rolled.rolls.join(", ")}} = ${sign * rolled.total}`);
      } else if (/^[a-z_][\w-]*$/i.test(value)) {
        const mod = Number(state.memory.modifiers[value.toLowerCase()] ?? 0);
        total += sign * mod;
        details.push(`${sign < 0 ? "-" : "+"} ${escapeHtml(value)} {${mod}}`);
      } else if (/^-?\d+$/.test(value)) {
        const n = Number(value);
        total += sign * n;
        details.push(`${sign < 0 ? "-" : "+"} ${Math.abs(n)}`);
      } else {
        throw new Error(`Unknown token ${value}`);
      }
    }
    let verdict = "";
    if (target) {
      const ok = compare(total, target.op, target.value);
      verdict = `<div class="${ok ? "onyx-success" : "onyx-danger"}">${ok ? "Success" : "Failure"}: ${total} ${escapeHtml(target.op)} ${target.value}</div>`;
    }
    return { total, html: `<div class="onyx-card"><div class="onyx-card-title">${escapeHtml(input)} = ✨ ${total} ✨</div><div>${details.join("<br>").replace(/^\+ /, "")}</div>${verdict}</div>` };
  }

  function tokenizeDice(expr) {
    if (!expr) throw new Error("No dice expression given");
    const normalized = expr.replace(/\s+/g, "").replace(/(^|[+\-])d(\d+)/gi, "$11d$2");
    const matches = normalized.match(/[+\-]?[^+\-]+/g) || [];
    return matches.map(m => ({ sign: m[0] === "-" ? "-" : "+", value: m.replace(/^[+\-]/, "").toLowerCase() }));
  }

  function rollDiceToken(token, adv, dis) {
    const match = token.match(/^(\d*)d(\d+)(?::(dl|dh|rr|min|c)(\d+))?/i);
    if (!match) throw new Error(`Bad dice token ${token}`);
    const count = Math.min(Number(match[1] || 1), 200);
    const sides = Math.min(Number(match[2]), 10000);
    const special = match[3];
    const specialN = Number(match[4] || 0);
    let rolls = [];
    if ((adv || dis) && sides === 20 && count === 1) {
      const a = randomInt(1, 20), b = randomInt(1, 20);
      const picked = adv && !dis ? Math.max(a, b) : dis && !adv ? Math.min(a, b) : a;
      rolls = [a, b, `kept ${picked}`];
      return { total: picked, rolls };
    }
    for (let i = 0; i < count; i++) {
      let r = randomInt(1, sides);
      if (special === "rr" && r < specialN) r = randomInt(1, sides);
      if (special === "min" && r < specialN) r = specialN;
      rolls.push(r);
    }
    let kept = [...rolls];
    if (special === "dl") kept = dropLowest(kept, specialN);
    if (special === "dh") kept = dropHighest(kept, specialN);
    return { total: kept.reduce((a, b) => a + Number(b), 0), rolls: rolls.map(String) };
  }

  function dropLowest(arr, n) { return [...arr].sort((a,b)=>a-b).slice(n); }
  function dropHighest(arr, n) { return [...arr].sort((a,b)=>b-a).slice(n); }
  function randomInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
  function compare(a, op, b) { return op === ">=" ? a >= b : op === "<=" ? a <= b : op === ">" ? a > b : op === "<" ? a < b : a === b; }

  function commandModifier(rest) {
    const [key, value] = parseAssignment(rest);
    if (!key) return "Use <code>mod wis=4</code>. Cats respect clear notation.";
    if (value === "") { delete state.memory.modifiers[key]; return `Modifier <code>${escapeHtml(key)}</code> deleted. Vanished like dignity near a laser pointer.`; }
    const n = Number(value);
    if (!Number.isFinite(n)) return "Modifier value must be a number. I cannot roll vibes, regrettably.";
    state.memory.modifiers[key] = n;
    return `Modifier saved: <code>${escapeHtml(key)} = ${n}</code>.`;
  }

  function commandQuickroll(rest) {
    const [key, value] = parseAssignment(rest);
    if (!key || !value) return "Use <code>qroll perception=d20+wis+level</code>.";
    state.memory.quickrolls[key] = value;
    return `Quickroll saved: <code>${escapeHtml(key)} = ${escapeHtml(value)}</code>.`;
  }

  function commandDelete(rest) {
    const key = rest.trim().toLowerCase();
    if (!key) return "Delete what, exactly? A quickroll? A modifier? A chair? Be specific.";
    const had = key in state.memory.modifiers || key in state.memory.quickrolls;
    delete state.memory.modifiers[key];
    delete state.memory.quickrolls[key];
    return had ? `Deleted <code>${escapeHtml(key)}</code>.` : `I found no <code>${escapeHtml(key)}</code>. It has escaped judgment.`;
  }

  function parseAssignment(rest) {
    const idx = rest.indexOf("=");
    if (idx === -1) return [rest.trim().toLowerCase(), ""];
    return [rest.slice(0, idx).trim().toLowerCase(), rest.slice(idx + 1).trim()];
  }

  function renderMemory() {
    const mods = Object.entries(state.memory.modifiers).map(([k,v]) => `<tr><td>${escapeHtml(k)}</td><td>${escapeHtml(String(v))}</td></tr>`).join("") || `<tr><td colspan="2">None</td></tr>`;
    const rolls = Object.entries(state.memory.quickrolls).map(([k,v]) => `<tr><td>${escapeHtml(k)}</td><td>${escapeHtml(v)}</td></tr>`).join("") || `<tr><td colspan="2">None</td></tr>`;
    const tasks = state.memory.tasks.map((t,i) => `<tr><td>${i+1}</td><td>${t.done ? "✅" : "⬜"}</td><td>${escapeHtml(t.text)}</td></tr>`).join("") || `<tr><td colspan="3">None</td></tr>`;
    const lore = Object.entries(state.memory.lore).map(([k,v]) => `<tr><td>${escapeHtml(k)}</td><td>${escapeHtml(v.slice(0, 140))}${v.length > 140 ? "…" : ""}</td></tr>`).join("") || `<tr><td colspan="2">No saved lore snippets yet.</td></tr>`;
    return `<h4>Onyx Memory</h4>
      <div class="onyx-card"><div class="onyx-card-title">Tasks</div><table>${tasks}</table></div>
      <div class="onyx-card"><div class="onyx-card-title">Lore Snippets</div><table>${lore}</table></div>`;
  }

  function generateNpc(notes = "") {
    const seed = normalizeSeed(notes);
    const name = makeName();
    const faction = pick(DATA.loreSeeds?.factions || ["merchant league"]);
    const personality = pick(DATA.loreSeeds?.personalities || ["suspicious"]);
    const location = pick(DATA.loreSeeds?.locationTypes || ["tavern"]);
    const hook = notes || `linked to the ${faction}`;
    const sample=window.BelavadosForgeCore.assignPopulation("Village",1,String(Date.now()))[0]; const species=window.BelavadosForgeCore.canon.people[Math.floor(Math.random()*window.BelavadosForgeCore.canon.people.length)].name;
    return `<h4>NPC: ${name}</h4><table><tr><th>Species</th><td>${species}</td></tr><tr><th>Identity and pronouns</th><td>${sample.identity} · ${sample.pronounSet.name}</td></tr>
      <tr><th>Role</th><td>${titleCase(seed || location)} specialist, ${faction}</td></tr>
      <tr><th>Personality</th><td>${personality}; behaves polite until someone tracks mud across the floor.</td></tr>
      <tr><th>Public Use</th><td>Can provide goods, services, rumors, schedule clues, and faction introductions.</td></tr>
      <tr><th>Secret</th><td>They are hiding a ledger, relic, or message tied to: ${escapeHtml(hook)}.</td></tr>
      <tr><th>Schedule</th><td>${window.BelavadosForgeCore.calendar.weekdays.map(day=>day+": work at "+location+"; visit community").join("; ")}</td></tr>
      <tr><th>Onyx Note</th><td>${pick(DATA.loreSeeds?.cattyAdvice || ["Add a rumor."])}</td></tr>
    </table>`;
  }

  function generateLocation(notes = "") {
    const type = normalizeSeed(notes) || pick(DATA.loreSeeds?.locationTypes || ["tavern"]);
    const faction = pick(DATA.loreSeeds?.factions || ["merchant league"]);
    const name = `${pick(["Brass", "Velvet", "Black", "Gilded", "Moonlit", "Cinder", "Iron", "Sable"])} ${titleCase(type)}`;
    return `<h4>Location: ${name}</h4><table>
      <tr><th>Type</th><td>${titleCase(type)}</td></tr>
      <tr><th>Services</th><td>Goods and services, rumor exchange, faction contact, job board, safe/unsafe rest depending on danger level.</td></tr>
      <tr><th>Staff</th><td>${makeName()} manages the front; ${makeName()} knows the back-room truth.</td></tr>
      <tr><th>Faction Tie</th><td>${titleCase(faction)}</td></tr>
      <tr><th>Map Pin</th><td>Auto-categorize as ${pinCategory(type)}; highlight in directory and settlement map.</td></tr>
      <tr><th>Complication</th><td>A shipment, guest, ledger, shrine, or locked room has become everyone’s problem.</td></tr>
    </table>`;
  }

  function generateSettlement(notes = "") {
    const biome = pick(DATA.loreSeeds?.biomes || ["coastal river"]);
    const transport = settlementTransit(biome);
    const factionA = pick(DATA.loreSeeds?.factions || []);
    const factionB = pick(DATA.loreSeeds?.factions || []);
    return `<h4>Settlement Skeleton</h4><table>
      <tr><th>Concept</th><td>${escapeHtml(notes || "DM-defined settlement")}</td></tr>
      <tr><th>Biome</th><td>${titleCase(biome)}</td></tr>
      <tr><th>Core Factions</th><td>${titleCase(factionA)} vs. ${titleCase(factionB)}</td></tr>
      <tr><th>Transit</th><td>${transport.join(", ")}</td></tr>
      <tr><th>Required Locations</th><td>Government office, market, inn/tavern, healer/apothecary, temple/shrine, guard station, transit depot, residential cluster, worksite, quest hot spot.</td></tr>
      <tr><th>Quest Engine</th><td>Every faction gets public goal, private goal, reputation rewards, enemy faction reaction, and rumor trail.</td></tr>
      <tr><th>Onyx Complaint</th><td>Needs more fishmongers. This is not negotiable.</td></tr>
    </table>`;
  }

  function generateQuest(notes = "") {
    const faction = pick(DATA.loreSeeds?.factions || ["merchant league"]);
    const giver = makeName();
    return `<h4>Faction Quest</h4><table>
      <tr><th>Faction</th><td>${titleCase(faction)}</td></tr>
      <tr><th>Quest Giver</th><td>${giver}</td></tr>
      <tr><th>Hook</th><td>${escapeHtml(notes || "A public service request hides a private faction problem.")}</td></tr>
      <tr><th>Objective</th><td>Investigate a location, speak with 2–3 NPCs, recover evidence or goods, then choose who receives the truth.</td></tr>
      <tr><th>Moral Complication</th><td>The official solution helps order but harms someone vulnerable; the unofficial solution helps people but angers a faction.</td></tr>
      <tr><th>Rewards</th><td>Coin, access to restricted services, faction reputation, discounted transit, or a map-pin unlock.</td></tr>
      <tr><th>Failure State</th><td>Faction rival gains influence; prices or guard presence change in the settlement.</td></tr>
    </table>`;
  }

  function normalizeSeed(notes) {
    return (notes || "").split(/[,.|;]/)[0].trim().toLowerCase();
  }

  function makeName() {
    const a = ["Avar", "Vel", "Morn", "Thessa", "Brann", "Sable", "Ira", "Nox", "Eld", "Korr", "Luma", "Vey"];
    const b = ["wick", "thorn", "vane", "mere", "ross", "cairn", "dusk", "vale", "sorn", "mar", "lyre", "brook"];
    return pick(a) + pick(b);
  }

  function pinCategory(type) {
    const t = type.toLowerCase();
    if (/train|caravan|ferry|port|terminal|skyship|submarine|portal/.test(t)) return "Transportation";
    if (/temple|shrine|cathedral/.test(t)) return "Religious";
    if (/apothecary|healer|hospital/.test(t)) return "Medical";
    if (/market|merchant|bazaar|shop/.test(t)) return "Commercial";
    if (/tavern|inn|hostel/.test(t)) return "Hospitality";
    if (/library|academy|school|university/.test(t)) return "Education";
    if (/blacksmith|foundry|workshop/.test(t)) return "Industry & Crafting";
    if (/guard|barracks|court|hall/.test(t)) return "Government & Civic";
    return "Special / General";
  }

  function settlementTransit(biome) {
    const base = ["Train Station", "Caravan Station"];
    if (/coastal|ocean|reef|river|beach/.test(biome)) base.push("Ferry Terminal", "Steamship Port");
    if (/underwater/.test(biome)) base.push("Submarine Terminal");
    if (/floating|treetop|mountain/.test(biome)) base.push("Skyship Port");
    return base;
  }

  function searchLore(term) {
    const q = term.toLowerCase().trim();
    if (!q) return "Give me a keyword. I cannot sniff the entire archive at once.";
    const results = Object.entries(state.memory.lore).filter(([k,v]) => (k + " " + v).toLowerCase().includes(q));
    if (!results.length) return `No local lore matched <code>${escapeHtml(term)}</code>. Import or remember lore first. Hmph.`;
    return `<h4>Lore Results</h4>${results.slice(0, 8).map(([k,v]) => `<div class="onyx-card"><div class="onyx-card-title">${escapeHtml(k)}</div>${escapeHtml(v)}</div>`).join("")}`;
  }

  function remember(rest) {
    const idx = rest.indexOf(":");
    if (idx === -1) return "Use <code>remember key: text</code>. I require labels, unlike certain chaotic bipeds.";
    const key = rest.slice(0, idx).trim().toLowerCase();
    const value = rest.slice(idx + 1).trim();
    if (!key || !value) return "Both key and text are required.";
    state.memory.lore[key] = value;
    return `Remembered <code>${escapeHtml(key)}</code> locally in this browser.`;
  }

  function forget(rest) {
    const key = rest.trim().toLowerCase();
    if (state.memory.lore[key]) { delete state.memory.lore[key]; return `Forgot <code>${escapeHtml(key)}</code>. Into the void with it.`; }
    return `No lore key named <code>${escapeHtml(key)}</code>.`;
  }

  function addTask(text) {
    if (!text) return "Task text required. I refuse to chase invisible mice.";
    state.memory.tasks.push({ text, done: false, createdAt: new Date().toISOString() });
    return `Task added #${state.memory.tasks.length}: ${escapeHtml(text)}`;
  }

  function doneTask(rest) {
    const i = Number(rest) - 1;
    if (!state.memory.tasks[i]) return "No such task. The task has hidden under the sofa.";
    state.memory.tasks[i].done = true;
    return `Marked task #${i+1} complete. Acceptable.`;
  }

  function removeTask(rest) {
    const i = Number(rest) - 1;
    if (!state.memory.tasks[i]) return "No such task.";
    const [removed] = state.memory.tasks.splice(i, 1);
    return `Removed task: ${escapeHtml(removed.text)}`;
  }

  function addReminder(rest) {
    const match = rest.match(/^(\d+)(m|h|d)\s+(.+)$/i);
    let time, text;
    if (match) {
      const amount = Number(match[1]);
      const unit = match[2].toLowerCase();
      const mult = unit === "m" ? 60000 : unit === "h" ? 3600000 : 86400000;
      time = Date.now() + amount * mult;
      text = match[3];
    } else {
      const parts = rest.split(/\s+/);
      const maybeDate = parts.slice(0, 2).join(" ");
      const date = new Date(maybeDate);
      if (Number.isNaN(date.getTime())) return "Use <code>remind 10m feed the players clues</code>, <code>remind 2h prep tavern</code>, or <code>remind 2026-06-06 18:30 session prep</code>.";
      time = date.getTime();
      text = parts.slice(2).join(" ") || "Reminder";
    }
    const reminder = { id: crypto.randomUUID?.() || String(Date.now()), time, text, done: false };
    state.memory.reminders.push(reminder);
    scheduleReminder(reminder);
    return `Reminder set for ${new Date(time).toLocaleString()}: ${escapeHtml(text)}. This works while the page is open.`;
  }

  function hydrateReminders() {
    for (const reminder of state.memory.reminders.filter(r => !r.done)) scheduleReminder(reminder);
  }

  function scheduleReminder(reminder) {
    const delay = reminder.time - Date.now();
    if (delay <= 0) return;
    if (state.timers.has(reminder.id)) clearTimeout(state.timers.get(reminder.id));
    state.timers.set(reminder.id, setTimeout(() => {
      reminder.done = true;
      saveMemory();
      if (!state.open) toggleOpen(true);
      addBot(`<h4>Reminder</h4>${escapeHtml(reminder.text)}<br><span class="onyx-muted">I have yelled. My civic duty is complete.</span>`);
    }, Math.min(delay, 2147483647)));
  }

  function makePoll(rest) {
    const parts = rest.split("|").map(s => s.trim()).filter(Boolean);
    if (parts.length < 3) return "Use <code>poll question | option 1 | option 2</code>.";
    const poll = { id: Date.now(), question: parts[0], options: parts.slice(1).map(o => ({ text: o, votes: 0 })) };
    state.memory.polls.push(poll);
    return renderPoll(poll);
  }

  function renderPoll(poll) {
    setTimeout(() => {
      const card = state.body.querySelector(`[data-poll-id="${poll.id}"]`);
      if (!card) return;
      card.querySelectorAll("button[data-option]").forEach(btn => {
        btn.addEventListener("click", () => {
          const idx = Number(btn.dataset.option);
          poll.options[idx].votes++;
          saveMemory();
          addBot(renderPoll(poll));
        });
      });
    }, 0);
    const buttons = poll.options.map((o,i) => `<button class="onyx-small-button" data-option="${i}">${escapeHtml(o.text)} (${o.votes})</button>`).join("");
    return `<div class="onyx-card" data-poll-id="${poll.id}"><div class="onyx-card-title">${escapeHtml(poll.question)}</div>${buttons}</div>`;
  }

  function promptIdea(rest) {
    const theme = rest || "dark fantasy steampunk settlement";
    const biome = pick(DATA.loreSeeds?.biomes || ["deep cavern"]);
    return `<h4>Prompt Idea</h4><div class="onyx-card">${escapeHtml(theme)}, ${biome}, painterly dark fantasy, readable landmark silhouettes, visitable buildings, practical map-pin spaces, moody brass lighting, layered districts, cinematic atmosphere, no modern cars, no airplanes.</div>`;
  }

  function scanPage() {
    if (!isDmMode()) return "DM scan is locked. Add <code>#dm-editor</code> to the URL. I guard the cupboards.";
    const headings = [...document.querySelectorAll("h1,h2,h3")].slice(0, 12).map(e => e.textContent.trim()).filter(Boolean);
    const buttons = [...document.querySelectorAll("button")].slice(0, 18).map(e => e.textContent.trim() || e.getAttribute("aria-label") || "unnamed button");
    const forms = document.querySelectorAll("form, input, textarea, select").length;
    const tables = document.querySelectorAll("table").length;
    const brokenImgs = [...document.images].filter(img => img.complete && img.naturalWidth === 0).map(img => img.src).slice(0, 8);
    return `<h4>DM Page Scan</h4><table>
      <tr><th>Headings</th><td>${headings.map(escapeHtml).join("<br>") || "None found"}</td></tr>
      <tr><th>Buttons</th><td>${buttons.map(escapeHtml).join("<br>") || "None found"}</td></tr>
      <tr><th>Inputs / Forms</th><td>${forms}</td></tr>
      <tr><th>Tables</th><td>${tables}</td></tr>
      <tr><th>Broken Images</th><td>${brokenImgs.length ? brokenImgs.map(escapeHtml).join("<br>") : "None detected after load"}</td></tr>
      <tr><th>Onyx Advice</th><td>If a player page is white, check console errors, missing script paths, invalid JSON, and CSS hiding the root. Also: stop leaving syntax errors on my lawn.</td></tr>
    </table>`;
  }

  function renderDmTools() {
    if (!isDmMode()) return `<h4>DM Tools Locked</h4><p>Add <code>#dm-editor</code> to your URL to unlock page scan and DM-only helper commands.</p>`;
    return `<h4>DM Tools</h4><p>Unlocked. I am watching the gate.</p><table>
      <tr><th>Scan</th><td><code>${escapeHtml(state.memory.prefix)}scan</code> checks headings, buttons, forms, tables, and broken images.</td></tr>
      <tr><th>Export</th><td><code>${escapeHtml(state.memory.prefix)}export</code> saves Onyx memory.</td></tr>
      <tr><th>Generator Hooks</th><td>Use commands like <code>${escapeHtml(state.memory.prefix)}npc</code>, <code>${escapeHtml(state.memory.prefix)}location</code>, <code>${escapeHtml(state.memory.prefix)}quest</code>, then copy into your DM editor.</td></tr>
      <tr><th>Future Hook</th><td>Wire <code>window.EmperorOnyx.onGenerate</code> to your existing generator functions.</td></tr>
    </table>`;
  }

  function exportMemory(returnMessage = false) {
    const blob = new Blob([JSON.stringify(state.memory, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "emperor-onyx-memory.json";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    if (returnMessage) return "Exported Onyx memory JSON. Do not let it near water bowls.";
  }

  function importMemory() {
    const ta = document.getElementById("onyx-import-json");
    try {
      const incoming = JSON.parse(ta.value);
      state.memory = mergeDeep(structuredClone(defaults), incoming);
      saveMemory();
      state.importer.classList.add("onyx-hidden");
      addBot("Imported Onyx memory. I have sniffed it and found it acceptable.");
      renderTab();
    } catch (err) {
      addBot(`<span class="onyx-danger">Import failed:</span> ${escapeHtml(err.message)}`);
    }
  }

  function setPrefix(rest) {
    const prefix = rest.trim();
    if (!prefix || prefix.length > 4) return "Use a short prefix like <code>!</code>, <code>.</code>, <code>/</code>, or <code>onyx</code>.";
    state.memory.prefix = prefix;
    return `Prefix changed to <code>${escapeHtml(prefix)}</code>. I shall answer, reluctantly.`;
  }

  function food(topic='food') {
    return displayDialogue('hungry', topic) || 'Papa, I have many opinions about gravy, and I intend to share them.';
  }

  function fallback(text) {
    const lower = text.toLowerCase();
    if (lower.includes("npc")) return generateNpc(text);
    if (lower.includes("location") || lower.includes("tavern") || lower.includes("shop")) return generateLocation(text);
    if (lower.includes("settlement") || lower.includes("city") || lower.includes("village")) return generateSettlement(text);
    if (lower.includes("quest") || lower.includes("faction")) return generateQuest(text);
    // Ordinary conversation uses Onyx's 800 canonical long-form responses, not a generic help loop.
    const mood = dialogue?.classify(text) || 'listening';
    return displayDialogue(mood, text) || `${grumble()} Tell me more, Papa, and I will listen.`;
  }

  function grumble() { return pick(DATA.persona?.grumbles || ["Hmph."]); }
  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function titleCase(s) { return String(s).replace(/\w\S*/g, t => t[0].toUpperCase() + t.slice(1)); }
  function escapeHtml(value) {
    return String(value).replace(/[&<>'"]/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[ch]));
  }

  window.EmperorOnyx = {
    init, state, submit, exportMemory,
    get mood() { return imageController?.mood || 'listening'; },
    get moodImages() { return imageController?.urls || {}; },
    get dialogueStats() { return dialogue?.diagnostics() || null; },
    get imageStatus() { return imageController?.diagnostics() || null; },
    setMood: (mood, opts={}) => changeMood(mood, { source:'manual', holdMs:8000, ...opts }),
    preloadMoods: () => imageController?.preloadAll() || Promise.resolve([]),
    createPortrait: (container, size='external') => imageController?.mount(container, size),
    bindImage: img => imageController?.bindImage(img),
    subscribeMood: cb => imageController?.subscribe(cb),
    selectDialogue: (mood, topic='') => dialogueFor(mood,topic),
    destroy: () => { imageController?.destroy(); state.root?.remove(); state.root=null; }
  };
  document.addEventListener("DOMContentLoaded", () => init());
})();
