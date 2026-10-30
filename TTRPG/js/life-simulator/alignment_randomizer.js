/*
  life_simulator_alignment_randomizer.js
  Life Simulator NPC alignment randomization engine

  Purpose:
  - Randomize NPC alignment from race + class(es) + settlement danger level.
  - Preserve the Life Simulator four-axis model.
  - Return the actual Life Simulator alignment profile name, not a generic phrase.
  - Make true neutral and exact matching score signatures extremely rare by default.

  Drop this file beside your simulator/generator JS files and include it with:
    <script src="life_simulator_alignment_randomizer.js"></script>

  Main API:
    LifeAlignmentRandomizer.generateAlignment({ race, classes, settlementDangerLevel, npcId })
    LifeAlignmentRandomizer.randomizeNPC(npc, options)
    LifeAlignmentRandomizer.randomizeNPCBatch(npcs, options)
    LifeAlignmentRandomizer.registerRaceAlignment("Race Name", { altruism: 1750, lawfulness: 1250, cooperation: 1750, honor: 2000 })
*/
(function attachLifeAlignmentRandomizer(globalScope) {
  "use strict";

  const AXES = ["altruism", "lawfulness", "cooperation", "honor"];

  const AXIS_DISPLAY = Object.freeze({
    altruism: "Altruism",
    lawfulness: "Lawfulness",
    cooperation: "Cooperation",
    honor: "Honor"
  });

  // User-specified axis phases.
  const AXIS_PHASE_WORDS = Object.freeze({
    altruism: { negative: "Selfish", neutral: "Neutral", positive: "Altruistic" },
    lawfulness: { negative: "Chaotic", neutral: "Neutral", positive: "Lawful" },
    cooperation: { negative: "Combative", neutral: "Neutral", positive: "Cooperative" },
    honor: { negative: "Pragmatic", neutral: "Neutral", positive: "Honorable" }
  });

  // Actual Life Simulator profile archetype names.
  // Final profile name is: `${LawfulnessPhase} ${Archetype}`.
  // Key order: altruismPhase|cooperationPhase|honorPhase.
  const PROFILE_ARCHETYPES = {
    // Selfish profiles
    "Selfish|Cooperative|Pragmatic": "Renegade",
    "Selfish|Cooperative|Neutral": "Drifter",
    "Selfish|Cooperative|Honorable": "Champion",
    "Selfish|Neutral|Pragmatic": "Strategist",
    "Selfish|Neutral|Neutral": "Knave",
    "Selfish|Neutral|Honorable": "Avenger",
    "Selfish|Combative|Pragmatic": "Mercenary",
    "Selfish|Combative|Neutral": "Marauder",
    "Selfish|Combative|Honorable": "Gladiator",

    // Neutral altruism profiles
    "Neutral|Cooperative|Pragmatic": "Operator",
    "Neutral|Cooperative|Neutral": "Collaborator",
    "Neutral|Cooperative|Honorable": "Harmonizer",
    "Neutral|Neutral|Pragmatic": "Adapter",
    // The guide excerpt available to this file did not expose a distinct all-neutral archetype.
    // This engine keeps true all-neutral extremely rare and resolves the rare event as Adapter
    // unless you override it with setProfileName("Neutral", "Neutral", "Neutral", "Neutral", "Your Name").
    "Neutral|Neutral|Neutral": "Adapter",
    "Neutral|Neutral|Honorable": "Ethicist",
    "Neutral|Combative|Pragmatic": "Ravager",
    "Neutral|Combative|Neutral": "Scoundrel",
    "Neutral|Combative|Honorable": "Warrior",

    // Altruistic profiles
    "Altruistic|Cooperative|Pragmatic": "Coordinator",
    "Altruistic|Cooperative|Neutral": "Mediator",
    "Altruistic|Cooperative|Honorable": "Guardian",
    "Altruistic|Neutral|Pragmatic": "Defender",
    "Altruistic|Neutral|Neutral": "Arbiter",
    "Altruistic|Neutral|Honorable": "Sentinel",
    "Altruistic|Combative|Pragmatic": "Enforcer",
    "Altruistic|Combative|Neutral": "Vigilante",
    "Altruistic|Combative|Honorable": "Crusader"
  };

  // Class tendency ranges from the Life Simulator class tendency tables.
  // Multiclass characters blend all listed classes.
  const CLASS_RANGES = Object.freeze({
    barbarian: { altruism: [1200, 1900], lawfulness: [500, 1400], cooperation: [1200, 1900], honor: [1000, 2200] },
    bard: { altruism: [1400, 2200], lawfulness: [900, 1700], cooperation: [1800, 2600], honor: [1200, 2200] },
    cleric: { altruism: [1700, 3000], lawfulness: [1700, 3000], cooperation: [1600, 2600], honor: [1700, 3000] },
    druid: { altruism: [1500, 2400], lawfulness: [1000, 1900], cooperation: [1400, 2200], honor: [1500, 2300] },
    fighter: { altruism: [1200, 2200], lawfulness: [1200, 2400], cooperation: [1300, 2200], honor: [1200, 2500] },
    monk: { altruism: [1600, 2600], lawfulness: [2000, 3000], cooperation: [1500, 2200], honor: [2000, 3000] },
    paladin: { altruism: [1800, 3000], lawfulness: [2000, 3000], cooperation: [1600, 2600], honor: [2000, 3000] },
    ranger: { altruism: [1400, 2400], lawfulness: [900, 1900], cooperation: [1200, 2100], honor: [1400, 2400] },
    rogue: { altruism: [700, 1800], lawfulness: [700, 1700], cooperation: [700, 1800], honor: [500, 1800] },
    sorcerer: { altruism: [1000, 2200], lawfulness: [700, 1700], cooperation: [1200, 2200], honor: [900, 2200] },
    warlock: { altruism: [500, 1900], lawfulness: [700, 1800], cooperation: [700, 1900], honor: [400, 1800] },
    wizard: { altruism: [1200, 2300], lawfulness: [1300, 2400], cooperation: [1200, 2000], honor: [1200, 2400] },
    artificer: { altruism: [1500, 2400], lawfulness: [1700, 2600], cooperation: [1700, 2500], honor: [1400, 2300] },
    "blood hunter": { altruism: [900, 2100], lawfulness: [900, 1900], cooperation: [1000, 1900], honor: [900, 2200] }
  });

  // Small built-in starter map. The engine also accepts external race data and parsed Axis Reading text.
  const RACE_BASELINES = Object.create(null);
  [
    ["human", 1500, 1500, 1500, 1500],
    ["umbral human", 1500, 1500, 1500, 1500],
    ["half-elf", 1500, 2000, 2000, 1500],
    ["half-orc", 1500, 2000, 1750, 1750],
    ["elf", 1750, 1750, 1750, 2250],
    ["high elf", 1750, 1750, 1750, 2250],
    ["wood elf", 1750, 1250, 1500, 2000],
    ["drow", 1250, 1750, 1250, 1250],
    ["astral elf", 1750, 1500, 1750, 2000],
    ["sea elf", 1750, 1500, 1750, 2000],
    ["dwarf", 1500, 2250, 1750, 2250],
    ["duergar", 1500, 2000, 1750, 2000],
    ["gnome", 1500, 2000, 1750, 2000],
    ["deep gnome", 1500, 2000, 1500, 2000],
    ["halfling", 2000, 1750, 2250, 2000],
    ["kender", 1750, 750, 1750, 1250],
    ["kithkin", 2250, 2000, 2500, 2250],
    ["orc", 1000, 1250, 1500, 1500],
    ["goblin", 1000, 1000, 1250, 1250],
    ["hobgoblin", 1000, 2250, 2000, 1750],
    ["bugbear", 1000, 1250, 1000, 1250],
    ["gnoll", 750, 750, 1250, 750],
    ["kobold", 1250, 2000, 1750, 2000],
    ["hexblood", 1250, 1250, 1500, 1000],
    ["accursed", 1250, 1250, 1250, 1000],
    ["fairy", 1750, 750, 1500, 1500],
    ["faerie", 1750, 750, 1750, 1500],
    ["changeling", 1750, 1000, 1500, 1250],
    ["lorwyn changeling", 1750, 1000, 1500, 1250],
    ["satyr", 1750, 750, 1750, 1500],
    ["harengon", 1750, 1000, 1750, 1750],
    ["leonin", 2000, 1500, 1750, 2250],
    ["loxodon", 2000, 1750, 2000, 2000],
    ["shifter", 1250, 1750, 1250, 1500],
    ["verdan", 1500, 1500, 1500, 1500],
    ["kaluseban", 1700, 1550, 1500, 1800],
    ["mandrake", 2000, 1500, 2250, 1750],
    ["mycelian", 1750, 1500, 2500, 2000]
  ].forEach(([race, altruism, lawfulness, cooperation, honor]) => {
    RACE_BASELINES[race] = { altruism, lawfulness, cooperation, honor };
  });

  // Settlement danger modifies social pressure. This should be used as a nudge, not a hard lock.
  const DANGER_BIAS = Object.freeze({
    peaceful: { altruism: 120, lawfulness: 90, cooperation: 120, honor: 80, volatility: 0.80 },
    safe: { altruism: 80, lawfulness: 70, cooperation: 90, honor: 60, volatility: 0.90 },
    low: { altruism: 40, lawfulness: 30, cooperation: 40, honor: 20, volatility: 1.00 },
    moderate: { altruism: 0, lawfulness: 0, cooperation: 0, honor: 0, volatility: 1.12 },
    dangerous: { altruism: -90, lawfulness: -60, cooperation: -80, honor: -70, volatility: 1.30 },
    high: { altruism: -125, lawfulness: -90, cooperation: -110, honor: -100, volatility: 1.45 },
    extreme: { altruism: -200, lawfulness: -140, cooperation: -170, honor: -170, volatility: 1.70 },
    lethal: { altruism: -260, lawfulness: -180, cooperation: -230, honor: -230, volatility: 2.00 }
  });

  const DEFAULT_OPTIONS = Object.freeze({
    seed: null,
    // Race is the strongest identity anchor, class is second, settlement danger is third.
    weights: { race: 0.48, class: 0.34, danger: 0.18 },
    baseVolatility: 235,
    multiclassSpreadBonus: 36,
    exactNeutralChance: 0.0001,
    allNeutralPhaseChance: 0.001,
    // Neutral axis phases should be rare for generated NPCs.
    // Set higher only if you intentionally want many neutral NPCs.
    neutralAxisChance: 0.06,
    minimumNonNeutralAxes: 2,
    avoidExactScoreDuplicates: true,
    avoidAllAxisNeutral: true,
    allowExactNeutral: false,
    scoreSnap: 1,
    maxDuplicateRepairAttempts: 32
  });

  function normalizeKey(value) {
    return String(value || "")
      .toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[’']/g, "")
      .replace(/[_-]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function hashString(input) {
    let h = 2166136261 >>> 0;
    const s = String(input || "LifeAlignmentSeed");
    for (let i = 0; i < s.length; i += 1) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  // Mulberry32-style seeded RNG; good enough for deterministic game randomization.
  function createRng(seed) {
    let a = typeof seed === "number" ? seed >>> 0 : hashString(seed);
    return function rng() {
      a += 0x6D2B79F5;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function randomBetween(rng, min, max) {
    return min + (max - min) * rng();
  }

  function randomInt(rng, min, max) {
    return Math.floor(randomBetween(rng, min, max + 1));
  }

  function gaussian(rng) {
    // Box-Muller; centered around 0, most results between -2 and 2.
    let u = 0;
    let v = 0;
    while (u === 0) u = rng();
    while (v === 0) v = rng();
    return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  }

  function averageAxes(records) {
    const out = { altruism: 1500, lawfulness: 1500, cooperation: 1500, honor: 1500 };
    const usable = records.filter(Boolean);
    if (!usable.length) return out;
    AXES.forEach(axis => {
      out[axis] = usable.reduce((sum, item) => sum + Number(item[axis] || 1500), 0) / usable.length;
    });
    return out;
  }

  function midpoint(range) {
    return (Number(range[0]) + Number(range[1])) / 2;
  }

  function normalizeClasses(classes) {
    if (!classes) return [];
    if (typeof classes === "string") {
      return classes.split(/[,+/&]|\band\b/gi).map(normalizeKey).filter(Boolean);
    }
    if (Array.isArray(classes)) {
      return classes.map(item => {
        if (typeof item === "string") return normalizeKey(item);
        return normalizeKey(item && (item.name || item.class || item.className));
      }).filter(Boolean);
    }
    return [normalizeKey(classes.name || classes.class || classes.className)].filter(Boolean);
  }

  function classMidpoint(classKey) {
    const entry = CLASS_RANGES[normalizeKey(classKey)];
    if (!entry) return null;
    const out = {};
    AXES.forEach(axis => { out[axis] = midpoint(entry[axis]); });
    return out;
  }

  function classBlend(classes) {
    const records = normalizeClasses(classes).map(classMidpoint).filter(Boolean);
    return averageAxes(records);
  }

  function getRaceBaseline(race, externalRaceMap) {
    if (race && typeof race === "object") {
      const direct = extractAxesFromObject(race);
      if (direct) return direct;
      if (race.axisReading) {
        const parsed = parseAxisReadingText(race.axisReading);
        if (parsed) return parsed;
      }
      race = race.name || race.race || race.lineage || race.ancestry || "";
    }
    const key = normalizeKey(race);
    if (externalRaceMap) {
      const ext = externalRaceMap[key] || externalRaceMap[String(race || "")];
      const axes = extractAxesFromObject(ext);
      if (axes) return axes;
    }
    return RACE_BASELINES[key] || { altruism: 1500, lawfulness: 1500, cooperation: 1500, honor: 1500 };
  }

  function extractAxesFromObject(obj) {
    if (!obj || typeof obj !== "object") return null;
    const source = obj.axes || obj.alignmentAxes || obj.alignment || obj;
    const out = {};
    let found = false;
    AXES.forEach(axis => {
      if (source[axis] != null) {
        out[axis] = Number(source[axis]);
        found = true;
      } else if (source[AXIS_DISPLAY[axis]] != null) {
        out[axis] = Number(source[AXIS_DISPLAY[axis]]);
        found = true;
      } else {
        out[axis] = 1500;
      }
    });
    return found ? out : null;
  }

  function parseAxisReadingText(text) {
    if (!text || typeof text !== "string") return null;
    const out = {};
    const patterns = {
      altruism: /Altruism\s*:\s*(-?\d+)/i,
      lawfulness: /Lawfulness\s*:\s*(-?\d+)/i,
      cooperation: /Cooperation\s*:\s*(-?\d+)/i,
      honor: /Honor\s*:\s*(-?\d+)/i
    };
    let found = false;
    AXES.forEach(axis => {
      const match = text.match(patterns[axis]);
      if (match) {
        out[axis] = clamp(Number(match[1]), 0, 3000);
        found = true;
      } else {
        out[axis] = 1500;
      }
    });
    return found ? out : null;
  }

  function dangerBias(level) {
    const key = normalizeKey(level || "moderate");
    return DANGER_BIAS[key] || DANGER_BIAS.moderate;
  }

  function mergeOptions(options) {
    const merged = Object.assign({}, DEFAULT_OPTIONS, options || {});
    merged.weights = Object.assign({}, DEFAULT_OPTIONS.weights, (options && options.weights) || {});
    return merged;
  }

  function weightedBase({ raceAxes, classAxes, danger, options }) {
    const out = {};
    AXES.forEach(axis => {
      const weighted =
        (raceAxes[axis] * options.weights.race) +
        (classAxes[axis] * options.weights.class) +
        ((1500 + (danger[axis] || 0)) * options.weights.danger);
      out[axis] = clamp(weighted, 0, 3000);
    });
    return out;
  }

  function snapScore(value, snap) {
    const step = Math.max(1, Number(snap || 1));
    return Math.round(value / step) * step;
  }

  function avoidExactNeutral(score, rng, options) {
    if (options.allowExactNeutral) return score;
    if (score === 1500) {
      return 1500 + (rng() < 0.5 ? -1 : 1) * randomInt(rng, 7, 83);
    }
    // Also keep generated scores from hugging perfect center too often.
    if (Math.abs(score - 1500) <= 2 && rng() > options.exactNeutralChance) {
      return 1500 + (score < 1500 ? -1 : 1) * randomInt(rng, 11, 91);
    }
    return score;
  }

  function scoreToAxisPhase(axis, score) {
    const words = AXIS_PHASE_WORDS[axis];
    const clean = clamp(Math.round(score), 0, 3000);
    let direction;
    let phase;
    let intensity;

    if (clean < 1000) {
      direction = "negative";
      phase = words.negative;
      if (clean <= 249) intensity = "extremely";
      else if (clean <= 499) intensity = "very";
      else if (clean <= 749) intensity = "moderately";
      else intensity = "slightly";
    } else if (clean <= 1999) {
      direction = "neutral";
      phase = words.neutral;
      const distanceFromCenter = Math.abs(clean - 1500);
      if (distanceFromCenter === 0) intensity = "perfectly";
      else if (distanceFromCenter <= 124) intensity = "extremely";
      else if (distanceFromCenter <= 249) intensity = "very";
      else if (distanceFromCenter <= 374) intensity = "moderately";
      else intensity = "slightly";
    } else {
      direction = "positive";
      phase = words.positive;
      if (clean <= 2249) intensity = "slightly";
      else if (clean <= 2499) intensity = "moderately";
      else if (clean <= 2749) intensity = "very";
      else intensity = "extremely";
    }

    return {
      axis,
      axisName: AXIS_DISPLAY[axis],
      score: clean,
      direction,
      phase,
      intensity,
      label: `${capitalize(intensity)} ${phase}`
    };
  }

  function capitalize(value) {
    const s = String(value || "");
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  function resolveAlignmentName(phases) {
    const lawfulness = phases.lawfulness.phase;
    const key = `${phases.altruism.phase}|${phases.cooperation.phase}|${phases.honor.phase}`;
    const archetype = PROFILE_ARCHETYPES[key] || "Adapter";
    return `${lawfulness} ${archetype}`;
  }

  function phaseSignature(phases) {
    return AXES.map(axis => phases[axis].phase).join("|");
  }

  function detailedSignature(phases) {
    return AXES.map(axis => `${phases[axis].intensity}:${phases[axis].phase}`).join("|");
  }

  function scoreSignature(scores) {
    return AXES.map(axis => `${axis}:${Math.round(scores[axis])}`).join("|");
  }

  function allNeutral(phases) {
    return AXES.every(axis => phases[axis].phase === "Neutral");
  }

  function directionalScore(rng, direction) {
    // Spread within a phase so two NPCs rarely land on the same intensity or score.
    if (direction === "positive") return randomInt(rng, 2000, 3000);
    return randomInt(rng, 0, 999);
  }

  function chooseNonNeutralDirection(axis, baseScores, danger, rng) {
    const base = baseScores && Number(baseScores[axis]);
    if (Number.isFinite(base) && base <= 1350) return "negative";
    if (Number.isFinite(base) && base >= 1650) return "positive";

    // Settlement danger tends to harden people toward selfish, chaotic, combative, pragmatic pressure.
    const dangerPush = danger && Number(danger[axis] || 0);
    if (dangerPush <= -80 && rng() < 0.7) return "negative";
    if (dangerPush >= 80 && rng() < 0.7) return "positive";
    return rng() < 0.5 ? "negative" : "positive";
  }

  function deNeutralizeScores(scores, phases, baseScores, danger, rng, options) {
    const out = Object.assign({}, scores);
    let neutralAxes = AXES.filter(axis => phases[axis].phase === "Neutral");

    neutralAxes.forEach(axis => {
      if (rng() > options.neutralAxisChance) {
        out[axis] = directionalScore(rng, chooseNonNeutralDirection(axis, baseScores, danger, rng));
      }
    });

    let after = Object.fromEntries(AXES.map(axis => [axis, scoreToAxisPhase(axis, out[axis]) ]));
    let nonNeutralCount = AXES.filter(axis => after[axis].phase !== "Neutral").length;

    while (nonNeutralCount < options.minimumNonNeutralAxes) {
      const candidates = AXES.filter(axis => after[axis].phase === "Neutral");
      if (!candidates.length) break;
      const axis = candidates[randomInt(rng, 0, candidates.length - 1)];
      out[axis] = directionalScore(rng, chooseNonNeutralDirection(axis, baseScores, danger, rng));
      after = Object.fromEntries(AXES.map(a => [a, scoreToAxisPhase(a, out[a]) ]));
      nonNeutralCount = AXES.filter(a => after[a].phase !== "Neutral").length;
    }

    return out;
  }

  function perturbScores(scores, rng, magnitude) {
    const out = Object.assign({}, scores);
    const axis = AXES[randomInt(rng, 0, AXES.length - 1)];
    const direction = out[axis] >= 1500 ? 1 : -1;
    const push = randomInt(rng, Math.ceil(magnitude * 0.45), magnitude) * (rng() < 0.75 ? direction : -direction);
    out[axis] = clamp(Math.round(out[axis] + push), 0, 3000);
    if (out[axis] === 1500) out[axis] += rng() < 0.5 ? -17 : 17;
    return out;
  }

  function generateAlignment(input, options) {
    const opts = mergeOptions(options);
    const npcIdentity = input && (input.npcId || input.id || input.name || input.seed || "npc");
    const seedParts = [opts.seed, npcIdentity, input && input.race, JSON.stringify(input && input.classes), input && input.settlementDangerLevel].join("::");
    const rng = createRng(seedParts);
    const raceAxes = getRaceBaseline(input && input.race, opts.raceMap);
    const classAxes = classBlend(input && (input.classes || input.class || input.className));
    const danger = dangerBias(input && (input.settlementDangerLevel || input.dangerLevel || input.danger || "moderate"));
    const classes = normalizeClasses(input && (input.classes || input.class || input.className));
    const volatility = (opts.baseVolatility + Math.max(0, classes.length - 1) * opts.multiclassSpreadBonus) * (danger.volatility || 1);
    const base = weightedBase({ raceAxes, classAxes, danger, options: opts });

    let scores = {};
    AXES.forEach(axis => {
      const wildness = gaussian(rng) * volatility;
      const smallDice = randomInt(rng, -37, 37); // dice-bot-style swing without forcing d20 mechanics.
      scores[axis] = clamp(snapScore(base[axis] + wildness + smallDice, opts.scoreSnap), 0, 3000);
      scores[axis] = avoidExactNeutral(scores[axis], rng, opts);
    });

    let phases = Object.fromEntries(AXES.map(axis => [axis, scoreToAxisPhase(axis, scores[axis]) ]));

    // Make neutral NPCs and all-neutral profiles rare by moving most neutral axes
    // into the nearest believable non-neutral phase after race/class/danger blending.
    scores = deNeutralizeScores(scores, phases, base, danger, rng, opts);
    phases = Object.fromEntries(AXES.map(axis => [axis, scoreToAxisPhase(axis, scores[axis]) ]));

    if (opts.avoidAllAxisNeutral && allNeutral(phases) && rng() > opts.allNeutralPhaseChance) {
      scores = deNeutralizeScores(scores, phases, base, danger, rng, Object.assign({}, opts, { neutralAxisChance: 0, minimumNonNeutralAxes: 2 }));
      phases = Object.fromEntries(AXES.map(axis => [axis, scoreToAxisPhase(axis, scores[axis]) ]));
    }

    const alignmentName = resolveAlignmentName(phases);
    return {
      alignmentName,
      profileName: alignmentName,
      scores: Object.fromEntries(AXES.map(axis => [axis, Math.round(scores[axis])])),
      axes: phases,
      axisPhases: Object.fromEntries(AXES.map(axis => [axis, phases[axis].phase])),
      axisIntensities: Object.fromEntries(AXES.map(axis => [axis, phases[axis].intensity])),
      fullAlignmentLabel: AXES.map(axis => phases[axis].label).join(" / "),
      phaseSignature: phaseSignature(phases),
      detailedSignature: detailedSignature(phases),
      scoreSignature: scoreSignature(scores),
      inputInfluence: {
        race: input && input.race,
        classes,
        settlementDangerLevel: input && (input.settlementDangerLevel || input.dangerLevel || input.danger || "moderate"),
        raceAxes,
        classAxes,
        dangerBias: danger
      }
    };
  }

  function repairDuplicate(result, registry, rng, options) {
    if (!options.avoidExactScoreDuplicates || !registry) return result;
    let current = result;
    let attempts = 0;
    while (registry.has(current.scoreSignature) && attempts < options.maxDuplicateRepairAttempts) {
      const nextScores = perturbScores(current.scores, rng, 173 + attempts * 11);
      const phases = Object.fromEntries(AXES.map(axis => [axis, scoreToAxisPhase(axis, nextScores[axis]) ]));
      current = Object.assign({}, current, {
        alignmentName: resolveAlignmentName(phases),
        profileName: resolveAlignmentName(phases),
        scores: Object.fromEntries(AXES.map(axis => [axis, Math.round(nextScores[axis])])),
        axes: phases,
        axisPhases: Object.fromEntries(AXES.map(axis => [axis, phases[axis].phase])),
        axisIntensities: Object.fromEntries(AXES.map(axis => [axis, phases[axis].intensity])),
        fullAlignmentLabel: AXES.map(axis => phases[axis].label).join(" / "),
        phaseSignature: phaseSignature(phases),
        detailedSignature: detailedSignature(phases),
        scoreSignature: scoreSignature(nextScores)
      });
      attempts += 1;
    }
    registry.add(current.scoreSignature);
    return current;
  }

  function randomizeNPC(npc, options) {
    const opts = mergeOptions(options);
    const registry = opts.registry || new Set();
    const seedParts = [opts.seed, npc && (npc.id || npc.npcId || npc.name || JSON.stringify(npc).slice(0, 120)), "repair"].join("::");
    const rng = createRng(seedParts);
    const result = repairDuplicate(generateAlignment({
      npcId: npc && (npc.id || npc.npcId || npc.name),
      race: npc && (npc.race || npc.lineage || npc.ancestry || npc.species),
      classes: npc && (npc.classes || npc.class || npc.className),
      settlementDangerLevel: npc && (npc.settlementDangerLevel || npc.dangerLevel || npc.danger)
    }, opts), registry, rng, opts);

    return Object.assign({}, npc, {
      alignmentName: result.alignmentName,
      alignment: result
    });
  }

  function randomizeNPCBatch(npcs, options) {
    const registry = new Set();
    const opts = Object.assign({}, mergeOptions(options), { registry });
    return (Array.isArray(npcs) ? npcs : []).map((npc, index) => randomizeNPC(Object.assign({ npcId: index }, npc), opts));
  }

  function registerRaceAlignment(raceName, axes) {
    const key = normalizeKey(raceName);
    const parsed = extractAxesFromObject(axes);
    if (!key || !parsed) return false;
    RACE_BASELINES[key] = Object.fromEntries(AXES.map(axis => [axis, clamp(Number(parsed[axis]), 0, 3000)]));
    return true;
  }

  function registerRaceFromAxisReading(raceName, axisReadingText) {
    const parsed = parseAxisReadingText(axisReadingText);
    if (!parsed) return false;
    return registerRaceAlignment(raceName, parsed);
  }

  function setProfileName(altruismPhase, lawfulnessPhase, cooperationPhase, honorPhase, profileName) {
    const key = `${capitalize(normalizeKey(altruismPhase))}|${capitalize(normalizeKey(cooperationPhase))}|${capitalize(normalizeKey(honorPhase))}`;
    PROFILE_ARCHETYPES[key] = String(profileName || "Adapter");
    return `${capitalize(normalizeKey(lawfulnessPhase))} ${PROFILE_ARCHETYPES[key]}`;
  }

  const api = Object.freeze({
    AXES,
    AXIS_PHASE_WORDS,
    CLASS_RANGES,
    DANGER_BIAS,
    PROFILE_ARCHETYPES,
    RACE_BASELINES,
    createRng,
    hashString,
    normalizeKey,
    parseAxisReadingText,
    registerRaceAlignment,
    registerRaceFromAxisReading,
    scoreToAxisPhase,
    resolveAlignmentName,
    generateAlignment,
    randomizeNPC,
    randomizeNPCBatch,
    setProfileName
  });

  if (typeof module !== "undefined" && module.exports) module.exports = api;
  globalScope.LifeAlignmentRandomizer = api;
})(typeof window !== "undefined" ? window : globalThis);
