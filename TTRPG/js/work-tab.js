(async function(){
"use strict";
const FALLBACK_BACKEND_URL = "";
const STORAGE = Object.freeze({
  state: "onyx.work.state.v1",
  messages: "onyx.work.messages.v1",
  session: "onyx.work.sessionToken.v1",
  projects: "onyx.work.projects.v1",
  catalogFiles: "onyx.work.catalogFiles.v1",
  mood: "onyx.work.mood.v1"
});
const SESSION_KEYS = [];
const MAX_LOCAL_MESSAGES = 240;
const MAX_ATTACHMENT_BYTES = 9 * 1024 * 1024;
const IDLE_SNUGGLY_MS = 3 * 60 * 1000;
const IDLE_SLEEPY_MS = 5 * 60 * 1000;
const WORK_MOODS = Object.freeze({
  listening:  { label:"Listening",  src:"assets/images/shared/legacy-static/onyx_listening.png" },
  thinking:   { label:"Thinking",   src:"assets/images/shared/legacy-static/onyx_thinking.png" },
  thoughtful: { label:"Thinking", src:"assets/images/shared/legacy-static/onyx_thinking.png" },
  judgmental: { label:"Judgmental", src:"assets/images/shared/legacy-static/onyx_judgmental.png" },
  purring:    { label:"Snuggly",    src:"assets/images/shared/legacy-static/onyx_snuggly.png" },
  snuggly:    { label:"Snuggly",    src:"assets/images/shared/legacy-static/onyx_snuggly.png" },
  sleepy:     { label:"Snuggly",    src:"assets/images/shared/legacy-static/onyx_snuggly.png" },
  hungry:     { label:"Hungry", src:"assets/images/shared/legacy-static/onyx_hungry.png" }
});
const ACTIVE_WORK_MOODS = new Set(["listening","thinking","judgmental","hungry","snuggly"]);

let brainConfig = {backendUrl:"",chatAction:"local.dialogue",historyAction:"local.history"};

const $ = (sel, root = document) => root.querySelector(sel);
const els = {
  app: $("#workApp"), serverList: $("#serverList"), serverTitle: $("#serverTitle"), serverDescription: $("#serverDescription"),
  channelSidebar: $("#channelSidebar"), channelList: $("#channelList"), channelTitle: $("#channelTitle"), channelTopic: $("#channelTopic"),
  messages: $("#messages"), viewport: $("#messageViewport"), composer: $("#composerForm"), input: $("#messageInput"), send: $("#sendButton"),
  fileInput: $("#fileInput"), attach: $("#attachButton"), attachmentTray: $("#attachmentTray"),
  webSearch: $("#webSearchToggle"), drive: $("#driveToggle"), imageModeChip: $("#imageModeChip"), imageMode: $("#imageModeToggle"), reasoning: $("#reasoningSelect"),
  addChannel: $("#addChannelButton"), newChannel: $("#newChannelButton"), renameChannel: $("#renameChannelButton"), deleteChannel: $("#deleteChannelButton"), clearChannel: $("#clearChannelButton"), exportChannel: $("#exportChannelButton"),
  settings: $("#settingsButton"), settingsDialog: $("#settingsDialog"), settingsForm: $("#settingsForm"), sessionToken: $("#sessionTokenInput"), backendUrl: $("#backendUrlInput"), settingsStatus: $("#settingsStatus"), testConnection: $("#testConnectionButton"), saveSettings: $("#saveSettingsButton"),
  statusDot: $("#brainStatusDot"), statusText: $("#brainStatusText"), toast: $("#toast"), openChannels: $("#openChannelsButton"), closeChannels: $("#closeChannelsButton"),
  onyxMoodWindow: $("#onyxIdleWindow"), onyxMoodImage: $("#onyxMoodImage"), onyxMoodLabel: $("#onyxMoodLabel"),
  catalogButton: $("#catalogButton"), catalogDrawer: $("#catalogDrawer"), closeCatalog: $("#closeCatalogButton"), catalogSearch: $("#catalogSearch"), catalogSort: $("#catalogSort"), categoryStrip: $("#categoryStrip"), projectList: $("#projectList"), projectDropzone: $("#projectDropzone"), catalogFileList: $("#catalogFileList"), newProject: $("#newProjectButton"), projectDialog: $("#projectDialog"), projectForm: $("#projectForm"), projectName: $("#projectName"), projectCategory: $("#projectCategory"), projectStatus: $("#projectStatus"), projectPriority: $("#projectPriority"), projectTags: $("#projectTags"), projectSummary: $("#projectSummary"), projectCategories: $("#projectCategories"), projectDialogTitle: $("#projectDialogTitle"), saveProject: $("#saveProjectButton"), deleteProject: $("#deleteProjectButton")
};

const WORK_DESIGN_KEYS = Object.freeze({
  panelBg:"--onyx-panel-bg", panelText:"--onyx-panel-text", panelBorder:"--onyx-panel-border", tabBg:"--onyx-tab-bg",
  headerBg:"--onyx-header-bg", surface1:"--onyx-surface-1", surface2:"--onyx-surface-2", surface3:"--onyx-surface-3",
  railBg:"--onyx-rail-bg", chatBg:"--onyx-chat-bg", userMessageBg:"--onyx-user-message-bg", onyxMessageBg:"--onyx-assistant-message-bg",
  inputBg:"--onyx-input-bg", inputText:"--onyx-input-text", buttonBg:"--onyx-button-bg", buttonText:"--onyx-button-text",
  buttonHover:"--onyx-button-hover", activeBg:"--onyx-active-bg", activeText:"--onyx-active-text", linkText:"--onyx-link-text",
  linkHover:"--onyx-link-hover", muted:"--onyx-muted", focus:"--onyx-focus", scrollTrack:"--onyx-scroll-track", scrollThumb:"--onyx-scroll-thumb"
});
function applyLinkedDesign(detail) {
  const palette = detail && typeof detail === "object" ? detail : {};
  const colorMode = palette.colorMode === "light" ? "light" : "dark";
  document.documentElement.dataset.theme = colorMode;
  document.documentElement.style.colorScheme = colorMode;
  const themeColor = document.querySelector('meta[name="theme-color"]');
  if (themeColor) themeColor.setAttribute("content", colorMode === "light" ? "#FFFFFF" : "#000000");
  let applied = false;
  for (const [key, variable] of Object.entries(WORK_DESIGN_KEYS)) {
    const value = String(palette[key] || "").trim();
    if (/^#[0-9a-f]{6}$/i.test(value)) { document.documentElement.style.setProperty(variable,value); applied = true; }
  }
  if (!applied) return;
  document.documentElement.dataset.onyxDesignLinked = "true";
  document.documentElement.dataset.onyxDesignMode = String(palette.themeMode || "auto");
  const panelBg = String(palette.panelBg || "").trim();
  if (/^#[0-9a-f]{6}$/i.test(panelBg)) {
    const r = parseInt(panelBg.slice(1,3),16), g = parseInt(panelBg.slice(3,5),16), b = parseInt(panelBg.slice(5,7),16);
    const linear = [r,g,b].map(v => { const n=v/255; return n<=.04045?n/12.92:Math.pow((n+.055)/1.055,2.4); });
    document.documentElement.style.colorScheme = linear[0]*.2126+linear[1]*.7152+linear[2]*.0722 > .45 ? "light" : "dark";
  }
}
window.addEventListener("message", event => {
  if (event.source !== window.parent) return;
  const message = event.data || {};
  if (message.source !== "belavados-onyx-parent") return;
  if (message.type === "design-palette") applyLinkedDesign(message.detail);
  if (message.type === "focus") document.getElementById("messageInput")?.focus({preventScroll:true});
});

const FALLBACK_TABS = {
  schema: "onyx.work.tabs.v1",
  tabs: [
    ["coding","Coding","</>","Programming, debugging, architecture, APIs, web apps, and implementation help."],
    ["gaming","Gaming","🎮","Game design, builds, mechanics, balancing, walkthrough thinking, and multiplayer systems."],
    ["worldbuilding","Worldbuilding","✦","Settlements, cultures, histories, inhabitants and maps."],
    ["idea-help","Idea Help","✦","Brainstorming, comparing options, expanding rough ideas, and turning fragments into plans."],
    ["image-creation","Image Creation","▣","Image generation, prompt development, composition, style direction, and visual iteration."],
    ["writing","Writing","Aa","Drafting, rewriting, editing, creative writing, tone, structure, and language help."]
  ].map(([id,label,icon,description]) => ({
    id,label,icon,description,context:`Work mode: ${label}. Preserve the user's constraints and provide practical help.`,
    suggestions:[`Help me with ${label.toLowerCase()}`,"Break this into a practical plan","Give me several distinct options","Review what I have and improve it"],
    defaultChannels:id==="worldbuilding" ? [{id:"settlements",name:"settlements",topic:"Provinces, people and places."},{id:"characters",name:"characters",topic:"NPCs and relationships."},{id:"history",name:"history",topic:"Culture and lore."}] : [{id:"general",name:"general",topic:`General ${label.toLowerCase()} help.`}]
  }))
};

let tabConfig = FALLBACK_TABS;
let state = null;
let allMessages = loadJson(STORAGE.messages, {});
let queuedFiles = [];
let sending = false;
let toastTimer = 0;
let projects = loadJson(STORAGE.projects, []);
let catalogFiles = loadJson(STORAGE.catalogFiles, []);
let selectedCategory = "all";
let editingProjectId = "";
let draggedProjectId = "";
let draggedChannelId = "";
let moodRuntime = loadJson(STORAGE.mood, { activeMood:"thinking", lastChatAt:0, reason:"startup" });
let moodInterval = 0;
let moodPreview = "";
const DEFAULT_CATEGORIES = ["Worldbuilding","Settlements","Maps","Characters","Lore","Campaign","Coding","Gaming","Idea Help","Image Creation","Writing","Research","Files","Planning","Other"];


function loadJson(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key) || "") || fallback; } catch { return fallback; }
}
function saveJson(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch (error) { console.warn("Local save failed", error); } }
function uid(prefix = "id") { return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`; }
function slugify(value) { return String(value || "").trim().toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,64) || "subtab"; }
function nowIso() { return new Date().toISOString(); }
function currentServer() { return tabConfig.tabs.find(x => x.id === state.activeServerId) || tabConfig.tabs[0]; }
function channels() { return state.channelsByServer[state.activeServerId] || []; }
function currentChannel() {
  const id = state.activeChannelByServer[state.activeServerId];
  return channels().find(x => x.id === id) || channels()[0] || null;
}
function threadKey(serverId = state.activeServerId, channelId = currentChannel()?.id) { return `${serverId}::${channelId || "general"}`; }
function threadMessages() { return allMessages[threadKey()] || []; }
function saveMessages() { saveJson(STORAGE.messages, allMessages); }
function setThreadMessages(messages) { allMessages[threadKey()] = messages.slice(-MAX_LOCAL_MESSAGES); saveMessages(); }
function persistState() { saveJson(STORAGE.state, state); }

function cleanMoodName(value) {
  const key = String(value || "").trim().toLowerCase().replace(/^onyx[_-]/,"").replace(/[\s-]+/g,"_");
  return Object.prototype.hasOwnProperty.call(WORK_MOODS,key) ? key : "";
}
function saveMoodRuntime() {
  saveJson(STORAGE.mood, {
    activeMood: cleanMoodName(moodRuntime.activeMood) || "thoughtful",
    lastChatAt: Number(moodRuntime.lastChatAt) || 0,
    reason: String(moodRuntime.reason || "").slice(0,120)
  });
}
function latestStoredChat() {
  let latest = null;
  for (const rows of Object.values(allMessages || {})) {
    if (!Array.isArray(rows)) continue;
    for (const message of rows) {
      if (!message || message.error || !["user","assistant"].includes(message.role)) continue;
      const ms = Date.parse(message.createdAt || "");
      if (!Number.isFinite(ms)) continue;
      if (!latest || ms > latest.ms) latest = { ms, message };
    }
  }
  return latest;
}
function inferWorkMood(text, role = "user") {
  const value = String(text || "").trim();
  const lower = value.toLowerCase();
  if (!value) return role === "assistant" ? "thoughtful" : "listening";

  const warm = /\b(thank(?:s| you)?|appreciate|love (?:this|that|you)|good (?:boy|kitty)|perfect|awesome|amazing|yay|nice|glad|happy|purr|snuggl|cuddl|slow blink)\b/i.test(value);
  const playful = /\b(lol|lmao|rofl|haha+|hehe+|joke|joking|funny|ridiculous|absurd|silly|goofy|chaos|menace|gremlin|criminal|offended|side[- ]?eye)\b/i.test(value) || /[😂🤣😹]/u.test(value);
  const complex = /\b(code|coding|debug|bug|fix|repair|implement|build|merge|refactor|architecture|api|backend|frontend|javascript|typescript|html|css|json|repo|github|research|analy[sz]e|compare|trace|inspect|audit|calculate|algorithm|workflow|file|archive|zip|project|sort|catalog|category|drag|drop|generate|image|design|plan|structure|why|how)\b/i.test(value);
  const nuanced = /\b(thoughts?|think about|perspective|trade[- ]?offs?|pros? and cons?|which (?:is|would)|better|option|decision|meaning|tone|feel|feels|nuance|ambiguous|maybe|possibly|depends)\b/i.test(value);

  if (warm && !complex) return "purring";
  if (playful && !complex) return "judgmental";
  if (role === "user") {
    if (complex || value.length > 700 || (value.match(/\?/g) || []).length > 1) return "thinking";
    if (nuanced) return "thoughtful";
    return "listening";
  }
  if (playful) return "judgmental";
  if (warm && value.length < 700) return "purring";
  if (complex && /\b(working|checking|analy[sz]ing|processing|searching|reviewing|inspecting)\b/i.test(value)) return "thinking";
  return "thoughtful";
}
function backendWorkMood(result) {
  const candidates = [
    result?.state,
    result?.mood,
    result?.behavior?.state,
    result?.behaviorCue?.state,
    result?.meta?.state,
    result?.meta?.mood
  ];
  for (const candidate of candidates) {
    const mood = cleanMoodName(candidate);
    if (ACTIVE_WORK_MOODS.has(mood)) return mood;
  }
  return "";
}
function markChatMood(mood, reason = "conversation") {
  const chosen = cleanMoodName(mood);
  if (!ACTIVE_WORK_MOODS.has(chosen)) return;
  moodPreview = "";
  moodRuntime.activeMood = chosen;
  moodRuntime.lastChatAt = Date.now();
  moodRuntime.reason = reason;
  saveMoodRuntime();
  renderOnyxMood();
}
function currentIdleAwareMood() {
  if (moodPreview && WORK_MOODS[moodPreview]) return moodPreview;
  if (sending) return cleanMoodName(moodRuntime.activeMood) || "thinking";
  const last = Number(moodRuntime.lastChatAt) || 0;
  if (!last) return "sleepy";
  const idleFor = Date.now() - last;
  if (idleFor >= IDLE_SLEEPY_MS) return "sleepy";
  if (idleFor >= IDLE_SNUGGLY_MS) return "snuggly";
  return cleanMoodName(moodRuntime.activeMood) || "thoughtful";
}
function renderOnyxMood() {
  if (!els.onyxMoodImage || !els.onyxMoodLabel) return;
  const mood = currentIdleAwareMood();
  const config = WORK_MOODS[mood] || WORK_MOODS.thoughtful;
  const current = els.onyxMoodImage.dataset.mood || "";
  if (current !== mood) {
    els.onyxMoodImage.dataset.pendingMood = mood;
    els.onyxMoodImage.classList.add("mood-changing");
    window.setTimeout(() => {
      if (els.onyxMoodImage.dataset.pendingMood !== mood) return;
      els.onyxMoodImage.src = config.src;
      els.onyxMoodImage.alt = `Onyx is ${config.label.toLowerCase()}`;
      els.onyxMoodImage.dataset.mood = mood;
      els.onyxMoodLabel.textContent = config.label;
      requestAnimationFrame(() => els.onyxMoodImage.classList.remove("mood-changing"));
    }, 90);
  } else {
    els.onyxMoodLabel.textContent = config.label;
  }
  if (els.onyxMoodWindow) els.onyxMoodWindow.dataset.mood = mood;
}
function seedMoodFromHistory() {
  const latest = latestStoredChat();
  if (latest && latest.ms > (Number(moodRuntime.lastChatAt) || 0)) {
    moodRuntime.lastChatAt = latest.ms;
    moodRuntime.activeMood = inferWorkMood(latest.message.content, latest.message.role);
    moodRuntime.reason = `restored-${latest.message.role}`;
    saveMoodRuntime();
  } else {
    moodRuntime.activeMood = cleanMoodName(moodRuntime.activeMood) || "thoughtful";
  }
  renderOnyxMood();
  clearInterval(moodInterval);
  moodInterval = window.setInterval(renderOnyxMood, 5000);
}
function previewMoodFromDraft() {
  const draft = String(els.input?.value || "").trim();
  if (!draft) {
    moodPreview = "";
  } else if (draft.length < 12) {
    moodPreview = "listening";
  } else {
    const inferred = inferWorkMood(draft,"user");
    moodPreview = inferred === "purring" || inferred === "judgmental" ? inferred : (inferred === "thinking" ? "thinking" : "listening");
  }
  renderOnyxMood();
}

async function loadConfig() {
  // Direct-open support: browsers commonly block fetch() from file:// pages.
  // Keep local previews functional when the JSON configuration cannot be loaded.
  if (location.protocol !== "file:") {
    try {
      const url = new URL("./json/work-tabs.json", document.baseURI);
      const response = await fetch(url, { cache: "no-store" });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const parsed = await response.json();
      if (Array.isArray(parsed?.tabs) && parsed.tabs.length) tabConfig = parsed;
    } catch (error) {
      console.info("Using embedded Work tab config fallback.", error);
    }
  }
  tabConfig.tabs = tabConfig.tabs.filter(tab => tab.id !== "household");
  tabConfig.tabs.sort((a,b) => a.id==="worldbuilding" ? -1 : b.id==="worldbuilding" ? 1 : a.label.localeCompare(b.label));
}

function createInitialState() {
  const saved = loadJson(STORAGE.state, null);
  const next = saved && saved.version === 1 ? saved : { version:1, activeServerId:tabConfig.tabs[0]?.id || "worldbuilding", activeChannelByServer:{}, channelsByServer:{} };
  for (const server of tabConfig.tabs) {
    if (!Array.isArray(next.channelsByServer[server.id]) || !next.channelsByServer[server.id].length) {
      next.channelsByServer[server.id] = (server.defaultChannels || [{id:"general",name:"general",topic:"General help."}]).map(c => ({...c,createdAt:c.createdAt || nowIso()}));
    }
    const active = next.activeChannelByServer[server.id];
    if (!next.channelsByServer[server.id].some(c => c.id === active)) next.activeChannelByServer[server.id] = next.channelsByServer[server.id][0].id;
  }
  if (!tabConfig.tabs.some(s => s.id === next.activeServerId)) next.activeServerId = tabConfig.tabs[0].id;
  return next;
}

function render() {
  renderServers();
  renderChannels();
  renderHeader();
  renderMessages();
  updateComposerMode();
}

function renderServers() {
  els.serverList.innerHTML = "";
  for (const server of tabConfig.tabs) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "server-button";
    button.setAttribute("role","tab");
    button.setAttribute("aria-selected", String(server.id === state.activeServerId));
    button.setAttribute("aria-label", server.label);
    button.title = server.label;
    const span = document.createElement("span"); span.className = "server-abbr"; span.textContent = server.icon || server.label.slice(0,2);
    button.append(span);
    button.addEventListener("click", () => { state.activeServerId = server.id; persistState(); render(); closeChannels(); });
    els.serverList.append(button);
  }
}

function renderChannels() {
  const server = currentServer();
  els.serverTitle.textContent = server.label;
  els.serverDescription.textContent = server.description || "";
  els.channelList.innerHTML = "";
  for (const channel of channels()) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `channel-item${channel.id === currentChannel()?.id ? " active" : ""}`;
    button.draggable = true; button.dataset.channelId = channel.id;
    button.innerHTML = `<span class="hash">#</span><span class="channel-name"></span><span class="channel-count"></span>`;
    $(".channel-name",button).textContent = channel.name;
    const count = (allMessages[threadKey(server.id,channel.id)] || []).length;
    $(".channel-count",button).textContent = count ? String(count) : "";
    button.addEventListener("click", () => { state.activeChannelByServer[server.id] = channel.id; persistState(); render(); closeChannels(); });
    button.addEventListener("dragstart", e => { draggedChannelId=channel.id; button.classList.add("dragging"); e.dataTransfer.effectAllowed="move"; });
    button.addEventListener("dragend", () => { draggedChannelId=""; button.classList.remove("dragging"); document.querySelectorAll(".channel-item").forEach(x=>x.classList.remove("drop-target")); });
    button.addEventListener("dragover", e => { if(draggedChannelId&&draggedChannelId!==channel.id){e.preventDefault();button.classList.add("drop-target");} });
    button.addEventListener("dragleave",()=>button.classList.remove("drop-target"));
    button.addEventListener("drop", e => { e.preventDefault(); button.classList.remove("drop-target"); reorderChannel(draggedChannelId,channel.id); });
    els.channelList.append(button);
  }
}

