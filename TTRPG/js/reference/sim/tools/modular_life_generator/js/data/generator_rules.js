window.LIFE_SIMULATOR_LIFE_GENERATOR_RULES = {
  "schema": "life_simulator.lifeGeneratorRules.v1",
  "settlementScaling": {
    "Capital City": {
      "locations": 1312,
      "npcs": 3588,
      "npcsPerLocation": 2.74
    },
    "City": {
      "locations": 1000,
      "npcs": 2700,
      "npcsPerLocation": 2.7
    },
    "Town": {
      "locations": 220,
      "npcs": 600,
      "npcsPerLocation": 2.73
    },
    "Village": {
      "locations": 60,
      "npcs": 160,
      "npcsPerLocation": 2.67
    }
  },
  "settlementDistribution": {
    "Residential": {
      "Capital City": 24,
      "City": 25,
      "Town": 32,
      "Village": 40
    },
    "Commercial": {
      "Capital City": 14,
      "City": 15,
      "Town": 12,
      "Village": 8
    },
    "Hospitality": {
      "Capital City": 8,
      "City": 8,
      "Town": 8,
      "Village": 8
    },
    "Government & Civic": {
      "Capital City": 8,
      "City": 7,
      "Town": 5,
      "Village": 3
    },
    "Religious": {
      "Capital City": 6,
      "City": 6,
      "Town": 6,
      "Village": 5
    },
    "Education": {
      "Capital City": 5,
      "City": 5,
      "Town": 2,
      "Village": 1
    },
    "Medical": {
      "Capital City": 4,
      "City": 4,
      "Town": 2,
      "Village": 1
    },
    "Industry & Crafting": {
      "Capital City": 10,
      "City": 10,
      "Town": 8,
      "Village": 5
    },
    "Agriculture": {
      "Capital City": 4,
      "City": 3,
      "Town": 10,
      "Village": 15
    },
    "Nature": {
      "Capital City": 5,
      "City": 5,
      "Town": 5,
      "Village": 6
    },
    "Maritime": {
      "Capital City": 4,
      "City": 4,
      "Town": 3,
      "Village": 2
    },
    "Transportation": {
      "Capital City": 4,
      "City": 4,
      "Town": 4,
      "Village": 4
    },
    "Noble & Elite": {
      "Capital City": 3,
      "City": 2,
      "Town": 1,
      "Village": 0
    },
    "Criminal & Underground": {
      "Capital City": 2,
      "City": 2,
      "Town": 1,
      "Village": 0
    },
    "Special / Quest / Intrigue": {
      "Capital City": 3,
      "City": 3,
      "Town": 1,
      "Village": 2
    }
  },
  "transportationAllocation": {
    "Train Station": 20,
    "Caravan Station": 20,
    "Ferry Terminal": 15,
    "Steamship Port": 10,
    "Submarine Terminal": 10,
    "Skyship Port": 10,
    "Portal Facility": 5,
    "Warehouse": 5,
    "Freight Depot": 5
  },
  "biomeModifiers": {
    "Coastal River": [
      "Maritime",
      "Commercial",
      "Transportation"
    ],
    "Beach & Grass": [
      "Maritime",
      "Hospitality",
      "Commercial"
    ],
    "Beach & Reefs": [
      "Maritime",
      "Nature",
      "Hospitality"
    ],
    "Deep Forest": [
      "Nature",
      "Residential"
    ],
    "Hybrid Forest Floor": [
      "Nature",
      "Hospitality"
    ],
    "Marsh & Swamp": [
      "Nature"
    ],
    "Partial Forest": [
      "Nature",
      "Agriculture"
    ],
    "Treetops": [
      "Nature",
      "Residential"
    ],
    "Deep Cavern": [
      "Industry & Crafting",
      "Commercial"
    ],
    "Mountain Range": [
      "Industry & Crafting",
      "Transportation"
    ],
    "Valley": [
      "Agriculture",
      "Commercial"
    ],
    "Ocean Surface": [
      "Maritime",
      "Transportation"
    ],
    "Underwater Reefs": [
      "Maritime",
      "Nature"
    ],
    "Underwater Open Ocean": [
      "Maritime",
      "Industry & Crafting"
    ],
    "Farming Plains": [
      "Agriculture"
    ],
    "Grassland": [
      "Agriculture",
      "Residential"
    ],
    "Hybrid Farm/Forest": [
      "Agriculture",
      "Nature"
    ],
    "Prairie": [
      "Agriculture"
    ],
    "Rainforest": [
      "Nature",
      "Hospitality"
    ]
  },
  "mandatoryTransportationRules": {
    "land": [
      "Train Station",
      "Caravan Station"
    ],
    "water": [
      "Ferry Terminal"
    ],
    "underwater": [
      "Submarine Terminal"
    ],
    "city": [
      "Skyship Port"
    ],
    "underwaterCityReplacement": "Submarine Terminal",
    "capital": [
      "Portal Facility"
    ],
    "hybrid": [
      "Train Station",
      "Caravan Station",
      "Ferry Terminal",
      "Steamship Port",
      "Submarine Terminal",
      "Skyship Port",
      "Portal Facility"
    ]
  },
  "overlayRendering": {
    "default": {
      "opacity": 0.15,
      "border": "1.5px"
    },
    "hover": {
      "opacity": 0.3,
      "border": "2px"
    },
    "selected": {
      "opacity": 0.45,
      "border": "3px"
    },
    "district": {
      "opacity": 0.08
    }
  },
  "locationHierarchy": [
    {
      "category": "Government & Civic",
      "subcategory": "Government Building",
      "overlayColor": "Royal Blue",
      "hex": "#4169E1"
    },
    {
      "category": "Government & Civic",
      "subcategory": "Town Hall",
      "overlayColor": "Royal Blue",
      "hex": "#4169E1"
    },
    {
      "category": "Government & Civic",
      "subcategory": "Courthouse",
      "overlayColor": "Steel Blue",
      "hex": "#4682B4"
    },
    {
      "category": "Government & Civic",
      "subcategory": "Guard Station",
      "overlayColor": "Navy Blue",
      "hex": "#1E3A8A"
    },
    {
      "category": "Government & Civic",
      "subcategory": "Barracks",
      "overlayColor": "Deep Navy",
      "hex": "#1B365D"
    },
    {
      "category": "Government & Civic",
      "subcategory": "Embassy",
      "overlayColor": "Sapphire",
      "hex": "#0F52BA"
    },
    {
      "category": "Government & Civic",
      "subcategory": "Administrative District",
      "overlayColor": "Slate Blue",
      "hex": "#6A5ACD"
    },
    {
      "category": "Religious",
      "subcategory": "Temple",
      "overlayColor": "Gold",
      "hex": "#D4AF37"
    },
    {
      "category": "Religious",
      "subcategory": "Shrine",
      "overlayColor": "Pale Gold",
      "hex": "#E6C56A"
    },
    {
      "category": "Religious",
      "subcategory": "Cathedral",
      "overlayColor": "Bright Gold",
      "hex": "#FFD700"
    },
    {
      "category": "Religious",
      "subcategory": "Sacred Grove",
      "overlayColor": "Emerald",
      "hex": "#2E8B57"
    },
    {
      "category": "Religious",
      "subcategory": "Religious District",
      "overlayColor": "Amber Gold",
      "hex": "#FFBF00"
    },
    {
      "category": "Medical",
      "subcategory": "Hospital",
      "overlayColor": "Crimson Red",
      "hex": "#C62828"
    },
    {
      "category": "Medical",
      "subcategory": "Healer",
      "overlayColor": "Rose Red",
      "hex": "#D94A4A"
    },
    {
      "category": "Medical",
      "subcategory": "Apothecary",
      "overlayColor": "Deep Magenta",
      "hex": "#A23B72"
    },
    {
      "category": "Medical",
      "subcategory": "Medical District",
      "overlayColor": "Warm Red",
      "hex": "#D9534F"
    },
    {
      "category": "Commercial",
      "subcategory": "Market",
      "overlayColor": "Orange",
      "hex": "#F57C00"
    },
    {
      "category": "Commercial",
      "subcategory": "Merchant Hall",
      "overlayColor": "Burnt Orange",
      "hex": "#E67E22"
    },
    {
      "category": "Commercial",
      "subcategory": "Trading Post",
      "overlayColor": "Copper",
      "hex": "#B87333"
    },
    {
      "category": "Commercial",
      "subcategory": "Bazaar",
      "overlayColor": "Golden Orange",
      "hex": "#F39C12"
    },
    {
      "category": "Commercial",
      "subcategory": "Commercial District",
      "overlayColor": "Amber",
      "hex": "#FF9800"
    },
    {
      "category": "Hospitality",
      "subcategory": "Tavern",
      "overlayColor": "Warm Brown",
      "hex": "#8B5A2B"
    },
    {
      "category": "Hospitality",
      "subcategory": "Inn",
      "overlayColor": "Tan",
      "hex": "#C19A6B"
    },
    {
      "category": "Hospitality",
      "subcategory": "Hostel",
      "overlayColor": "Sandy Brown",
      "hex": "#D2B48C"
    },
    {
      "category": "Hospitality",
      "subcategory": "Entertainment Venue",
      "overlayColor": "Bronze",
      "hex": "#CD7F32"
    },
    {
      "category": "Education",
      "subcategory": "Library",
      "overlayColor": "Purple",
      "hex": "#6A0DAD"
    },
    {
      "category": "Education",
      "subcategory": "University",
      "overlayColor": "Royal Purple",
      "hex": "#7851A9"
    },
    {
      "category": "Education",
      "subcategory": "Academy",
      "overlayColor": "Indigo",
      "hex": "#4B0082"
    },
    {
      "category": "Education",
      "subcategory": "School",
      "overlayColor": "Lavender",
      "hex": "#9370DB"
    },
    {
      "category": "Industry & Crafting",
      "subcategory": "Blacksmith",
      "overlayColor": "Dark Gray",
      "hex": "#555555"
    },
    {
      "category": "Industry & Crafting",
      "subcategory": "Workshop",
      "overlayColor": "Iron Gray",
      "hex": "#707070"
    },
    {
      "category": "Industry & Crafting",
      "subcategory": "Foundry",
      "overlayColor": "Charcoal",
      "hex": "#3D3D3D"
    },
    {
      "category": "Industry & Crafting",
      "subcategory": "Warehouse",
      "overlayColor": "Slate Gray",
      "hex": "#708090"
    },
    {
      "category": "Industry & Crafting",
      "subcategory": "Industrial District",
      "overlayColor": "Gunmetal",
      "hex": "#2A3439"
    },
    {
      "category": "Agriculture",
      "subcategory": "Farm",
      "overlayColor": "Green",
      "hex": "#4CAF50"
    },
    {
      "category": "Agriculture",
      "subcategory": "Orchard",
      "overlayColor": "Apple Green",
      "hex": "#66BB6A"
    },
    {
      "category": "Agriculture",
      "subcategory": "Vineyard",
      "overlayColor": "Olive Green",
      "hex": "#6B8E23"
    },
    {
      "category": "Agriculture",
      "subcategory": "Ranch",
      "overlayColor": "Moss Green",
      "hex": "#557A46"
    },
    {
      "category": "Agriculture",
      "subcategory": "Agricultural District",
      "overlayColor": "Forest Green",
      "hex": "#228B22"
    },
    {
      "category": "Nature",
      "subcategory": "Park",
      "overlayColor": "Bright Green",
      "hex": "#32CD32"
    },
    {
      "category": "Nature",
      "subcategory": "Garden",
      "overlayColor": "Mint Green",
      "hex": "#98FB98"
    },
    {
      "category": "Nature",
      "subcategory": "Sacred Grove",
      "overlayColor": "Emerald",
      "hex": "#2E8B57"
    },
    {
      "category": "Nature",
      "subcategory": "Forest Area",
      "overlayColor": "Deep Forest Green",
      "hex": "#006400"
    },
    {
      "category": "Nature",
      "subcategory": "Nature Reserve",
      "overlayColor": "Dark Green",
      "hex": "#1B5E20"
    },
    {
      "category": "Maritime",
      "subcategory": "Dock",
      "overlayColor": "Ocean Blue",
      "hex": "#1E88E5"
    },
    {
      "category": "Maritime",
      "subcategory": "Harbor",
      "overlayColor": "Deep Blue",
      "hex": "#1565C0"
    },
    {
      "category": "Maritime",
      "subcategory": "Shipyard",
      "overlayColor": "Navy Blue",
      "hex": "#0D47A1"
    },
    {
      "category": "Maritime",
      "subcategory": "Fishing Wharf",
      "overlayColor": "Teal Blue",
      "hex": "#00838F"
    },
    {
      "category": "Maritime",
      "subcategory": "Maritime District",
      "overlayColor": "Marine Blue",
      "hex": "#0277BD"
    },
    {
      "category": "Residential",
      "subcategory": "Residence",
      "overlayColor": "Light Gray",
      "hex": "#B0BEC5"
    },
    {
      "category": "Residential",
      "subcategory": "Housing District",
      "overlayColor": "Silver Gray",
      "hex": "#A9A9A9"
    },
    {
      "category": "Residential",
      "subcategory": "Neighborhood",
      "overlayColor": "Cool Gray",
      "hex": "#90A4AE"
    },
    {
      "category": "Residential",
      "subcategory": "Apartments",
      "overlayColor": "Pale Gray",
      "hex": "#CFD8DC"
    },
    {
      "category": "Noble & Elite",
      "subcategory": "Noble Estate",
      "overlayColor": "Deep Purple",
      "hex": "#5E35B1"
    },
    {
      "category": "Noble & Elite",
      "subcategory": "Manor",
      "overlayColor": "Royal Violet",
      "hex": "#673AB7"
    },
    {
      "category": "Noble & Elite",
      "subcategory": "Palace",
      "overlayColor": "Imperial Purple",
      "hex": "#512DA8"
    },
    {
      "category": "Noble & Elite",
      "subcategory": "Aristocratic District",
      "overlayColor": "Rich Purple",
      "hex": "#4527A0"
    },
    {
      "category": "Criminal & Underground",
      "subcategory": "Thieves Guild",
      "overlayColor": "Dark Red",
      "hex": "#7B1113"
    },
    {
      "category": "Criminal & Underground",
      "subcategory": "Smuggler Den",
      "overlayColor": "Dark Maroon",
      "hex": "#5D1916"
    },
    {
      "category": "Criminal & Underground",
      "subcategory": "Black Market",
      "overlayColor": "Black",
      "hex": "#222222"
    },
    {
      "category": "Criminal & Underground",
      "subcategory": "Criminal District",
      "overlayColor": "Dark Burgundy",
      "hex": "#4A0404"
    },
    {
      "category": "Transportation",
      "subcategory": "Train Station",
      "overlayColor": "Iron Blue",
      "hex": "#5F7FA3"
    },
    {
      "category": "Transportation",
      "subcategory": "Caravan Station",
      "overlayColor": "Saddle Brown",
      "hex": "#8B4513"
    },
    {
      "category": "Transportation",
      "subcategory": "Ferry Terminal",
      "overlayColor": "Ocean Blue",
      "hex": "#1E88E5"
    },
    {
      "category": "Transportation",
      "subcategory": "Steamship Port",
      "overlayColor": "Deep Marine Blue",
      "hex": "#1565C0"
    },
    {
      "category": "Transportation",
      "subcategory": "Submarine Terminal",
      "overlayColor": "Deep Teal",
      "hex": "#006D77"
    },
    {
      "category": "Transportation",
      "subcategory": "Skyship Port",
      "overlayColor": "Sky Blue",
      "hex": "#87CEEB"
    },
    {
      "category": "Transportation",
      "subcategory": "Portal Facility",
      "overlayColor": "Arcane Violet",
      "hex": "#7B2CBF"
    },
    {
      "category": "Transportation",
      "subcategory": "Warehouse",
      "overlayColor": "Slate Gray",
      "hex": "#708090"
    },
    {
      "category": "Transportation",
      "subcategory": "Freight Depot",
      "overlayColor": "Rust Brown",
      "hex": "#B7410E"
    },
    {
      "category": "Special / Quest / Intrigue",
      "subcategory": "Quest Location",
      "overlayColor": "Bright Cyan",
      "hex": "#00BCD4"
    },
    {
      "category": "Special / Quest / Intrigue",
      "subcategory": "Major Plot Location",
      "overlayColor": "Bright Gold",
      "hex": "#FFD700"
    },
    {
      "category": "Special / Quest / Intrigue",
      "subcategory": "Intrigue Location",
      "overlayColor": "Violet",
      "hex": "#8A2BE2"
    },
    {
      "category": "Special / Quest / Intrigue",
      "subcategory": "Secret Location",
      "overlayColor": "Dark Indigo",
      "hex": "#311B92"
    },
    {
      "category": "Special / Quest / Intrigue",
      "subcategory": "Unique Landmark",
      "overlayColor": "Bright Teal",
      "hex": "#009688"
    }
  ]
};
