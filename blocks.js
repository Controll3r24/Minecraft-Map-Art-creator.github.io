const COLOR_NAMES_IT_M = {
  white: "Bianco",
  light_gray: "Grigio Chiaro",
  gray: "Grigio",
  black: "Nero",
  brown: "Marrone",
  red: "Rosso",
  orange: "Arancione",
  yellow: "Giallo",
  lime: "Verde Lime",
  green: "Verde",
  cyan: "Ciano",
  light_blue: "Azzurro",
  blue: "Blu",
  purple: "Viola",
  magenta: "Magenta",
  pink: "Rosa"
};

const COLOR_NAMES_IT_F = {
  white: "Bianca",
  light_gray: "Grigia Chiara",
  gray: "Grigia",
  black: "Nera",
  brown: "Marrone",
  red: "Rossa",
  orange: "Arancione",
  yellow: "Gialla",
  lime: "Verde Lime",
  green: "Verde",
  cyan: "Ciano",
  light_blue: "Azzurra",
  blue: "Blu",
  purple: "Viola",
  magenta: "Magenta",
  pink: "Rosa"
};

const DYE_BASE = [ [ "white", "#F9FFFE" ], [ "light_gray", "#9D9D97" ], [ "gray", "#474F52" ], [ "black", "#1D1D21" ], [ "brown", "#835432" ], [ "red", "#B02E26" ], [ "orange", "#F9801D" ], [ "yellow", "#FED83D" ], [ "lime", "#80C71F" ], [ "green", "#5E7C16" ], [ "cyan", "#169C9C" ], [ "light_blue", "#3AB3DA" ], [ "blue", "#3C44AA" ], [ "purple", "#8932B8" ], [ "magenta", "#C74EBD" ], [ "pink", "#F38BAA" ] ];

function hexToRgb(hex) {
  const n = parseInt(hex.replace("#", ""), 16);
  return {
    r: n >> 16 & 255,
    g: n >> 8 & 255,
    b: n & 255
  };
}

function rgbToHex(r, g, b) {
  const c = v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0");
  return `#${c(r)}${c(g)}${c(b)}`;
}

function mix(hexA, hexB, amount) {
  const a = hexToRgb(hexA), b = hexToRgb(hexB);
  return rgbToHex(a.r + (b.r - a.r) * amount, a.g + (b.g - a.g) * amount, a.b + (b.b - a.b) * amount);
}

function darken(hex, amount) {
  return mix(hex, "#000000", amount);
}

function lighten(hex, amount) {
  return mix(hex, "#FFFFFF", amount);
}

function blockCubeSVG(hex) {
  const top = lighten(hex, .35);
  const left = darken(hex, .12);
  const right = darken(hex, .38);
  return `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">\n    <polygon points="50,4 96,27 50,50 4,27" fill="${top}" stroke="#17171a" stroke-width="3" stroke-linejoin="round"/>\n    <polygon points="4,27 50,50 50,96 4,73" fill="${left}" stroke="#17171a" stroke-width="3" stroke-linejoin="round"/>\n    <polygon points="96,27 50,50 50,96 96,73" fill="${right}" stroke="#17171a" stroke-width="3" stroke-linejoin="round"/>\n  </svg>`;
}

function buildDyeFamily() {
  const blocks = [];
  for (const [key, hex] of DYE_BASE) {
    const colorM = COLOR_NAMES_IT_M[key];
    const colorF = COLOR_NAMES_IT_F[key];
    blocks.push({
      id: `${key}_wool`,
      name: `Lana ${colorF}`,
      hex: mix(hex, "#FFFFFF", .06),
      category: "Lana",
      survival: true
    });
    blocks.push({
      id: `${key}_concrete`,
      name: `Calcestruzzo ${colorM}`,
      hex: darken(hex, .12),
      category: "Calcestruzzo",
      survival: true
    });
    blocks.push({
      id: `${key}_terracotta`,
      name: `Terracotta ${colorF}`,
      hex: darken(mix(hex, "#7A5236", .55), .05),
      category: "Terracotta",
      survival: true
    });
    blocks.push({
      id: `${key}_glazed_terracotta`,
      name: `Terracotta Invetriata ${colorF}`,
      hex: mix(hex, "#FFFFFF", .22),
      category: "Terracotta Invetriata",
      survival: false
    });
  }
  return blocks;
}