function renderHeader() {
  const channel = currentChannel();
  els.channelTitle.textContent = channel?.name || "general";
  els.channelTopic.textContent = channel?.topic || "Work with Onyx.";
  document.title = `#${channel?.name || "general"} · ${currentServer().label} · Onyx Work`;
}

function renderMessages() {
  const messages = threadMessages();
  els.messages.innerHTML = "";
  if (!messages.length) {
    const server = currentServer();
    const welcome = document.createElement("div");
    welcome.className = "welcome-card";
    const h = document.createElement("h2"); h.textContent = `${server.label} · #${currentChannel()?.name || "general"}`;
    const p = document.createElement("p"); p.textContent = server.description || "Start a Work conversation with Onyx.";
    const grid = document.createElement("div"); grid.className = "prompt-grid";
    for (const suggestion of (server.suggestions || []).slice(0,4)) {
      const b = document.createElement("button"); b.type = "button"; b.className = "prompt-suggestion"; b.textContent = suggestion;
      b.addEventListener("click", () => { els.input.value = suggestion; resizeComposer(); els.input.focus(); }); grid.append(b);
    }
    welcome.append(h,p,grid); els.messages.append(welcome); return;
  }
  for (const message of messages) els.messages.append(messageNode(message));
  requestAnimationFrame(() => { els.viewport.scrollTop = els.viewport.scrollHeight; wireCodeCopy(); });
}

