import argparse
import math
import os

from PIL import Image
import mcschematic

DYE_BASE = {
    "white": "#F9FFFE", "light_gray": "#9D9D97", "gray": "#474F52",
    "black": "#1D1D21", "brown": "#835432", "red": "#B02E26",
    "orange": "#F9801D", "yellow": "#FED83D", "lime": "#80C71F",
    "green": "#5E7C16", "cyan": "#169C9C", "light_blue": "#3AB3DA",
    "blue": "#3C44AA", "purple": "#8932B8", "magenta": "#C74EBD",
    "pink": "#F38BAA",
}

MISC_BLOCKS = {
    (134, 96, 67): "minecraft:dirt",
    (125, 125, 125): "minecraft:stone",
    (122, 122, 122): "minecraft:cobblestone",
    (219, 208, 160): "minecraft:sand",
    (216, 202, 150): "minecraft:sandstone",
    (169, 131, 90): "minecraft:oak_planks",
    (76, 58, 37): "minecraft:dark_oak_planks",
    (15, 11, 28): "minecraft:obsidian",
    (107, 54, 48): "minecraft:netherrack",
    (236, 227, 215): "minecraft:quartz_block",
    (141, 180, 221): "minecraft:packed_ice",
    (246, 254, 254): "minecraft:snow_block",
    (156, 107, 84): "minecraft:terracotta",
    (67, 129, 24): "minecraft:melon",
}

SURVIVAL_UNFRIENDLY = {"glazed_terracotta"}


def hex_to_rgb(hex_str):
    hex_str = hex_str.lstrip("#")
    return tuple(int(hex_str[i:i + 2], 16) for i in (0, 2, 4))


def mix(rgb_a, rgb_b, amount):
    return tuple(round(a + (b - a) * amount) for a, b in zip(rgb_a, rgb_b))


def darken(rgb, amount):
    return mix(rgb, (0, 0, 0), amount)


def build_palette(modalita):
    palette = {}

    for key, hex_color in DYE_BASE.items():
        base = hex_to_rgb(hex_color)

        palette[mix(base, (255, 255, 255), 0.06)] = f"minecraft:{key}_wool"
        palette[darken(base, 0.12)] = f"minecraft:{key}_concrete"
        palette[darken(mix(base, (122, 82, 54), 0.55), 0.05)] = f"minecraft:{key}_terracotta"

        if modalita == "creativa":
            palette[mix(base, (255, 255, 255), 0.22)] = f"minecraft:{key}_glazed_terracotta"

    for rgb, block in MISC_BLOCKS.items():
        palette[rgb] = block

    return palette


def get_closest_block(rgb, palette):
    r, g, b = rgb
    best_block, best_dist = None, math.inf
    for (pr, pg, pb), block in palette.items():
        dist = (r - pr) ** 2 + (g - pg) ** 2 + (b - pb) ** 2
        if dist < best_dist:
            best_dist, best_block = dist, block
    return best_block


def main():
    parser = argparse.ArgumentParser(description="Converte una foto in un file .schem di Minecraft")
    parser.add_argument("immagine", help="percorso dell'immagine da convertire")
    parser.add_argument("--modalita", choices=["creativa", "survival"], default="creativa")
    parser.add_argument("--lato", type=int, default=None, help="lato in blocchi (immagine quadrata)")
    parser.add_argument("--larghezza", type=int, default=128)
    parser.add_argument("--altezza", type=int, default=128)
    args = parser.parse_args()

    width = args.lato or args.larghezza
    height = args.lato or args.altezza

    print(f"Carico {args.immagine}...")
    img = Image.open(args.immagine).convert("RGB")
    img = img.resize((width, height), Image.Resampling.LANCZOS)
    pixels = img.load()

    palette = build_palette(args.modalita)
    schem = mcschematic.MCSchematic()

    print(f"Conversione {width}x{height} in modalità {args.modalita}...")
    for x in range(width):
        for z in range(height):
            block = get_closest_block(pixels[x, z], palette)
            schem.setBlock((x, 0, z), block)

    base_name = os.path.splitext(os.path.basename(args.immagine))[0]
    output_name = f"{base_name}_{args.modalita}"
    schem.save(".", output_name, mcschematic.Version.JE_1_20_1)

    print(f"Fatto! File salvato come {output_name}.schem")
    print("Importalo in WorldEdit con //schem load ... e //paste, oppure con Litematica.")


if __name__ == "__main__":
    main()