const MISC_BLOCKS = [ {
  id: "dirt",
  name: "Terra",
  hex: "#866043",
  category: "Naturale",
  survival: true
}, {
  id: "coarse_dirt",
  name: "Terra Sassosa",
  hex: "#7C5A3B",
  category: "Naturale",
  survival: true
}, {
  id: "podzol",
  name: "Podzol",
  hex: "#5B3D24",
  category: "Naturale",
  survival: true
}, {
  id: "grass_block",
  name: "Blocco d'Erba",
  hex: "#6A9C3F",
  category: "Naturale",
  survival: true
}, {
  id: "mycelium",
  name: "Micelio",
  hex: "#6C6376",
  category: "Naturale",
  survival: true
}, {
  id: "stone",
  name: "Pietra",
  hex: "#7D7D7D",
  category: "Naturale",
  survival: true
}, {
  id: "cobblestone",
  name: "Pietrisco",
  hex: "#7A7A7A",
  category: "Naturale",
  survival: true
}, {
  id: "mossy_cobblestone",
  name: "Pietrisco Muscoso",
  hex: "#67704F",
  category: "Naturale",
  survival: true
}, {
  id: "andesite",
  name: "Andesite",
  hex: "#888887",
  category: "Naturale",
  survival: true
}, {
  id: "diorite",
  name: "Diorite",
  hex: "#DBDBDA",
  category: "Naturale",
  survival: true
}, {
  id: "granite",
  name: "Granito",
  hex: "#95665A",
  category: "Naturale",
  survival: true
}, {
  id: "deepslate",
  name: "Deepslate",
  hex: "#3B3B40",
  category: "Naturale",
  survival: true
}, {
  id: "cobbled_deepslate",
  name: "Deepslate Frantumata",
  hex: "#4A4A4E",
  category: "Naturale",
  survival: true
}, {
  id: "tuff",
  name: "Tufo",
  hex: "#6B6C61",
  category: "Naturale",
  survival: true
}, {
  id: "calcite",
  name: "Calcite",
  hex: "#E4E5DE",
  category: "Naturale",
  survival: true
}, {
  id: "dripstone_block",
  name: "Blocco di Roccia Sedimentaria",
  hex: "#8C7160",
  category: "Naturale",
  survival: true
}, {
  id: "sand",
  name: "Sabbia",
  hex: "#DBD0A0",
  category: "Naturale",
  survival: true
}, {
  id: "red_sand",
  name: "Sabbia Rossa",
  hex: "#AA5121",
  category: "Naturale",
  survival: true
}, {
  id: "sandstone",
  name: "Arenaria",
  hex: "#D8CA96",
  category: "Naturale",
  survival: true
}, {
  id: "red_sandstone",
  name: "Arenaria Rossa",
  hex: "#9C5924",
  category: "Naturale",
  survival: true
}, {
  id: "oak_planks",
  name: "Assi di Quercia",
  hex: "#A9835A",
  category: "Legno",
  survival: true
}, {
  id: "spruce_planks",
  name: "Assi di Abete",
  hex: "#785A38",
  category: "Legno",
  survival: true
}, {
  id: "birch_planks",
  name: "Assi di Betulla",
  hex: "#D2C388",
  category: "Legno",
  survival: true
}, {
  id: "jungle_planks",
  name: "Assi di Giungla",
  hex: "#AD7F55",
  category: "Legno",
  survival: true
}, {
  id: "acacia_planks",
  name: "Assi di Acacia",
  hex: "#AC5A34",
  category: "Legno",
  survival: true
}, {
  id: "dark_oak_planks",
  name: "Assi di Quercia Scura",
  hex: "#4C3A25",
  category: "Legno",
  survival: true
}, {
  id: "mangrove_planks",
  name: "Assi di Mangrovia",
  hex: "#7B3B31",
  category: "Legno",
  survival: true
}, {
  id: "cherry_planks",
  name: "Assi di Ciliegio",
  hex: "#E6B7B0",
  category: "Legno",
  survival: true
}, {
  id: "crimson_planks",
  name: "Assi Cremisi",
  hex: "#7A3E56",
  category: "Legno",
  survival: true
}, {
  id: "warped_planks",
  name: "Assi Contorte",
  hex: "#298E86",
  category: "Legno",
  survival: true
}, {
  id: "bamboo_planks",
  name: "Assi di Bambù",
  hex: "#C6A94F",
  category: "Legno",
  survival: true
}, {
  id: "obsidian",
  name: "Ossidiana",
  hex: "#0F0B1C",
  category: "Naturale",
  survival: true
}, {
  id: "crying_obsidian",
  name: "Ossidiana Piangente",
  hex: "#3D1A5B",
  category: "Naturale",
  survival: false
}, {
  id: "netherrack",
  name: "Netherrack",
  hex: "#6B3630",
  category: "Nether",
  survival: true
}, {
  id: "soul_sand",
  name: "Sabbia delle Anime",
  hex: "#5B4633",
  category: "Nether",
  survival: true
}, {
  id: "soul_soil",
  name: "Suolo delle Anime",
  hex: "#4A3826",
  category: "Nether",
  survival: true
}, {
  id: "basalt",
  name: "Basalto",
  hex: "#5A5A61",
  category: "Nether",
  survival: true
}, {
  id: "blackstone",
  name: "Pietra Nera",
  hex: "#2B252A",
  category: "Nether",
  survival: true
}, {
  id: "polished_blackstone",
  name: "Pietra Nera Levigata",
  hex: "#3B343A",
  category: "Nether",
  survival: true
}, {
  id: "nether_bricks",
  name: "Mattoni del Nether",
  hex: "#2C1518",
  category: "Nether",
  survival: true
}, {
  id: "red_nether_bricks",
  name: "Mattoni Rossi del Nether",
  hex: "#460A08",
  category: "Nether",
  survival: true
}, {
  id: "glowstone",
  name: "Pietra Lucente",
  hex: "#D9A96A",
  category: "Nether",
  survival: true
}, {
  id: "quartz_block",
  name: "Blocco di Quarzo",
  hex: "#ECE3D7",
  category: "Nether",
  survival: true
}, {
  id: "purpur_block",
  name: "Blocco di Purpur",
  hex: "#A578A6",
  category: "End",
  survival: false
}, {
  id: "end_stone",
  name: "Pietra dell'End",
  hex: "#DDDF9B",
  category: "End",
  survival: false
}, {
  id: "end_stone_bricks",
  name: "Mattoni di Pietra dell'End",
  hex: "#E4E6AC",
  category: "End",
  survival: false
}, {
  id: "prismarine",
  name: "Prismarine",
  hex: "#6D9C97",
  category: "Oceano",
  survival: true
}, {
  id: "prismarine_bricks",
  name: "Mattoni di Prismarine",
  hex: "#63A69B",
  category: "Oceano",
  survival: true
}, {
  id: "dark_prismarine",
  name: "Prismarine Scura",
  hex: "#354E3C",
  category: "Oceano",
  survival: true
}, {
  id: "sea_lantern",
  name: "Lanterna Marina",
  hex: "#ACC7C4",
  category: "Oceano",
  survival: true
}, {
  id: "packed_ice",
  name: "Ghiaccio Compatto",
  hex: "#8DB4DD",
  category: "Freddo",
  survival: true
}, {
  id: "blue_ice",
  name: "Ghiaccio Blu",
  hex: "#74A8E0",
  category: "Freddo",
  survival: true
}, {
  id: "snow_block",
  name: "Blocco di Neve",
  hex: "#F6FEFE",
  category: "Freddo",
  survival: true
}, {
  id: "ice",
  name: "Ghiaccio",
  hex: "#8FC1DE",
  category: "Freddo",
  survival: true
}, {
  id: "bone_block",
  name: "Blocco d'Osso",
  hex: "#E4DFC7",
  category: "Naturale",
  survival: true
}, {
  id: "honeycomb_block",
  name: "Blocco a Nido d'Ape",
  hex: "#E8981F",
  category: "Naturale",
  survival: true
}, {
  id: "moss_block",
  name: "Blocco di Muschio",
  hex: "#5C7B33",
  category: "Naturale",
  survival: true
}, {
  id: "mud",
  name: "Fango",
  hex: "#3C3A38",
  category: "Naturale",
  survival: true
}, {
  id: "mud_bricks",
  name: "Mattoni di Fango",
  hex: "#8A7156",
  category: "Naturale",
  survival: true
}, {
  id: "packed_mud",
  name: "Fango Compatto",
  hex: "#93714E",
  category: "Naturale",
  survival: true
}, {
  id: "clay",
  name: "Argilla",
  hex: "#9DA7B0",
  category: "Naturale",
  survival: true
}, {
  id: "terracotta",
  name: "Terracotta",
  hex: "#9C6B54",
  category: "Terracotta",
  survival: true
}, {
  id: "hay_block",
  name: "Balla di Fieno",
  hex: "#B79E20",
  category: "Naturale",
  survival: true
}, {
  id: "melon",
  name: "Anguria",
  hex: "#4C8118",
  category: "Naturale",
  survival: true
}, {
  id: "pumpkin",
  name: "Zucca",
  hex: "#B6650F",
  category: "Naturale",
  survival: true
}, {
  id: "sponge",
  name: "Spugna",
  hex: "#C3C635",
  category: "Naturale",
  survival: true
}, {
  id: "target",
  name: "Bersaglio",
  hex: "#DDCFC1",
  category: "Redstone",
  survival: true
}, {
  id: "redstone_block",
  name: "Blocco di Redstone",
  hex: "#9C1B12",
  category: "Risorsa",
  survival: false
}, {
  id: "lapis_block",
  name: "Blocco di Lapislazzuli",
  hex: "#1D5CBD",
  category: "Risorsa",
  survival: false
}, {
  id: "gold_block",
  name: "Blocco d'Oro",
  hex: "#F9CE4C",
  category: "Risorsa",
  survival: false
}, {
  id: "iron_block",
  name: "Blocco di Ferro",
  hex: "#E4E4E0",
  category: "Risorsa",
  survival: false
}, {
  id: "diamond_block",
  name: "Blocco di Diamante",
  hex: "#68DFD4",
  category: "Risorsa",
  survival: false
}, {
  id: "emerald_block",
  name: "Blocco di Smeraldo",
  hex: "#2CB94E",
  category: "Risorsa",
  survival: false
}, {
  id: "coal_block",
  name: "Blocco di Carbone",
  hex: "#0E0E0E",
  category: "Risorsa",
  survival: false
}, {
  id: "netherite_block",
  name: "Blocco di Netherite",
  hex: "#453F3F",
  category: "Risorsa",
  survival: false
}, {
  id: "copper_block",
  name: "Blocco di Rame",
  hex: "#C36445",
  category: "Risorsa",
  survival: false
}, {
  id: "oxidized_copper",
  name: "Rame Ossidato",
  hex: "#4F9A81",
  category: "Risorsa",
  survival: false
} ];

const BLOCK_PALETTE = [ ...buildDyeFamily(), ...MISC_BLOCKS ].map(b => ({
  ...b,
  rgb: hexToRgb(b.hex)
}));