function messageNode(message) {
  const row = document.createElement("article"); row.className = `message-row ${message.role === "assistant" ? "assistant" : "user"}`;
  const avatar = document.createElement("div"); avatar.className = "message-avatar"; avatar.textContent = message.role === "assistant" ? "O" : "YOU";
  const main = document.createElement("div"); main.className = "message-main";
  const meta = document.createElement("div"); meta.className = "message-meta";
  const author = document.createElement("span"); author.className = "message-author"; author.textContent = message.role === "assistant" ? "Onyx" : "You";
  const time = document.createElement("time"); time.className = "message-time"; time.textContent = formatTime(message.createdAt); meta.append(author,time);
  const content = document.createElement("div"); content.className = "message-content";
  if (message.error) { const e = document.createElement("div"); e.className = "message-error"; e.textContent = message.content; content.append(e); }
  else content.innerHTML = renderSafeMarkdown(message.content || "");
  if (Array.isArray(message.attachments) && message.attachments.length) {
    const tray = document.createElement("div"); tray.className = "message-attachments";
    for (const file of message.attachments) { const pill = document.createElement("span"); pill.className = "attachment-pill"; pill.textContent = `${file.name} · ${formatBytes(file.size || 0)}`; tray.append(pill); }
    content.append(tray);
  }
  if (Array.isArray(message.images) && message.images.length) content.append(imageGridNode(message.images));
  main.append(meta,content); row.append(avatar,main); return row;
}

