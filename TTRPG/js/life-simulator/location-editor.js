(() => {
  "use strict";

  const ui = {
    locationFilter: "all",
    selectedLocationId: "",
    initialized: false
  };

  const $ = (id) => document.getElementById(id);
  const core = () => window.LifeSimulator;
  const gen = () => window.LifeLocationGenerator;
  const state = () => core()?.state;
  const h = () => core()?.helpers || {};
  const a = () => core()?.actions || {};

  function escapeHTML(value) {
    return h().escapeHTML ? h().escapeHTML(value) : String(value ?? "").replace(/[&<>"']/g, c => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", "\"":"&quot;", "'":"&#039;" }[c]));
  }

  function slug(value) {
    return h().slug ? h().slug(value) : String(value || "item").toLowerCase().replace(/\W+/g, "_").replace(/^_+|_+$/g, "");
  }

  function ensureReady(callback) {
    const run = async () => {
      if (!gen()?.rules) await gen()?.loadRules?.();
      callback();
    };
    if (core()?.state?.data && gen()) run();
    else window.addEventListener("life_simulator:location-rules-ready", run, { once: true });
  }

  function init() {
    if (ui.initialized) return;
    ui.initialized = true;
    bindEvents();
    hydrateLocationSelectors();
    hydrateBiomeProfiles();
    hydrateEditorSelects();
    syncLocationDefaultsFromCore();
    renderAllLocationTools();
  }

  function bindEvents() {
    $("bvs-showNpcSimulatorPageBtn")?.addEventListener("click", () => switchPage("npc"));
    $("bvs-showLocationToolsPageBtn")?.addEventListener("click", () => switchPage("locations"));
    $("bvs-locationRefreshBtn")?.addEventListener("click", renderAllLocationTools);
    $("bvs-locationScopeSelect")?.addEventListener("change", () => { hydrateLocationSelectors(); updateLocationCountDefault(); renderStats(); });
    $("bvs-locationProvinceSelect")?.addEventListener("change", () => { hydrateLocationSettlementSelect(); updateLocationCountDefault(); });
    $("bvs-locationSettlementSelect")?.addEventListener("change", updateLocationCountDefault);
    $("bvs-locationSettlementTypeSelect")?.addEventListener("change", updateLocationCountDefault);
    $("bvs-locationKindSelect")?.addEventListener("change", updateLocationCountDefault);
    $("bvs-locationBiomeProfileSelect")?.addEventListener("change", () => updateRuleSummary());
    $("bvs-generateLocationsBtn")?.addEventListener("click", generateFromUI);
    $("bvs-lockUploadedNpcLocationsBtn")?.addEventListener("click", () => { gen().createLockedLocationsFromUploadedNpcs(); renderAllLocationTools(); });
    $("bvs-assignGeneratedNpcsBtn")?.addEventListener("click", () => { gen().assignGeneratedNpcsToLocations(gen().allLocations()); renderAllLocationTools(); a().warnOnce?.("Generated NPCs were auto-assigned to existing generated/editable locations."); });
    $("bvs-randomizeLocationNamesBtn")?.addEventListener("click", () => { gen().randomizeLocationNames(0.05); renderAllLocationTools(); });
    $("bvs-locationExportJsonBtn")?.addEventListener("click", () => gen().exportLocations());
    $("bvs-locationSearchInput")?.addEventListener("input", renderDirectory);
    document.querySelectorAll("[data-location-filter]").forEach(button => button.addEventListener("click", () => {
      ui.locationFilter = button.dataset.locationFilter || "all";
      document.querySelectorAll("[data-location-filter]").forEach(b => { b.classList.toggle("active", b === button); b.setAttribute("aria-selected", String(b === button)); });
      renderDirectory();
    }));
    $("bvs-locationDirectory")?.addEventListener("click", event => {
      const button = event.target.closest("[data-edit-location]");
      if (button) selectLocation(button.dataset.editLocation);
      const assignButton = event.target.closest("[data-assign-location]");
      if (assignButton) {
        const loc = findLocation(assignButton.dataset.assignLocation);
        if (loc) { gen().assignGeneratedNpcsToLocations([loc]); renderAllLocationTools(); }
      }
    });
    $("bvs-newManualLocationBtn")?.addEventListener("click", newManualLocation);
    $("bvs-locationEditorForm")?.addEventListener("submit", saveLocationFromForm);
    $("bvs-deleteLocationBtn")?.addEventListener("click", deleteSelectedLocation);
    $("bvs-expandLockedLocationBtn")?.addEventListener("click", expandSelectedLocation);
    window.addEventListener("life_simulator:locations-changed", renderAllLocationTools);
    window.addEventListener("life-simulator:core-rendered", () => { renderStats(); renderDirectory(); });
    window.addEventListener("life-simulator:ready", () => { hydrateLocationSelectors(); hydrateEditorSelects(); renderAllLocationTools(); });
  }

  function switchPage(page) {
    const npcPage = $("bvs-npcSimulatorPage");
    const locationPage = $("bvs-locationToolsPage");
    const showLocations = page === "locations";
    if (npcPage) { npcPage.hidden = showLocations; npcPage.classList.toggle("active", !showLocations); }
    if (locationPage) { locationPage.hidden = !showLocations; locationPage.classList.toggle("active", showLocations); }
    $("bvs-showNpcSimulatorPageBtn")?.classList.toggle("active", !showLocations);
    $("bvs-showLocationToolsPageBtn")?.classList.toggle("active", showLocations);
    if (showLocations) renderAllLocationTools();
  }

  function hydrateLocationSelectors() {
    const s = state();
    if (!s?.data) return;
    const provinces = h().flattenProvinces ? h().flattenProvinces() : [];
    const scopeSelect = $("bvs-locationScopeSelect");
    if (scopeSelect) scopeSelect.value = s.scope || "settlement";
    const provinceSelect = $("bvs-locationProvinceSelect");
    if (provinceSelect) {
      provinceSelect.innerHTML = provinces.map(p => `<option value="${escapeHTML(p.id)}">${escapeHTML(p.name)}</option>`).join("");
      provinceSelect.value = s.provinceId || provinces[0]?.id || "";
    }
    hydrateLocationSettlementSelect();
  }

  function hydrateLocationSettlementSelect() {
    const s = state();
    const provinceId = $("bvs-locationProvinceSelect")?.value || s?.provinceId || "";
    const settlements = h().flattenSettlements ? h().flattenSettlements().filter(set => set.provinceId === provinceId || set.province === provinceNameById(provinceId)) : [];
    const select = $("bvs-locationSettlementSelect");
    if (!select) return;
    select.innerHTML = settlements.map(set => `<option value="${escapeHTML(set.id)}">${escapeHTML(set.name)} — ${escapeHTML(set.type)}</option>`).join("");
    select.value = settlements.some(set => set.id === s?.settlementId) ? s.settlementId : settlements[0]?.id || "";
    const selected = settlements.find(set => set.id === select.value);
    if (selected) $("bvs-locationSettlementTypeSelect").value = selected.type || "Town";
  }

  function provinceNameById(id) {
    return (h().flattenProvinces ? h().flattenProvinces() : []).find(p => p.id === id)?.name || "";
  }

  function hydrateBiomeProfiles() {
    const select = $("bvs-locationBiomeProfileSelect");
    if (!select || !gen()?.rules) return;
    const profiles = gen().profilesForSelect();
    select.innerHTML = `<option value="">Auto-match settlement biome</option>` + profiles.map(profile => `<option value="${escapeHTML(profile.id)}">${escapeHTML(profile.label)}</option>`).join("");
    updateRuleSummary();
  }

  function hydrateEditorSelects() {
    const typeSelect = $("bvs-editLocationType");
    if (typeSelect && gen()?.CANONICAL_TO_SIMPLE) {
      typeSelect.innerHTML = Object.keys(gen().CANONICAL_TO_SIMPLE).map(type => `<option value="${escapeHTML(type)}">${escapeHTML(type)}</option>`).join("");
    }
    const settlementSelect = $("bvs-editLocationSettlement");
    if (settlementSelect && h().flattenSettlements) {
      settlementSelect.innerHTML = h().flattenSettlements().map(set => `<option value="${escapeHTML(set.id)}">${escapeHTML(set.name)} — ${escapeHTML(set.provinceName || set.province || "")}</option>`).join("");
    }
    hydrateGeneratedNpcAssignmentSelect();
  }

  function hydrateGeneratedNpcAssignmentSelect(selectedIds = []) {
    const select = $("bvs-editLocationNpcAssignments");
    if (!select) return;
    const npcs = (state()?.npcs || []).filter(isGeneratedNpc);
    const selected = new Set(selectedIds);
    select.innerHTML = npcs.map(npc => `<option value="${escapeHTML(npc.id)}" ${selected.has(npc.id) ? "selected" : ""}>${escapeHTML(npc.name)} — ${escapeHTML(npc.job?.title || "Generated NPC")}</option>`).join("") || `<option value="" disabled>No generated NPCs available</option>`;
  }

  function isGeneratedNpc(npc) {
    return !(npc?.source?.type === "imported" || String(npc?.id || "").startsWith("imported_npc_"));
  }

  function syncLocationDefaultsFromCore() {
    updateLocationCountDefault();
  }

  function selectedLocationSettlement() {
    const id = $("bvs-locationSettlementSelect")?.value || state()?.settlementId;
    return (h().flattenSettlements ? h().flattenSettlements() : []).find(set => set.id === id) || h().currentSettlement?.();
  }

  function updateLocationCountDefault() {
    const set = selectedLocationSettlement();
    const type = $("bvs-locationSettlementTypeSelect")?.value || set?.type || "Town";
    const kind = $("bvs-locationKindSelect")?.value || "settlement";
    const count = gen()?.getDefaultCount(type, kind === "settlement" ? type : kind) || 24;
    const input = $("bvs-locationCountInput");
    if (input) input.value = count;
    updateRuleSummary();
  }

  function updateRuleSummary() {
    const summary = $("bvs-locationRuleSummary");
    if (!summary || !gen()?.rules) return;
    const set = selectedLocationSettlement();
    const type = $("bvs-locationSettlementTypeSelect")?.value || set?.type || "Town";
    const profileId = $("bvs-locationBiomeProfileSelect")?.value || "auto";
    const kind = $("bvs-locationKindSelect")?.value || "settlement";
    summary.textContent = `Rules loaded from ${gen().rules.source || "location_generator_rules.json"}. Current target: ${kind}, ${type}, ${set?.name || "selected settlement"}; biome profile: ${profileId}.`;
  }

  function generateFromUI() {
    const created = gen().generateLocations({
      scope: $("bvs-locationScopeSelect")?.value || state()?.scope || "settlement",
      provinceId: $("bvs-locationProvinceSelect")?.value || state()?.provinceId,
      settlementId: $("bvs-locationSettlementSelect")?.value || state()?.settlementId,
      settlementType: $("bvs-locationSettlementTypeSelect")?.value || selectedLocationSettlement()?.type || "Town",
      generationKind: $("bvs-locationKindSelect")?.value || "settlement",
      biomeProfileId: $("bvs-locationBiomeProfileSelect")?.value || "",
      count: Number($("bvs-locationCountInput")?.value || 0)
    });
    if (created?.[0]) ui.selectedLocationId = created[0].id;
    renderAllLocationTools();
    if (ui.selectedLocationId) selectLocation(ui.selectedLocationId);
  }

  function renderAllLocationTools() {
    if (!gen()) return;
    hydrateBiomeProfiles();
    hydrateEditorSelects();
    renderStats();
    renderDirectory();
    if (ui.selectedLocationId && findLocation(ui.selectedLocationId)) populateEditor(findLocation(ui.selectedLocationId));
  }

  function renderStats() {
    const grid = $("bvs-locationStatsGrid");
    if (!grid || !gen()) return;
    const all = gen().allLocations();
    const generated = all.filter(loc => loc.source === "generated-location-editor" || loc.locationSystem === "expanded-location-generator" && !loc.lockedCore && !String(loc.source || "").startsWith("imported"));
    const locked = all.filter(loc => loc.lockedCore);
    const withNpc = all.filter(loc => (loc.employees || []).length || (loc.visitors || []).length);
    const settlements = new Set(all.map(loc => loc.settlementId || loc.settlementName).filter(Boolean));
    grid.innerHTML = [
      [all.length, "Locations"],
      [generated.length, "Generated / Editable"],
      [locked.length, "Locked Uploaded-NPC"],
      [withNpc.length, "With NPC Links"],
      [settlements.size, "Settlements"],
      [(state()?.npcs || []).filter(isGeneratedNpc).length, "Generated NPC Pool"]
    ].map(([num, label]) => `<div class="stat"><strong>${escapeHTML(num)}</strong><span>${escapeHTML(label)}</span></div>`).join("");
  }

  function filteredLocations() {
    const query = String($("bvs-locationSearchInput")?.value || "").toLowerCase().trim();
    let rows = gen()?.allLocations?.() || [];
    if (ui.locationFilter === "generated") rows = rows.filter(loc => !loc.lockedCore && loc.source === "generated-location-editor");
    if (ui.locationFilter === "locked") rows = rows.filter(loc => loc.lockedCore);
    if (ui.locationFilter === "imported") rows = rows.filter(loc => !loc.lockedCore && loc.source !== "generated-location-editor");
    if (query) {
      rows = rows.filter(loc => locationSearchText(loc).includes(query));
    }
    return rows.sort((a, b) => String(a.settlementName || "").localeCompare(String(b.settlementName || "")) || String(a.name || "").localeCompare(String(b.name || "")));
  }

  function locationSearchText(loc) {
    return [loc.name, loc.category, loc.locationType, loc.settlementName, loc.province, loc.description, loc.purpose, loc.ownership, ...(loc.services || []), ...(loc.tags || []), ...(loc.employees || []).map(e => `${e.name} ${e.role}`)].join(" ").toLowerCase();
  }

  function renderDirectory() {
    const wrap = $("bvs-locationDirectory");
    const summary = $("bvs-locationDirectorySummary");
    if (!wrap || !gen()) return;
    const rows = filteredLocations();
    if (summary) summary.textContent = `${rows.length} matching location${rows.length === 1 ? "" : "s"}.`;
    if (!rows.length) {
      wrap.innerHTML = `<div class="location-empty">No locations match this filter yet. Generate locations or create locked locations from uploaded NPCs.</div>`;
      return;
    }
    wrap.innerHTML = rows.map(locationCardHTML).join("");
  }

  function locationCardHTML(loc) {
    const locked = Boolean(loc.lockedCore);
    const classes = ["location-card", locked ? "locked" : "", loc.imported && !locked ? "imported" : ""].filter(Boolean).join(" ");
    const employees = (loc.employees || []).slice(0, 5).map(e => `<span class="pill">${escapeHTML(e.name || e.npcId)}${e.role ? ` — ${escapeHTML(e.role)}` : ""}</span>`).join("") || `<span class="pill">No assigned NPCs</span>`;
    const services = (loc.services || []).slice(0, 4).map(service => `<li>${escapeHTML(service)}</li>`).join("");
    return `<article class="${classes}">
      <div>
        <h3>${escapeHTML(loc.name || "Unnamed Location")}</h3>
        <p class="location-meta">${escapeHTML(loc.locationType || loc.category || "Flexible")} • ${escapeHTML(loc.settlementName || "Unknown settlement")} • ${escapeHTML(loc.biomeAssignment || "No biome")}</p>
      </div>
      <div class="location-badges">
        <span class="location-badge ${locked ? "locked" : "generated"}">${locked ? "Locked uploaded-NPC core" : "Editable"}</span>
        <span class="location-badge">${escapeHTML(loc.source || "generated")}</span>
      </div>
      <p class="muted">${escapeHTML(loc.description || loc.purpose || "No description yet.")}</p>
      <div class="mini"><b>Services / Goods</b><ul class="location-small-list">${services || `<li>None yet</li>`}</ul></div>
      <div class="location-connection-list">${employees}</div>
      <div class="pin-mini"><span class="pin-chip">Pin X: ${escapeHTML(loc.pin?.x ?? "—")}</span><span class="pin-chip">Pin Y: ${escapeHTML(loc.pin?.y ?? "—")}</span></div>
      <div class="location-card-actions">
        <button type="button" data-edit-location="${escapeHTML(loc.id)}">Edit / Expand</button>
        <button type="button" data-assign-location="${escapeHTML(loc.id)}">Assign Generated NPCs</button>
      </div>
    </article>`;
  }

  function findLocation(id) {
    return (gen()?.allLocations() || []).find(loc => loc.id === id);
  }

  function selectLocation(id) {
    const loc = findLocation(id);
    if (!loc) return;
    ui.selectedLocationId = id;
    populateEditor(loc);
    $("bvs-locationEditorForm")?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  function populateEditor(loc) {
    if (!loc) return;
    $("bvs-editingLocationId").value = loc.id || "";
    $("bvs-editLocationName").value = loc.name || "";
    $("bvs-editLocationType").value = loc.locationType || loc.category || "Other / Flexible";
    $("bvs-editLocationSettlement").value = loc.settlementId || "";
    $("bvs-editLocationBiome").value = loc.biomeAssignment || "";
    $("bvs-editLocationDescription").value = loc.description || "";
    $("bvs-editLocationPurpose").value = loc.purpose || "";
    $("bvs-editLocationOwnership").value = loc.ownership || "";
    $("bvs-editLocationHours").value = loc.hours || "";
    $("bvs-editLocationServices").value = arrayToLines(loc.services);
    $("bvs-editLocationPricing").value = loc.pricing || "";
    $("bvs-editLocationReputation").value = loc.reputation || "";
    $("bvs-editLocationHooks").value = arrayToLines(loc.storyHooks);
    $("bvs-editLocationTags").value = (loc.tags || []).join(", ");
    $("bvs-editPinX").value = loc.pin?.x ?? 50;
    $("bvs-editPinY").value = loc.pin?.y ?? 50;
    $("bvs-editPlacementRecommendations").value = arrayToLines(loc.placementRecommendations || loc.pin?.recommendations);
    $("bvs-editTerrainRequirements").value = arrayToLines(loc.terrainRequirements || loc.pin?.terrainRequirements);
    hydrateGeneratedNpcAssignmentSelect((loc.employees || []).map(e => e.npcId).filter(Boolean));
    setCoreLock(Boolean(loc.lockedCore));
  }

  function setCoreLock(locked) {
    ["bvs-editLocationName", "bvs-editLocationType", "bvs-editLocationSettlement", "bvs-editLocationBiome"].forEach(id => { if ($(id)) $(id).disabled = locked; });
    const notice = $("bvs-locationLockedNotice");
    if (notice) {
      notice.classList.toggle("hidden", !locked);
      notice.textContent = locked ? "This location was created from uploaded NPC data. Its core name, type, settlement, and biome are locked, but you can expand descriptions, services, pricing, hooks, pins, and generated-NPC assignments." : "";
    }
    if ($("bvs-deleteLocationBtn")) $("bvs-deleteLocationBtn").disabled = locked;
  }

  function arrayToLines(value) {
    return (Array.isArray(value) ? value : value ? [value] : []).map(item => typeof item === "string" ? item : JSON.stringify(item)).join("\n");
  }

  function linesToArray(value) {
    return String(value || "").split(/\r?\n/).map(line => line.trim()).filter(Boolean);
  }

  function csvToArray(value) {
    return String(value || "").split(",").map(v => v.trim()).filter(Boolean);
  }

  function saveLocationFromForm(event) {
    event.preventDefault();
    const id = $("bvs-editingLocationId").value;
    let loc = id ? findLocation(id) : null;
    const isNew = !loc;
    if (isNew) {
      loc = makeManualLocationShell();
      state().customLocations.push(loc);
      ui.selectedLocationId = loc.id;
    }
    const locked = Boolean(loc.lockedCore);
    const settlement = selectedEditorSettlement();
    if (!locked) {
      loc.name = $("bvs-editLocationName").value.trim() || loc.name || "Unnamed Location";
      loc.locationType = $("bvs-editLocationType").value || loc.locationType || "Other / Flexible";
      loc.category = loc.locationType;
      loc.settlementId = settlement?.id || loc.settlementId || "";
      loc.settlementName = settlement?.name || loc.settlementName || "";
      loc.province = settlement?.provinceName || settlement?.province || loc.province || "";
      loc.provinceId = settlement?.provinceId || loc.provinceId || "";
      loc.timeZone = settlement?.timeZone || loc.timeZone || "";
      loc.biomeAssignment = $("bvs-editLocationBiome").value.trim() || loc.biomeAssignment || "Manual";
    }
    loc.description = $("bvs-editLocationDescription").value.trim();
    loc.purpose = $("bvs-editLocationPurpose").value.trim();
    loc.ownership = $("bvs-editLocationOwnership").value.trim();
    loc.hours = $("bvs-editLocationHours").value.trim();
    loc.services = linesToArray($("bvs-editLocationServices").value);
    loc.pricing = $("bvs-editLocationPricing").value.trim();
    loc.reputation = $("bvs-editLocationReputation").value.trim();
    loc.storyHooks = linesToArray($("bvs-editLocationHooks").value);
    loc.tags = csvToArray($("bvs-editLocationTags").value);
    loc.pin = { ...(loc.pin || {}), x: Number($("bvs-editPinX").value || 50), y: Number($("bvs-editPinY").value || 50) };
    loc.placementRecommendations = linesToArray($("bvs-editPlacementRecommendations").value);
    loc.terrainRequirements = linesToArray($("bvs-editTerrainRequirements").value);
    loc.updatedAt = new Date().toISOString();
    applyNpcAssignmentsFromEditor(loc);
    a().warnOnce?.(`${loc.name} saved${locked ? " as an expanded locked location" : ""}.`);
    a().renderAll?.();
    renderAllLocationTools();
    selectLocation(loc.id);
  }

  function selectedEditorSettlement() {
    const id = $("bvs-editLocationSettlement")?.value || state()?.settlementId;
    return (h().flattenSettlements ? h().flattenSettlements() : []).find(set => set.id === id) || h().currentSettlement?.();
  }

  function makeManualLocationShell() {
    const settlement = selectedEditorSettlement();
    const name = $("bvs-editLocationName").value.trim() || "Manual Location";
    const type = $("bvs-editLocationType").value || "Other / Flexible";
    return {
      id: `manual_loc_${slug(settlement?.id || settlement?.name || "settlement")}_${slug(name)}_${Date.now().toString(36)}`,
      name,
      category: type,
      locationType: type,
      simpleCategory: gen()?.CANONICAL_TO_SIMPLE?.[type] || "flexible",
      generationKind: "manual editor",
      description: "",
      purpose: "",
      ownership: "Unassigned",
      ownerNpcId: "",
      employees: [],
      visitors: [],
      services: [],
      pricing: "",
      reputation: "",
      storyHooks: [],
      relationships: [],
      tags: [],
      biomeAssignment: "Manual",
      settlementId: settlement?.id || "",
      settlementName: settlement?.name || "",
      province: settlement?.provinceName || settlement?.province || "",
      provinceId: settlement?.provinceId || "",
      timeZone: settlement?.timeZone || "",
      hours: "",
      pin: { x: 50, y: 50, anchor: "manual" },
      placementRecommendations: [],
      terrainRequirements: [],
      source: "manual-location-editor",
      imported: false,
      lockedCore: false,
      locationSystem: "expanded-location-generator",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  function applyNpcAssignmentsFromEditor(loc) {
    const selectedIds = [...($("bvs-editLocationNpcAssignments")?.selectedOptions || [])].map(option => option.value).filter(Boolean);
    const npcs = (state()?.npcs || []).filter(npc => selectedIds.includes(npc.id) && isGeneratedNpc(npc));
    loc.employees = npcs.map(npc => ({ npcId: npc.id, name: npc.name, role: npc.job?.title || "Assigned generated NPC", assignmentSource: "manual editor" }));
    if (npcs[0]) {
      loc.ownerNpcId = loc.ownerNpcId || npcs[0].id;
      loc.ownership = loc.ownership || `${npcs[0].name} (${npcs[0].job?.title || "assigned owner"})`;
    }
    const lite = gen().locationLite(loc);
    npcs.forEach(npc => {
      if (!npc.assignedLocations) npc.assignedLocations = {};
      npc.assignedLocations.work = lite;
    });
  }

  function newManualLocation() {
    ui.selectedLocationId = "";
    $("bvs-locationEditorForm")?.reset();
    $("bvs-editingLocationId").value = "";
    hydrateEditorSelects();
    setCoreLock(false);
    const set = selectedLocationSettlement();
    if (set && $("bvs-editLocationSettlement")) $("bvs-editLocationSettlement").value = set.id;
    if ($("bvs-editLocationType")) $("bvs-editLocationType").value = "Other / Flexible";
    if ($("bvs-editLocationName")) $("bvs-editLocationName").value = "New Location";
    $("bvs-locationEditorForm")?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  function deleteSelectedLocation() {
    const id = $("bvs-editingLocationId")?.value;
    const loc = findLocation(id);
    if (!loc) return;
    if (loc.lockedCore) {
      a().warnOnce?.("Locked uploaded-NPC locations cannot be deleted from the editor.");
      return;
    }
    if (!confirm(`Delete ${loc.name}? This removes the editable location record, not the NPCs.`)) return;
    state().customLocations = (state().customLocations || []).filter(item => item.id !== id);
    (state().npcs || []).forEach(npc => {
      Object.keys(npc.assignedLocations || {}).forEach(slot => {
        if (npc.assignedLocations[slot]?.id === id) delete npc.assignedLocations[slot];
      });
    });
    ui.selectedLocationId = "";
    newManualLocation();
    a().warnOnce?.(`${loc.name} was deleted from editable locations.`);
    a().renderAll?.();
    renderAllLocationTools();
  }

  function expandSelectedLocation() {
    const loc = findLocation($("bvs-editingLocationId")?.value);
    if (!loc) return;
    const additions = ["local rumors", "expanded inventory", "NPC schedule hooks"];
    loc.services = [...new Set([...(loc.services || []), ...additions])];
    loc.storyHooks = [...new Set([...(loc.storyHooks || []), `A new connection at ${loc.name} draws generated NPCs into the location schedule.`])];
    gen().assignGeneratedNpcsToLocations([loc]);
    populateEditor(loc);
    renderAllLocationTools();
    a().warnOnce?.(`${loc.name} was expanded with goods, hooks, and generated-NPC assignments.`);
  }

  ensureReady(init);
})();
