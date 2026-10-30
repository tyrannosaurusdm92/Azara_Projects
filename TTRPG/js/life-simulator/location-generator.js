(() => {
  "use strict";

  const RULES_PATH = "json/location_generator_rules.json";
  let rules = null;

  const CANONICAL_TO_SIMPLE = Object.freeze({
    "Government & Civic": "civic",
    "Religious & Spiritual": "religious",
    "Medical, Alchemy & Ichor": "medical",
    "Commercial & Retail": "commercial",
    "Food, Drink & Hospitality": "hospitality",
    "Education, Archives & Lore": "education",
    "Industry & Crafting": "industry",
    "Agriculture, Animals & Food Supply": "agriculture",
    "Nature & Wilderness": "nature",
    "Maritime & Waterfront": "maritime",
    "Residential & Social Care": "residential",
    "Noble, Elite & Prestige": "noble",
    "Criminal, Vice & Underground": "criminal",
    "Transportation & Logistics": "transportation",
    "Special, Hazards & Adventure Sites": "special",
    "Other / Flexible": "flexible"
  });

  const CATEGORY_KEYWORDS = Object.freeze({
    "Government & Civic": ["hall", "court", "guard", "barracks", "permit", "registry", "civic", "customs", "command", "prison", "jail"],
    "Religious & Spiritual": ["temple", "shrine", "chapel", "cathedral", "monastery", "memorial", "necropolis", "funerary"],
    "Medical, Alchemy & Ichor": ["apothecary", "clinic", "hospital", "healer", "alchemy", "potion", "ichor", "sanitarium"],
    "Commercial & Retail": ["market", "store", "shop", "bazaar", "merchant", "exchange", "pawn", "jewelry", "supply"],
    "Food, Drink & Hospitality": ["tavern", "inn", "hotel", "hostel", "bakery", "butcher", "restaurant", "tea", "bathhouse", "common house"],
    "Education, Archives & Lore": ["school", "academy", "university", "library", "archive", "museum", "scroll", "research", "cartographer", "newspaper"],
    "Industry & Crafting": ["forge", "smith", "foundry", "workshop", "mill", "rope", "clockwork", "engine", "shipwright", "repair"],
    "Agriculture, Animals & Food Supply": ["farm", "stable", "orchard", "greenhouse", "kennel", "fishery", "kelp", "granary", "ranch", "hunting"],
    "Nature & Wilderness": ["park", "garden", "grove", "ranger", "preserve", "sanctuary", "moss", "wilderness"],
    "Maritime & Waterfront": ["harbor", "dock", "pier", "wharf", "fishing", "lighthouse", "sail", "reef", "waterfront"],
    "Residential & Social Care": ["house", "home", "residence", "apartment", "boarding", "orphanage", "poorhouse", "refugee", "housing", "tenement", "rowhouse"],
    "Noble, Elite & Prestige": ["palace", "noble", "estate", "manor", "royal", "luxury", "prestige", "grand hotel"],
    "Criminal, Vice & Underground": ["black market", "smuggler", "pirate", "gambling", "undercity", "vice", "thieves", "rebel"],
    "Transportation & Logistics": ["rail", "station", "caravan", "ferry", "steamship", "skyship", "submarine", "portal", "freight", "warehouse", "terminal", "route"],
    "Special, Hazards & Adventure Sites": ["ruin", "hazard", "haunted", "dungeon", "quest", "storm shelter", "disaster", "prison rumor", "ancient"],
    "Other / Flexible": ["plaza", "yard", "quarter", "district", "annex", "site"]
  });

  const CATEGORY_TEMPLATES = Object.freeze({
    "Government & Civic": ["Civic Ledger Hall", "Reeve House", "Permit Lantern Office", "Guard Charter Court"],
    "Religious & Spiritual": ["Lantern Shrine", "Moonlit Chapel", "Reliquary Temple", "Pilgrim Bell House"],
    "Medical, Alchemy & Ichor": ["Ichor-Licensed Apothecary", "Mercy Clinic", "Violet Phial Exchange", "Sanitarium Annex"],
    "Commercial & Retail": ["Brass Market", "Provisioners' Arcade", "Coin-and-Crate Shop", "Merchant Row"],
    "Food, Drink & Hospitality": ["Cinder Kettle Tavern", "Wayfarer's Inn", "Copper Teahouse", "Public Bathhouse"],
    "Education, Archives & Lore": ["Archive of Tide and Gear", "Lantern Library", "Cartographer's School", "Museum of Local Wonders"],
    "Industry & Crafting": ["Gearwright Workshop", "Rivet Forge", "Steam Mill", "Clockwork Repair Hall"],
    "Agriculture, Animals & Food Supply": ["Common Granary", "Glasshouse Farm", "Working Stable", "Kelp and Grain Store"],
    "Nature & Wilderness": ["Ranger Grove", "Moonmoss Garden", "Public Green", "Warden's Preserve"],
    "Maritime & Waterfront": ["Harbor Steps", "Lantern Dock", "Reefside Wharf", "Tide Bell Lighthouse"],
    "Residential & Social Care": ["Worker Rowhouses", "Boarding Court", "Refuge Hearth", "Public Housing Terrace"],
    "Noble, Elite & Prestige": ["Velvet Manor", "Noble Crescent", "Gilded Estate", "Royal Guest House"],
    "Criminal, Vice & Underground": ["Hidden Pawn Den", "Smuggler's Stair", "Red Lantern Alley", "Quiet Dice Cellar"],
    "Transportation & Logistics": ["Freight Ledger Depot", "Caravan Gate", "Rail and Rope Station", "Transit Customs Hall"],
    "Special, Hazards & Adventure Sites": ["Sealed Ruin Gate", "Storm Shelter Vault", "Haunted Pool", "Old Expedition Door"],
    "Other / Flexible": ["Open Plaza", "Flexible Civic Lot", "Maker's Annex", "Unclaimed Corner"]
  });

  function core() { return window.LifeSimulator; }
  function state() { return core()?.state; }
  function helpers() { return core()?.helpers || {}; }
  function actions() { return core()?.actions || {}; }
  function byId(id) { return document.getElementById(id); }

  function ensureStateShape() {
    const s = state();
    if (!s) return;
    if (!Array.isArray(s.customLocations)) s.customLocations = [];
    if (!s.locationGenerator) {
      s.locationGenerator = { selectedProfileId: "", lastGeneratedAt: "", lastGenerationSummary: "" };
    }
  }

  async function loadRules() {
    if (rules) return rules;
    try {
      const response = await fetch(RULES_PATH, { cache: "no-store" });
      if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
      rules = await response.json();
    } catch (err) {
      console.warn("Could not load location generator rules; using fallback rules.", err);
      rules = window.BELAVADOS_LOCATION_RULES || fallbackRules();
    }
    window.dispatchEvent(new CustomEvent("life_simulator:location-rules-ready", { detail: rules }));
    return rules;
  }

  function fallbackRules() {
    const types = Object.keys(CANONICAL_TO_SIMPLE);
    const equal = Object.fromEntries(types.map(type => [type, { "Capital City": 100 / types.length, City: 100 / types.length, Town: 100 / types.length, Village: 100 / types.length }]));
    return {
      schema: "life_simulator.locationGeneratorRules.fallback",
      generationTargets: {
        "Capital City": { defaultCount: 335, min: 327, max: 342 },
        City: { defaultCount: 244, min: 236, max: 252 },
        Town: { defaultCount: 143, min: 135, max: 151 },
        Village: { defaultCount: 65, min: 59, max: 71 },
        District: { defaultCount: 36, min: 12, max: 90 },
        "Individual building": { defaultCount: 1, min: 1, max: 1 },
        Business: { defaultCount: 1, min: 1, max: 1 },
        Landmark: { defaultCount: 1, min: 1, max: 1 },
        "Quest location": { defaultCount: 1, min: 1, max: 3 },
        Dungeon: { defaultCount: 1, min: 1, max: 4 },
        "Faction headquarters": { defaultCount: 1, min: 1, max: 2 }
      },
      canonicalTypes: Object.fromEntries(types.map(t => [t, t])),
      biomeProfiles: [{ id: "general", label: "General", terrain: "General", variant: "General", percentages: equal }]
    };
  }

  function allLocations() {
    ensureStateShape();
    return state()?.customLocations || [];
  }

  function generatedLocations() {
    return allLocations().filter(loc => loc.locationSystem === "expanded-location-generator" || loc.source === "generated-location-editor");
  }

  function protectedNpcLocations() {
    return allLocations().filter(loc => loc.lockedCore || loc.source === "uploaded-npc-location");
  }

  function getSettlementsForScope(scope, provinceId, settlementId) {
    const h = helpers();
    const provinces = h.flattenProvinces ? h.flattenProvinces() : [];
    const settlements = h.flattenSettlements ? h.flattenSettlements() : [];
    if (scope === "world") return settlements;
    if (scope === "province") return settlements.filter(s => s.provinceId === provinceId || s.province === provinces.find(p => p.id === provinceId)?.name);
    return settlements.filter(s => s.id === settlementId).slice(0, 1);
  }

  function profileForSettlement(settlement, requestedProfileId = "") {
    if (!rules?.biomeProfiles?.length) return null;
    if (requestedProfileId) {
      const requested = rules.biomeProfiles.find(p => p.id === requestedProfileId);
      if (requested) return requested;
    }
    const biomeIds = new Set((settlement?.biomes || []).map(b => String(b.id || "").toLowerCase()));
    const biomeLabels = new Set((settlement?.biomes || []).map(b => `${b.category || ""} ${b.name || ""}`.toLowerCase()));
    return rules.biomeProfiles.find(profile => biomeIds.has((profile.id || "").toLowerCase()))
      || rules.biomeProfiles.find(profile => [...biomeLabels].some(label => label.includes(String(profile.terrain || "").toLowerCase()) && label.includes(String(profile.variant || "").toLowerCase().split(" ")[0])))
      || rules.biomeProfiles[0];
  }

  function profilesForSelect() {
    return (rules?.biomeProfiles || []).map(profile => ({ id: profile.id, label: profile.label || `${profile.terrain} - ${profile.variant}` }));
  }

  function getDefaultCount(settlementType, generationKind = "settlement") {
    const kindTarget = rules?.generationTargets?.[generationKind];
    if (kindTarget) return Number(kindTarget.defaultCount || kindTarget.min || 1);
    const target = rules?.generationTargets?.[settlementType] || rules?.summary?.[settlementType];
    return Math.round(Number(target?.defaultCount || target?.averageLocations || 24));
  }

  function profilePercentages(profile, settlementType) {
    const percentages = {};
    Object.entries(profile?.percentages || {}).forEach(([type, row]) => {
      const value = Number(row?.[settlementType] ?? row?.City ?? row?.Town ?? row?.Village ?? 0);
      percentages[type] = Number.isFinite(value) ? value : 0;
    });
    if (!Object.values(percentages).some(Boolean)) {
      Object.keys(CANONICAL_TO_SIMPLE).forEach(type => { percentages[type] = 100 / Object.keys(CANONICAL_TO_SIMPLE).length; });
    }
    return percentages;
  }

  function largestRemainder(total, percentages) {
    const entries = Object.entries(percentages).filter(([, value]) => Number(value) > 0);
    const exact = entries.map(([type, value]) => ({ type, exact: total * Number(value) / 100 }));
    let assigned = 0;
    const rows = exact.map(row => {
      const floor = Math.floor(row.exact);
      assigned += floor;
      return { type: row.type, count: floor, remainder: row.exact - floor };
    });
    rows.sort((a, b) => b.remainder - a.remainder);
    let left = Math.max(0, total - assigned);
    for (let i = 0; left > 0 && rows.length; i++, left--) rows[i % rows.length].count += 1;
    return Object.fromEntries(rows.map(row => [row.type, row.count]));
  }

  function matchingPools(profile, settlementType) {
    const pools = state()?.data?.visitableLocations?.settlementTypes || [];
    const terrain = String(profile?.terrain || "").toLowerCase();
    const variant = String(profile?.variant || "").toLowerCase();
    const exact = pools.filter(pool => String(pool.size) === settlementType && String(pool.terrain).toLowerCase() === terrain && String(pool.variant).toLowerCase() === variant);
    if (exact.length) return exact;
    const sizeOnly = pools.filter(pool => String(pool.size) === settlementType);
    return sizeOnly.length ? sizeOnly : pools;
  }

  function inferCanonicalType(name, fallback = "Other / Flexible") {
    const text = String(name || "").toLowerCase();
    for (const [type, words] of Object.entries(CATEGORY_KEYWORDS)) {
      if (words.some(word => text.includes(word))) return type;
    }
    const simple = helpers().inferLocationCategory ? helpers().inferLocationCategory(name) : "";
    const found = Object.entries(CANONICAL_TO_SIMPLE).find(([, s]) => s === simple);
    return found?.[0] || fallback;
  }

  function nameFromPool(type, profile, settlementType, rng, used) {
    const pools = matchingPools(profile, settlementType);
    const allNames = [...new Set(pools.flatMap(pool => pool.locations || []))];
    const typed = allNames.filter(name => inferCanonicalType(name, type) === type && !used.has(locationNameKey(name)));
    const any = allNames.filter(name => !used.has(locationNameKey(name)));
    const chosen = helpers().pick ? helpers().pick(typed.length ? typed : any, rng) : (typed[0] || any[0]);
    if (chosen) return chosen;
    const templates = CATEGORY_TEMPLATES[type] || CATEGORY_TEMPLATES["Other / Flexible"];
    const base = templates[Math.floor(rng() * templates.length)] || "Generated Location";
    return `${base} ${Math.floor(100 + rng() * 900)}`;
  }

  function locationNameKey(name) {
    return helpers().slug ? helpers().slug(name) : String(name || "").toLowerCase().replace(/\W+/g, "_");
  }

  function generatedLocationId(settlement, name, type, seedPart = "") {
    const slug = helpers().slug || locationNameKey;
    return `locgen_${slug(settlement?.id || settlement?.name || "settlement")}_${slug(type)}_${slug(name)}${seedPart ? `_${slug(seedPart)}` : ""}`;
  }

  function makeLocationRecord({ name, type, settlement, profile, generationKind, index, source = "generated-location-editor", lockedCore = false, originNpcId = "" }) {
    const h = helpers();
    const simpleCategory = CANONICAL_TO_SIMPLE[type] || (h.inferLocationCategory ? h.inferLocationCategory(name) : "flexible");
    const placement = placementForType(type, profile, settlement);
    const now = new Date().toISOString();
    const id = source === "uploaded-npc-location"
      ? generatedLocationId(settlement, name, type, originNpcId || "uploaded")
      : generatedLocationId(settlement, name, type, `${generationKind}_${index}`);
    return {
      id,
      name,
      category: type,
      simpleCategory,
      locationType: type,
      generationKind,
      description: `${name} serves as ${String(type).toLowerCase()} for ${settlement?.name || "the settlement"}.`,
      purpose: defaultPurpose(type),
      ownership: "Unassigned",
      ownerNpcId: "",
      employees: [],
      visitors: [],
      services: servicesForType(type),
      pricing: pricingForType(type),
      reputation: "Newly indexed by the simulator.",
      storyHooks: hooksForType(type, name),
      relationships: [],
      tags: [simpleCategory, profile?.terrain, profile?.variant, settlement?.type].filter(Boolean),
      biomeAssignment: profile?.label || `${profile?.terrain || "General"} - ${profile?.variant || "General"}`,
      biomeProfileId: profile?.id || "general",
      settlementId: settlement?.id || "",
      settlementName: settlement?.name || "",
      province: settlement?.provinceName || settlement?.province || "",
      provinceId: settlement?.provinceId || "",
      timeZone: settlement?.timeZone || "",
      hours: defaultHours(type),
      pin: placement,
      placementRecommendations: placement.recommendations,
      terrainRequirements: placement.terrainRequirements,
      source,
      imported: source !== "generated-location-editor",
      lockedCore: Boolean(lockedCore),
      locationSystem: "expanded-location-generator",
      createdAt: now,
      updatedAt: now
    };
  }

  function defaultPurpose(type) {
    if (/Residential/.test(type)) return "Housing, households, and social care.";
    if (/Transportation/.test(type)) return "Route handling, freight, transit, and arrivals.";
    if (/Commercial/.test(type)) return "Trade, goods, services, and bargaining.";
    if (/Religious/.test(type)) return "Worship, counsel, ritual, and divine records.";
    if (/Medical/.test(type)) return "Healing, alchemy, medicines, and regulated ichor care.";
    if (/Industry/.test(type)) return "Crafting, repair, production, and local materials.";
    if (/Agriculture/.test(type)) return "Food supply, animals, storage, and harvest work.";
    if (/Special/.test(type)) return "Adventure hooks, dangers, mysteries, and unusual events.";
    return "Local civic, social, or economic function.";
  }

  function defaultHours(type) {
    if (/Food|Hospitality|Criminal/.test(type)) return "Late morning to late night; private hours vary.";
    if (/Transportation|Medical/.test(type)) return "Open daily with emergency or route staffing.";
    if (/Residential/.test(type)) return "Private residence access by invitation.";
    if (/Religious/.test(type)) return "Dawn services, midday counsel, evening rites.";
    return "Open during local work hours.";
  }

  function servicesForType(type) {
    const map = {
      "Government & Civic": ["permits", "legal records", "guard reports"],
      "Religious & Spiritual": ["blessings", "counsel", "ritual observance"],
      "Medical, Alchemy & Ichor": ["healing", "medicine", "regulated ichor treatment"],
      "Commercial & Retail": ["common goods", "trade orders", "special requests"],
      "Food, Drink & Hospitality": ["meals", "rooms", "local rumors"],
      "Education, Archives & Lore": ["research", "maps", "records access"],
      "Industry & Crafting": ["repairs", "custom work", "tools"],
      "Agriculture, Animals & Food Supply": ["produce", "animal care", "stored food"],
      "Nature & Wilderness": ["guidance", "rest", "natural resources"],
      "Maritime & Waterfront": ["dockage", "fishing contracts", "water routes"],
      "Residential & Social Care": ["housing", "care", "household support"],
      "Noble, Elite & Prestige": ["patronage", "private meetings", "elite hospitality"],
      "Criminal, Vice & Underground": ["rumors", "black-market favors", "hidden passage"],
      "Transportation & Logistics": ["tickets", "freight", "route ledgers"],
      "Special, Hazards & Adventure Sites": ["quest lead", "hazard warning", "restricted access"],
      "Other / Flexible": ["local use", "DM-defined service"]
    };
    return map[type] || map["Other / Flexible"];
  }

  function pricingForType(type) {
    if (/Noble|Elite/.test(type)) return "expensive or invitation-only";
    if (/Criminal/.test(type)) return "variable, risky, favor-based";
    if (/Residential|Nature/.test(type)) return "private, free, or locally managed";
    if (/Government|Religious|Medical/.test(type)) return "regulated fees, donations, or public service";
    return "standard local prices; adjust by danger, rarity, and demand";
  }

  function hooksForType(type, name) {
    if (/Criminal/.test(type)) return [`A hidden ledger at ${name} names an unexpected patron.`];
    if (/Transportation/.test(type)) return [`A route delay at ${name} strands a faction courier.`];
    if (/Medical|Ichor/.test(type)) return [`A bad batch or miracle cure at ${name} draws official attention.`];
    if (/Religious/.test(type)) return [`A rite at ${name} reveals a conflict between worship and civic law.`];
    if (/Special|Hazards/.test(type)) return [`A sealed warning at ${name} points to a larger danger.`];
    return [`A rumor spreading through ${name} connects two local NPCs.`];
  }

  function placementForType(type, profile, settlement) {
    const label = `${profile?.terrain || ""} ${profile?.variant || ""} ${(settlement?.biomes || []).map(b => b.label || b.name).join(" ")}`.toLowerCase();
    const req = [];
    const rec = [];
    const pin = { x: 50, y: 50, anchor: "center", locked: false };
    if (/Maritime|Waterfront/.test(type) || /dock|harbor|ferry|steamship|submarine/i.test(type)) {
      req.push("place on water edge, harbor, reef edge, dock, or pressure-gate access"); rec.push("near coast, river, reef shelf, submarine lock, or major water route"); pin.anchor = "water-edge"; pin.x = 18; pin.y = 62;
    } else if (/Agriculture/.test(type)) {
      req.push("requires open land, terraces, kelp beds, cavern farms, or greenhouse equivalents"); rec.push("place outside dense civic center"); pin.anchor = "outskirts"; pin.x = 78; pin.y = 70;
    } else if (/Industry/.test(type)) {
      req.push("near resource flow, workshops, mills, mines, docks, or freight access"); rec.push("place downwind/downstream or in industrial district"); pin.anchor = "industrial"; pin.x = 70; pin.y = 48;
    } else if (/Transportation/.test(type)) {
      req.push("connect to rail, caravan, ferry, steamship, skyship, submarine, portal, freight, or warehouse route"); rec.push("place at gate, terminal, port, or district edge"); pin.anchor = "route-gate"; pin.x = 35; pin.y = 82;
    } else if (/Residential/.test(type)) {
      req.push("near safe streets, household clusters, or social-care access"); rec.push("avoid dangerous wilderness unless settlement type supports it"); pin.anchor = "residential"; pin.x = 62; pin.y = 42;
    } else if (/Nature/.test(type)) {
      req.push("requires park, grove, garden, preserve, moss chamber, or managed wild edge"); rec.push("place near green or wilderness-adjacent region"); pin.anchor = "green-space"; pin.x = 24; pin.y = 32;
    } else if (/Government|Civic/.test(type)) {
      req.push("central, visible, legally accessible, or guarded"); rec.push("near square, court, market, or main road"); pin.anchor = "civic-center"; pin.x = 50; pin.y = 38;
    }
    if (/underwater|reef|ocean/.test(label)) rec.push("use pressure-safe architecture and submarine/ferry route logic");
    if (/mountain|cavern/.test(label)) rec.push("favor mines, lifts, tunnels, quarries, monasteries, and gear routes");
    if (/forest|rainforest|treetop/.test(label)) rec.push("favor ranger paths, canopy lifts, herbal routes, and groves");
    return { ...pin, terrainRequirements: req, recommendations: rec };
  }

  function upsertLocations(locations) {
    const s = state();
    ensureStateShape();
    const existing = new Map(s.customLocations.map(loc => [locationUniqueKey(loc), loc]));
    locations.forEach(loc => {
      const key = locationUniqueKey(loc);
      if (existing.has(key)) {
        const current = existing.get(key);
        if (current.lockedCore) {
          Object.assign(current, expansionOnlyMerge(current, loc), { updatedAt: new Date().toISOString() });
        } else {
          Object.assign(current, current, loc, { updatedAt: new Date().toISOString() });
        }
      } else {
        s.customLocations.push(loc);
      }
    });
  }

  function expansionOnlyMerge(current, incoming) {
    return {
      description: current.description || incoming.description,
      purpose: current.purpose || incoming.purpose,
      services: mergeArrays(current.services, incoming.services),
      pricing: current.pricing || incoming.pricing,
      reputation: current.reputation || incoming.reputation,
      storyHooks: mergeArrays(current.storyHooks, incoming.storyHooks),
      tags: mergeArrays(current.tags, incoming.tags),
      employees: mergeArrays(current.employees, incoming.employees, "npcId"),
      visitors: mergeArrays(current.visitors, incoming.visitors, "npcId"),
      relationships: mergeArrays(current.relationships, incoming.relationships)
    };
  }

  function mergeArrays(a = [], b = [], key = "") {
    const arr = [...(Array.isArray(a) ? a : [a]).filter(Boolean), ...(Array.isArray(b) ? b : [b]).filter(Boolean)];
    const seen = new Set();
    return arr.filter(item => {
      const k = key && item && typeof item === "object" ? item[key] : JSON.stringify(item);
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  }

  function locationUniqueKey(loc) {
    const slug = helpers().slug || locationNameKey;
    return `${slug(loc.settlementId || loc.settlementName || "any")}:${slug(loc.name)}:${slug(loc.locationType || loc.category || "location")}`;
  }

  function generateLocations(options = {}) {
    ensureStateShape();
    if (!rules) throw new Error("Location rules have not loaded yet.");
    const s = state();
    const rng = helpers().makeRng(`${s.seed}|locations|${Date.now()}|${JSON.stringify(options)}`);
    const scope = options.scope || s.scope || "settlement";
    const provinceId = options.provinceId || s.provinceId;
    const settlementId = options.settlementId || s.settlementId;
    const generationKind = options.generationKind || "settlement";
    const settlements = getSettlementsForScope(scope, provinceId, settlementId);
    const created = [];

    settlements.forEach(settlement => {
      const settlementType = options.settlementType || settlement.type || "Town";
      const profile = profileForSettlement(settlement, options.biomeProfileId || "");
      const total = Number(options.count || getDefaultCount(settlementType, generationKind));
      const allocation = generationKind === "settlement" || rules.generationTargets?.[generationKind]?.defaultCount > 1
        ? largestRemainder(total, profilePercentages(profile, settlementType))
        : { [kindToCanonicalType(generationKind)]: total };
      const used = new Set(allLocations().filter(loc => loc.settlementId === settlement.id).map(loc => locationNameKey(loc.name)));
      Object.entries(allocation).forEach(([type, count]) => {
        for (let i = 0; i < count; i += 1) {
          const name = nameFromPool(type, profile, settlementType, rng, used);
          used.add(locationNameKey(name));
          const record = makeLocationRecord({ name, type, settlement, profile, generationKind, index: created.length });
          if (isBiomeValid(record, profile)) created.push(record);
          else created.push(repairBiomeConflict(record, profile));
        }
      });
    });

    upsertLocations(created);
    assignGeneratedNpcsToLocations(created, rng);
    s.locationGenerator.lastGeneratedAt = new Date().toISOString();
    s.locationGenerator.lastGenerationSummary = `${created.length} locations generated for ${settlements.length} settlement${settlements.length === 1 ? "" : "s"}.`;
    actions().warnOnce?.(s.locationGenerator.lastGenerationSummary);
    actions().renderAll?.();
    window.dispatchEvent(new CustomEvent("life_simulator:locations-changed", { detail: { created } }));
    return created;
  }

  function kindToCanonicalType(kind) {
    if (kind === "Business") return "Commercial & Retail";
    if (kind === "Landmark") return "Special, Hazards & Adventure Sites";
    if (kind === "Quest location") return "Special, Hazards & Adventure Sites";
    if (kind === "Dungeon") return "Special, Hazards & Adventure Sites";
    if (kind === "Faction headquarters") return "Government & Civic";
    if (kind === "Individual building") return "Other / Flexible";
    if (kind === "District") return "Other / Flexible";
    return "Other / Flexible";
  }

  function isBiomeValid(record, profile) {
    const text = `${record.name} ${record.category}`.toLowerCase();
    const biome = `${profile?.terrain || ""} ${profile?.variant || ""}`.toLowerCase();
    if (/harbor|dock|wharf|ferry|steamship|submarine/.test(text) && !/coastal|river|ocean|reef|underwater|water|marsh|swamp/.test(biome)) return false;
    if (/farm|stable|ranch|orchard/.test(text) && /ocean surface|underwater/.test(biome)) return false;
    if (/coral|reef/.test(text) && !/ocean|reef|underwater|coastal/.test(biome)) return false;
    return true;
  }

  function repairBiomeConflict(record, profile) {
    const biome = `${profile?.terrain || ""} ${profile?.variant || ""}`.toLowerCase();
    if (/mountain|cavern/.test(biome)) {
      record.name = record.name.replace(/Harbor|Dock|Wharf|Farm|Stable|Coral/gi, "Stoneworks");
      record.category = /Farm|Stable/i.test(record.name) ? "Industry & Crafting" : record.category;
      record.repairNote = "Repaired invalid biome placement into mountain/cavern-appropriate form.";
    } else if (/underwater|reef|ocean/.test(biome)) {
      record.name = record.name.replace(/Stable|Orchard|Ranch|Farm/gi, "Kelp Garden");
      record.repairNote = "Repaired invalid land placement into ocean/underwater equivalent.";
    } else if (/forest|rainforest/.test(biome)) {
      record.name = record.name.replace(/Harbor|Wharf|Submarine/gi, "Ranger Lodge");
      record.repairNote = "Repaired invalid water placement into forest-appropriate equivalent.";
    }
    return record;
  }

  function isGeneratedNpc(npc) {
    return !(npc?.source?.type === "imported" || String(npc?.id || "").startsWith("imported_npc_"));
  }

  function assignGeneratedNpcsToLocations(locations = allLocations(), rng = Math.random) {
    const s = state();
    if (!s) return [];
    const generatedNpcs = (s.npcs || []).filter(isGeneratedNpc);
    if (!generatedNpcs.length || !locations.length) return [];
    const assignments = [];
    locations.forEach(loc => {
      const sameSettlement = generatedNpcs.filter(npc => npc.assignment?.settlementId === loc.settlementId || npc.assignment?.settlementName === loc.settlementName);
      const matches = sameSettlement.filter(npc => npcMatchesLocation(npc, loc));
      const pool = matches.length ? matches : sameSettlement;
      if (!pool.length) return;
      const staffTarget = staffTargetForLocation(loc);
      const chosen = sampleLocal(pool, staffTarget, rng);
      loc.employees = mergeArrays(loc.employees, chosen.map(npc => ({ npcId: npc.id, name: npc.name, role: npc.job?.title || "Assigned NPC", assignmentSource: "auto-assigned generated NPC" })), "npcId");
      if (!loc.ownerNpcId && chosen[0]) {
        loc.ownerNpcId = chosen[0].id;
        loc.ownership = `${chosen[0].name} (${chosen[0].job?.title || "assigned owner"})`;
      }
      chosen.forEach((npc, index) => {
        if (!npc.assignedLocations) npc.assignedLocations = {};
        const locLite = locationLite(loc);
        if (index === 0 || npcMatchesLocation(npc, loc)) npc.assignedLocations.work = locLite;
        else if (!npc.assignedLocations.personal || rng() < 0.4) npc.assignedLocations.personal = locLite;
        assignments.push({ npcId: npc.id, locationId: loc.id });
      });
    });
    actions().renderAll?.();
    window.dispatchEvent(new CustomEvent("life_simulator:locations-changed", { detail: { assignments } }));
    return assignments;
  }

  function sampleLocal(arr, count, rng) {
    const copy = [...arr];
    const out = [];
    while (copy.length && out.length < count) out.push(copy.splice(Math.floor(rng() * copy.length), 1)[0]);
    return out;
  }

  function staffTargetForLocation(loc) {
    if (/Capital|District/i.test(loc.generationKind || "")) return 5;
    if (/Government|Transportation|Medical|Food|Hospitality|Commercial|Industry/.test(loc.locationType || loc.category || "")) return 3;
    if (/Residential|Nature|Special/.test(loc.locationType || loc.category || "")) return 1;
    return 2;
  }

  function npcMatchesLocation(npc, loc) {
    const text = `${npc.job?.title || ""} ${npc.job?.category || ""} ${(npc.job?.locationKeywords || []).join(" ")} ${loc.name} ${loc.category} ${loc.simpleCategory}`.toLowerCase();
    const words = CATEGORY_KEYWORDS[loc.locationType || loc.category] || [];
    return words.some(word => text.includes(word)) || text.includes(String(loc.simpleCategory || "").toLowerCase());
  }

  function locationLite(loc) {
    return {
      id: loc.id,
      name: loc.name,
      category: loc.locationType || loc.category,
      settlementId: loc.settlementId,
      settlementName: loc.settlementName,
      province: loc.province,
      provinceId: loc.provinceId,
      timeZone: loc.timeZone,
      source: loc.source,
      imported: Boolean(loc.imported || loc.lockedCore)
    };
  }

  function createLockedLocationsFromUploadedNpcs() {
    ensureStateShape();
    const s = state();
    const rng = helpers().makeRng(`${s.seed}|uploaded-npc-locations|${Date.now()}`);
    const created = [];
    (s.npcs || []).filter(npc => npc?.source?.type === "imported").forEach((npc, index) => {
      const settlement = helpers().matchSettlement ? helpers().matchSettlement(npc) : (helpers().currentSettlement?.() || {});
      const profile = profileForSettlement(settlement);
      const raw = npc.importedRaw || {};
      const candidates = [];
      ["home", "residence", "workplace", "work", "location", "business", "shop", "temple", "base"].forEach(key => {
        const value = raw[key] || raw[key + "Name"];
        if (typeof value === "string" && value.trim()) candidates.push({ name: value.trim(), type: inferCanonicalType(value) });
      });
      Object.values(npc.assignedLocations || {}).forEach(loc => {
        if (loc?.name) candidates.push({ name: loc.name, type: inferCanonicalType(`${loc.name} ${loc.category || ""}`) });
      });
      if (!candidates.length && raw.settlementName) candidates.push({ name: `${raw.settlementName} Contact House`, type: "Residential & Social Care" });
      candidates.forEach((candidate, cIndex) => {
        const loc = makeLocationRecord({
          name: candidate.name,
          type: candidate.type,
          settlement,
          profile,
          generationKind: "uploaded NPC protected location",
          index: `${index}_${cIndex}`,
          source: "uploaded-npc-location",
          lockedCore: true,
          originNpcId: npc.id
        });
        loc.originNpcId = npc.id;
        loc.originNpcName = npc.name;
        loc.description = loc.description || `Protected imported location created from uploaded NPC ${npc.name}.`;
        loc.relationships.push({ npcId: npc.id, name: npc.name, relationship: "uploaded NPC source" });
        loc.employees = mergeArrays(loc.employees, [{ npcId: npc.id, name: npc.name, role: npc.job?.title || "Uploaded NPC connection" }], "npcId");
        created.push(loc);
      });
    });
    upsertLocations(created);
    assignGeneratedNpcsToLocations(created, rng);
    actions().warnOnce?.(created.length ? `Created or expanded ${created.length} locked locations from uploaded NPC data.` : "No uploaded NPC locations were found to protect.");
    actions().renderAll?.();
    window.dispatchEvent(new CustomEvent("life_simulator:locations-changed", { detail: { createdLocked: created } }));
    return created;
  }

  function randomizeLocationNames(percent = 0.05) {
    ensureStateShape();
    const s = state();
    const rng = helpers().makeRng(`${s.seed}|location-name-randomizer|${Date.now()}`);
    const editable = allLocations().filter(loc => !loc.lockedCore);
    const count = Math.max(1, Math.ceil(editable.length * percent));
    sampleLocal(editable, count, rng).forEach(loc => {
      const oldName = loc.name;
      loc.name = slightLocationVariant(loc.name, rng);
      loc.updatedAt = new Date().toISOString();
      loc.randomizerHistory = mergeArrays(loc.randomizerHistory, [`${oldName} → ${loc.name}`]);
    });
    actions().warnOnce?.(`5% location name randomizer updated ${Math.min(count, editable.length)} editable location name${count === 1 ? "" : "s"}. Locked uploaded-NPC locations were preserved.`);
    actions().renderAll?.();
    window.dispatchEvent(new CustomEvent("life_simulator:locations-changed", { detail: { randomized: count } }));
  }

  function slightLocationVariant(name, rng) {
    const prefixes = ["Old", "New", "Upper", "Lower", "Grand", "Little", "Moonlit", "Brass", "Lantern", "Cinder", "Velvet", "Copper"];
    const clean = String(name || "Location").replace(/^(Old|New|Upper|Lower|Grand|Little|Moonlit|Brass|Lantern|Cinder|Velvet|Copper)\s+/i, "");
    return `${prefixes[Math.floor(rng() * prefixes.length)]} ${clean}`;
  }

  function exportLocations(filename = "life_simulator_locations_expanded.json") {
    const data = {
      schema: "life_simulator.expandedLocations.export.v1",
      exportedAt: new Date().toISOString(),
      rulesSource: rules?.source || RULES_PATH,
      locations: allLocations(),
      npcConnections: (state()?.npcs || []).map(npc => ({ id: npc.id, name: npc.name, source: npc.source?.type || "generated", assignedLocations: npc.assignedLocations || {} }))
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    URL.revokeObjectURL(a.href);
    a.remove();
  }

  window.LifeLocationGenerator = {
    get rules() { return rules; },
    loadRules,
    allLocations,
    generatedLocations,
    protectedNpcLocations,
    profilesForSelect,
    getDefaultCount,
    generateLocations,
    assignGeneratedNpcsToLocations,
    createLockedLocationsFromUploadedNpcs,
    randomizeLocationNames,
    exportLocations,
    locationLite,
    inferCanonicalType,
    CANONICAL_TO_SIMPLE
  };

  function ready() {
    if (core()?.state?.data) {
      ensureStateShape();
      loadRules();
    } else {
      window.addEventListener("life-simulator:ready", () => {
        ensureStateShape();
        loadRules();
      }, { once: true });
    }
  }

  ready();
})();