function imageGridNode(images) {
  const grid = document.createElement("div"); grid.className = "image-grid";
  images.forEach((item,index) => {
    const card = document.createElement("figure"); card.className = "generated-image";
    const src = imageSource(item);
    if (src) { const img = document.createElement("img"); img.src = src; img.alt = item.alt || item.revisedPrompt || `Generated image ${index+1}`; img.loading = "lazy"; card.append(img); }
    const cap = document.createElement("figcaption"); cap.className = "image-caption"; cap.textContent = item.revisedPrompt || item.prompt || item.name || item.url || "Generated image artifact"; card.append(cap); grid.append(card);
  });
  return grid;
}
function imageSource(item) {
  if (!item) return ""; if (typeof item === "string") return item;
  if (item.url) return item.url; if (item.downloadUrl) return item.downloadUrl; if (item.dataUrl) return item.dataUrl;
  if (item.b64_json) return `data:image/png;base64,${item.b64_json}`; if (item.base64) return `data:${item.mimeType || "image/png"};base64,${item.base64}`; return "";
}

function renderSafeMarkdown(source) {
  const blocks = [];
  let text = String(source || "").replace(/```([\w+-]*)\n?([\s\S]*?)```/g, (_,lang,code) => {
    const token = `@@CODE${blocks.length}@@`; blocks.push({lang,code}); return token;
  });
  text = escapeHtml(text);
  text = text.replace(/^###\s+(.+)$/gm,"<h3>$1</h3>").replace(/^##\s+(.+)$/gm,"<h2>$1</h2>").replace(/^#\s+(.+)$/gm,"<h1>$1</h1>");
  text = text.replace(/\*\*(.+?)\*\*/g,"<strong>$1</strong>").replace(/`([^`]+)`/g,"<code>$1</code>");
  text = text.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,'<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
  text = text.split(/\n{2,}/).map(part => /^<h[1-3]>/.test(part) || /^@@CODE/.test(part) ? part : `<p>${part.replace(/\n/g,"<br>")}</p>`).join("");
  text = text.replace(/@@CODE(\d+)@@/g, (_,n) => {
    const block = blocks[Number(n)] || {lang:"",code:""};
    return `<div class="code-block"><div class="code-block-head"><span>${escapeHtml(block.lang || "code")}</span><button class="copy-code" type="button">Copy</button></div><pre><code>${escapeHtml(block.code.replace(/\n$/,""))}</code></pre></div>`;
  });
  return text;
}
function escapeHtml(value) { return String(value).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c])); }
function wireCodeCopy() { document.querySelectorAll(".copy-code").forEach(btn => btn.addEventListener("click", async () => { const code = btn.closest(".code-block")?.querySelector("code")?.textContent || ""; try { await navigator.clipboard.writeText(code); btn.textContent = "Copied"; setTimeout(()=>btn.textContent="Copy",1200); } catch { toast("Copy failed"); } })); }
function formatTime(iso) { try { return new Intl.DateTimeFormat(undefined,{hour:"numeric",minute:"2-digit"}).format(new Date(iso)); } catch { return ""; } }
function formatBytes(bytes) { const n = Number(bytes)||0; if (n < 1024) return `${n} B`; if (n < 1024*1024) return `${(n/1024).toFixed(1)} KB`; return `${(n/1024/1024).toFixed(1)} MB`; }

function getSessionToken(){return ''} // Local-only TTRPG; no credentials.

async function api(action,data={},timeoutMs=0){throw new Error("Action unavailable.")}

function workContext() {
  const server = currentServer(), channel = currentChannel();
  return { surface:"onyx-work-tab", lane:"work", workTab:server.id, workTabLabel:server.label, workSubtab:channel?.id || "general", workSubtabLabel:channel?.name || "general", workGuidance:server.context || "", channelTopic:channel?.topic || "", projectCatalog:projects.slice(0,40).map(p=>({id:p.id,name:p.name,category:p.category,status:p.status,priority:p.priority,tags:p.tags,summary:p.summary})) };
}
function threadId() { return `onyx-work-${state.activeServerId}-${currentChannel()?.id || "general"}`; }
function historyForBackend() { return threadMessages().slice(-22).filter(m => !m.error).map(m => ({ role:m.role, content:m.content })); }

async function sendMessage(text) {
  const clean=String(text||'').trim(); if(!clean||sending)return;
  moodPreview="";markChatMood(inferWorkMood(clean,"user"),"user-input");
  sending=true;updateSendState();renderOnyxMood();
  const files=queuedFiles.slice();const attachments=files.map(f=>({name:f.name,size:f.size,type:f.type}));
  const userMessage={id:uid('m'),role:'user',content:clean,createdAt:nowIso(),attachments};
  setThreadMessages([...threadMessages(),userMessage]);queuedFiles=[];renderAttachments();els.input.value='';resizeComposer();renderMessages();addTyping();
  try{
    const local=window.parent?.OnyxDialogue;
    const mood=local?.classify?.(clean,{activity:'work'})||inferWorkMood(clean,'user');
    const entry=local?.select?.({mood,topic:clean});
    const reply=entry?.text||'Papa, tell me which part of Belavadós you would like to build next.';
    const answer={id:uid('m'),role:'assistant',content:reply,createdAt:nowIso()};
    setThreadMessages([...threadMessages(),answer]);renderMessages();markChatMood(mood,'onyx-output');
    setBrainStatus(true,'Onyx ready');
  }finally{removeTyping();sending=false;updateSendState();renderOnyxMood()}
}

async function parseQueuedAttachmentsForMessage(messageId,prompt){return []} // No remote parsing.

// Keeps File objects only in memory while a send is in progress; local history stores metadata only.
const userMessageFilesCache = new Map();
function lastUserMessageId() { const arr = threadMessages(); for (let i=arr.length-1;i>=0;i--) if (arr[i].role === "user") return arr[i].id; return ""; }
async function readDataUrl(file) { return await new Promise((resolve,reject) => { const reader = new FileReader(); reader.onerror = () => reject(reader.error || new Error("File read failed")); reader.onload = () => resolve(String(reader.result || "")); reader.readAsDataURL(file); }); }

function addTyping() {
  removeTyping(); const row = document.createElement("div"); row.id = "typingIndicator"; row.className = "message-row assistant";
  row.innerHTML = `<div class="message-avatar">O</div><div class="message-main"><div class="typing-row"><span>Onyx is working</span><span class="typing-dots"><i></i><i></i><i></i></span></div></div>`;
  els.messages.append(row); requestAnimationFrame(() => els.viewport.scrollTop = els.viewport.scrollHeight);
}
function removeTyping() { $("#typingIndicator")?.remove(); }
function updateSendState() { els.send.disabled = sending || !els.input.value.trim(); els.input.disabled = sending; }
function resizeComposer() { els.input.style.height = "auto"; els.input.style.height = `${Math.min(180,Math.max(34,els.input.scrollHeight))}px`; updateSendState(); }
function updateComposerMode() { const image = currentServer().id === "image-creation"; els.imageModeChip.hidden = !image; els.input.placeholder = image && els.imageMode.checked ? "Describe the image you want Onyx to generate…" : "Message Onyx…"; }

function createChannel() {
  const name = prompt(`New subtab in ${currentServer().label}:`, "new-subtab"); if (name === null || !name.trim()) return;
  const base = slugify(name), used = new Set(channels().map(c => c.id)); let id = base, n = 2; while (used.has(id)) id = `${base}-${n++}`;
  const channel = { id, name:name.trim().slice(0,80), topic:"Custom Work subtab.", createdAt:nowIso() };
  state.channelsByServer[state.activeServerId].push(channel); state.activeChannelByServer[state.activeServerId] = id; persistState(); render(); els.input.focus();
}
function renameCurrentChannel() {
  const channel = currentChannel(); if (!channel) return; const name = prompt("Rename subtab:", channel.name); if (name === null || !name.trim()) return; channel.name = name.trim().slice(0,80); persistState(); render();
}
function deleteCurrentChannel() {
  const list = channels(), channel = currentChannel(); if (!channel) return;
  if (list.length <= 1) return toast("Each Work tab needs at least one subtab.");
  if (!confirm(`Delete #${channel.name}? Its local conversation will also be removed.`)) return;
  state.channelsByServer[state.activeServerId] = list.filter(c => c.id !== channel.id); delete allMessages[threadKey(state.activeServerId,channel.id)]; saveMessages(); state.activeChannelByServer[state.activeServerId] = state.channelsByServer[state.activeServerId][0].id; persistState(); render();
}
function clearCurrentChannel() { if (!threadMessages().length) return; if (!confirm(`Clear all local messages in #${currentChannel()?.name}?`)) return; setThreadMessages([]); renderMessages(); renderChannels(); }
function exportCurrentChannel() {
  const payload = { schema:"onyx.work.export.v1", exportedAt:nowIso(), server:currentServer(), channel:currentChannel(), messages:threadMessages() };
  const blob = new Blob([JSON.stringify(payload,null,2)],{type:"application/json"}); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = `onyx-work-${state.activeServerId}-${slugify(currentChannel()?.name)}.json`; a.click(); setTimeout(()=>URL.revokeObjectURL(url),1000);
}

