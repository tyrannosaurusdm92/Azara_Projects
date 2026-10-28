/* Savanski Keyboard - preassigned per-key sound packs (no user remapping). */
(function (global) {
  "use strict";

  const scriptUrl = document.currentScript && document.currentScript.src;
  const inferredRoot = scriptUrl ? new URL("../", scriptUrl).href : new URL("./", document.baseURI).href;
  const storageKey = "savanski.keyboard.sound.v1";
  const volumeKey = "savanski.keyboard.volume.v1";
  const muteKey = "savanski.keyboard.muted.v2";

  const getStored = (key, fallback) => {
    try { return global.localStorage.getItem(key) ?? fallback; }
    catch (_) { return fallback; }
  };
  const putStored = (key, value) => {
    try { global.localStorage.setItem(key, String(value)); }
    catch (_) { /* Sound continues if storage is disabled. */ }
  };

  function canonicalCode(key) {
    if (key && typeof key === "object") return key.code || canonicalCode(key.key || "");
    if (typeof key !== "string") return "";
    if (/^(Key[A-Z]|Digit[0-9]|Numpad\w+|F\d+)$/.test(key)) return key;
    if (/^[a-z]$/i.test(key)) return "Key" + key.toUpperCase();
    if (/^[0-9]$/.test(key)) return "Digit" + key;
    if (key === " ") return "Space";
    const names = { "PrtSc": "PrintScreen", "Print Screen": "PrintScreen", "Esc": "Escape",
      "Spacebar": "Space", "Left": "ArrowLeft", "Right": "ArrowRight", "Up": "ArrowUp",
      "Down": "ArrowDown", "Del": "Delete", "Return": "Enter" };
    return names[key] || key;
  }

  class KeyboardAudio {
    constructor(options = {}) {
      this.baseUrl = options.baseUrl || inferredRoot;
      this.manifestUrl = options.manifestUrl || new URL("json/audio-manifest.json", this.baseUrl).href;
      this.packId = getStored(storageKey, "classic");
      this.volume = Math.max(0, Math.min(1, Number(getStored(volumeKey, "50")) / 100 || 0));
      this.muted = getStored(muteKey, "false") === "true";
      this.manifest = null;
      this.buffers = new Map();
      this.pending = new Map();
      this.context = null;
      this.root = null;
      this.controls = null;
      this.boundKeydown = (event) => {
        // On-screen keys dispatch their own sound after activation. Do not play twice
        // when a keyboard or accessibility switch activates a focused key button.
        if (event.isComposing || (event.repeat && event.code === "Unidentified") ||
            event.target?.closest?.('.sk-key, #toolbarPrintScreen')) return;
        this.playKey(event.code || event.key);
      };
      if (options.listenPhysical !== false) document.addEventListener("keydown", this.boundKeydown);
    }

    async load() {
      if (this.manifest) return this.manifest;
      if (!this.manifestRequest) {
        this.manifestRequest = fetch(this.manifestUrl)
          .then((response) => { if (!response.ok) throw new Error(`HTTP ${response.status}`); return response.json(); })
          .then((data) => {
            if (!data || !Array.isArray(data.packs)) throw new Error("Invalid sound manifest");
            this.manifest = data;
            return data;
          })
          .catch((error) => { this.manifestRequest = null; throw error; });
      }
      return this.manifestRequest;
    }

    async mount(target) {
      const root = typeof target === "string" ? document.querySelector(target) : target;
      if (!root) throw new Error("No container for keyboard sound dropdown");
      this.root = root;
      root.classList.add("savanski-audio-dropdown");
      root.innerHTML = `
        <label class="sad-label" for="sad-sound">Keyboard typing sound</label>
        <div class="sad-controls">
          <select class="sad-select" id="sad-sound" aria-label="Choose keyboard typing sound">
            <option value="off">Loading sound packs...</option>
          </select>
          <button class="sad-preview" type="button" aria-label="Preview selected keyboard sound">▶ Preview</button>
        </div>
        <label class="sad-volume-label" for="sad-volume">Volume <output id="sad-volume-output">50%</output></label>
        <input class="sad-volume" id="sad-volume" type="range" min="0" max="100" step="5" value="50" />
        <button class="sad-preview" type="button" id="sad-mute" aria-pressed="false">Mute sounds</button>
        <p class="sad-description">Select a sound theme; its individual keys already have established sound assignments, including Space, Enter, Backspace, and Print Screen. Key-to-clip remapping is not available.</p>
        <button type="button" class="sad-preview" id="sad-save-offline">Cache selected theme for offline use</button>
        <p class="sad-status" role="status" aria-live="polite">Loading sound packs...</p>`;
      const select = root.querySelector(".sad-select");
      const preview = root.querySelector(".sad-preview");
      const volume = root.querySelector(".sad-volume");
      const output = root.querySelector("output");
      this.controls = { select, preview, volume, output, status: root.querySelector(".sad-status") };
      const muteButton=root.querySelector('#sad-mute');
      const updateMute=()=>{muteButton.textContent=this.muted?'Unmute sounds':'Mute sounds';muteButton.setAttribute('aria-pressed',String(this.muted));};
      updateMute();
      muteButton.addEventListener('click',()=>{this.muted=!this.muted;putStored(muteKey,this.muted);updateMute();this.report(this.muted?'Typing sounds muted.':'Typing sounds enabled.');});
      volume.value = String(Math.round(this.volume * 100));
      output.textContent = volume.value + "%";
      select.addEventListener("change", () => this.setPack(select.value));
      volume.addEventListener("input", () => {
        this.volume = Number(volume.value) / 100;
        output.textContent = volume.value + "%";
        putStored(volumeKey, volume.value);
      });
      preview.addEventListener("click", async () => {
        if (this.packId === "off") return;
        // Direct click unlocks Web Audio; the provided key-to-clip mapping stays intact.
        this.startAudio();
        await this.playKey("KeyA");
      });
      root.querySelector('#sad-save-offline').addEventListener('click', async () => {
        const pack = this.currentPack();
        if (!pack) { this.report('Choose a sound theme first.'); return; }
        let downloaded=0, failed=0;
        for (const clip of pack.clips) {
          try { const response=await fetch(new URL(clip.file,this.baseUrl));
            if (!response.ok) throw new Error('Unavailable');
            downloaded++;
          } catch {failed++;}
        }
        this.report(`${pack.label}: ${downloaded} clips downloaded${failed?`, ${failed} unavailable`:''}. A controlling service worker caches successful sound requests for offline use.`);
      });
      try {
        const data = await this.load();
        select.replaceChildren(new Option("No typing sound (off)", "off"));
        for (const pack of data.packs) select.add(new Option(pack.label, pack.id));
        if (this.packId !== "off" && !data.packs.some(p => p.id === this.packId)) this.packId = "off";
        select.value = this.packId;
        this.report(this.packId === "off" ? "Sounds are off." : "Sound pack ready.");
        if (this.packId !== "off") this.preloadSelected();
      } catch (error) {
        select.replaceChildren(new Option("Unable to load sounds", "off"));
        this.report("Could not load sound files. Serve this folder via HTTPS or a local web server.");
        throw error;
      }
      return this;
    }

    report(message) { if (this.controls) this.controls.status.textContent = message; }
    currentPack() { return this.manifest?.packs.find(pack => pack.id === this.packId); }
    setPack(id) {
      if (id !== "off" && !this.manifest?.packs.some(pack => pack.id === id)) return false;
      this.packId = id;
      putStored(storageKey, id);
      if (this.controls) this.controls.select.value = id;
      if (id === "off") this.report("Sounds are off.");
      else {
        this.report("Selected " + this.currentPack().label + ". Preparing clips...");
        this.preloadSelected();
      }
      return true;
    }

    startAudio() {
      const AudioContext = global.AudioContext || global.webkitAudioContext;
      if (!AudioContext) { this.report("Web Audio is unavailable in this browser."); return null; }
      if (!this.context) this.context = new AudioContext();
      if (this.context.state === "suspended") this.context.resume().catch(() => {});
      return this.context;
    }

    async bufferFor(path) {
      if (this.buffers.has(path)) return this.buffers.get(path);
      if (this.pending.has(path)) return this.pending.get(path);
      const promise = (async () => {
        const result = await fetch(new URL(path, this.baseUrl));
        if (!result.ok) throw new Error("Audio HTTP " + result.status);
        const bytes = await result.arrayBuffer();
        const audio = this.startAudio();
        if (!audio) return null;
        const buffer = await audio.decodeAudioData(bytes);
        this.buffers.set(path, buffer);
        return buffer;
      })().finally(() => this.pending.delete(path));
      this.pending.set(path, promise);
      return promise;
    }

    async preloadSelected() {
      const pack = this.currentPack();
      if (!pack) return;
      // Buffer fetch/decode is delayed until audio is unlocked by a user gesture.
      const audio = this.startAudio();
      if (!audio) return;
      const unique = [...new Set(Object.values(pack.keyMap))];
      let cursor = 0;
      const loadWorker = async () => {
        while (cursor < unique.length) {
          const clip = pack.clips[unique[cursor++]];
          try { await this.bufferFor(clip.file); } catch (_) { /* Try again on keystroke. */ }
        }
      };
      await Promise.all(Array.from({ length: Math.min(6, unique.length) }, loadWorker));
      if (this.packId === pack.id) this.report(`${pack.label}: ready (${unique.length} key sounds).`);
    }

    async playKey(codeOrEvent) {
      const pack = this.currentPack();
      if (!pack || this.volume <= 0 || this.muted) return false;
      const code = canonicalCode(codeOrEvent);
      const index = pack.keyMap[code];
      if (index === undefined) return false;
      const audio = this.startAudio();
      if (!audio) return false;
      const path = pack.clips[index].file;
      try {
        const buffer = await this.bufferFor(path);
        if (!buffer || this.packId !== pack.id) return false;
        const source = audio.createBufferSource();
        const gain = audio.createGain();
        gain.gain.value = this.volume;
        source.buffer = buffer;
        source.connect(gain);
        gain.connect(audio.destination);
        source.start();
        source.onended = () => { source.disconnect(); gain.disconnect(); };
        return true;
      } catch (error) {
        this.report("Could not play " + path + ". Check the audio file paths.");
        return false;
      }
    }

    destroy() {
      document.removeEventListener("keydown", this.boundKeydown);
      if (this.context) this.context.close().catch(() => {});
      if (this.root) this.root.replaceChildren();
    }
  }

  const keyboardAudio = new KeyboardAudio();
  global.SavanskiKeyboardAudio = keyboardAudio;
  global.SavanskiAudioDropdown = KeyboardAudio;

  const autoMount = () => {
    const node = document.querySelector("[data-audio-dropdown]");
    if (node) keyboardAudio.mount(node).catch(error => console.error("Savanski audio:", error));
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", autoMount, { once: true });
  else autoMount();
})(window);
