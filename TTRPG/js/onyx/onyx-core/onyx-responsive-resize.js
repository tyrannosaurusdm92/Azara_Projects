/* Onyx module responsive resize + proportional UI scaling
   Adapted from the Savanski Art Tools eight-edge/corner ResizeObserver model.
   Scope: Onyx's normal open module only. Onyx markup, tabs, chat semantics,
   bubble dragging, fullscreen, backend, alerts, sprite loader and dependencies
   remain authoritative and unchanged.
*/
(() => {
  "use strict";

  const EDGES = ["n", "s", "e", "w", "ne", "nw", "se", "sw"];
  const SCALE_MIN = .75;
  const SCALE_MAX = 36 / 18;
  const state = new WeakMap();

  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
  const cssNumber = (value, fallback = 0) => {
    const n = parseFloat(value);
    return Number.isFinite(n) ? n : fallback;
  };
  const px = value => `${Math.round(value * 100) / 100}px`;
  const sized = (base, scale, min = 2, max = 1600) => clamp(base * scale, min, max);
  // Visible dimensions are measured after the outer profile zoom (.735).
  // CSS width/height/offsets use pre-zoom pixels, so convert when writing styles.
  const toCssPx = (panel, visualPx) => {
    const visual = panel.getBoundingClientRect().width;
    const layout = panel.offsetWidth || visual;
    return px(visualPx / Math.max(.01, visual / Math.max(1, layout)));
  };

  function setScaledVars(panel, scale) {
    const v = (name, base, min, max) => panel.style.setProperty(name, px(sized(base, scale, min, max)));

    /* Typography: mirrors Savanski's variable-driven scaling but maps to Onyx's
       existing title/chat/channel/design hierarchy rather than Savanski classes. */
    v("--onyx-rf75", 7.5, 7, 28);
    v("--onyx-rf8", 8, 7, 30);
    v("--onyx-rf85", 8.5, 7, 32);
    v("--onyx-rf9", 9, 7, 34);
    v("--onyx-rf95", 9.5, 7, 36);
    v("--onyx-rf10", 10, 8, 40);
    v("--onyx-rf105", 10.5, 8, 40);
    v("--onyx-rf11", 11, 8, 40);
    v("--onyx-rf115", 11.5, 8, 40);
    v("--onyx-rf12", 12, 9, 42);
    v("--onyx-rf13", 13, 9, 44);
    v("--onyx-rf14", 14, 10, 46);
    v("--onyx-rf15", 15, 10, 48);
    v("--onyx-rf18", 18, 11, 54);

    /* Common geometry. */
    v("--onyx-rgap2", 2, 1, 8);
    v("--onyx-rgap3", 3, 2, 9);
    v("--onyx-rgap4", 4, 2, 11);
    v("--onyx-rgap5", 5, 3, 13);
    v("--onyx-rgap6", 6, 3, 15);
    v("--onyx-rgap7", 7, 4, 17);
    v("--onyx-rgap8", 8, 4, 19);
    v("--onyx-rgap10", 10, 5, 22);
    v("--onyx-rgap12", 12, 6, 26);

    v("--onyx-rpad3", 3, 2, 9);
    v("--onyx-rpad4", 4, 2, 11);
    v("--onyx-rpad5", 5, 3, 13);
    v("--onyx-rpad6", 6, 3, 15);
    v("--onyx-rpad7", 7, 4, 17);
    v("--onyx-rpad8", 8, 4, 19);
    v("--onyx-rpad9", 9, 5, 21);
    v("--onyx-rpad10", 10, 5, 23);
    v("--onyx-rpad12", 12, 6, 27);
    v("--onyx-rpad14", 14, 7, 31);

    v("--onyx-rradius4", 4, 2, 10);
    v("--onyx-rradius6", 6, 3, 14);
    v("--onyx-rradius8", 8, 4, 18);
    v("--onyx-rradius10", 10, 5, 22);
    v("--onyx-rradius12", 12, 6, 26);

    /* Existing Onyx chrome/control dimensions. */
    v("--onyx-rtopbar-h", 38, 30, 86);
    v("--onyx-rtab-h", 32, 25, 72);
    v("--onyx-rpane-h", 36, 28, 80);
    v("--onyx-rbutton-h", 30, 24, 66);
    v("--onyx-rinput-h", 32, 26, 68);
    v("--onyx-rclose-size", 36, 28, 78);
    v("--onyx-ricon-size", 18, 11, 40);
    v("--onyx-ravatar-size", 38, 24, 84);
    v("--onyx-rhistory-icon", 32, 24, 70);
    v("--onyx-rprompt-h", 28, 23, 60);
    v("--onyx-rchannel-open-h", 34, 26, 72);
    v("--onyx-rchannel-action-w", 23, 19, 52);
    v("--onyx-rchannel-action-h", 24, 20, 54);
    v("--onyx-rworkspace-head-h", 38, 29, 84);
    v("--onyx-rchat-header-h", 44, 32, 92);
    v("--onyx-rsummary-h", 32, 25, 72);
    v("--onyx-rpreset-h", 62, 38, 138);
    v("--onyx-rtextarea-h", 88, 58, 220);
    v("--onyx-rtextarea-max-h", 260, 130, 520);
    v("--onyx-rmessages-min-h", 280, 140, 620);
    v("--onyx-rconversation-min-h", 460, 260, 980);
    v("--onyx-rworkspace-min-h", 500, 290, 1080);
    v("--onyx-rhistory-min-h", 80, 48, 180);
    v("--onyx-rscrollbar-size", 8, 6, 14);

    panel.style.setProperty("--onyx-ui-scale", String(Math.round(scale * 1000) / 1000));
  }

  function reflowResponsiveLayout(panel, scale) {
    const width = panel.clientWidth;
    const height = panel.clientHeight;
    if (!width || !height) return;

    /* Container state is based on the actual Onyx module, not the browser.
       CSS uses this to reformat controls instead of squeezing them. */
    const fit = width < 460 ? "tiny" : width < 650 ? "compact" : width < 860 ? "medium" : "wide";
    panel.dataset.onyxFit = fit;

    const scaledMin = (base, min = 60, max = 360) => sized(base, scale, min, max);

    function repeated(selector, maxCols, baseMin) {
      panel.querySelectorAll(selector).forEach(grid => {
        const w = grid.clientWidth || width;
        const gap = sized(6, scale, 3, 14);
        const wanted = Math.max(1, Math.min(maxCols,
          Math.floor((w + gap) / (scaledMin(baseMin) + gap))));
        grid.style.gridTemplateColumns = `repeat(${wanted},minmax(0,1fr))`;
      });
    }

    repeated(".onyx-care-grid", 4, fit === "tiny" ? 78 : 96);
    repeated(".onyx-chat-modes", 6, fit === "tiny" ? 72 : 82);
    repeated(".module-design-layout-grid", 3, 145);
    repeated(".module-design-presets", 3, 132);

    /* Channels use a narrow rail when there is room, then become a horizontal
       rail above chat before the conversation itself is allowed to get skinny. */
    const stackedServer = fit === "compact" || fit === "tiny";
    panel.querySelectorAll(".server-workspace-grid").forEach(grid => {
      if (stackedServer) {
        const railH = fit === "tiny"
          ? px(sized(108, scale, 86, 150))
          : px(sized(132, scale, 100, 175));
        grid.style.gridTemplateColumns = "minmax(0,1fr)";
        grid.style.gridTemplateRows = `${railH} minmax(0,1fr)`;
      } else {
        const rail = fit === "medium"
          ? px(sized(150, scale, 126, 185))
          : px(sized(178, scale, 145, 215));
        grid.style.gridTemplateColumns = `${rail} minmax(0,1fr)`;
        grid.style.gridTemplateRows = "minmax(0,1fr)";
      }
    });

    panel.querySelectorAll(".channel-sidebar").forEach(sidebar => {
      sidebar.style.borderRightWidth = stackedServer ? "0" : "2px";
      sidebar.style.borderBottomWidth = stackedServer ? "2px" : "0";
    });

    const petCompact = fit === "compact" || fit === "tiny";
    panel.querySelectorAll(".onyx-pet-dashboard").forEach(grid => {
      grid.style.gridTemplateColumns = petCompact
        ? "minmax(0,1fr)"
        : "minmax(0,1fr) minmax(180px,.72fr)";
    });

    /* Composer buttons go underneath the text box before the text box is
       squeezed. Wide/medium keeps the familiar single-row composer. */
    panel.querySelectorAll(".chat-compose").forEach(grid => {
      grid.style.gridTemplateColumns = stackedServer ? "minmax(0,1fr)" : "minmax(0,1fr) auto auto";
    });

    const designCompact = fit !== "wide";
    panel.querySelectorAll(".module-design-preset-editor").forEach(grid => {
      grid.style.gridTemplateColumns = designCompact ? "minmax(0,1fr)" : "minmax(0,1fr) auto";
    });

    panel.querySelectorAll(".module-design-row").forEach(row => {
      if (fit === "tiny") row.style.gridTemplateColumns = "minmax(0,1fr)";
      else if (designCompact) row.style.gridTemplateColumns = "minmax(0,1fr) 42px minmax(76px,88px)";
      else row.style.gridTemplateColumns = "minmax(150px,1fr) minmax(120px,180px) 42px 96px";
    });

    /* Give chat the vertical priority. If a user makes the panel short,
       surrounding page controls can scroll instead of crushing messages. */
    panel.style.setProperty("--onyx-fit-chat-floor",
      px(clamp(height * (fit === "tiny" ? 0.44 : 0.52), 180, 620)));
  }
  function captureBaseline(panel) {
    let s = state.get(panel);
    if (!s) {
      s = {};
      state.set(panel, s);
    }
    if (s.baseW && s.baseH) return true;

    const r = panel.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) return false;

    s.baseW = r.width;
    s.baseH = r.height;
    panel.dataset.onyxDefaultWidth = String(Math.round(r.width * 100) / 100);
    panel.dataset.onyxDefaultHeight = String(Math.round(r.height * 100) / 100);
    setScaledVars(panel, 1);
    requestAnimationFrame(() => reflowResponsiveLayout(panel, 1));
    return true;
  }

  function applyScale(widget, panel) {
    if (!captureBaseline(panel)) return;

    /* Fullscreen is an existing independent Onyx presentation mode. */
    if (widget.classList.contains("is-fullscreen") || widget.classList.contains("tab-fullscreen")) {
      setScaledVars(panel, 1);
      return;
    }

    const s = state.get(panel);
    const r = panel.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) return;

    const wr = r.width / s.baseW;
    const hr = r.height / s.baseH;
    const scale = clamp(Math.sqrt(Math.max(.01, wr) * Math.max(.01, hr)), SCALE_MIN, SCALE_MAX);

    setScaledVars(panel, scale);
    requestAnimationFrame(() => reflowResponsiveLayout(panel, scale));

    const detail = {
      width: r.width,
      height: r.height,
      scale,
      defaultWidth: s.baseW,
      defaultHeight: s.baseH
    };
    panel.dispatchEvent(new CustomEvent("bottomdragresize", { bubbles: true, detail }));
    panel.dispatchEvent(new CustomEvent("onyx:uiresize", { bubbles: true, detail }));
  }

  function install(widget) {
    if (!widget || widget.dataset.onyxResponsiveResizeInstalled === "true") return;

    const panel = widget.querySelector("#onyxPopout, .jump-panel");
    if (!panel) return;

    widget.dataset.onyxResponsiveResizeInstalled = "true";
    panel.classList.add("onyx-responsive-scale");

    const resizeObserver = "ResizeObserver" in window
      ? new ResizeObserver(() => applyScale(widget, panel))
      : null;
    resizeObserver?.observe(panel);

    // Remove only stale handles from this runtime.
    panel.querySelectorAll(":scope > .onyx-resize-handle").forEach(el => el.remove());

    const resetSize = () => {
      if (!captureBaseline(panel)) return;
      const s = state.get(panel);
      const wr = widget.getBoundingClientRect();
      const pr = panel.getBoundingClientRect();
      const width = Math.min(s.baseW, Math.max(220, window.innerWidth - 8));
      const height = Math.min(s.baseH, Math.max(190, window.innerHeight - 8));
      let left = clamp(pr.left, 4, Math.max(4, window.innerWidth - width - 4)) - wr.left;
      let top = clamp(pr.top, 4, Math.max(4, window.innerHeight - height - 4)) - wr.top;

      panel.classList.add("onyx-user-sized");
      panel.style.position = "absolute";
      panel.style.transform = "none";
      panel.style.right = "auto";
      panel.style.bottom = "auto";
      panel.style.left = toCssPx(panel,left);
      panel.style.top = toCssPx(panel,top);
      panel.style.width = toCssPx(panel,width);
      panel.style.height = toCssPx(panel,height);
      panel.style.maxWidth = "none";
      panel.style.maxHeight = "none";
      setScaledVars(panel, 1);
      requestAnimationFrame(() => reflowResponsiveLayout(panel, 1));
    };

    EDGES.forEach(edge => {
      const handle = document.createElement("span");
      handle.className = "onyx-resize-handle";
      handle.dataset.edge = edge;
      handle.setAttribute("role", "separator");
      handle.setAttribute("aria-label", `Resize Onyx module ${edge} edge`);
      handle.title = "Drag to resize · double-click to restore default size";
      if (edge === "n" || edge === "s") handle.setAttribute("aria-orientation", "horizontal");
      if (edge === "e" || edge === "w") handle.setAttribute("aria-orientation", "vertical");
      panel.appendChild(handle);

      handle.addEventListener("dblclick", event => {
        event.preventDefault();
        event.stopPropagation();
        resetSize();
      });

      handle.addEventListener("pointerdown", event => {
        if (event.button !== undefined && event.button !== 0) return;
        if (widget.classList.contains("is-fullscreen") || widget.classList.contains("tab-fullscreen")) return;
        if (!captureBaseline(panel)) return;

        event.preventDefault();
        event.stopPropagation();

        const panelRect = panel.getBoundingClientRect();
        const widgetRect = widget.getBoundingClientRect();
        const startLeft = panelRect.left - widgetRect.left;
        const startTop = panelRect.top - widgetRect.top;
        const startWidth = panelRect.width;
        const startHeight = panelRect.height;
        const startX = event.clientX;
        const startY = event.clientY;
        const s = state.get(panel);

        const minW = Math.min(s.baseW * SCALE_MIN, Math.max(1, window.innerWidth - 8));
        const minH = Math.min(s.baseH * SCALE_MIN, Math.max(1, window.innerHeight - 8));
        const maxW = Math.max(minW, Math.min(s.baseW * SCALE_MAX, window.innerWidth - 8));
        const maxH = Math.max(minH, Math.min(s.baseH * SCALE_MAX, window.innerHeight - 8));

        panel.classList.add("onyx-user-sized", "onyx-resizing");
        panel.style.position = "absolute";
        panel.style.transform = "none";
        panel.style.right = "auto";
        panel.style.bottom = "auto";
        panel.style.left = toCssPx(panel,startLeft);
        panel.style.top = toCssPx(panel,startTop);
        panel.style.width = toCssPx(panel,startWidth);
        panel.style.height = toCssPx(panel,startHeight);
        panel.style.maxWidth = "none";
        panel.style.maxHeight = "none";

        handle.setPointerCapture?.(event.pointerId);

        const move = ev => {
          const dx = ev.clientX - startX;
          const dy = ev.clientY - startY;

          let x = panelRect.left;
          let y = panelRect.top;
          let width = panelRect.width;
          let height = panelRect.height;

          if (edge.includes("e")) {
            width = clamp(panelRect.width + dx, minW, Math.min(maxW, Math.max(minW, window.innerWidth - panelRect.left - 4)));
          }
          if (edge.includes("s")) {
            height = clamp(panelRect.height + dy, minH, Math.min(maxH, Math.max(minH, window.innerHeight - panelRect.top - 4)));
          }
          if (edge.includes("w")) {
            const nx = clamp(panelRect.left + dx, Math.max(4, panelRect.right - maxW), panelRect.right - minW);
            width = panelRect.right - nx;
            x = nx;
          }
          if (edge.includes("n")) {
            const ny = clamp(panelRect.top + dy, Math.max(4, panelRect.bottom - maxH), panelRect.bottom - minH);
            height = panelRect.bottom - ny;
            y = ny;
          }

          if (x + width > window.innerWidth - 4) width = Math.max(minW, window.innerWidth - 4 - x);
          if (y + height > window.innerHeight - 4) height = Math.max(minH, window.innerHeight - 4 - y);

          panel.style.left = toCssPx(panel,x - widgetRect.left);
          panel.style.top = toCssPx(panel,y - widgetRect.top);
          panel.style.width = toCssPx(panel,width);
          panel.style.height = toCssPx(panel,height);

          /* ResizeObserver remains the source of truth, matching Savanski, but
             apply immediately too so text/buttons track the pointer every frame. */
          applyScale(widget, panel);
        };

        const end = () => {
          panel.classList.remove("onyx-resizing");
          handle.removeEventListener("pointermove", move);
          handle.removeEventListener("pointerup", end);
          handle.removeEventListener("pointercancel", end);
          applyScale(widget, panel);
        };

        handle.addEventListener("pointermove", move);
        handle.addEventListener("pointerup", end);
        handle.addEventListener("pointercancel", end);
      });
    });

    const keepInsideViewport = () => {
      if (!panel.classList.contains("onyx-user-sized")) return;
      if (widget.classList.contains("is-fullscreen") || widget.classList.contains("tab-fullscreen")) return;

      const wr = widget.getBoundingClientRect();
      const pr = panel.getBoundingClientRect();
      const s = state.get(panel);
      if (!s) return;

      const minW = Math.min(s.baseW * SCALE_MIN, Math.max(1, window.innerWidth - 8));
      const minH = Math.min(s.baseH * SCALE_MIN, Math.max(1, window.innerHeight - 8));
      const maxW = Math.max(minW, Math.min(s.baseW * SCALE_MAX, window.innerWidth - 8));
      const maxH = Math.max(minH, Math.min(s.baseH * SCALE_MAX, window.innerHeight - 8));

      let width = clamp(pr.width, minW, maxW);
      let height = clamp(pr.height, minH, maxH);
      let x = clamp(pr.left, 4, Math.max(4, window.innerWidth - width - 4));
      let y = clamp(pr.top, 4, Math.max(4, window.innerHeight - height - 4));

      panel.style.left = toCssPx(panel,x - wr.left);
      panel.style.top = toCssPx(panel,y - wr.top);
      panel.style.width = toCssPx(panel,width);
      panel.style.height = toCssPx(panel,height);
      panel.style.right = "auto";
      panel.style.bottom = "auto";
      panel.style.transform = "none";
      applyScale(widget, panel);
    };

    window.addEventListener("resize", keepInsideViewport, { passive: true });

    const classObserver = new MutationObserver(() => {
      if (widget.classList.contains("is-fullscreen") || widget.classList.contains("tab-fullscreen")) {
        setScaledVars(panel, 1);
      } else {
        requestAnimationFrame(() => {
          keepInsideViewport();
          applyScale(widget, panel);
        });
      }
    });
    classObserver.observe(widget, { attributes: true, attributeFilter: ["class"] });

    captureBaseline(panel);
  }

  function boot() {
    document.querySelectorAll(".onyx-round-widget").forEach(install);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }

  const rootObserver = new MutationObserver(boot);
  rootObserver.observe(document.documentElement, { childList: true, subtree: true });
})();
