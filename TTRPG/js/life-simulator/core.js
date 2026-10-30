(() => {
  "use strict";

  const STORE_KEY = "lifeSimulator.state.v1";
  const MAP_ASSET_HANDOFF_KEY = "lifeSimulator.handoff";
  const DATA_PATHS = {
    raceData: "json/race_categories.json",
    classData: "json/class_subclass_options.json",
    provinceData: "json/provinces_settlements.json",
    factionRules: "json/faction_rules.json",
    livingRules: "json/living_world_rules.json",
    transitRules: "json/transit_rules.json",
    visitableLocations: "json/visitable_locations.json"
  };

  const AXES = ["Altruism", "Lawfulness", "Cooperation", "Honor"];
  const DND_ALIGNMENT_SCORES = Object.freeze({
    "Lawful Good": { Altruism: 2450, Lawfulness: 2500, Cooperation: 2250, Honor: 2500 },
    "Neutral Good": { Altruism: 2500, Lawfulness: 1500, Cooperation: 2300, Honor: 2050 },
    "Chaotic Good": { Altruism: 2350, Lawfulness: 550, Cooperation: 1950, Honor: 1700 },
    "Lawful Neutral": { Altruism: 1500, Lawfulness: 2500, Cooperation: 1600, Honor: 2300 },
    "True Neutral": { Altruism: 1500, Lawfulness: 1500, Cooperation: 1500, Honor: 1500 },
    "Chaotic Neutral": { Altruism: 1500, Lawfulness: 500, Cooperation: 1300, Honor: 1100 },
    "Lawful Evil": { Altruism: 550, Lawfulness: 2400, Cooperation: 900, Honor: 1350 },
    "Neutral Evil": { Altruism: 500, Lawfulness: 1500, Cooperation: 700, Honor: 700 },
    "Chaotic Evil": { Altruism: 450, Lawfulness: 500, Cooperation: 500, Honor: 450 }
  });
  const DND_ALIGNMENT_CHOICES = Object.freeze(Object.keys(DND_ALIGNMENT_SCORES));
  const ALIGNMENT_TERMS = Object.freeze({
    Altruism: { low:"selfish", neutral:"neutral", high:"altruistic", gradient:"linear-gradient(90deg,#8e1d2c 0%,#5f6670 50%,#31d17e 100%)" },
    Lawfulness: { low:"chaotic", neutral:"neutral", high:"lawful", gradient:"linear-gradient(90deg,#7b2cbf 0%,#5f6670 50%,#3aa0ff 100%)" },
    Cooperation: { low:"combative", neutral:"neutral", high:"cooperative", gradient:"linear-gradient(90deg,#b72234 0%,#5f6670 50%,#4df2b8 100%)" },
    Honor: { low:"pragmatic", neutral:"neutral", high:"honorable", gradient:"linear-gradient(90deg,#a05a20 0%,#5f6670 50%,#f6d36b 100%)" }
  });
  const AXIS_LABELS = Object.freeze(Object.fromEntries(AXES.map(axis => [axis, [ALIGNMENT_TERMS[axis].low, ALIGNMENT_TERMS[axis].neutral, ALIGNMENT_TERMS[axis].high]])));
  const BEL_WEEKDAYS = ["Day 1", "Day 2", "Day 3", "Day 4", "Day 5", "Day 6"];


  const ACTIVITY_EMOJI_GROUPS = Object.freeze({
    sleepRest: [
      ["Sleeping", "😴🛏️"], ["Napping", "💤"], ["Resting in bed", "🛏️"], ["Waking up", "🌅😴"], ["Going to sleep", "🌙🛏️"],
      ["Recuperating from injury", "🤕🛏️"], ["Recovering from illness", "🤒🛏️"], ["Meditating", "🧘"], ["Daydreaming", "💭"],
      ["Sitting quietly", "🪑🤫"], ["Reading before bed", "📖🛏️"]
    ],
    morningRoutine: [
      ["Waking late or early", "🌅⏰"], ["Washing up", "🧼💧"], ["Brushing hair", "🪮"], ["Shaving", "🪒"], ["Bathing", "🛁"],
      ["Dressing", "👕"], ["Making breakfast", "🍳"], ["Feeding pets", "🐾🍲"], ["Checking messages", "✉️👀"],
      ["Preparing tools or supplies", "🛠️🎒"], ["Opening a shop", "🏪🔓"], ["Locking or unlocking doors", "🔐🚪"],
      ["Leaving home", "🏠🚶"], ["Taking a morning walk", "🌅🚶"]
    ],
    workProfessionalDuties: [
      ["Working at a desk", "🧾🖋️"], ["Crafting", "🛠️"], ["Smithing", "⚒️"], ["Sewing", "🪡"], ["Cooking", "🍳"], ["Cleaning", "🧽"],
      ["Farming", "🌾"], ["Fishing", "🎣"], ["Mining", "⛏️"], ["Guard duty", "🛡️"], ["Patrolling", "🚶🛡️"], ["Teaching", "🧑‍🏫"],
      ["Healing patients", "🩺🏥"], ["Researching", "🔎📚"], ["Trading", "⚖️💰"], ["Bargaining", "🤝💰"], ["Counting inventory", "📋📦"],
      ["Delivering goods", "📦➡️"], ["Repairing equipment", "🛠️⚙️"], ["Building", "🧱🔨"], ["Managing staff", "🧑‍💼👥"],
      ["Supervising workers", "👀👷"], ["Filing paperwork", "🗂️📄"], ["Collecting taxes", "💰📜"], ["Performing inspections", "🔍📋"],
      ["Writing reports", "✍️📄"], ["Meeting clients", "🤝💼"], ["Serving customers", "🛎️🤝"], ["Hosting patrons", "🍻👥"],
      ["Taking orders", "📝🍽️"], ["Loading cargo", "📦⬆️"], ["Unloading cargo", "📦⬇️"], ["Maintaining machinery", "⚙️🔧"],
      ["Training apprentices", "🧑‍🏫🛠️"], ["Studying magical texts", "📚✨"], ["Performing rituals", "🔮🕯️"],
      ["Guarding a location", "🛡️🏛️"], ["Escorting someone", "🛡️🚶"], ["Traveling for business", "🧳💼"]
    ],
    middayActiveHours: [
      ["Eating lunch", "🥪"], ["Taking a break", "☕"], ["Running errands", "🧺🚶"], ["Shopping", "🛍️"], ["Socializing", "🗣️👥"],
      ["Meeting friends", "👥😊"], ["Visiting family", "👨‍👩‍👧‍👦🏠"], ["Attending appointments", "📅🚶"], ["Praying", "🙏"],
      ["Attending school", "🏫📚"], ["Practicing a trade", "🛠️📚"], ["Practicing combat", "⚔️"], ["Practicing magic", "🪄✨"],
      ["Practicing music", "🎵"], ["Performing street work", "🛣️🧹"], ["Visiting public places", "🏛️🚶"], ["Gambling", "🎲"],
      ["Gossiping", "🗣️👂"], ["People-watching", "👀🧍"], ["Collecting supplies", "🎒📦"], ["Inspecting property", "🔍🏠"],
      ["Checking on animals", "🐾👀"], ["Delivering messages", "✉️➡️"], ["Negotiating deals", "🤝📜"]
    ],
    afternoonRoutine: [
      ["Continuing work", "💼➡️"], ["Visiting a second job", "💼💼"], ["Banking money", "🏦💰"], ["Attending council meetings", "🏛️🤝"],
      ["Training", "🏋️"], ["Exercising", "💪"], ["Patrolling", "🚶🛡️"], ["Escorting goods", "🛡️📦"], ["Restocking shelves", "📦🧺"],
      ["Making deliveries", "📦🚶"], ["Doing repairs", "🛠️"], ["Preparing dinner ingredients", "🥕🍲"], ["Studying", "📚"],
      ["Conducting research", "🔎📚"], ["Meeting with clients", "🤝💼"], ["Meeting with a faction", "🏴🤝"], ["Visiting a tavern", "🍻🏠"],
      ["Taking children home", "🧒🏠"], ["Running family errands", "👨‍👩‍👧‍👦🧺"]
    ],
    eveningRoutine: [
      ["Returning home", "🏠⬅️"], ["Cooking dinner", "🍲"], ["Eating dinner", "🍽️"], ["Visiting the tavern", "🍻"],
      ["Attending dinner gatherings", "🍽️👥"], ["Attending social events", "🎉👥"], ["Going to church or temple", "🛐🛕"],
      ["Attending a lecture or performance", "🎭📜"], ["Relaxing", "🛋️"], ["Reading", "📖"], ["Gambling", "🎲"], ["Drinking", "🍺"],
      ["Singing", "🎶"], ["Dancing", "💃"], ["Playing games", "🎲♟️"], ["Spending time with family", "👨‍👩‍👧‍👦"],
      ["Talking with neighbors", "🏘️🗣️"], ["Locking up shops", "🏪🔒"], ["Closing stalls", "🧺🔒"], ["Checking on livestock", "🐄👀"],
      ["Walking pets", "🐕🚶"], ["Patrolling streets", "🌆🛡️"], ["Starting night shift", "🌙💼"], ["Preparing for bed", "🌙🛏️"]
    ],
    nightRoutine: [
      ["Sleeping", "😴🛏️"], ["Night patrol", "🌙🛡️"], ["Watching over property", "👀🏠"], ["Guard duty", "🛡️"], ["Smuggling", "📦🕵️"],
      ["Sneaking around", "🤫🚶"], ["Stealing", "🖐️💰"], ["Secret meetings", "🤫🤝"], ["Illegal dealings", "🕵️💰"],
      ["Shadowing someone", "👤👣"], ["Hunting", "🏹"], ["Stargazing", "🔭✨"], ["Researching", "🔎📚"], ["Working late", "🌙💼"],
      ["Tending a sick person", "🤒🩺"], ["Keeping watch", "👁️🛡️"], ["Traveling under cover of darkness", "🌙🚶"],
      ["Spying", "👁️🕵️"], ["Performing rituals", "🔮🕯️"], ["Visiting hidden contacts", "🕵️🚪"], ["Restless wandering", "😵‍💫🚶"]
    ],
    daysOffLeisure: [
      ["Visiting friends", "👥😊"], ["Going to the market", "🧺🏪"], ["Attending festivals", "🎪🎉"], ["Hunting for fun", "🏹🌲"],
      ["Fishing for fun", "🎣🌊"], ["Drinking", "🍺"], ["Gambling", "🎲"], ["Playing games", "🎲♟️"], ["Reading", "📖"],
      ["Studying", "📚"], ["Shopping", "🛍️"], ["Traveling", "🧳"], ["Walking", "🚶"], ["Exercising", "💪"],
      ["Visiting scenic spots", "🏞️"], ["Gardening", "🌱"], ["Crafting personal items", "🛠️🎁"], ["Practicing a hobby", "🎨"],
      ["Visiting family", "👨‍👩‍👧‍👦🏠"], ["Sleeping in", "😴🌅"], ["Attending performances", "🎭"]
    ],
    socialRelationshipActivities: [
      ["Dating", "💕"], ["Courting", "🌹💕"], ["Meeting a partner", "💞🤝"], ["Spending time with spouse", "💍🏠"],
      ["Visiting family", "👨‍👩‍👧‍👦🏠"], ["Caring for children", "🧒🫶"], ["Babysitting", "🧸"], ["Arguing", "😠💬"],
      ["Reconciliation", "🫂"], ["Attending weddings", "💒"], ["Attending funerals", "🕯️⚱️"], ["Visiting the sick", "🤒🏥"],
      ["Hosting guests", "🏠👥"], ["Having meals together", "🍽️👥"], ["Celebrating birthdays", "🎂🎉"], ["Sending letters", "✉️"],
      ["Exchanging gifts", "🎁"], ["Making apologies", "🙇"], ["Breaking up", "💔"], ["Secret affairs", "🕵️💕"],
      ["Mentoring", "🧑‍🏫"], ["Apprenticing", "📚🛠️"], ["Supporting a friend", "🫂"], ["Settling disputes", "⚖️🤝"]
    ],
    factionPoliticalActivities: [
      ["Attending meetings", "🏛️🤝"], ["Voting", "🗳️"], ["Lobbying support", "📣🤝"], ["Spreading propaganda", "📣🧾"],
      ["Spying", "👁️🕵️"], ["Forming alliances", "🤝🏴"], ["Making threats", "⚠️💬"], ["Negotiating treaties", "📜🤝"],
      ["Planning raids", "🗺️⚔️"], ["Organizing protests", "✊📣"], ["Enforcing laws", "⚖️🛡️"], ["Collecting bribes", "💰🤫"],
      ["Investigating crimes", "🔎⚖️"], ["Covering up crimes", "🧹🕵️"], ["Holding court", "👑⚖️"], ["Issuing orders", "📜📣"],
      ["Recruiting members", "🧑‍🤝‍🧑📣"], ["Debating policy", "🏛️💬"], ["Writing decrees", "📜✒️"], ["Delivering speeches", "🎙️📣"]
    ],
    travelTransit: [
      ["Walking", "🚶"], ["Riding horseback", "🐎"], ["Driving a cart", "🐴🛒"], ["Sailing", "⛵"], ["Flying", "🪽"],
      ["Teleporting", "🌀✨"], ["Taking a caravan", "🛤🧳"], ["Boarding a train", "🚉"], ["Crossing a river", "🌊➡️"],
      ["Entering a port", "⚓🚪"], ["Arriving in town", "🏘️➡️"], ["Departing town", "🏘️⬅️"], ["Delivering cargo", "📦➡️"],
      ["Escorting travelers", "🛡️🚶"], ["Camping", "🏕️"], ["Navigating roads", "🧭🛣️"], ["Searching for a route", "🗺️🔎"],
      ["Waiting for transport", "⏳🚏"]
    ],
    emergencyCrisis: [
      ["Fleeing", "🏃💨"], ["Hiding", "🙈"], ["Fighting", "⚔️"], ["Defending others", "🛡️👥"], ["Searching for someone", "🔎👤"],
      ["Treating injuries", "🩺🤕"], ["Locking down a building", "🔒🏠"], ["Sounding an alarm", "🚨📣"], ["Evacuating civilians", "🏃👥"],
      ["Putting out fires", "🧯🔥"], ["Rescuing animals", "🐾🛟"], ["Protecting valuables", "💎🛡️"], ["Reporting danger", "⚠️📣"],
      ["Looting", "💰🧤"], ["Loot recovery", "🔎💰"], ["Rebuilding", "🧱🔨"], ["Mourning", "🕯️😢"], ["Investigating damage", "🔎🧱"]
    ],
    criminalSecretActivities: [
      ["Pickpocketing", "🖐️💰"], ["Smuggling", "📦🕵️"], ["Lying low", "🕶️🏠"], ["Meeting an accomplice", "🕵️🤝"],
      ["Selling contraband", "💰🚫"], ["Breaking into buildings", "🔓🏠"], ["Forging documents", "📜✒️"], ["Hiding evidence", "🧾🗑️"],
      ["Bribing officials", "💰⚖️"], ["Threatening witnesses", "⚠️👁️"], ["Laundering money", "🧺💰"], ["Spying", "👁️🕵️"],
      ["Tailing targets", "👣👤"], ["Running a black market", "🏴💰"], ["Interrogating someone", "❓🪑"], ["Making escape plans", "🗺️🏃"]
    ],
    magicReligiousActivities: [
      ["Casting spells", "🪄✨"], ["Studying spellbooks", "📖✨"], ["Brewing potions", "🧪"], ["Enchanting items", "💍✨"],
      ["Performing rituals", "🔮🕯️"], ["Making offerings", "🎁🙏"], ["Praying", "🙏"], ["Leading worship", "🛐📣"],
      ["Blessing others", "🙌✨"], ["Exorcising spirits", "👻🕯️"], ["Divining omens", "🔮👁️"], ["Consulting prophecy", "📜🔮"],
      ["Training apprentices", "🧑‍🏫✨"], ["Protecting sacred spaces", "🛡️🛕"], ["Attending ceremonies", "🕯️🛕"],
      ["Visiting their deity", "🙏✨"], ["Attending a chapel", "🛐⛪"]
    ],
    maintenanceDomesticActivities: [
      ["Cleaning", "🧽"], ["Sweeping", "🧹"], ["Laundry", "🧺"], ["Repairing clothing", "🪡👕"], ["Fixing furniture", "🔨🪑"],
      ["Cooking", "🍳"], ["Gardening", "🌱"], ["Caring for animals", "🐾🫶"], ["Fetching water", "🪣💧"], ["Collecting firewood", "🪵"],
      ["Restocking supplies", "📦"], ["Organizing storage", "📦🗂️"], ["Tending the hearth", "🔥🏠"], ["Mending tools", "🛠️"],
      ["Painting walls", "🎨🏠"], ["Renovating rooms", "🧱🔨"]
    ],
    specialStates: [
      ["Sick", "🤒"], ["Injured", "🤕"], ["Exhausted", "😴"], ["Hungover", "🤢🍺"], ["Distracted", "😵‍💫"], ["Angry", "😠"],
      ["Grieving", "😢🕯️"], ["Celebrating", "🎉"], ["Waiting", "⏳"], ["Lost", "🧭❓"], ["Confused", "❓😵‍💫"], ["Suspicious", "🤨"],
      ["Scared", "😨"], ["Injured but working", "🤕💼"], ["Overworked", "😫📚"], ["Undercover", "🕵️"], ["Missing", "❓👤"],
      ["Imprisoned", "⛓️🏰"], ["Missing work", "🚫💼"], ["On leave", "🏖️"]
    ],
    usefulLocationMarkers: [
      ["Home", "🏠"], ["Work", "💼"], ["Hospital / healer", "🏥"], ["Library", "📚🏛️"], ["Tavern", "🍻"], ["Market", "🧺🏪"],
      ["Park", "🌳"], ["Chapel", "⛪"], ["Temple", "🛕"], ["Prison", "⛓️🏰"], ["Court / council", "🏛️⚖️"], ["Deity shrine", "🙏✨"],
      ["Public square", "🏛️👥"], ["Hidden contact location", "🕵️🚪"]
    ],
    addedStates: [["Vacationing", "🏖️"]]
  });
  const ACTIVITY_EMOJIS = Object.freeze(Object.fromEntries(Object.values(ACTIVITY_EMOJI_GROUPS).flat()));
  const ACTIVITY_ASSET_ROOT = "assets/activity-assets/";
  const ACTIVITY_VISUALS = Object.freeze(Object.fromEntries(
    Object.entries(ACTIVITY_EMOJI_GROUPS).flatMap(([group, rows]) => rows.map(([activity, emoji]) => [activity, {
      activity,
      group,
      emoji,
      imageAsset: `${ACTIVITY_ASSET_ROOT}${slug(group)}__${slug(activity)}.svg`,
      assetType: "emoji-svg",
      alt: `${activity} activity icon`
    }]))
  ));
  const ACTIVITY_ASSET_MANIFEST = Object.freeze(Object.fromEntries(Object.entries(ACTIVITY_VISUALS).map(([activity, visual]) => [activity, {
    group: visual.group,
    emoji: visual.emoji,
    imageAsset: visual.imageAsset,
    assetType: visual.assetType,
    alt: visual.alt
  }])));
  const LOCATION_EMOJIS = Object.freeze(Object.fromEntries(ACTIVITY_EMOJI_GROUPS.usefulLocationMarkers));
  const TRANSIT_MODE_VISUALS = Object.freeze({
    ferry: { emoji: "⛵", activity: "Sailing", label: "Boat & Ferry" },
    caravan: { emoji: "🛤", activity: "Taking a caravan", label: "Caravan Routes" },
    rail: { emoji: "🚉", activity: "Boarding a train", label: "Train", icon: { type:"image", src:"assets/transit-assets/train.png", alt:"Train transit" } },
    steamship: { emoji: "⛵", activity: "Sailing", label: "Steamship", icon: { type:"image", src:"assets/transit-assets/steamship.png", alt:"Steamship transit" } },
    skyship: { emoji: "🪽", activity: "Flying", label: "Skyship", icon: { type:"image", src:"assets/transit-assets/skyship.png", alt:"Skyship transit" } },
    submarine: { emoji: "⚓", activity: "Entering a port", label: "Submarine", icon: { type:"image", src:"assets/transit-assets/Submarine.png", alt:"Submarine transit" } },
    portal: { emoji: "🌀✨", activity: "Teleporting", label: "Regulated Portal" }
  });

  const state = {
    data: null,
    scope: "settlement",
    provinceId: "",
    settlementId: "",
    danger: "Guarded",
    seed: "Life Simulator",
    npcCount: 24,
    raceCache: [],
    biomeCache: [],
    alignmentMode: "axis",
    traditionalAlignment: "random",
    alignmentPreference: { Altruism: 1500, Lawfulness: 1500, Cooperation: 1500, Honor: 1500 },
    npcs: [],
    customLocations: [],
    importedDocuments: [],
    generatedAt: null,
    warnings: [],
    npcPage: "world",
    npcWindowHistory: [],
    npcWindowCurrentId: null,
    npcWindowReturn: null,
    relationshipFocusId: ""
  };

  // Tracks generated score signatures during this browser session so mass-generated
  // NPCs almost never walk away with the exact same alignment scores.
  const GENERATED_ALIGNMENT_SIGNATURES = new Set();

  const $ = (id) => document.getElementById(id);

  async function loadJSONWithFallback(key) {
    try {
      const response = await fetch(DATA_PATHS[key], { cache: "no-store" });
      if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
      return await response.json();
    } catch (err) {
      return window.LIFE_SIMULATOR_DEFAULT_DATA[key];
    }
  }

  function hashString(str) {
    let h = 2166136261 >>> 0;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }
  function makeRng(seed) {
    // All site-level randomization now routes through the attached Life Simulator
    // randomizer when it is available. Existing generator functions still call
    // pick/sample with rng, but this makes their entropy source consistent.
    const engine = globalThis.LifeAlignmentRandomizer;
    if (engine && typeof engine.createRng === "function") return engine.createRng(seed || "Life Simulator");
    let a = hashString(String(seed || "Life Simulator"));
    return function rng() {
      a += 0x6D2B79F5;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function pick(arr, rng) { return arr && arr.length ? arr[Math.floor(rng() * arr.length)] : null; }
  function sample(arr, n, rng) {
    const copy = [...(arr || [])];
    const out = [];
    while (copy.length && out.length < n) out.push(copy.splice(Math.floor(rng() * copy.length), 1)[0]);
    return out;
  }
  function clamp(n, min, max) { return Math.max(min, Math.min(max, n)); }
  function snap250(n) { return clamp(Math.round(n / 250) * 250, 0, 3000); }
  function slug(s) { return String(s || "item").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[’'‘`´]/g, "").replace(/[^A-Za-z0-9]+/g, "_").replace(/^_+|_+$/g, "").toLowerCase() || "item"; }
  function escapeHTML(s) { return String(s ?? "").replace(/[&<>"']/g, (c) => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[c])); }

  function axisTerm(axis, value) {
    const terms = ALIGNMENT_TERMS[axis] || { low:"low", neutral:"neutral", high:"high" };
    const n = Number(value ?? 1500);
    if (n <= 999) return terms.low;
    if (n <= 1999) return terms.neutral;
    return terms.high;
  }
  function axisDisplayName(axis) {
    const terms = AXIS_LABELS[axis] || [axis, "neutral", axis];
    return `${terms[0]} ${terms[1]} ${terms[2]}`;
  }
  function alignmentNameFromScores(scores = {}) {
    return AXES.map(axis => axisTerm(axis, scores[axis] ?? 1500)).join(" ");
  }
  function alignmentPhase(value) {
    const n = Number(value ?? 1500);
    if (n <= 999) return "extreme negative";
    if (n <= 1499) return "skewed negative";
    if (n === 1500) return "neutral";
    if (n <= 1999) return "skewed positive";
    return "extreme positive";
  }

  function alignmentEngine() {
    return globalThis.LifeAlignmentRandomizer || null;
  }

  function alignmentAxisKey(axis) {
    return String(axis || "").toLowerCase();
  }

  function siteAxisFromRandomizerKey(axis) {
    const found = AXES.find(a => alignmentAxisKey(a) === alignmentAxisKey(axis));
    return found || axis;
  }

  function alignmentDangerKey(level) {
    const key = slug(level || state.danger || "moderate").replace(/_/g, " ").trim();
    const map = {
      peaceful: "peaceful",
      safe: "safe",
      low: "low",
      guarded: "safe",
      moderate: "moderate",
      tense: "dangerous",
      dangerous: "dangerous",
      high: "high",
      severe: "extreme",
      extreme: "extreme",
      catastrophic: "lethal",
      lethal: "lethal"
    };
    return map[key] || map[key.split(" ")[0]] || "moderate";
  }

  function classesForAlignment(classInfo) {
    if (!classInfo) return [];
    if (Array.isArray(classInfo)) return classInfo;
    if (typeof classInfo === "string") return classInfo;
    const classes = [];
    if (classInfo.primaryClass) classes.push(classInfo.primaryClass);
    if (classInfo.secondaryClass) classes.push(classInfo.secondaryClass);
    if (classInfo.className) classes.push(classInfo.className);
    if (classInfo.name) classes.push(classInfo.name);
    if (classInfo.class) classes.push(classInfo.class);
    return classes.filter(Boolean);
  }

  function alignmentOptions(seedLabel) {
    return {
      seed: `${state.seed || "Life Simulator"}|${seedLabel || "alignment"}`,
      registry: GENERATED_ALIGNMENT_SIGNATURES,
      neutralAxisChance: 0.012,
      minimumNonNeutralAxes: 3,
      exactNeutralChance: 0.000001,
      allNeutralPhaseChance: 0.00001,
      allowExactNeutral: false,
      avoidAllAxisNeutral: true,
      avoidExactScoreDuplicates: true,
      scoreSnap: 1,
      maxDuplicateRepairAttempts: 80,
      weights: { race: 0.46, class: 0.36, danger: 0.18 },
      baseVolatility: 335,
      multiclassSpreadBonus: 70
    };
  }

  function alignmentNameForSiteScores(scores, fallbackName = null) {
    const engine = alignmentEngine();
    if (engine && typeof engine.scoreToAxisPhase === "function" && typeof engine.resolveAlignmentName === "function") {
      const phases = Object.fromEntries(AXES.map(axis => [alignmentAxisKey(axis), engine.scoreToAxisPhase(alignmentAxisKey(axis), scores[axis]) ]));
      return engine.resolveAlignmentName(phases);
    }
    return fallbackName || alignmentNameFromScores(scores);
  }

  function fullAlignmentLabelForSiteScores(scores) {
    const engine = alignmentEngine();
    if (engine && typeof engine.scoreToAxisPhase === "function") {
      return AXES.map(axis => engine.scoreToAxisPhase(alignmentAxisKey(axis), scores[axis]).label).join(" / ");
    }
    return AXES.map(axis => describeAxis(axis, scores[axis])).join(" / ");
  }

  function adaptRandomizerAlignment(result) {
    const scores = Object.fromEntries(AXES.map(axis => [axis, Number(result?.scores?.[alignmentAxisKey(axis)] ?? 1500)]));
    const descriptors = Object.fromEntries(AXES.map(axis => {
      const key = alignmentAxisKey(axis);
      const label = result?.axes?.[key]?.label || describeAxis(axis, scores[axis]);
      return [axis, String(label).toLowerCase()];
    }));
    const axisTerms = Object.fromEntries(AXES.map(axis => {
      const key = alignmentAxisKey(axis);
      const phase = result?.axisPhases?.[key] || axisTerm(axis, scores[axis]);
      return [axis, String(phase).toLowerCase()];
    }));
    const phases = Object.fromEntries(AXES.map(axis => {
      const key = alignmentAxisKey(axis);
      const intensity = result?.axisIntensities?.[key];
      const phase = result?.axisPhases?.[key];
      return [axis, intensity && phase ? `${intensity} ${phase}`.toLowerCase() : alignmentPhase(scores[axis])];
    }));
    return {
      system: "Axis alignment randomizer",
      randomizer: "life_simulator_alignment_randomizer.js",
      scale: [0, 3000],
      neutralCenter: 1500,
      positionStep: 1,
      axisOrder: AXES,
      axisNames: Object.fromEntries(AXES.map(axis => [axis, axisDisplayName(axis)])),
      axisTerms,
      phases,
      alignmentName: result?.alignmentName || result?.profileName || alignmentNameFromScores(scores),
      profileName: result?.profileName || result?.alignmentName || alignmentNameFromScores(scores),
      fullAlignmentLabel: result?.fullAlignmentLabel || AXES.map(axis => descriptors[axis]).join(" / "),
      phaseSignature: result?.phaseSignature || AXES.map(axis => axisTerms[axis]).join("|"),
      detailedSignature: result?.detailedSignature || AXES.map(axis => `${phases[axis]}:${axisTerms[axis]}`).join("|"),
      scoreSignature: result?.scoreSignature || AXES.map(axis => `${axis}:${scores[axis]}`).join("|"),
      scores,
      descriptors,
      inputInfluence: result?.inputInfluence || null
    };
  }

  function deNeutralizeFallbackScores(scores, rng) {
    const out = { ...scores };
    const neutralAxes = AXES.filter(axis => Math.abs(Number(out[axis] ?? 1500) - 1500) < 500);
    neutralAxes.forEach(axis => {
      if (rng() > 0.012) {
        const preferHigh = Number(out[axis] ?? 1500) >= 1500;
        out[axis] = preferHigh ? Math.floor(2000 + rng() * 1001) : Math.floor(rng() * 1000);
      }
    });
    while (AXES.filter(axis => axisTerm(axis, out[axis]) !== ALIGNMENT_TERMS[axis].neutral).length < 3) {
      const axis = pick(AXES, rng);
      out[axis] = rng() < 0.5 ? Math.floor(rng() * 1000) : Math.floor(2000 + rng() * 1001);
    }
    return out;
  }
  function ensureArray(value) { return Array.isArray(value) ? value : value == null ? [] : [value]; }
  function firstDefined(...values) { return values.find(v => v !== undefined && v !== null && v !== ""); }
  function cleanText(value) { return String(value ?? "").replace(/\s+/g, " ").trim(); }
  function uniqueBy(items, keyFn) {
    const seen = new Set();
    return (items || []).filter(item => {
      const key = keyFn(item);
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  function flattenProvinces() { return state.data.provinceData.provinces || []; }
  function flattenSettlements() { return flattenProvinces().flatMap(p => (p.settlements || []).map(s => ({ ...s, provinceId: p.id, provinceName: p.name, province: p.name }))); }
  function currentProvince() { return flattenProvinces().find(p => p.id === state.provinceId) || flattenProvinces()[0]; }
  function currentSettlement() { return flattenSettlements().find(s => s.id === state.settlementId) || (currentProvince()?.settlements || [])[0]; }
  function biomeLimit() { return state.scope === "world" ? 15 : 3; }

  function allRaceDetails() {
    return state.data.raceData.categories.flatMap(c => c.racesDetailed.map(r => ({...r, categoryId: c.categoryId, category: c.category, creatorGod: r.creatorGod || c.god})));
  }
  function sanitizeRaceCache(cache = state.raceCache) {
    const locked = uniqueBy(ensureArray(cache).map(r => matchRace(r)).filter(Boolean), r => r.id);
    const removed = ensureArray(cache).length - locked.length;
    if (removed > 0) warnOnce(`Removed ${removed} race cache entr${removed === 1 ? "y" : "ies"} that were not found in the compendium race list.`);
    state.raceCache = locked;
    return locked;
  }
  function matchRaceBloodline(race, value) {
    const options = Array.isArray(race?.bloodlines) ? race.bloodlines : [];
    if (!options.length || value == null || value === "") return null;
    const key = slug(typeof value === "object" ? firstDefined(value.id, value.name, value.lineage, value.bloodline) : value);
    const found = options.find(b => slug(b.id) === key || slug(b.name) === key || slug(b.name).includes(key) || key.includes(slug(b.name)));
    return found ? { id: found.id || slug(found.name), name: found.name, description: found.description || "", source: found.source || "compendium-listed bloodline", theme: found.theme || null, profile: found.profile || null, alignment: found.alignment || null, parentDragons: found.parentDragons || null, inheritedTheme: found.inheritedTheme || null } : null;
  }
  function allBiomeOptions() {
    return (state.data.provinceData.biomeCategories || []).flatMap(c => (c.biomes || []).map(b => ({...b, category: c.category})));
  }

  async function init() {
    state.data = {
      raceData: await loadJSONWithFallback("raceData"),
      classData: await loadJSONWithFallback("classData"),
      provinceData: await loadJSONWithFallback("provinceData"),
      factionRules: await loadJSONWithFallback("factionRules"),
      livingRules: await loadJSONWithFallback("livingRules"),
      transitRules: await loadJSONWithFallback("transitRules"),
      visitableLocations: await loadJSONWithFallback("visitableLocations")
    };
    hydrateControls();
    bindEvents();
    applyScopeRules();
    renderAll();
    window.dispatchEvent(new CustomEvent("life-simulator:ready", { detail: window.LifeSimulator }));
  }

  function hydrateControls() {
    const scopeSelect = $("scopeSelect");
    scopeSelect.value = state.scope;
    const dangerSelect = $("dangerSelect");
    dangerSelect.innerHTML = state.data.livingRules.dangerLevels.map(d => `<option value="${escapeHTML(d)}">${escapeHTML(d)}</option>`).join("");
    dangerSelect.value = state.danger;

    const psel = $("provinceSelect");
    psel.innerHTML = flattenProvinces().map(p => `<option value="${escapeHTML(p.id)}">${escapeHTML(p.name)}</option>`).join("");
    state.provinceId = state.provinceId || (flattenProvinces()[0]?.id || "");
    psel.value = state.provinceId;
    hydrateSettlements();

    const raceCat = $("raceCategorySelect");
    raceCat.innerHTML = state.data.raceData.categories.map(c => `<option value="${escapeHTML(c.categoryId)}">${escapeHTML(c.category)}</option>`).join("");
    hydrateRaceSelect();

    const biomeCat = $("biomeCategorySelect");
    biomeCat.innerHTML = (state.data.provinceData.biomeCategories || []).map(c => `<option value="${escapeHTML(c.category)}">${escapeHTML(c.category)}</option>`).join("");
    hydrateBiomeSelect();
    const alignmentModeSelect = $("alignmentModeSelect");
    if (alignmentModeSelect) alignmentModeSelect.value = state.alignmentMode || "axis";
    const traditionalAlignmentSelect = $("traditionalAlignmentSelect");
    if (traditionalAlignmentSelect) traditionalAlignmentSelect.value = state.traditionalAlignment || "random";
    hydrateAlignmentControls();
  }

  function hydrateSettlements() {
    const p = currentProvince();
    const ssel = $("settlementSelect");
    ssel.innerHTML = (p?.settlements || []).map(s => `<option value="${escapeHTML(s.id)}">${escapeHTML(s.name)} — ${escapeHTML(s.type)}</option>`).join("");
    if (!state.settlementId || !(p?.settlements || []).some(s => s.id === state.settlementId)) state.settlementId = p?.settlements?.[0]?.id || "";
    ssel.value = state.settlementId;
  }

  function hydrateRaceSelect() {
    const catId = $("raceCategorySelect").value || state.data.raceData.categories[0]?.categoryId;
    const cat = state.data.raceData.categories.find(c => c.categoryId === catId) || state.data.raceData.categories[0];
    $("raceSelect").innerHTML = (cat?.racesDetailed || []).map(r => `<option value="${escapeHTML(r.id)}">${escapeHTML(r.name)}</option>`).join("");
  }

  function hydrateBiomeSelect() {
    const catName = $("biomeCategorySelect").value || state.data.provinceData.biomeCategories?.[0]?.category;
    const cat = (state.data.provinceData.biomeCategories || []).find(c => c.category === catName);
    $("biomeSelect").innerHTML = (cat?.biomes || []).map(b => `<option value="${escapeHTML(b.id)}">${escapeHTML(b.name)}</option>`).join("");
  }

  function hydrateAlignmentControls() {
    const wrap = $("alignmentControls");
    const traditionalField = $("traditionalAlignmentField");
    const usingTraditional = state.alignmentMode === "dnd";
    if (traditionalField) traditionalField.hidden = !usingTraditional;
    if (!wrap) return;
    if (usingTraditional) {
      const chosen = state.traditionalAlignment === "random" ? "Random D&D Alignment" : state.traditionalAlignment;
      wrap.innerHTML = `<div class="alignment-row dnd-alignment-summary"><header><b>Traditional D&amp;D Mode</b><span>${escapeHTML(chosen)}</span></header><p class="hint">Generated NPCs store the selected nine-grid alignment plus a compatible four-axis score profile for filtering and exports.</p></div>`;
      return;
    }
    wrap.innerHTML = AXES.map(axis => {
      const [low, neutral, high] = AXIS_LABELS[axis];
      const value = state.alignmentPreference[axis];
      const gradient = ALIGNMENT_TERMS[axis].gradient;
      return `<div class="alignment-row" data-axis="${axis}" style="--axis-gradient:${gradient}">
        <header><b>${axisDisplayName(axis)}</b><span id="${axis}Value">${value} — ${describeAxis(axis, value)}</span></header>
        <input type="range" min="0" max="3000" step="250" value="${value}" data-align-range="${axis}" />
        <div class="axis-extremes"><span>${low}</span><span>${neutral}</span><span>${high}</span></div>
      </div>`;
    }).join("");
  }

  function bindEvents() {
    $("scopeSelect").addEventListener("change", () => { state.scope = $("scopeSelect").value; applyScopeRules(); renderAll(); });
    $("provinceSelect").addEventListener("change", () => { state.provinceId = $("provinceSelect").value; hydrateSettlements(); state.settlementId = $("settlementSelect").value; renderAll(); });
    $("settlementSelect").addEventListener("change", () => { state.settlementId = $("settlementSelect").value; renderAll(); });
    $("dangerSelect").addEventListener("change", () => { state.danger = $("dangerSelect").value; renderAll(); });
    $("alignmentModeSelect")?.addEventListener("change", () => { state.alignmentMode = $("alignmentModeSelect").value || "axis"; hydrateAlignmentControls(); renderAll(); });
    $("traditionalAlignmentSelect")?.addEventListener("change", () => { state.traditionalAlignment = $("traditionalAlignmentSelect").value || "random"; hydrateAlignmentControls(); });
    $("seedInput").addEventListener("input", () => { state.seed = $("seedInput").value; });
    $("npcCount").addEventListener("input", () => { state.npcCount = parseInt($("npcCount").value, 10) || 1; });
    $("raceCategorySelect").addEventListener("change", hydrateRaceSelect);
    $("biomeCategorySelect").addEventListener("change", hydrateBiomeSelect);
    $("addRaceBtn").addEventListener("click", addRaceToCache);
    $("addBiomeBtn").addEventListener("click", addBiomeToCache);
    $("generateNpcsBtn").addEventListener("click", generateNPCs);
    $("clearNpcsBtn").addEventListener("click", () => { state.npcs = []; state.generatedAt = null; renderAll(); });
    $("saveStateBtn").addEventListener("click", saveProgress);
    $("loadStateBtn").addEventListener("click", loadProgress);
    $("resetStateBtn").addEventListener("click", resetState);
    $("openCompanionButton")?.addEventListener("click", openCompanion);
    $("exportAllBtn").addEventListener("click", () => exportNPCs("all"));
    $("exportWorldBtn").addEventListener("click", () => exportNPCs("world"));
    $("exportProvinceBtn").addEventListener("click", () => exportNPCs("province"));
    $("exportSettlementBtn").addEventListener("click", () => exportNPCs("settlement"));
    $("exportProvinceDataBtn").addEventListener("click", exportProvinceData);
    $("importProvinceFile").addEventListener("change", importProvinceFile);
    $("importSaveFile").addEventListener("change", importSaveFile);
    $("importNpcDocsFile")?.addEventListener("change", importNpcDocumentsFile);
    $("randomizeFiveBtn")?.addEventListener("click", fivePercentRandomize);
    $("reconcileLocationsBtn")?.addEventListener("click", reconcileLocationsFromMenu);
    $("clearLocationsBtn")?.addEventListener("click", clearImportedLocationsFromMenu);
    bindDropZone();
    $("npcSearch").addEventListener("input", renderNPCs);
    document.querySelectorAll("[data-npc-page]").forEach(btn => btn.addEventListener("click", () => {
      state.npcPage = btn.dataset.npcPage || "world";
      renderNPCs();
      renderRelationshipTracker();
    }));
    $("refreshRelationshipTrackerBtn")?.addEventListener("click", renderRelationshipTracker);
    $("relationshipFocusSelect")?.addEventListener("change", () => {
      state.relationshipFocusId = $("relationshipFocusSelect").value;
      renderRelationshipTracker();
    });
    $("npcWindowCloseBtn")?.addEventListener("click", closeNpcWindow);
    $("npcWindowPreviousBtn")?.addEventListener("click", previousNpcWindowPage);
    $("npcWindowBackToGeneratorBtn")?.addEventListener("click", backToGeneratorFromNpcWindow);
    $("npcWindowOverlay")?.addEventListener("click", (e) => { if (e.target?.id === "npcWindowOverlay") closeNpcWindow(); });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !$("npcWindowOverlay")?.classList.contains("hidden")) closeNpcWindow(); });
    document.addEventListener("click", (e) => {
      const openBtn = e.target.closest?.("[data-open-npc]");
      if (openBtn) {
        e.preventDefault();
        openNpcWindow(openBtn.dataset.openNpc, { pushHistory:true });
      }
    });
    document.addEventListener("input", (e) => {
      if (e.target.matches("[data-align-range]")) {
        const axis = e.target.dataset.alignRange;
        state.alignmentPreference[axis] = parseInt(e.target.value, 10);
        const label = $(`${axis}Value`);
        if (label) label.textContent = `${state.alignmentPreference[axis]} — ${describeAxis(axis, state.alignmentPreference[axis])}`;
        renderWarnings();
      }
    });
  }

  function applyScopeRules() {
    $("scopeSelect").value = state.scope;
    const rules = state.data?.livingRules?.scopeRules?.[state.scope];
    const p = $("provinceSelect");
    const s = $("settlementSelect");
    p.disabled = !rules?.provinceEnabled;
    s.disabled = !rules?.settlementEnabled;
    if (state.biomeCache.length > biomeLimit()) state.biomeCache = state.biomeCache.slice(0, biomeLimit());
    $("scopeHint").textContent = state.scope === "world"
      ? "Whole World selected: province and settlement selection are locked, biome cache expands to 15, and NPC travel can cross the world."
      : state.scope === "province"
      ? "Whole Province selected: settlement selection is locked, and NPC travel stays inside the selected province."
      : "Single Settlement selected: NPCs stay mostly inside their selected settlement with occasional local errands.";
    $("biomeLimitHint").textContent = `Biome cache limit: ${biomeLimit()} selected biome${biomeLimit() === 1 ? "" : "s"}.`;
  }

  function addRaceToCache() {
    const raceId = $("raceSelect").value;
    const race = allRaceDetails().find(r => r.id === raceId);
    if (!race) return;
    if (!state.raceCache.some(r => r.id === race.id)) state.raceCache.push(race);
    renderCaches();
    renderWarnings();
  }

  function addBiomeToCache() {
    const biomeId = $("biomeSelect").value;
    const biome = allBiomeOptions().find(b => b.id === biomeId);
    if (!biome) return;
    if (state.biomeCache.some(b => b.id === biome.id)) return;
    if (state.biomeCache.length >= biomeLimit()) {
      warnOnce(`Biome cache is already at its current limit of ${biomeLimit()}.`);
      return;
    }
    state.biomeCache.push(biome);
    renderCaches();
    renderWarnings();
  }

  function warnOnce(message) {
    if (!state.warnings.includes(message)) state.warnings.push(message);
    renderWarnings();
  }

  function renderCaches() {
    $("raceCache").innerHTML = state.raceCache.length ? state.raceCache.map(r => `<span class="chip">${escapeHTML(r.name)} <button data-remove-race="${escapeHTML(r.id)}" title="Remove">×</button></span>`).join("") : `<span class="hint">No race cache yet. Add at least one race or generation will use all races.</span>`;
    $("biomeCache").innerHTML = state.biomeCache.length ? state.biomeCache.map(b => `<span class="chip">${escapeHTML(b.category)}: ${escapeHTML(b.name)} <button data-remove-biome="${escapeHTML(b.id)}" title="Remove">×</button></span>`).join("") : `<span class="hint">No biome cache yet. Add biomes to guide location and travel assignment.</span>`;
    document.querySelectorAll("[data-remove-race]").forEach(btn => btn.addEventListener("click", () => { state.raceCache = state.raceCache.filter(r => r.id !== btn.dataset.removeRace); renderCaches(); renderWarnings(); }));
    document.querySelectorAll("[data-remove-biome]").forEach(btn => btn.addEventListener("click", () => { state.biomeCache = state.biomeCache.filter(b => b.id !== btn.dataset.removeBiome); renderCaches(); renderWarnings(); }));
  }

  function renderAll() {
    if (state.data && Array.isArray(state.npcs)) {
      const allowed = allRaceDetails();
      const allowedById = new Map(allowed.map(r => [r.id,r]));
      state.npcs.forEach(n => {
        const valid = allowedById.get(n.race?.id) || allowed.find(r => r.name === n.race?.name);
        if (!valid && n.race) {
          const fallback = allowed[0];
          n.race = {id:fallback.id,name:fallback.name,category:fallback.category,bloodline:null,source:'approved-canon-reassigned'};
        }
      });
      sanitizeRaceCache();
    }

    $("seedInput").value = state.seed;
    $("npcCount").value = state.npcCount;
    $("dangerSelect").value = state.danger;
    applyScopeRules();
    renderCaches();
    renderSummary();
    renderWarnings();
    renderNPCs();
    renderRelationshipTracker();
    writeCompanionHandoff();
    window.dispatchEvent(new CustomEvent("life-simulator:core-rendered", { detail: window.LifeSimulator }));
  }

  function renderSummary() {
    const province = currentProvince();
    const settlement = currentSettlement();
    const scopeName = state.data.livingRules.scopeRules[state.scope].label;
    $("summaryLine").textContent = `${scopeName}. ${province ? province.name : "No province"}${state.scope === "settlement" && settlement ? ` → ${settlement.name}` : ""}. ${state.npcs.length} NPCs in memory.`;
    const factionCount = new Set(state.npcs.map(n => n.faction?.name).filter(Boolean)).size;
    const settlementCount = new Set(state.npcs.map(n => n.assignment?.settlementId).filter(Boolean)).size;
    const provinceCount = new Set(state.npcs.map(n => n.assignment?.provinceId).filter(Boolean)).size;
    $("statsGrid").innerHTML = [
      [state.npcs.length, "NPCs in Memory"], [state.customLocations.length, "Imported / Custom Locations"], [state.importedDocuments.length, "Scanned Documents"], [state.raceCache.length || "All", "Race Cache"], [state.biomeCache.length, `Biome Cache / ${biomeLimit()}`], [provinceCount, "Used Provinces"], [settlementCount, "Used Settlements"], [factionCount, "Active Factions"]
    ].map(([num,label]) => `<div class="stat"><strong>${escapeHTML(num)}</strong><span>${escapeHTML(label)}</span></div>`).join("");
  }

  function validate() {
    const warnings = [];
    if (!state.raceCache.length) warnings.push("Race cache is empty; generation will draw from the full race list.");
    if (!state.biomeCache.length) warnings.push("Biome cache is empty; NPCs may use any settlement biome.");
    if (state.scope === "settlement" && !state.settlementId) warnings.push("No settlement is selected.");
    if (state.scope === "province" && !state.provinceId) warnings.push("No province is selected.");
    if (state.scope !== "world" && state.biomeCache.length > 3) warnings.push("Non-world scopes should use no more than 3 biomes.");
    for (const axis of AXES) {
      const v = state.alignmentPreference[axis];
      if (v <= 500 || v >= 2500) warnings.push(`${axis} preference is at an extreme; generated NPCs will show sharper civic pressure on that axis.`);
    }
    state.warnings = [...new Set([...warnings, ...state.warnings.filter(w => w.startsWith("Imported") || w.includes("already"))])].slice(0, 12);
  }

  function renderWarnings() {
    validate();
    $("warnings").innerHTML = state.warnings.length ? state.warnings.map(w => `<div class="warning">${escapeHTML(w)}</div>`).join("") : `<div class="hint">No validation warnings.</div>`;
  }

  function describeAxis(axis, value) {
    const engine = alignmentEngine();
    if (engine && typeof engine.scoreToAxisPhase === "function") {
      return engine.scoreToAxisPhase(alignmentAxisKey(axis), value).label.toLowerCase();
    }
    const d = value - 1500;
    const term = axisTerm(axis, value);
    if (d === 0) return `true neutral ${axisDisplayName(axis)}`;
    const ad = Math.abs(d);
    const degree = ad >= 1000 ? "extremely" : ad >= 750 ? "very" : ad >= 500 ? "moderately" : "slightly";
    return `${degree} ${term} (${alignmentPhase(value)})`;
  }

  function generateNPCs() {
    state.seed = $("seedInput").value || "Life Simulator";
    state.npcCount = clamp(parseInt($("npcCount").value, 10) || 1, 1, 500);
    const rng = makeRng(`${state.seed}|${state.scope}|${Date.now()}`);
    sanitizeRaceCache();
    const selectedSettlements = settlementsForScope();
    const races = state.raceCache.length ? state.raceCache : allRaceDetails();
    if (!selectedSettlements.length) {
      warnOnce("No settlements matched the current province/biome filters. Add a broader biome or import a fuller province file.");
      return;
    }
    const npcs = [];
    for (let i = 0; i < state.npcCount; i++) {
      const settlement = pick(selectedSettlements, rng);
      const province = flattenProvinces().find(p => p.id === settlement.provinceId || p.name === settlement.provinceName || p.name === settlement.province);
      const race = pick(races, rng);
      const npc = makeNPC(state.npcs.length + i, race, province, settlement, rng);
      npc.source = { type:"generated", priority:"generated" };
      npcs.push(npc);
    }
    // The attached dice and language engine is internal-only. Each settlement group
    // receives its six-die opening pool, 232-set d20 assignments, and exact-half
    // trans/demi overrides; no dice controls or independent generator page.
    const identityGroups = new Map();
    for (const npc of npcs) {
      const kind = window.BelavadosIdentityEngine.settlementSize(npc.assignment?.settlementType);
      if (!identityGroups.has(kind)) identityGroups.set(kind, []);
      identityGroups.get(kind).push(npc);
    }
    for (const [kind, group] of identityGroups) {
      window.BelavadosIdentityEngine.assignPopulation(group, {
        seed: `${state.seed}|npc-generation|${Date.now()}|${kind}`,
        size: kind, rerollIdentities: true
      });
    }
    createRelationships(npcs, rng);
    state.npcs = uniqueBy([...state.npcs, ...npcs], n => n.id || slug(n.name));
    ensureNpcExpansion(state.npcs, rng, { linkExisting:true });
    // V7: adult-only reciprocal relationships; at least 60% of the whole population attached.
    window.BelavadosRelationshipEngine?.ensureCoverage(state.npcs, rng);
    addRelationshipScheduleContext(state.npcs, rng);
    state.generatedAt = new Date().toISOString();
    state.warnings = state.warnings.filter(w => !w.includes("already at"));
    warnOnce(`Generated ${npcs.length} NPCs and linked them into the existing NPC network.`);
    renderAll();
  }

  function settlementsForScope() {
    let settlements = [];
    if (state.scope === "world") settlements = flattenSettlements();
    else if (state.scope === "province") settlements = (currentProvince()?.settlements || []).map(s => ({...s, provinceId: currentProvince().id, provinceName: currentProvince().name, province: currentProvince().name}));
    else settlements = currentSettlement() ? [{...currentSettlement()}] : [];
    if (state.biomeCache.length) {
      const ids = new Set(state.biomeCache.map(b => b.id));
      const filtered = settlements.filter(s => (s.biomes || []).some(b => ids.has(b.id)));
      if (filtered.length) settlements = filtered;
    }
    return settlements;
  }

  function chooseRaceBloodline(race, rng) {
    const options = Array.isArray(race?.bloodlines) ? race.bloodlines.filter(Boolean) : [];
    if (!options.length) return null;
    return matchRaceBloodline(race, pick(options, rng));
  }

  function makeNPC(index, race, province, settlement, rng) {
    const gender = pick(state.data.livingRules.genderIdentities, rng);
    const age = Math.floor(16 + rng() * 62);
    const name = makeName(race, gender, rng);
    const bloodline = chooseRaceBloodline(race, rng);
    const job = pick(weightJobsForSettlement(settlement), rng);
    const locations = assignLocations(job, province, settlement, rng);
    const faction = chooseFaction(job, locations.work?.name || "", rng);
    const classInfo = chooseClass(job, faction, rng);
    const alignment = makeAlignment(race, rng, classInfo, state.danger, `${index}|${name}|${race?.name || "race"}|${settlement?.id || settlement?.name || "settlement"}`);
    const traits = sample(state.data.livingRules.traits, 3, rng);
    const hobbies = sample(state.data.livingRules.hobbies, 2 + Math.floor(rng()*2), rng);
    const want = pick(state.data.livingRules.wants, rng);
    const fear = pick(state.data.livingRules.fears, rng);
    const aspiration = pick(state.data.livingRules.aspirations, rng);
    const personalitySeed = pick(state.data.livingRules.personalitySeeds, rng);
    const route = makeTravelRoute(province, settlement, locations, rng);
    const npc = {
      id: `npc_${Date.now().toString(36)}_${index}_${slug(name)}`,
      name, age, genderIdentity: gender.identity, pronouns: gender.pronouns,
      race: { id: race.id, name: race.name, category: race.category, creatorGod: race.creatorGod, bloodline, bloodlinesAvailable: Array.isArray(race.bloodlines) ? race.bloodlines.map(b => ({ id:b.id, name:b.name, source:b.source || "compendium" })) : [], source: race.source || "compendium", habitatTags: race.habitatTags || [] },
      alignment,
      alignmentSummary: AXES.map(axis => describeAxis(axis, alignment.scores[axis])).join(", "),
      job: { title: job.title, category: job.category },
      class: classInfo,
      faction,
      traits,
      personality: `${name} is ${traits.join(", ")}, and ${personalitySeed}.`,
      wants: [want], fears: [fear], aspirations: [aspiration], hobbies,
      assignment: {
        scope: state.scope,
        provinceId: province?.id || settlement.provinceId,
        provinceName: province?.name || settlement.provinceName || settlement.province,
        settlementId: settlement.id,
        settlementName: settlement.name,
        settlementType: settlement.type,
        governmentType: settlement.governmentType,
        timeZone: settlement.timeZone,
        biomes: settlement.biomes || []
      },
      assignedLocations: locations,
      travelRange: state.scope === "world" ? "world-wide" : state.scope === "province" ? "province-wide" : "settlement-wide",
      transitRoute: route,
      schedules: makeSchedule(job, locations, route, rng),
      relationships: { familial: [], romantic: [], personal: [], professional: [] },
      familyTree: { householdId: null, role: "independent", guardians: [], dependents: [], siblings: [], partners: [] },
      rumors: makeRumors(name, job, faction, locations, rng),
      secrets: makeSecret(name, job, faction, rng),
      createdAt: new Date().toISOString()
    };
    return npc;
  }

  function makeName(race, gender, rng) {
    const starts = ["Ael","Vael","Syr","Thal","Myr","Elar","Nym","Cor","Ish","Vey","Drav","Sol","Khar","Lun","Ryn","Ost","Fael","Zor","Cind","Tav","Mara","Nef","Kael","Yva","Oryn","Qel"];
    const mids = ["an","or","ith","av","un","ess","ir","al","eth","om","yr","esh","ara","iel","oth","en","is","ai"];
    const ends = ["wyn","thir","vane","rith","mora","keth","sara","dros","lune","var","neth","voss","rielle","dun","myr","zeth","rune","thara"];
    const surnames = ["Vaelriven","Duskmere","Clockroot","Emberledger","Thornwake","Glasswater","Ashdrift","Moonquill","Railborne","Vexford","Hearthglen","Mistwarden","Brassvale","Sablebrook","Stormmere","Gravecrown"];
    const raceHint = race?.name ? race.name.split(/\s|-/)[0].replace(/[^A-Za-z]/g, "") : "Bel";
    const given = `${pick(starts,rng)}${pick(mids,rng)}${pick(ends,rng)}`.replace(/\b\w/g, ch => ch.toUpperCase());
    const family = rng() < .28 ? `${raceHint}${pick(ends,rng)}` : pick(surnames, rng);
    return `${given} ${family}`;
  }

  function weightJobsForSettlement(settlement) {
    const jobs = [...state.data.livingRules.jobs];
    const biomeText = JSON.stringify(settlement.biomes || []).toLowerCase();
    const extras = [];
    if (biomeText.includes("ocean") || biomeText.includes("river") || biomeText.includes("underwater")) extras.push("Steamship Pilot", "Fisher / Tidewatcher", "Submarine Navigator");
    if (biomeText.includes("mountain") || biomeText.includes("cavern")) extras.push("Foundry Worker", "Artificer Mechanic");
    if (biomeText.includes("forest") || biomeText.includes("rainforest")) extras.push("Herbalist", "Refuge Shelter Coordinator");
    if (settlement.type === "Capital City") extras.push("Death-Ledger Clerk", "Ichor Licensing Inspector", "Temple Record-Keeper", "Cult Investigator");
    return jobs.concat(extras.map(t => jobs.find(j => j.title === t)).filter(Boolean));
  }

  function makeTraditionalDndAlignment(rng, identitySeed = "npc") {
    const selected = state.traditionalAlignment && state.traditionalAlignment !== "random" ? state.traditionalAlignment : pick(DND_ALIGNMENT_CHOICES, rng);
    const scores = { ...(DND_ALIGNMENT_SCORES[selected] || DND_ALIGNMENT_SCORES["True Neutral"]) };
    const descriptors = Object.fromEntries(AXES.map(axis => [axis, describeAxis(axis, scores[axis]) ]));
    const terms = Object.fromEntries(AXES.map(axis => [axis, axisTerm(axis, scores[axis]) ]));
    const phases = Object.fromEntries(AXES.map(axis => [axis, alignmentPhase(scores[axis]) ]));
    return {
      system: "Traditional D&D alignment",
      dndAlignment: selected,
      scale: [0, 3000],
      neutralCenter: 1500,
      positionStep: 1,
      axisOrder: AXES,
      axisNames: Object.fromEntries(AXES.map(axis => [axis, axisDisplayName(axis)])),
      axisTerms: terms,
      phases,
      alignmentName: selected,
      profileName: selected,
      fullAlignmentLabel: `${selected} / ${AXES.map(axis => descriptors[axis]).join(" / ")}`,
      scores,
      descriptors,
      seed: identitySeed
    };
  }

  function makeAlignment(race, rng, classInfo = null, settlementDangerLevel = state.danger, identitySeed = "npc") {
    if (state.alignmentMode === "dnd") return makeTraditionalDndAlignment(rng, identitySeed);
    const engine = alignmentEngine();
    const danger = alignmentDangerKey(settlementDangerLevel);
    if (engine && typeof engine.randomizeNPC === "function") {
      const randomized = engine.randomizeNPC({
        id: identitySeed,
        npcId: identitySeed,
        race,
        classes: classesForAlignment(classInfo),
        settlementDangerLevel: danger
      }, alignmentOptions(identitySeed));
      return adaptRandomizerAlignment(randomized.alignment);
    }
    if (engine && typeof engine.generateAlignment === "function") {
      const result = engine.generateAlignment({
        npcId: identitySeed,
        race,
        classes: classesForAlignment(classInfo),
        settlementDangerLevel: danger
      }, alignmentOptions(identitySeed));
      return adaptRandomizerAlignment(result);
    }

    // Safety fallback if the external randomizer script is missing: keep the old
    // race/local/danger blend, but remove heavy neutral snapping.
    const raceScores = race?.alignment || {Altruism:1500,Lawfulness:1500,Cooperation:1500,Honor:1500};
    let scores = {};
    const descriptors = {};
    const terms = {};
    const phases = {};
    for (const axis of AXES) {
      const local = state.alignmentPreference[axis] ?? 1500;
      const dangerPush = {peaceful:120, safe:75, low:35, moderate:0, dangerous:-90, high:-135, extreme:-210, lethal:-285}[danger] || 0;
      const randomLife = (rng() - .5) * 1700;
      let score = raceScores[axis] * .46 + local * .16 + (1500 + randomLife + (axis === "Honor" || axis === "Cooperation" ? dangerPush : dangerPush * .65)) * .38;
      scores[axis] = clamp(Math.round(score), 0, 3000);
    }
    scores = deNeutralizeFallbackScores(scores, rng);
    for (const axis of AXES) {
      descriptors[axis] = describeAxis(axis, scores[axis]);
      terms[axis] = axisTerm(axis, scores[axis]);
      phases[axis] = alignmentPhase(scores[axis]);
    }
    return {
      system:"Axis alignment fallback",
      scale:[0,3000],
      neutralCenter:1500,
      positionStep:1,
      axisOrder:AXES,
      axisNames:Object.fromEntries(AXES.map(axis => [axis, axisDisplayName(axis)])),
      axisTerms:terms,
      phases,
      alignmentName: alignmentNameFromScores(scores),
      profileName: alignmentNameFromScores(scores),
      scores,
      descriptors
    };
  }

  function getLocationPool(settlement) {
    const pools = state.data.visitableLocations.settlementTypes || [];
    const size = settlement.type === "Capital City" ? "Capital City" : settlement.type;
    const biomeIds = new Set((settlement.biomes || []).map(b => b.id));
    let rows = pools.filter(p => p.size === size && biomeIds.has(slug(`${p.terrain}_${p.variant}`)));
    if (!rows.length) rows = pools.filter(p => p.size === size);
    if (!rows.length) rows = pools;
    const names = [...new Set(rows.flatMap(r => r.locations || []))];
    const custom = (state.customLocations || [])
      .filter(loc => !loc.settlementId || loc.settlementId === settlement.id || loc.settlementName === settlement.name)
      .map(loc => loc.name)
      .filter(Boolean);
    const merged = [...new Set([...custom, ...names])];
    return merged.length ? merged : ["House cluster", "Market hall", "Temple", "Rail station", "Public park", "Town hall"];
  }

  function findLocation(pool, keywords, fallback, rng) {
    const found = pool.filter(name => keywords.some(k => name.toLowerCase().includes(k.toLowerCase())));
    return pick(found.length ? found : pool.filter(n => fallback.some(k => n.toLowerCase().includes(k.toLowerCase()))), rng) || pick(pool, rng) || "Unassigned Location";
  }

  function makeLocationObject(name, category, settlement) {
    const custom = (state.customLocations || []).find(loc => loc.name === name && (!loc.settlementId || loc.settlementId === settlement.id || loc.settlementName === settlement.name));
    return {
      id: custom?.id || `loc_${slug(settlement.id)}_${slug(name)}`,
      name,
      category: custom?.category || category,
      settlementId: custom?.settlementId || settlement.id,
      settlementName: custom?.settlementName || settlement.name,
      province: custom?.province || settlement.provinceName || settlement.province,
      timeZone: custom?.timeZone || settlement.timeZone,
      source: custom?.source || "generated-location-pool",
      imported: Boolean(custom)
    };
  }

  function assignLocations(job, province, settlement, rng) {
    const pool = getLocationPool(settlement);
    const homeName = findLocation(pool, ["apartment","residence","house","boarding","tenement","rowhouse","loft"], ["house", "rental", "inn"], rng);
    const workName = findLocation(pool, job.locationKeywords || [], ["market","hall","station","office","guild","shop","temple"], rng);
    const personalName = findLocation(pool, ["park","garden","tavern","tea","library","shrine","festival","bathhouse","theater"], ["market","square"], rng);
    const professionalName = findLocation(pool, ["transit","rail","caravan","ferry","steamship","skyship","submarine","portal","customs","guild","archive","permit"], ["office", "hall", "station"], rng);
    return {
      home: makeLocationObject(homeName, "home", settlement),
      work: makeLocationObject(workName, "work", settlement),
      personal: makeLocationObject(personalName, "personal", settlement),
      professionalTravel: makeLocationObject(professionalName, "professional travel", settlement)
    };
  }

  function chooseFaction(job, workName, rng) {
    const text = `${job.title} ${job.category} ${workName}`.toLowerCase();
    const matches = state.data.factionRules.factions.filter(f => (f.jobKeywords || []).some(k => text.includes(k.toLowerCase())));
    const faction = matches.length ? pick(matches, rng) : (rng() < .18 ? pick(state.data.factionRules.factions, rng) : null);
    if (!faction) return null;
    const tierRoll = rng();
    const tier = tierRoll > .94 ? 3 : tierRoll > .72 ? 2 : tierRoll > .35 ? 1 : 0;
    const badge = ["No Badge", "Bronze Badge", "Silver Badge", "Gold Badge"][tier];
    const passEligible = tier === 3 && rng() > .45;
    return { id:faction.id, name:faction.name, role:faction.role, tier, badge, reputation: Math.floor([5,45,120,190][tier] + rng()*45), portalPass: passEligible ? pick(state.data.factionRules.portalPassTypes, rng) : null };
  }

  function parseClassHint(hint) {
    if (!hint) return null;
    const [className, subclass] = hint.split(":");
    return { className, subclass: subclass || "—" };
  }
  function chooseClass(job, faction, rng) {
    const hints = [...(job.classHints || []), ...(faction ? (state.data.factionRules.factions.find(f => f.id === faction.id)?.classOptions || []) : [])];
    if (!hints.length && rng() > .28) return { primaryClass:"Commoner", primarySubclass:"—", multiClass:false, secondaryClass:null, secondarySubclass:null, reason:"No adventuring class needed for ordinary work." };
    const first = parseClassHint(pick(hints.length ? hints : ["Fighter:Champion", "Rogue:Inquisitive", "Bard:Lore", "Cleric:Knowledge", "Artificer:Alchemist"], rng));
    const multi = rng() < .16;
    const second = multi ? parseClassHint(pick(hints.filter(h => h !== `${first.className}:${first.subclass}`).length ? hints : ["Rogue:Scout", "Bard:Eloquence", "Wizard:Divination", "Ranger:Hunter"], rng)) : null;
    return { primaryClass:first.className, primarySubclass:first.subclass, multiClass:multi, secondaryClass:second?.className || null, secondarySubclass:second?.subclass || null, reason: job.title };
  }

  function makeTravelRoute(province, settlement, locations, rng) {
    const available = Object.entries(settlement.transitProfile || {}).filter(([k,v]) => v && k !== "land").map(([k]) => k);
    const modeId = pick(available.length ? available : ["caravan"], rng);
    const mode = state.data.transitRules.modes.find(m => m.id === modeId) || {name:"Caravan"};
    let destination = settlement.name;
    if (state.scope === "province") {
      const choices = (currentProvince()?.settlements || []).filter(s => s.id !== settlement.id);
      destination = pick(choices, rng)?.name || settlement.name;
    } else if (state.scope === "world") {
      const choices = flattenSettlements().filter(s => s.id !== settlement.id);
      const d = pick(choices, rng);
      destination = d ? `${d.name}, ${d.provinceName || d.province}` : settlement.name;
    }
    const visual = TRANSIT_MODE_VISUALS[modeId] || { emoji:"🧳", activity:"Traveling", label:mode.name };
    return { id:`route_${slug(settlement.id)}_${modeId}_${slug(destination)}`, mode: mode.name, modeId, origin: settlement.name, destination, purpose: pick(["work transfer","supply errand","family visit","faction check-in","market day","medical escort","record delivery"], rng), access: modeId === "portal" ? "requires legal pass or official sponsorship" : "public or chartered fare", emoji: visual.emoji, activity: visual.activity, icon: visual.icon || null };
  }

  function activityVisual(activity) {
    const known = ACTIVITY_VISUALS[activity];
    if (known) return known;
    return {
      activity: activity || "Unknown activity",
      group: "unmappedImportedActivity",
      emoji: ACTIVITY_EMOJIS[activity] || "•",
      imageAsset: `${ACTIVITY_ASSET_ROOT}unmapped_imported_activity.svg`,
      assetType: "emoji-svg",
      alt: `${activity || "Unknown activity"} activity icon`
    };
  }
  function activityEmoji(activity) { return activityVisual(activity).emoji; }
  function poolActivities(group) { return (ACTIVITY_EMOJI_GROUPS[group] || []).map(([activity]) => activity); }
  function locationEmoji(location) {
    const text = `${location?.category || ""} ${location?.name || ""}`.toLowerCase();
    if (text.includes("home") || text.includes("house") || text.includes("residence") || text.includes("apartment") || text.includes("boarding")) return LOCATION_EMOJIS.Home;
    if (text.includes("hospital") || text.includes("clinic") || text.includes("healer")) return LOCATION_EMOJIS["Hospital / healer"];
    if (text.includes("library") || text.includes("archive")) return LOCATION_EMOJIS.Library;
    if (text.includes("tavern") || text.includes("inn") || text.includes("ale")) return LOCATION_EMOJIS.Tavern;
    if (text.includes("market") || text.includes("bazaar") || text.includes("shop") || text.includes("stall")) return LOCATION_EMOJIS.Market;
    if (text.includes("park") || text.includes("garden")) return LOCATION_EMOJIS.Park;
    if (text.includes("chapel")) return LOCATION_EMOJIS.Chapel;
    if (text.includes("temple") || text.includes("shrine") || text.includes("cathedral")) return text.includes("shrine") ? LOCATION_EMOJIS["Deity shrine"] : LOCATION_EMOJIS.Temple;
    if (text.includes("prison") || text.includes("jail")) return LOCATION_EMOJIS.Prison;
    if (text.includes("court") || text.includes("council") || text.includes("hall")) return LOCATION_EMOJIS["Court / council"];
    if (text.includes("square")) return LOCATION_EMOJIS["Public square"];
    if (text.includes("hidden") || text.includes("contact")) return LOCATION_EMOJIS["Hidden contact location"];
    if (text.includes("work") || text.includes("guild") || text.includes("office") || text.includes("station")) return LOCATION_EMOJIS.Work;
    return "📍";
  }
  function scheduleEntry(day, startTime, endTime, location, activity, reason, secrecy = "public", extra = {}) {
    const visual = activityVisual(activity);
    // This routine generates new NPC schedules. Imported source schedules are left untouched.
    const azaTime = value => { const [h,m]=String(value).split(':').map(Number);
      const total=Math.min(1260,Math.round((((h||0)*60+(m||0))*21)/24));
      return String(Math.floor(total/60)).padStart(2,'0')+':'+String(total%60).padStart(2,'0'); };
    return {
      weekday: day,
      startTime:azaTime(startTime),
      endTime:azaTime(endTime),
      locationId: location?.id || "",
      locationName: location?.name || "",
      locationEmoji: locationEmoji(location),
      activity,
      emoji: visual.emoji,
      activityImage: visual.imageAsset,
      activityVisual: visual,
      reason: reason || activity,
      secrecy,
      repeats: true,
      ...extra
    };
  }
  function transitScheduleEntry(day, startTime, endTime, location, route, reason, secrecy = "public", extra = {}) {
    const visual = TRANSIT_MODE_VISUALS[route?.modeId] || { emoji:"🧳", activity:"Traveling", label:route?.mode || "Travel" };
    return scheduleEntry(day, startTime, endTime, location, visual.activity, reason, secrecy, {
      transitRouteId: route?.id,
      transitModeId: route?.modeId,
      transitMode: route?.mode,
      transitEmoji: visual.emoji,
      transitIcon: visual.icon || null,
      transitImage: visual.icon?.src || activityVisual(visual.activity).imageAsset,
      transitVisual: visual,
      ...extra
    });
  }
  function workActivitiesForJob(job) {
    const text = `${job.title} ${job.category}`.toLowerCase();
    if (/rail|skyship|steamship|submarine|caravan|transit|logistics|dock|pilot|navigator|quartermaster|courier|marshal/.test(text)) return ["Counting inventory", "Loading cargo", "Unloading cargo", "Maintaining machinery", "Delivering goods", "Escorting travelers", "Traveling for business", "Writing reports"];
    if (/apothecary|health|healer|clinic|hospital|medicine|alchemy/.test(text)) return ["Healing patients", "Brewing potions", "Treating injuries", "Writing reports", "Meeting clients", "Cleaning"];
    if (/temple|cleric|religion|lore|record|shrine|cult|magic|wizard|ritual|archive/.test(text)) return ["Studying magical texts", "Performing rituals", "Researching", "Praying", "Leading worship", "Writing reports"];
    if (/guard|peacekeeper|law|court|inspector|civic|administration|ledger|tax|investigator/.test(text)) return ["Guard duty", "Patrolling", "Filing paperwork", "Performing inspections", "Investigating crimes", "Enforcing laws", "Writing reports"];
    if (/smith|foundry|mechanic|artificer|craft|sew|tailor|builder|repair/.test(text)) return ["Crafting", "Smithing", "Repairing equipment", "Maintaining machinery", "Training apprentices", "Counting inventory"];
    if (/farm|herbal|forest|refuge|fisher|tidewatcher|ranch/.test(text)) return ["Farming", "Fishing", "Checking on animals", "Collecting supplies", "Gardening", "Repairing equipment"];
    if (/merchant|trader|market|tavern|host|cook|inn|customer/.test(text)) return ["Serving customers", "Trading", "Bargaining", "Taking orders", "Hosting patrons", "Counting inventory", "Cooking"];
    return ["Working at a desk", "Meeting clients", "Filing paperwork", "Writing reports", "Continuing work", "Taking a break"];
  }
  function restOrLeisureActivity(rng) {
    return pick(["Visiting friends", "Going to the market", "Attending festivals", "Reading", "Studying", "Shopping", "Walking", "Exercising", "Visiting scenic spots", "Gardening", "Practicing a hobby", "Visiting family", "Attending performances", "Vacationing"], rng);
  }
  function eveningActivity(job, rng) {
    const text = `${job.title} ${job.category}`.toLowerCase();
    if (/guard|peacekeeper|watch/.test(text) && rng() < .25) return "Patrolling streets";
    if (/tavern|merchant|host|cook/.test(text) && rng() < .25) return "Locking up shops";
    if (/temple|religion|cleric|shrine/.test(text) && rng() < .25) return "Going to church or temple";
    return pick(["Relaxing", "Reading", "Playing games", "Spending time with family", "Talking with neighbors", "Attending dinner gatherings", "Visiting the tavern"], rng);
  }
  function nightActivity(job, rng) {
    const text = `${job.title} ${job.category}`.toLowerCase();
    if (/guard|peacekeeper|watch|marshal/.test(text) && rng() < .35) return "Night patrol";
    if (/cult|spy|investigator|criminal/.test(text) && rng() < .18) return pick(["Secret meetings", "Spying", "Visiting hidden contacts"], rng);
    if (/temple|magic|ritual/.test(text) && rng() < .12) return "Performing rituals";
    return "Sleeping";
  }
  function makeSchedule(job, locations, route, rng) {
    const schedule = [];
    const workActs = workActivitiesForJob(job);
    for (let i = 0; i < BEL_WEEKDAYS.length; i++) {
      const day = BEL_WEEKDAYS[i];
      const rest = day === "Day 3";
      const travelDay = !rest && (i === 1 || i === 4);
      const morningStart = rng() < .18 ? "05:30" : "06:00";
      schedule.push(scheduleEntry(day, morningStart, "06:20", locations.home, rng() < .16 ? "Waking late or early" : "Waking up", "morning wake-up", "private"));
      schedule.push(scheduleEntry(day, "06:20", "06:50", locations.home, pick(["Washing up", "Brushing hair", "Shaving", "Bathing", "Dressing"], rng), "getting ready for the day", "private"));
      schedule.push(scheduleEntry(day, "06:50", "07:25", locations.home, "Making breakfast", "breakfast before duties", "private"));
      if (!rest) {
        schedule.push(scheduleEntry(day, "07:25", "08:00", locations.work, pick(["Leaving home", "Walking", "Riding horseback", "Driving a cart", "Waiting for transport"], rng), `commuting to ${locations.work.name}`, "public"));
        schedule.push(scheduleEntry(day, "08:00", "10:15", locations.work, pick(workActs, rng), `${job.title} morning duties`, "public"));
        schedule.push(scheduleEntry(day, "10:15", "10:35", locations.work, pick(["Taking a break", "Checking messages", "Counting inventory", "Preparing tools or supplies"], rng), "brief workday reset", "public"));
        schedule.push(scheduleEntry(day, "10:35", "12:00", locations.work, pick(workActs, rng), `${job.title} duties`, "public"));
        schedule.push(scheduleEntry(day, "12:00", "13:00", locations.personal, pick(["Eating lunch", "Socializing", "Running errands", "Praying", "Meeting friends"], rng), "midday active hour", "public"));
        schedule.push(scheduleEntry(day, "13:00", "15:30", locations.work, pick(workActs.concat(["Continuing work", "Meeting with clients", "Training apprentices", "Conducting research"]), rng), "afternoon work block", "public"));
        schedule.push(scheduleEntry(day, "15:30", "16:30", locations.work, pick(["Writing reports", "Restocking shelves", "Making deliveries", "Doing repairs", "Filing paperwork", "Meeting with a faction"], rng), "late-day duties", rng() < .12 ? "private" : "public"));
        if (travelDay) {
          schedule.push(transitScheduleEntry(day, "16:30", "18:00", locations.professionalTravel, route, `professional travel: ${route.purpose} by ${route.mode}`, route.modeId === "portal" ? "logged" : "public"));
          schedule.push(scheduleEntry(day, "18:00", "18:35", locations.professionalTravel, pick(["Arriving in town", "Entering a port", "Waiting for transport", "Delivering cargo"], rng), `arrival and handoff for ${route.purpose}`, "public", { transitRouteId: route.id, transitModeId: route.modeId, transitMode: route.mode }));
        } else {
          schedule.push(scheduleEntry(day, "16:30", "17:25", locations.personal, pick(["Running errands", "Shopping", "Visiting public places", "Gossiping", "People-watching", "Collecting supplies", "Delivering messages", "Negotiating deals"], rng), "after-work errand or civic stop", rng() < .18 ? "private" : "public"));
          schedule.push(scheduleEntry(day, "17:25", "18:00", locations.home, "Returning home", "returning home after duties", "public"));
        }
      } else {
        schedule.push(scheduleEntry(day, "07:25", "09:30", locations.home, pick(["Sleeping in", "Reading before bed", "Meditating", "Daydreaming", "Sitting quietly"], rng), "slower rest-day morning", "private"));
        schedule.push(scheduleEntry(day, "09:30", "11:00", locations.personal, restOrLeisureActivity(rng), "rest day leisure", "public"));
        schedule.push(scheduleEntry(day, "11:00", "12:30", locations.personal, pick(["Going to the market", "Visiting friends", "Visiting family", "Attending a chapel", "Visiting scenic spots", "Shopping"], rng), "rest day visit", rng() < .14 ? "private" : "public"));
        schedule.push(scheduleEntry(day, "12:30", "13:30", locations.personal, "Eating lunch", "rest day meal", "public"));
        schedule.push(scheduleEntry(day, "13:30", "15:30", locations.personal, restOrLeisureActivity(rng), "afternoon off-duty activity", "public"));
        schedule.push(scheduleEntry(day, "15:30", "17:30", locations.home, pick(["Cleaning", "Laundry", "Repairing clothing", "Cooking", "Gardening", "Caring for animals", "Restocking supplies", "Organizing storage"], rng), "domestic maintenance", "private"));
        if (rng() < .32) schedule.push(transitScheduleEntry(day, "17:30", "18:30", locations.professionalTravel, route, `short leisure trip by ${route.mode}`, "public", { vacationFlag: true }));
      }
      schedule.push(scheduleEntry(day, "18:30", "19:15", locations.home, pick(["Cooking dinner", "Preparing dinner ingredients", "Having meals together", "Eating dinner"], rng), "evening meal", "private"));
      schedule.push(scheduleEntry(day, "19:15", "21:00", locations.personal, eveningActivity(job, rng), "evening routine", rng() < .16 ? "private" : "public"));
      schedule.push(scheduleEntry(day, "21:00", "22:00", locations.home, pick(["Preparing for bed", "Reading before bed", "Bathing", "Locking or unlocking doors", "Resting in bed"], rng), "settling in for the night", "private"));
      const night = nightActivity(job, rng);
      schedule.push(scheduleEntry(day, "22:00", "06:00", locations.home, night, night === "Sleeping" ? "sleep" : "night activity", night === "Sleeping" ? "private" : "restricted"));
    }
    return schedule;
  }

  function makeRumors(name, job, faction, locations, rng) {
    const rumors = [
      `${name} changed their route after a conversation near ${locations.professionalTravel.name}.`,
      `${name} knows which ledger entry connected ${locations.work.name} to a quiet audit.`,
      `${name} is said to keep a favor owed by someone at ${locations.personal.name}.`
    ];
    if (faction) rumors.push(`${name}'s ${faction.name} badge opens doors, but also leaves a paper trail.`);
    return sample(rumors, 2 + Math.floor(rng()*2), rng);
  }
  function makeSecret(name, job, faction, rng) {
    const base = [
      `${name} once signed a witness line they did not fully understand.`,
      `${name} hides a family record that contradicts an official archive.`,
      `${name} is saving money for a journey they cannot legally explain.`,
      `${name} has seen diluted ichor used in a way that was not listed on the license.`
    ];
    if (faction) base.push(`${name} suspects someone inside ${faction.name} is using their title for private leverage.`);
    return pick(base, rng);
  }

  function createRelationships(npcs, rng) {
    // Households and family trees.
    let householdIndex = 0;
    const pool = [...npcs].sort((a,b) => b.age - a.age);
    while (pool.length) {
      const size = Math.min(pool.length, 1 + Math.floor(rng()*4));
      const members = pool.splice(0, size);
      const hid = `household_${++householdIndex}_${slug(members[0].assignedLocations.home.name)}`;
      const adults = members.filter(n => n.age >= 20);
      const youths = members.filter(n => n.age < 20);
      members.forEach(m => { m.familyTree.householdId = hid; });
      if (members.length === 1) members[0].familyTree.role = "single-person household";
      if (adults.length >= 2) {
        adults[0].relationships.familial.push(rel(adults[1], "familial", "co-guardian or close household kin"));
        adults[1].relationships.familial.push(rel(adults[0], "familial", "co-guardian or close household kin"));
      }
      youths.forEach(y => {
        y.familyTree.role = "ward or younger household member";
        adults.slice(0,2).forEach(a => {
          y.familyTree.guardians.push({id:a.id, name:a.name});
          a.familyTree.dependents.push({id:y.id, name:y.name});
          y.relationships.familial.push(rel(a, "familial", "guardian"));
          a.relationships.familial.push(rel(y, "familial", "ward"));
        });
      });
      for (let i = 0; i < members.length; i++) for (let j = i+1; j < members.length; j++) {
        if (Math.abs(members[i].age - members[j].age) < 12) {
          members[i].familyTree.siblings.push({id:members[j].id, name:members[j].name});
          members[j].familyTree.siblings.push({id:members[i].id, name:members[i].name});
        }
      }
    }
    // Romantic, personal, and professional links.
    const adults = npcs.filter(n => n.age >= 18);
    sample(adults, Math.floor(adults.length * .45), rng).forEach((a, idx, arr) => {
      if (idx % 2 === 0 && arr[idx+1]) {
        const b = arr[idx+1];
        const status = pick(["dating","committed partners","engaged","spouses","civil partners"], rng);
        // Avoid romantic matches between existing household kin or linked relatives.
        if (a.familyTree?.householdId === b.familyTree?.householdId ||
            a.relationships.familial.some(x => x.npcId === b.id) ||
            b.relationships.familial.some(x => x.npcId === a.id)) return;
        a.relationships.romantic.push(rel(b, "romantic", status));
        b.relationships.romantic.push(rel(a, "romantic", status));
        a.familyTree.partners.push({id:b.id, name:b.name, status});
        b.familyTree.partners.push({id:a.id, name:a.name, status});
      }
    });
    npcs.forEach(a => {
      const candidates = npcs.filter(b => b.id !== a.id);
      const friend = pick(candidates, rng);
      if (friend) a.relationships.personal.push(rel(friend, "personal", pick(state.data.livingRules.relationshipTypes.personal, rng)));
      const coworker = pick(candidates.filter(b => b.job.category === a.job.category || b.faction?.id === a.faction?.id), rng);
      if (coworker) a.relationships.professional.push(rel(coworker, "professional", pick(state.data.livingRules.relationshipTypes.professional, rng)));
    });
  }
  function rel(other, category, label) { return { npcId: other.id, name: other.name, category, label }; }

  function addRelationshipScheduleContext(npcs, rng) {
    npcs.forEach(n => {
      const choices = [];
      const romantic = n.relationships.romantic?.[0];
      const family = n.relationships.familial?.[0];
      const personal = n.relationships.personal?.[0];
      const professional = n.relationships.professional?.[0];
      if (romantic) choices.push({ activity: romantic.label?.includes("married") ? "Spending time with spouse" : pick(["Dating", "Courting", "Meeting a partner", "Having meals together"], rng), target: romantic, label:"loved one" });
      if (family) choices.push({ activity: pick(["Visiting family", "Spending time with family", "Having meals together", "Running family errands"], rng), target: family, label:"family" });
      if (personal) choices.push({ activity: pick(["Meeting friends", "Visiting friends", "Supporting a friend", "Socializing"], rng), target: personal, label:"friend" });
      if (professional) choices.push({ activity: pick(["Mentoring", "Apprenticing", "Meeting with clients", "Settling disputes"], rng), target: professional, label:"professional contact" });
      if (!choices.length) return;
      const targets = n.schedules.filter(s => ["evening routine", "rest day visit", "rest day leisure", "afternoon off-duty activity", "midday active hour"].includes(s.reason));
      sample(targets, Math.min(2, choices.length), rng).forEach(slot => {
        const choice = pick(choices, rng);
        const visual = activityVisual(choice.activity);
        slot.activity = choice.activity;
        slot.emoji = visual.emoji;
        slot.activityImage = visual.imageAsset;
        slot.activityVisual = visual;
        slot.reason = `${choice.activity.toLowerCase()} with ${choice.label}: ${choice.target.name}`;
        slot.relationshipTarget = { npcId: choice.target.npcId, name: choice.target.name, category: choice.target.category, label: choice.target.label };
        if (choice.activity.includes("family") || choice.activity.includes("spouse") || choice.activity.includes("meals")) {
          slot.locationId = n.assignedLocations.home.id;
          slot.locationName = n.assignedLocations.home.name;
          slot.locationEmoji = locationEmoji(n.assignedLocations.home);
        }
      });
    });
  }

  function renderNPCs() {
    const q = ($("npcSearch")?.value || "").toLowerCase().trim();
    const pageList = npcsForPage(state.npcPage);
    let list = pageList;
    if (q) list = list.filter(n => JSON.stringify(n).toLowerCase().includes(q));
    const tpl = $("npcCardTemplate");
    const dir = $("npcDirectory");
    renderNpcPageTabs(pageList.length, list.length);
    if (!state.npcs.length) {
      dir.innerHTML = `<p class="hint">No NPCs generated yet. Choose a scope, add cache entries as desired, then generate NPCs.</p>`;
      renderSummary();
      return;
    }
    if (!list.length) {
      dir.innerHTML = `<p class="hint">No NPCs match this ${escapeHTML(npcPageLabel(state.npcPage).toLowerCase())} page${q ? " and search" : ""}. World and province-generated NPCs will appear on Settlement NPCs when their residence is the selected settlement.</p>`;
      renderSummary();
      return;
    }
    dir.innerHTML = "";
    for (const n of list) {
      const node = tpl.content.cloneNode(true);
      node.querySelector(".npc-name").textContent = n.name;
      const raceDisplay = n.race?.bloodline?.name ? `${n.race.name} / ${n.race.bloodline.name}` : n.race?.name || "Unknown race";
      node.querySelector(".npc-meta").textContent = `${n.age} • ${n.genderIdentity} (${n.pronouns}) • ${raceDisplay} • ${n.job.title}`;
      node.querySelector(".scope-badge").textContent = `${n.travelRange} • resides in ${n.assignment?.settlementName || "unknown"}`;
      node.querySelector(".npc-personality").textContent = n.personality;
      node.querySelector(".npc-quick").innerHTML = quickFields(n);
      node.querySelector(".alignment-bars").innerHTML = AXES.map(axis => axisBar(axis, n.alignment.scores[axis], n.alignment.descriptors[axis])).join("");
      node.querySelector(".details-body").innerHTML = detailsHTML(n);
      const actions = node.querySelector(".npc-card-actions");
      if (actions) actions.innerHTML = `<button type="button" data-open-npc="${escapeHTML(n.id)}">Expand</button><button type="button" data-reroll-npc="${escapeHTML(n.id)}">Reroll NPC</button>`;
      dir.appendChild(node);
    }
    dir.querySelectorAll("[data-reroll-npc]").forEach(btn => btn.addEventListener("click", () => rerollNpc(btn.dataset.rerollNpc)));
    renderSummary();
  }

  function npcPageLabel(page = state.npcPage) {
    return page === "province" ? "Province NPCs" : page === "settlement" ? "Settlement NPCs" : "World NPCs";
  }

  function residenceMatchesProvince(npc, province = currentProvince()) {
    if (!province) return true;
    return npc.assignment?.provinceId === province.id || npc.assignment?.provinceName === province.name;
  }

  function residenceMatchesSettlement(npc, settlement = currentSettlement()) {
    if (!settlement) return true;
    return npc.assignment?.settlementId === settlement.id || npc.assignment?.settlementName === settlement.name;
  }

  function npcsForPage(page = state.npcPage) {
    const list = state.npcs || [];
    if (page === "province") return list.filter(n => residenceMatchesProvince(n));
    if (page === "settlement") return list.filter(n => residenceMatchesSettlement(n));
    return list;
  }

  function renderNpcPageTabs(pageTotal = npcsForPage(state.npcPage).length, visibleTotal = pageTotal) {
    document.querySelectorAll("[data-npc-page]").forEach(btn => {
      const active = (btn.dataset.npcPage || "world") === state.npcPage;
      btn.classList.toggle("active", active);
      btn.setAttribute("aria-selected", active ? "true" : "false");
    });
    const summary = $("npcPageSummary");
    if (!summary) return;
    const province = currentProvince();
    const settlement = currentSettlement();
    const residenceNote = state.npcPage === "settlement"
      ? `Showing residents of ${settlement?.name || "the selected settlement"}. This includes NPCs generated at world or province scope whose residence is here.`
      : state.npcPage === "province"
      ? `Showing NPCs whose residence is in ${province?.name || "the selected province"}.`
      : "Showing every NPC in memory across the current world packet.";
    summary.textContent = `${npcPageLabel()}: ${visibleTotal} visible / ${pageTotal} on this page. ${residenceNote}`;
  }

  function quickFields(n) {
    const cls = n.class.multiClass ? `${n.class.primaryClass} (${n.class.primarySubclass}) / ${n.class.secondaryClass} (${n.class.secondarySubclass})` : `${n.class.primaryClass}${n.class.primarySubclass && n.class.primarySubclass !== "—" ? ` (${n.class.primarySubclass})` : ""}`;
    return [
      ["Home", `${n.assignedLocations.home.name}`],
      ["Work", `${n.assignedLocations.work.name}`],
      ["Bloodline", n.race?.bloodline?.name || "None listed in compendium"],
      ["Alignment", n.alignment?.alignmentName || alignmentNameFromScores(n.alignment?.scores)],
      ["Faction", n.faction ? `${n.faction.name}, Tier ${n.faction.tier}, ${n.faction.badge}` : "None assigned"],
      ["Class", cls],
      ["Wants / Fears", `${n.wants[0]} / ${n.fears[0]}`],
      ["Aspirations", n.aspirations[0]],
      ["Source", n.source?.type ? `${n.source.type}: ${n.source.priority || "expanded"}` : "generated"]
    ].map(([k,v]) => `<div class="mini"><b>${escapeHTML(k)}</b>${escapeHTML(v)}</div>`).join("");
  }

  function axisBar(axis, value, descriptor) {
    const pct = (value / 3000) * 100;
    const gradient = ALIGNMENT_TERMS[axis]?.gradient || "linear-gradient(90deg,#6e1326,#34343a,#0d7c7f)";
    return `<div class="bar-row" data-axis="${escapeHTML(axis)}" style="--axis-gradient:${gradient}"><header><span>${escapeHTML(axisDisplayName(axis))}</span><span>${value}</span></header><div class="bar-track"><div class="bar-fill" style="width:${pct}%"></div></div><div class="bar-caption">${escapeHTML(descriptor)}</div></div>`;
  }

  function iconHTML(icon, className = "schedule-transit-icon") {
    if (!icon?.src) return "";
    return `<img class="${className}" src="${escapeHTML(icon.src)}" alt="${escapeHTML(icon.alt || "transit icon")}" loading="lazy" />`;
  }
  function scheduleIconHTML(s) {
    const pieces = [];
    if (s.transitIcon?.src) pieces.push(iconHTML(s.transitIcon));
    if (s.emoji) pieces.push(`<span class="schedule-emoji-text">${escapeHTML(s.emoji)}</span>`);
    if (s.transitEmoji && s.transitEmoji !== s.emoji) pieces.push(`<span class="schedule-emoji-text">${escapeHTML(s.transitEmoji)}</span>`);
    return pieces.join(" ") || "•";
  }
  function transitRouteHTML(route) {
    const icon = route?.icon?.src ? iconHTML(route.icon, "transit-summary-icon") : "";
    const emoji = route?.emoji ? `<span class="schedule-emoji-text">${escapeHTML(route.emoji)}</span>` : "";
    return `${icon}${emoji}`;
  }

  function detailsHTML(n) {
    const rels = Object.entries(n.relationships || {}).map(([cat, arr]) => `<div><b>${escapeHTML(cat)}</b><div class="pill-list">${arr.length ? arr.map(r => `<button type="button" class="pill link-pill relationship-pill relationship-${escapeHTML(cat)}" data-open-npc="${escapeHTML(r.npcId)}">${escapeHTML(r.label)}: ${escapeHTML(r.name)}</button>`).join("") : `<span class="pill">None assigned</span>`}</div></div>`).join("");
    const scheduleRows = ensureArray(n.schedules).map(s => `<tr><td>${escapeHTML(s.weekday)}</td><td>${escapeHTML(s.startTime)}–${escapeHTML(s.endTime)}</td><td class="schedule-icon-cell">${scheduleIconHTML(s)}</td><td>${escapeHTML(s.activity || s.reason)}</td><td><span class="location-marker">${escapeHTML(s.locationEmoji || "📍")}</span>${escapeHTML(s.locationName)}</td><td>${escapeHTML(s.reason)}</td></tr>`).join("");
    return `<div><b>Assignment</b><p class="muted">${escapeHTML(n.assignment.settlementName)}, ${escapeHTML(n.assignment.provinceName)} • ${escapeHTML(n.assignment.timeZone)} • ${escapeHTML(n.assignment.governmentType)}</p></div>
      <div><b>Transit</b><p class="muted transit-summary">${transitRouteHTML(n.transitRoute)} ${escapeHTML(n.transitRoute.mode)} from ${escapeHTML(n.transitRoute.origin)} to ${escapeHTML(n.transitRoute.destination)} for ${escapeHTML(n.transitRoute.purpose)}. Access: ${escapeHTML(n.transitRoute.access)}.</p></div>
      <div><b>Traits & Hobbies</b><div class="pill-list">${[...ensureArray(n.traits), ...ensureArray(n.hobbies)].map(x => `<span class="pill">${escapeHTML(x)}</span>`).join("")}</div></div>
      <div><b>Relationships</b>${rels}</div>
      <div><b>Quests / Uploaded Hooks</b><div class="pill-list">${ensureArray(n.quests || n.questHooks || n.offeredQuests).length ? ensureArray(n.quests || n.questHooks || n.offeredQuests).map(q => `<span class="pill">${escapeHTML(typeof q === "string" ? q : q.title || q.name || JSON.stringify(q))}</span>`).join("") : `<span class="pill">None imported</span>`}</div></div>
      <div><b>Rumors</b><ul>${ensureArray(n.rumors).map(r => `<li>${escapeHTML(r)}</li>`).join("")}</ul></div>
      <div><b>Family Tree</b><p class="muted">Household: ${escapeHTML(n.familyTree.householdId || "none")} • Role: ${escapeHTML(n.familyTree.role)} • Guardians: ${n.familyTree.guardians.map(g => escapeHTML(g.name)).join(", ") || "none"} • Dependents: ${n.familyTree.dependents.map(g => escapeHTML(g.name)).join(", ") || "none"}</p></div>
      <div><b>Schedule</b><div class="table-scroll"><table class="schedule-table"><thead><tr><th>Day</th><th>Time</th><th>Emoji</th><th>Activity</th><th>Location</th><th>Reason</th></tr></thead><tbody>${scheduleRows}</tbody></table></div></div>`;
  }

  function getNpcById(id) {
    return (state.npcs || []).find(n => n.id === id) || null;
  }

  function allRelationshipRows(npc) {
    return Object.entries(npc?.relationships || {}).flatMap(([category, rows]) => ensureArray(rows).map(row => ({ ...row, category: row.category || category })));
  }

  function compactJson(value) {
    return escapeHTML(JSON.stringify(value, null, 2));
  }

  function openNpcWindow(id, opts = {}) {
    const npc = getNpcById(id);
    if (!npc) { warnOnce("That connected NPC could not be found in the current generator memory."); return; }
    const pushHistory = opts.pushHistory !== false;
    if (pushHistory) {
      if (state.npcWindowCurrentId && state.npcWindowCurrentId !== id) state.npcWindowHistory.push({ type:"npc", id:state.npcWindowCurrentId });
      else if (!state.npcWindowCurrentId) state.npcWindowHistory.push({ type:"page", page:state.npcPage, scrollY:window.scrollY || 0 });
    }
    state.npcWindowCurrentId = id;
    const overlay = $("npcWindowOverlay");
    $("npcWindowTitle").textContent = npc.name;
    $("npcWindowBody").innerHTML = npcWindowHTML(npc);
    overlay?.classList.remove("hidden");
    document.body.classList.add("modal-open");
    $("npcWindowPreviousBtn").disabled = !state.npcWindowHistory.length;
  }

  function closeNpcWindow() {
    $("npcWindowOverlay")?.classList.add("hidden");
    document.body.classList.remove("modal-open");
    state.npcWindowCurrentId = null;
    state.npcWindowHistory = [];
  }

  function previousNpcWindowPage() {
    const previous = state.npcWindowHistory.pop();
    if (!previous) { closeNpcWindow(); return; }
    if (previous.type === "npc") {
      openNpcWindow(previous.id, { pushHistory:false });
      return;
    }
    state.npcPage = previous.page || state.npcPage;
    closeNpcWindow();
    renderNPCs();
    requestAnimationFrame(() => window.scrollTo({ top: previous.scrollY || 0, behavior:"smooth" }));
  }

  function backToGeneratorFromNpcWindow() {
    closeNpcWindow();
    document.querySelector(".control-panel")?.scrollIntoView({ behavior:"smooth", block:"start" });
  }

  function relationshipButtonsHTML(npc) {
    const rows = allRelationshipRows(npc);
    if (!rows.length) return `<span class="pill">No linked NPCs yet</span>`;
    return rows.map(r => `<button type="button" class="pill link-pill relationship-pill relationship-${escapeHTML(r.category)}" data-open-npc="${escapeHTML(r.npcId)}">${escapeHTML(r.category)} • ${escapeHTML(r.label)}: ${escapeHTML(r.name)}</button>`).join("");
  }

  function locationListHTML(locations = {}) {
    return Object.entries(locations).map(([key, loc]) => `<div class="mini"><b>${escapeHTML(key)}</b>${escapeHTML(loc?.name || "Unassigned")}<br><span class="muted">${escapeHTML(loc?.category || "")}${loc?.settlementName ? ` • ${escapeHTML(loc.settlementName)}` : ""}</span></div>`).join("");
  }

  function npcWindowHTML(n) {
    const scheduleRows = ensureArray(n.schedules).map(s => `<tr><td>${escapeHTML(s.weekday)}</td><td>${escapeHTML(s.startTime)}–${escapeHTML(s.endTime)}</td><td class="schedule-icon-cell">${scheduleIconHTML(s)}</td><td>${escapeHTML(s.activity || s.reason)}</td><td><span class="location-marker">${escapeHTML(s.locationEmoji || "📍")}</span>${escapeHTML(s.locationName)}</td><td>${escapeHTML(s.reason)}</td><td>${escapeHTML(s.secrecy || "public")}</td></tr>`).join("");
    const classText = n.class?.multiClass ? `${n.class.primaryClass} (${n.class.primarySubclass}) / ${n.class.secondaryClass} (${n.class.secondarySubclass})` : `${n.class?.primaryClass || "Commoner"}${n.class?.primarySubclass && n.class.primarySubclass !== "—" ? ` (${n.class.primarySubclass})` : ""}`;
    return `<section class="npc-window-grid">
      <div class="npc-window-panel full-width"><h3>Identity</h3><div class="mini-grid">${[
        ["Name", n.name], ["Age", n.age], ["Gender Identity", n.genderIdentity], ["Pronouns", n.pronouns], ["Honorific", n.formalHonorific||n.preferredHonorific||"Not recorded"], ["Respectful address", n.respectfulAddress], ["Everyday title", n.everydayTitle], ["Platonic endearment", n.platonicEndearment], ["Romantic endearment", n.romanticEndearment||"Only with explicit opt-in"], ["Family term options", Object.entries(n.kinshipTerms||{}).map(([k,v])=>`${k}: ${v}`).join(" · ")], ["Race", n.race?.name], ["Race Category", n.race?.category], ["Residence", `${n.assignment?.settlementName || "Unknown"}, ${n.assignment?.provinceName || "Unknown"}`], ["Travel Range", n.travelRange], ["Source", n.source?.type ? `${n.source.type}: ${n.source.priority || "expanded"}` : "generated"]
      ].map(([k,v]) => `<div class="mini"><b>${escapeHTML(k)}</b>${escapeHTML(v)}</div>`).join("")}</div></div>
      <div class="npc-window-panel full-width"><h3>Personality & Hooks</h3><p>${escapeHTML(n.personality || "")}</p><div class="pill-list">${[...ensureArray(n.traits), ...ensureArray(n.hobbies), ...ensureArray(n.wants), ...ensureArray(n.fears), ...ensureArray(n.aspirations)].map(x => `<span class="pill">${escapeHTML(x)}</span>`).join("")}</div></div>
      <div class="npc-window-panel"><h3>Class, Work, and Faction</h3><div class="mini-grid">${[["Job", n.job?.title], ["Job Category", n.job?.category], ["Class", classText], ["Faction", n.faction ? `${n.faction.name} • ${n.faction.badge}` : "None"], ["Faction Role", n.faction?.role || "—"], ["Portal Pass", n.faction?.portalPass || "—"]].map(([k,v]) => `<div class="mini"><b>${escapeHTML(k)}</b>${escapeHTML(v)}</div>`).join("")}</div></div>
      <div class="npc-window-panel"><h3>Locations</h3><div class="mini-grid">${locationListHTML(n.assignedLocations)}</div></div>
      <div class="npc-window-panel full-width"><h3>Alignment</h3>${AXES.map(axis => axisBar(axis, n.alignment.scores[axis], n.alignment.descriptors[axis])).join("")}</div>
      <div class="npc-window-panel full-width"><h3>Connected NPCs</h3><div class="pill-list">${relationshipButtonsHTML(n)}</div></div>
      <div class="npc-window-panel"><h3>Family / Household</h3><p class="muted">Household: ${escapeHTML(n.familyTree?.householdId || "none")}<br>Role: ${escapeHTML(n.familyTree?.role || "independent")}</p><div class="pill-list">${[...ensureArray(n.familyTree?.guardians).map(x => `Guardian: ${x.name}`), ...ensureArray(n.familyTree?.dependents).map(x => `Dependent: ${x.name}`), ...ensureArray(n.familyTree?.siblings).map(x => `Sibling: ${x.name}`), ...ensureArray(n.familyTree?.partners).map(x => `Partner: ${x.name}${x.status ? ` (${x.status})` : ""}`)].map(x => `<span class="pill">${escapeHTML(x)}</span>`).join("") || `<span class="pill">No household links</span>`}</div></div>
      <div class="npc-window-panel"><h3>Transit</h3><p class="muted transit-summary">${transitRouteHTML(n.transitRoute)} ${escapeHTML(n.transitRoute?.mode || "Travel")} from ${escapeHTML(n.transitRoute?.origin || "Unknown")} to ${escapeHTML(n.transitRoute?.destination || "Unknown")} for ${escapeHTML(n.transitRoute?.purpose || "general travel")}.</p><p>${escapeHTML(n.transitRoute?.access || "")}</p></div>
      <div class="npc-window-panel full-width"><h3>Rumors, Secrets, and Quests</h3><div class="mini-grid"><div class="mini"><b>Rumors</b><ul>${ensureArray(n.rumors).map(r => `<li>${escapeHTML(r)}</li>`).join("")}</ul></div><div class="mini"><b>Secret</b>${escapeHTML(n.secrets || "None assigned")}</div><div class="mini"><b>Quests / Uploaded Hooks</b><div class="pill-list">${ensureArray(n.quests || n.questHooks || n.offeredQuests).length ? ensureArray(n.quests || n.questHooks || n.offeredQuests).map(q => `<span class="pill">${escapeHTML(typeof q === "string" ? q : q.title || q.name || JSON.stringify(q))}</span>`).join("") : `<span class="pill">None imported</span>`}</div></div></div></div>
      <div class="npc-window-panel full-width"><h3>Complete Schedule</h3><div class="table-scroll tall"><table class="schedule-table"><thead><tr><th>Day</th><th>Time</th><th>Emoji</th><th>Activity</th><th>Location</th><th>Reason</th><th>Privacy</th></tr></thead><tbody>${scheduleRows}</tbody></table></div></div>
      <div class="npc-window-panel full-width"><details><summary>Complete NPC JSON</summary><pre class="json-dump">${compactJson(n)}</pre></details></div>
    </section>`;
  }

  // branch-style family-tree layout; the visible player label is Relationship Tracker.
  function renderRelationshipTracker() {
    renderRelationshipFocusSelect();
    const tracker = $("relationshipTracker");
    if (!tracker) return;
    const visible = npcsForPage(state.npcPage);
    if (!visible.length) {
      tracker.innerHTML = `<p class="hint">Generate or import NPCs to populate the Relationship Tracker.</p>`;
      return;
    }
    let focus = getNpcById(state.relationshipFocusId);
    if (!focus || !visible.some(n => n.id === focus.id)) focus = visible[0];
    state.relationshipFocusId = focus.id;
    const rels = uniqueRelationshipRows(focus).map((r, index) => ({ ...r, index, target:getNpcById(r.npcId) })).filter(r => r.target);
    if (!rels.length) {
      tracker.innerHTML = `<div class="relationship-map empty"><button type="button" class="tracker-node focus" data-open-npc="${escapeHTML(focus.id)}">${escapeHTML(focus.name)}<small>No linked NPCs yet</small></button></div>`;
      return;
    }
    const width = Math.max(980, 620 + rels.length * 22);
    const height = Math.max(680, 450 + Math.ceil(rels.length / 4) * 70);
    const cx = width / 2;
    const cy = height / 2;
    const groups = { familial:[], romantic:[], personal:[], professional:[] };
    rels.forEach(r => (groups[r.category] || groups.personal).push(r));
    const ranges = {
      familial: [-160, -35],
      romantic: [-25, 55],
      professional: [45, 155],
      personal: [145, 235]
    };
    const nodes = [];
    const paths = [];
    Object.entries(groups).forEach(([category, rows]) => {
      rows.forEach((r, i) => {
        const [a0, a1] = ranges[category] || ranges.personal;
        const pct = rows.length === 1 ? .5 : i / (rows.length - 1);
        const angle = (a0 + (a1 - a0) * pct) * Math.PI / 180;
        const ring = 230 + Math.floor(i / 7) * 120;
        const x = cx + Math.cos(angle) * ring;
        const y = cy + Math.sin(angle) * ring;
        const style = relationshipVisualStyle(category, r.label);
        paths.push(`<path d="${relationshipCurve(cx, cy, x, y, i, category)}" stroke="${style.stroke}" stroke-width="${style.width}" stroke-opacity="${style.opacity}" fill="none" stroke-linecap="round" ${style.dash ? `stroke-dasharray="${style.dash}"` : ""}/><text x="${(cx+x)/2}" y="${(cy+y)/2 - 8}" class="tracker-line-label">${escapeHTML(style.label)}</text>`);
        nodes.push(`<button type="button" class="tracker-node ${escapeHTML(category)}" style="left:${Math.max(12, x-92)}px;top:${Math.max(12, y-34)}px" data-open-npc="${escapeHTML(r.target.id)}"><strong>${escapeHTML(r.target.name)}</strong><small>${escapeHTML(r.label || category)}</small></button>`);
      });
    });
    tracker.innerHTML = `<div class="relationship-map" style="width:${width}px;height:${height}px"><svg class="relationship-svg" viewBox="0 0 ${width} ${height}" aria-hidden="true">${defsRelationshipSvg()}${paths.join("")}</svg><button type="button" class="tracker-node focus" style="left:${cx-110}px;top:${cy-44}px" data-open-npc="${escapeHTML(focus.id)}"><strong>${escapeHTML(focus.name)}</strong><small>${escapeHTML(focus.assignment?.settlementName || "Focused NPC")}</small></button>${nodes.join("")}</div>`;
  }

  function renderRelationshipFocusSelect() {
    const select = $("relationshipFocusSelect");
    if (!select) return;
    const visible = npcsForPage(state.npcPage);
    const old = select.value || state.relationshipFocusId;
    select.innerHTML = visible.length ? visible.map(n => `<option value="${escapeHTML(n.id)}">${escapeHTML(n.name)} — ${escapeHTML(n.assignment?.settlementName || "Unknown")}</option>`).join("") : `<option value="">No NPCs available</option>`;
    if (visible.some(n => n.id === old)) select.value = old;
    else if (visible[0]) select.value = visible[0].id;
    state.relationshipFocusId = select.value;
  }

  function uniqueRelationshipRows(npc) {
    return uniqueBy(allRelationshipRows(npc), r => `${r.category}:${r.npcId}:${r.label}`);
  }

  function defsRelationshipSvg() {
    return `<defs><filter id="trackerGlow"><feGaussianBlur stdDeviation="2" result="coloredBlur"/><feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>`;
  }

  function relationshipCurve(x1, y1, x2, y2, index, category) {
    const sign = category === "romantic" || category === "professional" ? 1 : -1;
    const bend = sign * (38 + (index % 5) * 9);
    const mx = (x1 + x2) / 2 + bend;
    const my = (y1 + y2) / 2 - bend * .45;
    return `M ${x1} ${y1} Q ${mx} ${my} ${x2} ${y2}`;
  }

  function relationshipVisualStyle(category, label = "") {
    const text = String(label).toLowerCase();
    if (category === "familial") {
      let stroke = "#71d66f", width = 3.2, opacity = .82;
      if (/guardian|parent/.test(text)) { stroke = "#57c95e"; width = 4.1; }
      if (/ward|child|dependent/.test(text)) { stroke = "#9af08f"; width = 3.6; }
      if (/sibling|kin/.test(text)) { stroke = "#7de083"; width = 2.8; }
      if (/grand|extended|cousin/.test(text)) { stroke = "#b4f7a8"; width = 2.4; opacity = .7; }
      return { stroke, width, opacity, dash:"", label:"family" };
    }
    if (category === "romantic") {
      let stroke = "#ff445f", width = 3.3, opacity = .86, dash = "";
      if (/poly/.test(text)) dash = "12 8";
      if (/dating|courting/.test(text)) { width = 2.8; opacity = .78; if (!dash) dash = ""; }
      if (/engaged/.test(text)) { width = 3.8; stroke = "#ff6378"; }
      if (/married|spouse/.test(text)) { width = 4.4; stroke = "#ff203f"; }
      if (/separated/.test(text)) { dash = "18 8 4 8"; opacity = .62; }
      if (/divorced|ex/.test(text)) { dash = "6 9"; opacity = .55; }
      return { stroke, width, opacity, dash, label:"romance" };
    }
    if (category === "professional") {
      let stroke = "#ff49dc", width = 3, opacity = .8, dash = "";
      if (/supervisor|superior|boss|lead/.test(text)) width = 4.1;
      if (/subordinate|apprentice/.test(text)) { width = 2.7; dash = "10 5"; }
      if (/client/.test(text)) { dash = "5 7"; stroke = "#ff7be7"; }
      if (/collaborator|partner|coworker/.test(text)) { stroke = "#d74cff"; }
      return { stroke, width, opacity, dash, label:"work" };
    }
    let stroke = "#153b83", width = 3, opacity = .82, dash = "";
    if (/friend|close|support/.test(text)) { stroke = "#1f5cc6"; width = 3.7; }
    if (/rival|enemy|dispute/.test(text)) { stroke = "#0b2664"; dash = "9 6"; }
    if (/mentor/.test(text)) { stroke = "#2a73df"; width = 4; }
    if (/familiar|neighbor/.test(text)) { stroke = "#315a9f"; opacity = .7; }
    return { stroke, width, opacity, dash, label:"personal" };
  }

  function reconcileLocationsFromMenu() {
    const rng = makeRng(`${state.seed}|manual-reconcile|${Date.now()}`);
    reconcileAllNpcAssignments(rng);
    warnOnce("NPC residence and location assignments were reconciled against current imported/custom locations.");
    renderAll();
  }

  function clearImportedLocationsFromMenu() {
    if (!confirm("Clear only imported/custom locations? Generated NPCs and province data will stay.")) return;
    state.customLocations = [];
    warnOnce("Imported/custom locations were cleared. Generated location pools remain available.");
    renderAll();
  }

  function exportPacket(scopeFilter) {
    let npcs = state.npcs;
    const curP = currentProvince();
    const curS = currentSettlement();
    if (scopeFilter === "world") npcs = npcsForPage("world");
    if (scopeFilter === "province") npcs = npcsForPage("province");
    if (scopeFilter === "settlement") npcs = npcsForPage("settlement");
    return {
      schema: "life_simulator.lifeSimulator.npcExport.v1",
      exportedAt: new Date().toISOString(),
      scopeFilter,
      currentScope: state.scope,
      selectedProvince: curP ? {id:curP.id, name:curP.name} : null,
      selectedSettlement: curS ? {id:curS.id, name:curS.name} : null,
      raceCache: state.raceCache.map(r => ({id:r.id, name:r.name, category:r.category, creatorGod:r.creatorGod, bloodlines:Array.isArray(r.bloodlines) ? r.bloodlines.map(b => ({id:b.id, name:b.name, source:b.source || "compendium"})) : []})),
      raceBloodlinePolicy: state.data.raceData.raceBloodlinePolicy || "NPC races and bloodlines are restricted to the loaded compendium race data.",
      biomeCache: state.biomeCache,
      alignmentPreference: state.alignmentPreference,
      alignmentTerms: ALIGNMENT_TERMS,
      customLocations: state.customLocations,
      importedDocuments: state.importedDocuments,
      scheduleEmojiLegend: ACTIVITY_EMOJI_GROUPS,
      scheduleActivityAssetManifest: ACTIVITY_ASSET_MANIFEST,
      transitVisuals: TRANSIT_MODE_VISUALS,
      npcs
    };
  }

  function downloadJSON(filename, data) {
    const blob = new Blob([JSON.stringify(data, null, 2)], {type:"application/json"});
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    URL.revokeObjectURL(a.href);
    a.remove();
  }
  function exportNPCs(scopeFilter) { downloadJSON(`life_simulator_${scopeFilter}_npcs.json`, exportPacket(scopeFilter)); }
  function exportProvinceData() { downloadJSON("provinces_settlements.json", state.data.provinceData); }

  function saveProgress() {
    localStorage.setItem(STORE_KEY, JSON.stringify(serializeState()));
    writeCompanionHandoff();
    warnOnce("Imported or saved state is now stored in this browser.");
  }
  function loadProgress() {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) { warnOnce("No saved browser state was found."); return; }
    try { applySave(JSON.parse(raw)); warnOnce("Imported browser save successfully."); } catch (err) { warnOnce(`Could not load saved state: ${err.message}`); }
  }
  function resetState() {
    if (!confirm("Reset generated NPCs and local cache selections?")) return;
    state.raceCache = []; state.biomeCache = []; state.npcs = []; state.customLocations = []; state.importedDocuments = []; state.generatedAt = null; state.locationGenerator = null; state.warnings = [];
    state.alignmentPreference = { Altruism:1500, Lawfulness:1500, Cooperation:1500, Honor:1500 };
    hydrateAlignmentControls(); renderAll();
  }
  function serializeState() {
    return { scope:state.scope, provinceId:state.provinceId, settlementId:state.settlementId, danger:state.danger, seed:state.seed, npcCount:state.npcCount, raceCache:state.raceCache, biomeCache:state.biomeCache, alignmentPreference:state.alignmentPreference, npcs:state.npcs, customLocations:state.customLocations, importedDocuments:state.importedDocuments, generatedAt:state.generatedAt, provinceData:state.data.provinceData, npcPage:state.npcPage, relationshipFocusId:state.relationshipFocusId, locationGenerator:state.locationGenerator || null };
  }
  function applySave(save) {
    Object.assign(state, { scope:save.scope || "settlement", provinceId:save.provinceId || state.provinceId, settlementId:save.settlementId || state.settlementId, danger:save.danger || state.danger, seed:save.seed || state.seed, npcCount:save.npcCount || state.npcCount, raceCache:save.raceCache || [], biomeCache:save.biomeCache || [], alignmentPreference:save.alignmentPreference || state.alignmentPreference, npcs:save.npcs || [], customLocations:save.customLocations || save.locations || [], importedDocuments:save.importedDocuments || [], generatedAt:save.generatedAt || null, npcPage:save.npcPage || state.npcPage || "world", relationshipFocusId:save.relationshipFocusId || "", locationGenerator:save.locationGenerator || state.locationGenerator || null });
    sanitizeRaceCache();
    if (save.provinceData?.provinces) state.data.provinceData = save.provinceData;
    const rng = makeRng(`${state.seed}|applySave|${Date.now()}`);
    ensureNpcExpansion(state.npcs, rng, { linkExisting:true });
    hydrateControls(); renderAll();
  }

  function openCompanion() {
    writeCompanionHandoff();
    window.open("emperor_map_asset_rulebot.html", "_blank", "noopener");
  }
  function writeCompanionHandoff() {
    const packet = { timestamp:new Date().toISOString(), currentSettlementSummary: currentSettlement() || null, warnings:state.warnings, selectedBiomes:state.biomeCache, raceCacheSummary:state.raceCache.map(r => ({name:r.name, category:r.category})), factionSummary:summarizeFactions(), exportStatus:{npcCount:state.npcs.length, generatedAt:state.generatedAt}, readOnly:true };
    try { localStorage.setItem(MAP_ASSET_HANDOFF_KEY, JSON.stringify(packet)); } catch (e) {}
  }
  function summarizeFactions() {
    const map = new Map();
    state.npcs.forEach(n => { if (n.faction) map.set(n.faction.name, (map.get(n.faction.name) || 0) + 1); });
    return [...map.entries()].map(([name,count]) => ({name,count}));
  }

  async function readFileJSON(file) {
    return JSON.parse(await file.text());
  }
  async function importProvinceFile(e) {
    const file = e.target.files?.[0]; if (!file) return;
    try {
      const data = await readFileJSON(file);
      if (!Array.isArray(data.provinces)) throw new Error("Expected top-level provinces array.");
      state.data.provinceData = data;
      state.provinceId = data.provinces[0]?.id || "";
      state.settlementId = data.provinces[0]?.settlements?.[0]?.id || "";
      reconcileAllNpcAssignments(makeRng(`${state.seed}|province-import|${Date.now()}`));
      hydrateControls(); warnOnce("Imported replacement province/settlement data successfully and reconciled existing NPC assignments."); renderAll();
    } catch (err) { warnOnce(`Province import failed: ${err.message}`); }
    e.target.value = "";
  }
  async function importSaveFile(e) {
    const file = e.target.files?.[0]; if (!file) return;
    try { applySave(await readFileJSON(file)); warnOnce("Imported simulator save successfully."); } catch (err) { warnOnce(`Save import failed: ${err.message}`); }
    e.target.value = "";
  }


  function bindDropZone() {
    const zone = $("npcDropZone");
    if (!zone) return;
    ["dragenter", "dragover"].forEach(type => zone.addEventListener(type, (e) => { e.preventDefault(); zone.classList.add("dragging"); }));
    ["dragleave", "drop"].forEach(type => zone.addEventListener(type, (e) => { e.preventDefault(); zone.classList.remove("dragging"); }));
    zone.addEventListener("drop", (e) => importFiles(Array.from(e.dataTransfer?.files || [])));
  }

  async function importNpcDocumentsFile(e) {
    const files = Array.from(e.target.files || []);
    if (files.length) await importFiles(files);
    e.target.value = "";
  }

  async function importFiles(files) {
    if (!files.length) return;
    const rng = makeRng(`${state.seed}|import|${Date.now()}`);
    let npcCount = 0;
    let locationCount = 0;
    let provinceChanged = false;
    const errors = [];
    for (const file of files) {
      try {
        const imported = await readAnySupportedFile(file);
        const beforeNpc = state.npcs.length;
        const beforeLoc = state.customLocations.length;
        if (imported.jsonPayloads.length) {
          for (const payload of imported.jsonPayloads) {
            const result = ingestStructuredPayload(payload, file.name, rng);
            provinceChanged = provinceChanged || result.provinceChanged;
          }
        }
        if (imported.text) ingestTextPayload(imported.text, file.name, imported.kind, rng);
        const afterNpc = state.npcs.length;
        const afterLoc = state.customLocations.length;
        npcCount += Math.max(0, afterNpc - beforeNpc);
        locationCount += Math.max(0, afterLoc - beforeLoc);
        state.importedDocuments.push({ fileName:file.name, kind:imported.kind, scannedAt:new Date().toISOString(), textCharacters: imported.text.length, jsonPayloads: imported.jsonPayloads.length, notes: imported.notes });
      } catch (err) {
        errors.push(`${file.name}: ${err.message}`);
      }
    }
    if (provinceChanged) hydrateControls();
    reconcileAllNpcAssignments(rng);
    ensureNpcExpansion(state.npcs, rng, { linkExisting:true });
    // V7: adult-only reciprocal relationships; at least 60% of the whole population attached.
    window.BelavadosRelationshipEngine?.ensureCoverage(state.npcs, rng);
    addRelationshipScheduleContext(state.npcs, rng);
    if (npcCount || locationCount) warnOnce(`Imported and expanded ${npcCount} NPCs and ${locationCount} locations. Uploaded NPC fields stayed authoritative; missing schedules, locations, and relationships were generated.`);
    if (errors.length) warnOnce(`Some imports could not be fully read: ${errors.join(" | ")}`);
    renderAll();
  }

  async function readAnySupportedFile(file) {
    const name = file.name || "uploaded-file";
    const lower = name.toLowerCase();
    const notes = [];
    if (lower.endsWith(".json")) {
      const text = await file.text();
      return { kind:"json", text, jsonPayloads:[JSON.parse(text)], notes };
    }
    if (lower.endsWith(".docx")) {
      const buffer = await file.arrayBuffer();
      const text = await extractDocxText(buffer, notes);
      return { kind:"docx", text, jsonPayloads:extractJsonPayloadsFromText(text), notes };
    }
    if (lower.endsWith(".pdf")) {
      const buffer = await file.arrayBuffer();
      const text = await extractPdfText(buffer, notes);
      return { kind:"pdf", text, jsonPayloads:extractJsonPayloadsFromText(text), notes };
    }
    const text = await file.text();
    return { kind: lower.endsWith(".html") || lower.endsWith(".htm") ? "html" : "text", text: htmlToLooseText(text), jsonPayloads:extractJsonPayloadsFromText(text), notes };
  }

  function htmlToLooseText(text) {
    return String(text || "")
      .replace(/<script[\s\S]*?<\/script>/gi, "\n")
      .replace(/<style[\s\S]*?<\/style>/gi, "\n")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/p>|<\/div>|<\/li>|<\/tr>|<\/h[1-6]>/gi, "\n")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/\s+\n/g, "\n")
      .replace(/\n\s+/g, "\n")
      .trim();
  }

  function extractJsonPayloadsFromText(text) {
    const payloads = [];
    const raw = String(text || "");
    const trimmed = raw.trim();
    if (/^[\[{]/.test(trimmed)) {
      try { payloads.push(JSON.parse(trimmed)); } catch (e) {}
    }
    const scriptRe = /<script[^>]+type=["']application\/json["'][^>]*>([\s\S]*?)<\/script>/gi;
    let match;
    while ((match = scriptRe.exec(raw))) {
      try { payloads.push(JSON.parse(match[1])); } catch (e) {}
    }
    return payloads;
  }

  async function extractDocxText(buffer, notes) {
    const files = await unzipXmlFiles(buffer, notes);
    const wanted = Object.entries(files).filter(([name]) => /word\/(document|header|footer|footnotes|endnotes).*\.xml$/i.test(name));
    if (!wanted.length) {
      notes.push("DOCX XML could not be decompressed; used fallback binary text scan.");
      return decodeBinaryText(buffer);
    }
    return wanted.map(([name, xml]) => xmlToText(xml)).join("\n");
  }

  async function unzipXmlFiles(buffer, notes) {
    const view = new DataView(buffer);
    const u8 = new Uint8Array(buffer);
    const decoder = new TextDecoder("utf-8", { fatal:false });
    let eocd = -1;
    for (let i = u8.length - 22; i >= Math.max(0, u8.length - 66000); i--) {
      if (view.getUint32(i, true) === 0x06054b50) { eocd = i; break; }
    }
    if (eocd < 0) return {};
    const entries = view.getUint16(eocd + 10, true);
    let ptr = view.getUint32(eocd + 16, true);
    const out = {};
    for (let i = 0; i < entries && ptr < u8.length; i++) {
      if (view.getUint32(ptr, true) !== 0x02014b50) break;
      const method = view.getUint16(ptr + 10, true);
      const compSize = view.getUint32(ptr + 20, true);
      const nameLen = view.getUint16(ptr + 28, true);
      const extraLen = view.getUint16(ptr + 30, true);
      const commentLen = view.getUint16(ptr + 32, true);
      const localOffset = view.getUint32(ptr + 42, true);
      const name = decoder.decode(u8.slice(ptr + 46, ptr + 46 + nameLen));
      const localNameLen = view.getUint16(localOffset + 26, true);
      const localExtraLen = view.getUint16(localOffset + 28, true);
      const dataStart = localOffset + 30 + localNameLen + localExtraLen;
      const bytes = u8.slice(dataStart, dataStart + compSize);
      if (/\.xml$/i.test(name)) {
        try {
          let data = bytes;
          if (method === 8) data = await inflateRaw(bytes);
          else if (method !== 0) { ptr += 46 + nameLen + extraLen + commentLen; continue; }
          out[name] = decoder.decode(data);
        } catch (err) {
          notes.push(`Could not inflate ${name}: ${err.message}`);
        }
      }
      ptr += 46 + nameLen + extraLen + commentLen;
    }
    return out;
  }

  async function inflateRaw(bytes) {
    if (!("DecompressionStream" in window)) throw new Error("browser does not expose DecompressionStream");
    const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
    return new Uint8Array(await new Response(stream).arrayBuffer());
  }

  function xmlToText(xml) {
    return String(xml || "")
      .replace(/<w:tab\/>/g, "\t")
      .replace(/<w:br\/>/g, "\n")
      .replace(/<\/w:p>/g, "\n")
      .replace(/<[^>]+>/g, "")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }

  async function extractPdfText(buffer, notes) {
    const raw = decodeBinaryText(buffer);
    const pieces = [];
    raw.replace(/\((?:\\.|[^\\)]){2,}\)\s*Tj/g, m => { pieces.push(decodePdfString(m.replace(/\)\s*Tj$/, "").slice(1, -1))); return m; });
    raw.replace(/\[((?:\s*\((?:\\.|[^\\)])*\)\s*)+)\]\s*TJ/g, m => { pieces.push(decodePdfString(m.replace(/^\[/, "").replace(/\]\s*TJ$/, "").replace(/\)\s*\(/g, "").replace(/[()]/g, ""))); return m; });
    const readable = raw.replace(/[^\x09\x0A\x0D\x20-\x7E]+/g, " ").replace(/\s+/g, " ");
    if (pieces.length < 8) notes.push("PDF text was extracted with a fallback scanner; image-only PDFs may need OCR outside this static app.");
    return [...pieces, readable].join("\n");
  }

  function decodeBinaryText(buffer) {
    try { return new TextDecoder("utf-8", { fatal:false }).decode(buffer); }
    catch (e) { return Array.from(new Uint8Array(buffer)).map(b => b >= 32 && b <= 126 ? String.fromCharCode(b) : " ").join(""); }
  }

  function decodePdfString(s) {
    return String(s || "").replace(/\\([nrtbf()\\])/g, (m, c) => ({n:"\n", r:"\r", t:"\t", b:"\b", f:"\f", "(":"(", ")":")", "\\":"\\"}[c] || c));
  }

  function ingestStructuredPayload(payload, fileName, rng) {
    let provinceChanged = false;
    const result = { provinceChanged:false };
    if (!payload) return result;
    if (payload.provinces && Array.isArray(payload.provinces)) {
      state.data.provinceData = payload;
      provinceChanged = true;
    }
    const locations = collectLocationsFromPayload(payload, fileName);
    if (locations.length) mergeCustomLocations(locations);
    const npcs = collectNpcsFromPayload(payload);
    if (npcs.length) {
      const normalized = npcs.map((raw, index) => normalizeImportedNpc(raw, fileName, rng, index)).filter(Boolean);
      state.npcs = uniqueBy([...state.npcs, ...normalized], n => n.id || slug(n.name));
    }
    result.provinceChanged = provinceChanged;
    return result;
  }

  function collectNpcsFromPayload(payload) {
    if (Array.isArray(payload)) return payload;
    const candidates = [payload.npcs, payload.npcData, payload.characters, payload.people, payload.roster, payload.data?.npcs, payload.lifeSimulator?.npcs].find(Array.isArray);
    if (candidates) return candidates;
    if (payload.name && (payload.race || payload.job || payload.quest || payload.quests || payload.alignment)) return [payload];
    return [];
  }

  function collectLocationsFromPayload(payload, fileName) {
    const arrays = [payload.customLocations, payload.locations, payload.settlementLocations, payload.visitableLocations, payload.data?.locations].filter(Array.isArray);
    const rows = arrays.flat();
    return rows.map((loc, index) => normalizeImportedLocation(loc, fileName, index)).filter(Boolean);
  }

  function normalizeImportedLocation(raw, fileName, index) {
    if (!raw) return null;
    const settlement = matchSettlement(raw) || currentSettlement() || flattenSettlements()[0] || {};
    const name = cleanText(firstDefined(raw.name, raw.locationName, raw.title, typeof raw === "string" ? raw : ""));
    if (!name || name.length < 2) return null;
    return {
      id: firstDefined(raw.id, `imported_loc_${slug(name)}_${index}`),
      name,
      category: firstDefined(raw.category, raw.type, inferLocationCategory(name), "imported"),
      settlementId: firstDefined(raw.settlementId, settlement.id, ""),
      settlementName: firstDefined(raw.settlementName, raw.settlement, settlement.name, ""),
      province: firstDefined(raw.provinceName, raw.province, settlement.provinceName, settlement.province, ""),
      timeZone: firstDefined(raw.timeZone, settlement.timeZone, ""),
      services: raw.services || raw.inventory || [],
      source: `imported:${fileName}`
    };
  }

  function mergeCustomLocations(locations) {
    state.customLocations = uniqueBy([...(state.customLocations || []), ...locations], loc => `${slug(loc.settlementId || loc.settlementName)}:${slug(loc.name)}`);
  }

  function ingestTextPayload(text, fileName, kind, rng) {
    const extracted = extractStructuredFromText(text, fileName, kind);
    if (extracted.locations.length) mergeCustomLocations(extracted.locations);
    if (extracted.npcs.length) {
      const normalized = extracted.npcs.map((raw, index) => normalizeImportedNpc(raw, fileName, rng, index)).filter(Boolean);
      state.npcs = uniqueBy([...state.npcs, ...normalized], n => n.id || slug(n.name));
    }
  }

  function extractStructuredFromText(text, fileName, kind) {
    const sourceText = htmlToLooseText(text);
    const lines = sourceText.split(/\r?\n/).map(cleanText).filter(Boolean);
    const npcs = [];
    const locations = [];
    const blocks = sourceText.split(/\n\s*\n+/).map(cleanText).filter(Boolean);
    for (const block of blocks) {
      if (!/(npc|name|race|job|profession|quest|offers?)/i.test(block)) continue;
      const raw = {};
      raw.name = labeledValue(block, ["NPC", "Name", "Character", "Full Name"]);
      raw.race = labeledValue(block, ["Race", "People", "Ancestry"]);
      const job = labeledValue(block, ["Job", "Profession", "Work", "Title", "Occupation"]);
      if (job) raw.job = { title:job, category:"imported" };
      raw.genderIdentity = labeledValue(block, ["Gender", "Gender Identity"]);
      raw.pronouns = labeledValue(block, ["Pronouns"]);
      raw.quests = ensureArray(labeledValue(block, ["Quest", "Quests", "Quest Offered", "Offers Quest", "Hook", "Hooks"])).filter(Boolean);
      const loc = labeledValue(block, ["Location", "Home", "Workplace", "Settlement"]);
      if (loc) raw.settlementName = loc;
      if (raw.name && raw.name.length <= 80) {
        raw.sourceText = block.slice(0, 1000);
        npcs.push(raw);
      }
    }
    const locationTerms = /(academy|apothecary|archive|arena|bathhouse|barracks|bazaar|chapel|court|dock|estate|farm|forge|garden|guild|hall|hospital|inn|library|market|park|port|prison|shrine|shop|station|tavern|temple|tower|warehouse)/i;
    lines.forEach((line, index) => {
      if (line.length > 8 && line.length < 90 && locationTerms.test(line) && !/^https?:/i.test(line)) {
        locations.push(normalizeImportedLocation({ name:line, category:inferLocationCategory(line) }, fileName, index));
      }
    });
    return { npcs: uniqueBy(npcs, n => slug(n.name)), locations: uniqueBy(locations.filter(Boolean), l => `${slug(l.settlementName)}:${slug(l.name)}`) };
  }

  function labeledValue(text, labels) {
    for (const label of labels) {
      const re = new RegExp(`(?:^|[\\n;|])\\s*${label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*[:=\u2014-]\\s*([^\\n;|]+)`, "i");
      const match = text.match(re);
      if (match) return cleanText(match[1]);
    }
    return "";
  }

  function normalizeImportedNpc(raw, fileName, rng, index) {
    if (!raw || typeof raw !== "object") return null;
    const sourceName = cleanText(firstDefined(raw.name, raw.fullName, raw.npcName, raw.characterName, raw.title, `Imported NPC ${index + 1}`));
    const npc = { ...raw, name: sourceName };
    npc.id = firstDefined(raw.id, raw.npcId, `imported_npc_${slug(sourceName)}_${hashString(fileName + index).toString(36)}`);
    npc.quests = ensureArray(firstDefined(raw.quests, raw.questHooks, raw.offeredQuests, raw.quest, raw.offersQuest)).filter(Boolean);
    npc.source = { type:"imported", priority:"uploaded npc data preserved; generator fills blanks", file:fileName };
    npc.protectedFields = [...new Set(Object.keys(raw).concat(["id", "name", "quests", "questHooks", "offeredQuests", "source"]))];
    npc.importedRaw = raw;
    return npc;
  }

  function ensureNpcExpansion(npcs, rng, options = {}) {
    (npcs || []).forEach((npc, index) => ensureNpcCore(npc, index, rng));
    ensureMissingRelationships(npcs || [], rng, options);
  }

  function ensureNpcCore(npc, index, rng) {
    const settlement = matchSettlement(npc) || currentSettlement() || flattenSettlements()[0];
    const province = matchProvince(npc, settlement);
    const race = matchRace(npc.race || npc.raceName || npc.people || npc.ancestry) || pick(allRaceDetails(), rng);
    const fallback = makeNPC(index, race, province, settlement, rng);
    const normalizedJob = normalizeJob(npc.job || npc.profession || npc.occupation || npc.title, fallback.job);
    npc.id = firstDefined(npc.id, fallback.id);
    npc.name = firstDefined(npc.name, fallback.name);
    npc.age = Number(firstDefined(npc.age, fallback.age));
    const gender = matchGender(firstDefined(npc.genderIdentity, npc.gender, npc.identity)) || matchGender(fallback.genderIdentity) || pick(state.data.livingRules.genderIdentities, rng);
    npc.genderIdentity = firstDefined(npc.genderIdentity, npc.gender, gender.identity);
    npc.pronouns = firstDefined(npc.pronouns, gender.pronouns, fallback.pronouns);
    const importedRaceLabel = typeof npc.race === "object" ? firstDefined(npc.race.name, npc.race.race, npc.race.ancestry, npc.race.id) : firstDefined(npc.raceName, npc.people, npc.ancestry, npc.race);
    const importedBloodline = typeof npc.race === "object" ? firstDefined(npc.race.bloodline, npc.race.lineage, npc.race.parentage, npc.bloodline, npc.lineage) : firstDefined(npc.bloodline, npc.lineage, npc.parentage);
    const validBloodline = matchRaceBloodline(race, importedBloodline) || fallback.race.bloodline || null;
    npc.race = { ...fallback.race, bloodline: validBloodline, importedRaceLabel: importedRaceLabel && slug(importedRaceLabel) !== slug(fallback.race.name) ? importedRaceLabel : null };
    npc.job = normalizedJob;
    npc.assignedLocations = mergeLocationBuckets(fallback.assignedLocations, npc.assignedLocations, settlement);
    npc.faction = npc.faction === undefined ? chooseFaction(normalizedJob, npc.assignedLocations.work?.name || "", rng) : npc.faction;
    npc.class = normalizeClass(npc.class, normalizedJob, npc.faction, rng);
    npc.alignment = normalizeAlignment(npc.alignment, race, rng, npc.class, npc.settlementDangerLevel || npc.dangerLevel || npc.danger || state.danger, npc.id || npc.name || index);
    npc.alignmentSummary = AXES.map(axis => describeAxis(axis, npc.alignment.scores[axis])).join(", ");
    npc.traits = ensureArray(npc.traits).length ? ensureArray(npc.traits) : sample(state.data.livingRules.traits, 3, rng);
    npc.hobbies = ensureArray(npc.hobbies).length ? ensureArray(npc.hobbies) : sample(state.data.livingRules.hobbies, 2 + Math.floor(rng()*2), rng);
    npc.wants = ensureArray(npc.wants || npc.want).length ? ensureArray(npc.wants || npc.want) : [pick(state.data.livingRules.wants, rng)];
    npc.fears = ensureArray(npc.fears || npc.fear).length ? ensureArray(npc.fears || npc.fear) : [pick(state.data.livingRules.fears, rng)];
    npc.aspirations = ensureArray(npc.aspirations || npc.aspiration).length ? ensureArray(npc.aspirations || npc.aspiration) : [pick(state.data.livingRules.aspirations, rng)];
    npc.personality = firstDefined(npc.personality, npc.description, `${npc.name} is ${npc.traits.join(", ")}, and ${pick(state.data.livingRules.personalitySeeds, rng)}.`);
    npc.assignment = { ...fallback.assignment, ...(npc.assignment || {}), provinceId: firstDefined(npc.assignment?.provinceId, province?.id, settlement?.provinceId), provinceName: firstDefined(npc.assignment?.provinceName, province?.name, settlement?.provinceName, settlement?.province), settlementId: firstDefined(npc.assignment?.settlementId, settlement?.id), settlementName: firstDefined(npc.assignment?.settlementName, settlement?.name), settlementType: firstDefined(npc.assignment?.settlementType, settlement?.type), governmentType: firstDefined(npc.assignment?.governmentType, settlement?.governmentType), timeZone: firstDefined(npc.assignment?.timeZone, settlement?.timeZone), biomes: firstDefined(npc.assignment?.biomes, settlement?.biomes, []) };
    npc.travelRange = firstDefined(npc.travelRange, state.scope === "world" ? "world-wide" : state.scope === "province" ? "province-wide" : "settlement-wide");
    npc.transitRoute = npc.transitRoute || makeTravelRoute(province, settlement, npc.assignedLocations, rng);
    npc.schedules = ensureArray(npc.schedules || npc.schedule).length ? normalizeScheduleEntries(ensureArray(npc.schedules || npc.schedule), npc) : makeSchedule(npc.job, npc.assignedLocations, npc.transitRoute, rng);
    npc.relationships = normalizeRelationshipBuckets(npc.relationships);
    npc.familyTree = normalizeFamilyTree(npc.familyTree);
    npc.rumors = ensureArray(npc.rumors).length ? ensureArray(npc.rumors) : makeRumors(npc.name, npc.job, npc.faction, npc.assignedLocations, rng);
    npc.secrets = firstDefined(npc.secrets, npc.secret, makeSecret(npc.name, npc.job, npc.faction, rng));
    npc.createdAt = firstDefined(npc.createdAt, new Date().toISOString());
    // Maintain existing language choices; expand old or imported NPCs once.
    window.BelavadosIdentityEngine.assignOne(npc, {
      seed: `existing-npc|${state.seed}|${npc.id}`,
      rerollIdentity: false, overwrite: false,
      size: settlement?.type || 'town'
    });
  }

  function normalizeJob(value, fallback) {
    if (typeof value === "object" && value) return { title:firstDefined(value.title, value.name, fallback.title), category:firstDefined(value.category, fallback.category, "imported"), locationKeywords:value.locationKeywords || fallback.locationKeywords || [], classHints:value.classHints || fallback.classHints || [] };
    if (typeof value === "string" && value.trim()) return { ...fallback, title:value.trim(), category:fallback.category || "imported" };
    return fallback;
  }

  function normalizeClass(value, job, faction, rng) {
    if (value && typeof value === "object") return { ...chooseClass(job, faction, rng), ...value };
    if (typeof value === "string" && value.trim()) return { primaryClass:value.trim(), primarySubclass:"—", multiClass:false, secondaryClass:null, secondarySubclass:null, reason:"imported class" };
    return chooseClass(job, faction, rng);
  }

  function normalizeAlignment(value, race, rng, classInfo = null, settlementDangerLevel = state.danger, identitySeed = "imported-npc") {
    const base = makeAlignment(race, rng, classInfo, settlementDangerLevel, identitySeed);
    const scores = { ...base.scores };

    // Imported alignment text/scores are treated as influence, not a hard lock.
    // This prevents uploaded NPC batches from all inheriting identical neutral
    // scores while still respecting clearly non-neutral source language.
    const text = typeof value === "string" ? value.toLowerCase() : JSON.stringify(value || "").toLowerCase();
    AXES.forEach(axis => {
      const terms = ALIGNMENT_TERMS[axis];
      if (text.includes(terms.low) && !text.includes(terms.high)) scores[axis] = Math.min(scores[axis], 999 - Math.floor(rng() * 300));
      if (text.includes(terms.high) && !text.includes(terms.low)) scores[axis] = Math.max(scores[axis], 2000 + Math.floor(rng() * 500));
    });

    const cleaned = deNeutralizeFallbackScores(scores, rng);
    const descriptors = Object.fromEntries(AXES.map(axis => [axis, describeAxis(axis, cleaned[axis])]));
    const axisTerms = Object.fromEntries(AXES.map(axis => [axis, axisTerm(axis, cleaned[axis])]));
    const phases = Object.fromEntries(AXES.map(axis => [axis, alignmentPhase(cleaned[axis])]));
    const alignmentName = alignmentNameForSiteScores(cleaned, base.alignmentName);
    const scoreSignature = AXES.map(axis => `${axis}:${cleaned[axis]}`).join("|");
    GENERATED_ALIGNMENT_SIGNATURES.add(scoreSignature);
    return {
      ...base,
      scores: cleaned,
      descriptors,
      axisTerms,
      phases,
      alignmentName,
      profileName: alignmentName,
      fullAlignmentLabel: fullAlignmentLabelForSiteScores(cleaned),
      scoreSignature
    };
  }

  function mergeLocationBuckets(fallback, incoming, settlement) {
    const merged = { ...fallback, ...(incoming || {}) };
    for (const key of ["home", "work", "personal", "professionalTravel"]) {
      if (!merged[key] || typeof merged[key] === "string") merged[key] = makeLocationObject(merged[key] || fallback[key]?.name || "Unassigned Location", key, settlement);
      else merged[key] = { ...makeLocationObject(merged[key].name || fallback[key]?.name, merged[key].category || key, settlement), ...merged[key] };
    }
    return merged;
  }

  function normalizeScheduleEntries(rows, npc) {
    return rows.map((row, index) => {
      if (typeof row === "string") return scheduleEntry(BEL_WEEKDAYS[index % BEL_WEEKDAYS.length], "08:00", "09:00", npc.assignedLocations.personal, row, "imported schedule note", "public");
      const loc = row.location || { id:row.locationId, name:row.locationName, category:row.locationCategory || "imported" };
      const activity = firstDefined(row.activity, row.title, row.reason, "Imported activity");
      const visual = row.activityVisual || activityVisual(activity);
      return { ...row, weekday:firstDefined(row.weekday, row.day, BEL_WEEKDAYS[index % BEL_WEEKDAYS.length]), startTime:firstDefined(row.startTime, row.start, "08:00"), endTime:firstDefined(row.endTime, row.end, "09:00"), locationId:firstDefined(row.locationId, loc.id, npc.assignedLocations.personal.id), locationName:firstDefined(row.locationName, loc.name, npc.assignedLocations.personal.name), locationEmoji:firstDefined(row.locationEmoji, locationEmoji(loc)), activity, emoji:firstDefined(row.emoji, visual.emoji), activityImage:firstDefined(row.activityImage, visual.imageAsset), activityVisual: visual, reason:firstDefined(row.reason, "imported schedule"), secrecy:firstDefined(row.secrecy, "public"), repeats: row.repeats !== false };
    });
  }

  function normalizeRelationshipBuckets(value) {
    const out = { familial:[], romantic:[], personal:[], professional:[] };
    if (!value) return out;
    if (Array.isArray(value)) value.forEach(r => { const cat = r.category && out[r.category] ? r.category : "personal"; out[cat].push(r); });
    else Object.keys(out).forEach(cat => { out[cat] = ensureArray(value[cat]).filter(Boolean); });
    return out;
  }

  function normalizeFamilyTree(value) {
    return { householdId:value?.householdId || null, role:value?.role || "independent", guardians:ensureArray(value?.guardians), dependents:ensureArray(value?.dependents), siblings:ensureArray(value?.siblings), partners:ensureArray(value?.partners) };
  }

  function ensureMissingRelationships(npcs, rng, options = {}) {
    const list = npcs || [];
    const needsHousehold = list.filter(n => !n.familyTree?.householdId);
    if (needsHousehold.length) createHouseholdLinks(needsHousehold, rng);
    list.forEach(n => {
      n.relationships = normalizeRelationshipBuckets(n.relationships);
      const candidates = list.filter(other => other.id !== n.id);
      if (!n.relationships.personal.length && candidates.length) addMutualRelationship(n, pick(candidates, rng), "personal", pick(state.data.livingRules.relationshipTypes.personal, rng));
      if (!n.relationships.professional.length && candidates.length) {
        const coworker = pick(candidates.filter(other => other.job?.category === n.job?.category || other.faction?.id === n.faction?.id), rng) || pick(candidates, rng);
        addMutualRelationship(n, coworker, "professional", pick(state.data.livingRules.relationshipTypes.professional, rng));
      }
      if (!n.relationships.romantic.length && n.age >= 18 && rng() < .18) {
        const partner = pick(candidates.filter(other => other.age >= 18), rng);
        if (partner) addMutualRelationship(n, partner, "romantic", pick(["dating","committed partners","engaged","spouses","civil partners"], rng));
      }
    });
  }

  function createHouseholdLinks(npcs, rng) {
    const pool = [...npcs].sort((a,b) => b.age - a.age);
    let householdIndex = state.npcs.length;
    while (pool.length) {
      const members = pool.splice(0, Math.min(pool.length, 1 + Math.floor(rng()*4)));
      const hid = `household_imported_${++householdIndex}_${slug(members[0].assignedLocations?.home?.name || members[0].name)}`;
      const adults = members.filter(n => n.age >= 20);
      const youths = members.filter(n => n.age < 20);
      members.forEach(m => { m.familyTree = normalizeFamilyTree(m.familyTree); m.familyTree.householdId = m.familyTree.householdId || hid; });
      if (members.length === 1) members[0].familyTree.role = members[0].familyTree.role || "single-person household";
      youths.forEach(y => adults.slice(0,2).forEach(a => { y.familyTree.guardians.push({id:a.id, name:a.name}); a.familyTree.dependents.push({id:y.id, name:y.name}); addMutualRelationship(y, a, "familial", "guardian / ward"); }));
    }
  }

  function addMutualRelationship(a, b, category, label) {
    if (!a || !b || a.id === b.id) return;
    a.relationships = normalizeRelationshipBuckets(a.relationships);
    b.relationships = normalizeRelationshipBuckets(b.relationships);
    if (!a.relationships[category].some(r => r.npcId === b.id)) a.relationships[category].push(rel(b, category, label));
    if (!b.relationships[category].some(r => r.npcId === a.id)) b.relationships[category].push(rel(a, category, label));
  }

  function matchRace(value) {
    if (!value) return null;
    const id = typeof value === "object" ? value.id : "";
    const name = typeof value === "object" ? value.name : String(value);
    const key = slug(id || name);
    return allRaceDetails().find(r => slug(r.id) === key || slug(r.name) === key || slug(r.name).includes(key) || key.includes(slug(r.name))) || null;
  }

  function matchGender(value) {
    if (!value) return null;
    const key = slug(typeof value === "object" ? value.identity || value.name : value);
    return state.data.livingRules.genderIdentities.find(g => slug(g.identity) === key) || null;
  }

  function matchProvince(npc, settlement) {
    const key = slug(firstDefined(npc.assignment?.provinceId, npc.assignment?.provinceName, npc.provinceId, npc.provinceName, npc.province, settlement?.provinceId, settlement?.provinceName, settlement?.province));
    return flattenProvinces().find(p => slug(p.id) === key || slug(p.name) === key) || flattenProvinces().find(p => p.id === settlement?.provinceId || p.name === settlement?.provinceName || p.name === settlement?.province) || currentProvince();
  }

  function matchSettlement(obj) {
    const key = slug(firstDefined(obj.assignment?.settlementId, obj.assignment?.settlementName, obj.settlementId, obj.settlementName, obj.settlement, obj.location?.settlementName));
    if (!key) return currentSettlement();
    return flattenSettlements().find(s => slug(s.id) === key || slug(s.name) === key) || currentSettlement();
  }

  function inferLocationCategory(name) {
    const text = String(name || "").toLowerCase();
    if (/house|home|residence|apartment|tenement|boarding/.test(text)) return "home";
    if (/station|port|dock|ferry|rail|caravan|skyship|steamship|submarine|portal/.test(text)) return "transportation";
    if (/temple|shrine|chapel|cathedral/.test(text)) return "religious";
    if (/market|shop|bazaar|guild|warehouse/.test(text)) return "commercial";
    if (/hospital|clinic|healer|apothecary/.test(text)) return "medical";
    if (/library|academy|school|archive/.test(text)) return "education";
    if (/park|garden|grove/.test(text)) return "public";
    if (/prison|jail|court|hall|barracks/.test(text)) return "civic";
    return "imported";
  }

  function reconcileAllNpcAssignments(rng) {
    (state.npcs || []).forEach((npc, index) => {
      ensureNpcCore(npc, index, rng);
      const settlement = matchSettlement(npc);
      const custom = (state.customLocations || []).filter(loc => !loc.settlementId || loc.settlementId === settlement?.id || loc.settlementName === settlement?.name);
      if (!custom.length) return;
      const generatedOnly = loc => !loc?.imported && !String(loc?.source || "").startsWith("imported:");
      const replaceIfGenerated = (slot, matcher) => {
        if (!generatedOnly(npc.assignedLocations[slot])) return;
        const candidate = pick(custom.filter(matcher), rng) || pick(custom, rng);
        if (candidate) npc.assignedLocations[slot] = makeLocationObject(candidate.name, candidate.category || slot, settlement);
      };
      replaceIfGenerated("work", loc => /work|commercial|civic|religious|medical|education|transportation|imported/i.test(loc.category));
      replaceIfGenerated("personal", loc => /public|commercial|religious|education|imported/i.test(loc.category));
      replaceIfGenerated("professionalTravel", loc => /transportation|civic|commercial|imported/i.test(loc.category));
      npc.schedules = makeSchedule(npc.job, npc.assignedLocations, npc.transitRoute || makeTravelRoute(matchProvince(npc, settlement), settlement, npc.assignedLocations, rng), rng);
    });
  }

  function fivePercentRandomize() {
    const rng = makeRng(`${state.seed}|five-percent|${Date.now()}`);
    const ops = [];
    state.npcs.forEach(npc => {
      ops.push(() => {
        const id = window.BelavadosIdentityEngine.pickIdentity(`${state.seed}|randomize-identity|${npc.id}|${Date.now()}`, npc.assignment?.settlementType);
        npc.genderIdentity = id.name;
        window.BelavadosIdentityEngine.assignOne(npc, {seed:`${state.seed}|randomize-language|${npc.id}|${Date.now()}`,overwrite:true});
      });
      ops.push(() => { npc.job.title = slightTitleVariant(npc.job.title, rng); });
      ops.push(() => { npc.name = slightNameVariant(npc.name, rng); });
      ops.push(() => { const axis = pick(AXES, rng); npc.alignment.scores[axis] = clamp(Math.round(npc.alignment.scores[axis] + pick([-283,283], rng)), 0, 3000); npc.alignment = normalizeAlignment({ scores:npc.alignment.scores }, npc.race, rng, npc.class, npc.settlementDangerLevel || npc.dangerLevel || npc.danger || state.danger, `${npc.id || npc.name}|five-percent`); });
      ops.push(() => { const settlement = matchSettlement(npc); const pool = getLocationPool(settlement); const name = pick(pool, rng); npc.assignedLocations.personal = makeLocationObject(name, "personal", settlement); });
    });
    state.customLocations.forEach(loc => ops.push(() => { loc.name = slightLocationVariant(loc.name, rng); }));
    const count = Math.max(1, Math.ceil(ops.length * 0.05));
    sample(ops, count, rng).forEach(fn => fn());
    warnOnce(`5% randomizer applied ${count} small changes across NPC and location fields only.`);
    renderAll();
  }

  function slightTitleVariant(title, rng) {
    const prefixes = ["Assistant", "Senior", "Night", "Traveling", "Guild", "Deputy", "Apprentice"];
    const suffixes = ["Coordinator", "Clerk", "Specialist", "Keeper", "Handler", "Warden"];
    return rng() < .5 ? `${pick(prefixes, rng)} ${title}` : `${title} ${pick(suffixes, rng)}`;
  }
  function slightNameVariant(name, rng) {
    const parts = String(name || "").split(/\s+/);
    if (parts.length < 2) return name;
    parts[0] = makeName({name:parts[1]}, {}, rng).split(" ")[0];
    return parts.join(" ");
  }
  function slightLocationVariant(name, rng) {
    const prefixes = ["Old", "New", "Upper", "Lower", "Grand", "Little", "Moonlit", "Brass"];
    return `${pick(prefixes, rng)} ${String(name || "Location").replace(/^(Old|New|Upper|Lower|Grand|Little|Moonlit|Brass)\s+/i, "")}`;
  }

  function rerollNpc(id) {
    const index = state.npcs.findIndex(n => n.id === id);
    if (index < 0) return;
    const original = state.npcs[index];
    const rng = makeRng(`${state.seed}|reroll|${id}|${Date.now()}`);
    const settlement = matchSettlement(original) || currentSettlement() || flattenSettlements()[0];
    const province = matchProvince(original, settlement);
    const race = matchRace(original.race) || pick(allRaceDetails(), rng);
    const replacement = makeNPC(index, race, province, settlement, rng);
    replacement.id = original.id;
    if (original.source?.type === "imported") {
      const keep = new Set(original.protectedFields || []);
      keep.add("source"); keep.add("protectedFields"); keep.add("importedRaw"); keep.add("quests"); keep.add("questHooks"); keep.add("offeredQuests"); keep.add("name"); keep.add("id");
      for (const key of keep) if (original[key] !== undefined) replacement[key] = original[key];
      replacement.source = original.source;
    }
    state.npcs[index] = replacement;
    ensureNpcExpansion(state.npcs, rng, { linkExisting:true });
    // V7: adult-only reciprocal relationships; at least 60% of the whole population attached.
    window.BelavadosRelationshipEngine?.ensureCoverage(state.npcs, rng);
    addRelationshipScheduleContext(state.npcs, rng);
    warnOnce(`${replacement.name} was rerolled. Uploaded/imported priority fields were preserved.`);
    renderAll();
  }

  window.LifeSimulator = {
    version: "1.1-location-api",
    get state() { return state; },
    helpers: {
      makeRng, pick, sample, clamp, slug, escapeHTML, cleanText, ensureArray, firstDefined,
      flattenProvinces, flattenSettlements, currentProvince, currentSettlement, allRaceDetails, sanitizeRaceCache, matchRaceBloodline, allBiomeOptions, getLocationPool, makeLocationObject,
      matchSettlement, matchProvince, inferLocationCategory, normalizeImportedLocation, makeSchedule, makeTravelRoute, locationEmoji, activityVisual
    },
    actions: {
      renderAll, renderNPCs, renderRelationshipTracker, warnOnce, ensureNpcExpansion, addRelationshipScheduleContext, reconcileAllNpcAssignments, fivePercentRandomize
    }
  };

  window.LegacyLifeSimulator = window.LifeSimulator;

  init().catch(err => {
    console.error(err);
    document.body.innerHTML = `<main class="card" style="margin:2rem;padding:1rem"><h1>Life Simulator could not start</h1><p>${escapeHTML(err.message)}</p></main>`;
  });
})();