function onFilesSelected(files) {
  for (const file of files) {
    if (file.size > MAX_ATTACHMENT_BYTES) { toast(`${file.name} is over the ${formatBytes(MAX_ATTACHMENT_BYTES)} Work attachment limit.`); continue; }
    queuedFiles.push(file);
  }
  renderAttachments();
}
function renderAttachments() {
  els.attachmentTray.innerHTML = ""; els.attachmentTray.hidden = !queuedFiles.length;
  queuedFiles.forEach((file,index) => { const chip = document.createElement("div"); chip.className = "queued-file"; const label = document.createElement("span"); label.textContent = `${file.name} · ${formatBytes(file.size)}`; const remove = document.createElement("button"); remove.type = "button"; remove.textContent = "×"; remove.setAttribute("aria-label",`Remove ${file.name}`); remove.addEventListener("click",()=>{queuedFiles.splice(index,1);renderAttachments();}); chip.append(label,remove); els.attachmentTray.append(chip); });
}


function saveProjects(){ saveJson(STORAGE.projects,projects); saveJson(STORAGE.catalogFiles,catalogFiles); }
function projectCategoryForTab(){ return currentServer()?.label || "Other"; }
function projectById(id){ return projects.find(p=>p.id===id); }
function renderCatalog(){
  if(!els.projectList)return;
  const q=(els.catalogSearch?.value||"").trim().toLowerCase(), sort=els.catalogSort?.value||"updated";
  const cats=["all",...new Set([...DEFAULT_CATEGORIES,...projects.map(p=>p.category).filter(Boolean)])];
  els.categoryStrip.innerHTML=""; cats.forEach(cat=>{const b=document.createElement("button");b.type="button";b.className="category-chip"+(selectedCategory===cat?" active":"");b.textContent=cat==="all"?"All":cat;b.onclick=()=>{selectedCategory=cat;renderCatalog()};els.categoryStrip.append(b)});
  if(els.projectCategories)els.projectCategories.innerHTML=DEFAULT_CATEGORIES.map(x=>`<option value="${escapeHtml(x)}"></option>`).join("");
  let rows=projects.filter(p=>(selectedCategory==="all"||p.category===selectedCategory)&&(!q||[p.name,p.category,p.status,p.priority,p.tags,p.summary].join(" ").toLowerCase().includes(q)));
  if(sort==="name")rows.sort((a,b)=>a.name.localeCompare(b.name)); else if(sort==="category")rows.sort((a,b)=>(a.category||"").localeCompare(b.category||"")||a.name.localeCompare(b.name)); else if(sort==="priority"){const w={Urgent:0,High:1,Normal:2,Low:3};rows.sort((a,b)=>(w[a.priority]??9)-(w[b.priority]??9));} else rows.sort((a,b)=>(b.updatedAt||"").localeCompare(a.updatedAt||""));
  els.projectList.innerHTML="";
  if(!rows.length){els.projectList.innerHTML='<div class="server-description">No projects match this catalog view.</div>'}
  rows.forEach(p=>{const card=document.createElement("article");card.className="project-card";card.draggable=true;card.dataset.projectId=p.id;const count=catalogFiles.filter(f=>f.projectId===p.id).length;card.innerHTML=`<span class="drag-handle" title="Drag to reorder">⋮⋮</span><div><div class="project-name-row"><strong></strong><span class="project-badge"></span><span class="project-badge"></span></div><div class="project-meta"></div><div class="project-summary"></div></div><div class="project-actions"><button type="button" title="Open project channel">#</button><button type="button" title="Edit project">✎</button></div>`;card.querySelector("strong").textContent=p.name;const badges=card.querySelectorAll(".project-badge");badges[0].textContent=p.category||"Other";badges[1].textContent=p.status||"Planning";card.querySelector(".project-meta").textContent=`${p.priority||"Normal"} priority · ${count} file${count===1?"":"s"}${p.tags?" · "+p.tags:""}`;card.querySelector(".project-summary").textContent=p.summary||"";const acts=card.querySelectorAll(".project-actions button");acts[0].onclick=()=>openProjectChannel(p);acts[1].onclick=()=>openProjectDialog(p.id);card.ondragstart=e=>{draggedProjectId=p.id;card.classList.add("dragging");e.dataTransfer.effectAllowed="move"};card.ondragend=()=>{draggedProjectId="";card.classList.remove("dragging")};card.ondragover=e=>{if(draggedProjectId&&draggedProjectId!==p.id){e.preventDefault();card.classList.add("drop-before")}};card.ondragleave=()=>card.classList.remove("drop-before");card.ondrop=e=>{e.preventDefault();card.classList.remove("drop-before");reorderProject(draggedProjectId,p.id)};els.projectList.append(card)});
  renderCatalogFiles();
}
function renderCatalogFiles(){ if(!els.catalogFileList)return;const p=projects[0];const rows=catalogFiles.slice().sort((a,b)=>(b.addedAt||"").localeCompare(a.addedAt||"")).slice(0,60);els.catalogFileList.innerHTML=rows.length?"":"<div class='project-meta'>Drop files into the catalog to index their metadata.</div>";rows.forEach(f=>{const r=document.createElement("div");r.className="catalog-file";const owner=projectById(f.projectId);r.innerHTML="<span></span><span></span>";r.children[0].textContent=`${f.name} · ${owner?.name||"Unassigned"}`;r.children[1].textContent=`${f.kind} · ${formatBytes(f.size)}`;els.catalogFileList.append(r)}) }
function fileKind(file){const t=(file.type||"").toLowerCase(),ext=(file.name.split(".").pop()||"").toLowerCase();if(t.startsWith("image/"))return"image";if(t.startsWith("audio/"))return"audio";if(t.startsWith("video/"))return"video";if(/^(js|ts|html|css|py|java|c|cpp|cs|php|rb|go|rs|sh)$/.test(ext))return"code";if(/^(json|xml|yaml|yml|csv|geojson)$/.test(ext))return"data";if(/^(zip|rar|7z|tar|gz)$/.test(ext))return"archive";if(/^(pdf|doc|docx|txt|md|rtf|odt)$/.test(ext))return"document";return"other"}
function catalogDroppedFiles(files){let target=projects[0];if(!target){target={id:uid("project"),name:`${currentServer().label} Project`,category:projectCategoryForTab(),status:"Active",priority:"Normal",tags:"",summary:"Created from dropped files.",createdAt:nowIso(),updatedAt:nowIso()};projects.unshift(target)}for(const f of files){catalogFiles.push({id:uid("file"),projectId:target.id,name:f.name,size:f.size,type:f.type||"",ext:(f.name.split(".").pop()||"").toLowerCase(),kind:fileKind(f),lastModified:f.lastModified||Date.now(),addedAt:nowIso()})}target.updatedAt=nowIso();saveProjects();renderCatalog();toast(`${files.length} file${files.length===1?"":"s"} cataloged in ${target.name}`)}
function openProjectDialog(id=""){editingProjectId=id;const p=projectById(id);els.projectDialogTitle.textContent=p?"Edit project":"New project";els.projectName.value=p?.name||"";els.projectCategory.value=p?.category||projectCategoryForTab();els.projectStatus.value=p?.status||"Planning";els.projectPriority.value=p?.priority||"Normal";els.projectTags.value=p?.tags||"";els.projectSummary.value=p?.summary||"";els.deleteProject.hidden=!p;els.projectDialog.showModal?.()}
function saveProjectFromDialog(){const name=els.projectName.value.trim();if(!name)return toast("Project name is required");let p=projectById(editingProjectId);if(!p){p={id:uid("project"),createdAt:nowIso()};projects.unshift(p)}Object.assign(p,{name,category:els.projectCategory.value.trim()||"Other",status:els.projectStatus.value,priority:els.projectPriority.value,tags:els.projectTags.value.trim(),summary:els.projectSummary.value.trim(),updatedAt:nowIso()});saveProjects();els.projectDialog.close?.();renderCatalog();toast("Project saved")}
function deleteProjectNow(){const p=projectById(editingProjectId);if(!p||!confirm(`Delete ${p.name}? Cataloged file metadata will be unassigned.`))return;projects=projects.filter(x=>x.id!==p.id);catalogFiles=catalogFiles.map(f=>f.projectId===p.id?{...f,projectId:""}:f);saveProjects();els.projectDialog.close?.();renderCatalog()}
function reorderProject(from,to){if(!from||!to||from===to)return;const a=projects.findIndex(p=>p.id===from),b=projects.findIndex(p=>p.id===to);if(a<0||b<0)return;const [x]=projects.splice(a,1);projects.splice(b,0,x);saveProjects();renderCatalog()}
function reorderChannel(from,to){if(!from||!to||from===to)return;const list=channels(),a=list.findIndex(c=>c.id===from),b=list.findIndex(c=>c.id===to);if(a<0||b<0)return;const[x]=list.splice(a,1);list.splice(b,0,x);persistState();renderChannels()}
function openProjectChannel(p){const serverId=tabConfig.tabs.find(t=>t.label.toLowerCase()===String(p.category||"").toLowerCase())?.id||state.activeServerId;state.activeServerId=serverId;const list=state.channelsByServer[serverId];let c=list.find(x=>x.projectId===p.id);if(!c){let id=slugify(p.name),n=2;while(list.some(x=>x.id===id))id=`${slugify(p.name)}-${n++}`;c={id,name:p.name,topic:p.summary||`Project: ${p.name}`,projectId:p.id,createdAt:nowIso()};list.push(c)}state.activeChannelByServer[serverId]=c.id;persistState();render();closeCatalog()}
function openCatalog(){closeChannels();try{if(els.settingsDialog?.open)els.settingsDialog.close()}catch(_){};if(els.projectDialog?.open)els.projectDialog.close();els.catalogDrawer.removeAttribute("inert");els.catalogDrawer.classList.add("open");els.catalogDrawer.setAttribute("aria-hidden","false");renderCatalog();requestAnimationFrame(()=>els.catalogSearch?.focus({preventScroll:true}))}
function closeCatalog(){if(!els.catalogDrawer.classList.contains("open"))return;els.catalogDrawer.classList.remove("open");els.catalogDrawer.setAttribute("aria-hidden","true");els.catalogDrawer.setAttribute("inert","");els.catalogButton?.focus({preventScroll:true})}

function openSettings(){closeCatalog();closeChannels();if(els.projectDialog?.open)els.projectDialog.close();
  els.sessionToken.value='';els.sessionToken.disabled=true;
  els.backendUrl.value='Ready';
  els.settingsStatus.textContent='Ready';
  if(typeof els.settingsDialog.showModal==='function')els.settingsDialog.showModal();else els.settingsDialog.setAttribute('open','');
}
async function testConnection(){els.settingsStatus.textContent='Ready';setBrainStatus(true,'Onyx ready')}
function saveSettings(){toast('Saved');els.settingsDialog.close?.()}
async function checkBrainStatus(){setBrainStatus(true,'Onyx ready')}

function setBrainStatus(ok,text) { els.statusDot.classList.toggle("ok",!!ok); els.statusDot.classList.toggle("bad",!ok); els.statusText.textContent = text; }
function toast(message) { clearTimeout(toastTimer); els.toast.textContent = message; els.toast.classList.add("show"); toastTimer = setTimeout(()=>els.toast.classList.remove("show"),2200); }
function openChannels() { closeCatalog();els.channelSidebar.classList.add("open"); }
function closeChannels() { els.channelSidebar.classList.remove("open"); }

function bindEvents() {
  els.composer.addEventListener("submit", async event => { event.preventDefault(); if (!els.input.value.trim() || sending) return; const text = els.input.value; await sendMessage(text); renderChannels(); });
  els.input.addEventListener("input",()=>{ resizeComposer(); previewMoodFromDraft(); });
  els.input.addEventListener("keydown",event => { if (event.key === "Enter" && !event.shiftKey && !event.isComposing) { event.preventDefault(); els.composer.requestSubmit(); } });
  els.attach.addEventListener("click",()=>els.fileInput.click()); els.fileInput.addEventListener("change",()=>{onFilesSelected([...els.fileInput.files]);els.fileInput.value="";});
  els.addChannel.addEventListener("click",createChannel); els.newChannel.addEventListener("click",createChannel); els.renameChannel.addEventListener("click",renameCurrentChannel); els.deleteChannel.addEventListener("click",deleteCurrentChannel); els.clearChannel.addEventListener("click",clearCurrentChannel); els.exportChannel.addEventListener("click",exportCurrentChannel);
  els.catalogButton?.addEventListener("click",openCatalog); els.closeCatalog?.addEventListener("click",closeCatalog); els.newProject?.addEventListener("click",()=>openProjectDialog()); els.catalogSearch?.addEventListener("input",renderCatalog); els.catalogSort?.addEventListener("change",renderCatalog); els.saveProject?.addEventListener("click",saveProjectFromDialog); els.deleteProject?.addEventListener("click",deleteProjectNow);
  if(els.projectDropzone){["dragenter","dragover"].forEach(ev=>els.projectDropzone.addEventListener(ev,e=>{e.preventDefault();els.projectDropzone.classList.add("dragover")}));["dragleave","drop"].forEach(ev=>els.projectDropzone.addEventListener(ev,e=>{e.preventDefault();els.projectDropzone.classList.remove("dragover")}));els.projectDropzone.addEventListener("drop",e=>catalogDroppedFiles([...e.dataTransfer.files]));}
  els.settings.addEventListener("click",openSettings); els.testConnection.addEventListener("click",testConnection); els.saveSettings.addEventListener("click",saveSettings);
  els.imageMode.addEventListener("change",updateComposerMode); els.openChannels.addEventListener("click",openChannels); els.closeChannels.addEventListener("click",closeChannels);
  window.addEventListener("keydown",event => { if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") { event.preventDefault(); openChannels(); } if (event.key === "Escape") { closeChannels(); closeCatalog(); } });
  // Fullscreen work can be reopened without retaining a drawer or a dialog
  // from the preceding session. Parent red X remains the only shell exit.
  window.addEventListener('message',event=>{
    if(event.source!==window.parent||event.data?.source!=='belavados-onyx-parent'||event.data.type!=='shell-visibility')return;
    closeChannels();closeCatalog();
    for(const dialog of [els.projectDialog,els.settingsDialog])if(dialog?.open){try{dialog.close()}catch(_){dialog.removeAttribute('open')}}
  });
  window.addEventListener('pagehide',()=>{closeChannels();closeCatalog();});
}

await loadConfig();
state = createInitialState();
persistState();
bindEvents();
render();
resizeComposer();
seedMoodFromHistory();
checkBrainStatus();

})().catch(error => {
  console.error("Onyx Work failed to initialize", error);
  const host = document.getElementById("serverList");
  if (host) host.innerHTML = '<div style="padding:8px;color:#ffb9c2;font:700 10px/1.4 system-ui">Work is unavailable. Reload to try again.</div>';
});
