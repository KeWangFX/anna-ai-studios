from __future__ import annotations

import random
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageEnhance, ImageFilter, ImageOps, features


ROOT = Path(__file__).resolve().parent.parent
OUTPUT = ROOT / "assets" / "brand"
WIDTH, HEIGHT = 1920, 1080


def make_background() -> Image.Image:
    image = Image.new("RGB", (WIDTH, HEIGHT), "#030504")
    radial = Image.radial_gradient("L").resize((WIDTH * 2, HEIGHT * 2), Image.Resampling.LANCZOS)
    radial = radial.crop((WIDTH // 3, HEIGHT // 4, WIDTH // 3 + WIDTH, HEIGHT // 4 + HEIGHT))
    color = ImageOps.colorize(radial, black="#242b25", white="#030504")
    image = Image.blend(image, color, 0.72)

    grid = Image.new("RGBA", image.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(grid)
    for x in range(0, WIDTH, 80):
        draw.line((x, 0, x, HEIGHT), fill=(232, 239, 230, 11), width=1)
    for y in range(0, HEIGHT, 80):
        draw.line((0, y, WIDTH, y), fill=(232, 239, 230, 11), width=1)
    return Image.alpha_composite(image.convert("RGBA"), grid)


def draw_circuit(image: Image.Image) -> None:
    traces = Image.new("RGBA", image.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(traces)
    copper_dim = (137, 75, 39, 90)
    copper = (221, 130, 66, 215)
    copper_light = (255, 184, 104, 118)

    background_paths = [
        [(-40, 210), (290, 210), (290, 368), (566, 368), (566, 276), (822, 276)],
        [(120, 1100), (120, 774), (404, 774), (404, 642), (650, 642)],
        [(1510, 1100), (1510, 850), (1274, 850), (1274, 716), (1092, 716)],
        [(1960, 130), (1598, 130), (1598, 310), (1296, 310), (1296, 438), (1124, 438)],
    ]
    for path in background_paths:
        draw.line(path, fill=copper_dim, width=7, joint="curve")
        for point in path[1:-1]:
            draw.ellipse((point[0] - 9, point[1] - 9, point[0] + 9, point[1] + 9), fill=(205, 117, 58, 105))

    die = [(312, 276), (1598, 218), (1650, 782), (360, 846)]
    draw.polygon(die, fill=(11, 16, 13, 232), outline=(229, 234, 224, 34), width=3)
    draw.rounded_rectangle((744, 382, 1178, 678), radius=18, fill=(21, 27, 23, 255), outline=(232, 143, 76, 188), width=5)
    draw.rounded_rectangle((816, 444, 1106, 616), radius=10, fill=(7, 10, 8, 255), outline=(232, 238, 227, 48), width=2)
    for x in (852, 918, 984, 1050):
        draw.rounded_rectangle((x, 478, x + 34, 582), radius=4, fill=(211, 122, 61, 198))

    main_path = [(-30, 814), (336, 814), (336, 724), (612, 724), (612, 650), (1000, 650), (1000, 574), (1360, 574), (1360, 438), (1950, 438)]
    draw.line(main_path, fill=(67, 36, 22, 255), width=64, joint="curve")
    draw.line(main_path, fill=copper, width=29, joint="curve")
    draw.line(main_path, fill=copper_light, width=4, joint="curve")
    image.alpha_composite(traces)


def draw_photon(image: Image.Image) -> None:
    glow = Image.new("RGBA", image.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(glow)
    center = (1320, 416)
    for radius, alpha in ((170, 18), (110, 30), (64, 80), (28, 210)):
        draw.ellipse(
            (center[0] - radius, center[1] - radius, center[0] + radius, center[1] + radius),
            fill=(78, 255, 216, alpha),
        )
    glow = glow.filter(ImageFilter.GaussianBlur(24))
    image.alpha_composite(glow)
    draw = ImageDraw.Draw(image)
    draw.ellipse((center[0] - 9, center[1] - 9, center[0] + 9, center[1] + 9), fill=(235, 255, 249, 255))


def add_grain(image: Image.Image) -> Image.Image:
    # Fine monochrome grain prevents large dark gradients from banding after WebP/AVIF compression.
    random.seed(18)
    noise = Image.effect_noise((WIDTH, HEIGHT), 18).convert("L")
    noise = ImageEnhance.Contrast(noise).enhance(0.7)
    noise_rgba = Image.merge("RGBA", (noise, noise, noise, Image.new("L", image.size, 18)))
    return ImageChops.soft_light(image, noise_rgba)


def main() -> None:
    OUTPUT.mkdir(parents=True, exist_ok=True)
    image = make_background()
    draw_circuit(image)
    draw_photon(image)
    image = add_grain(image).convert("RGB")
    image.save(OUTPUT / "circuit-poster.webp", "WEBP", quality=86, method=6)
    if features.check("avif"):
        image.save(OUTPUT / "circuit-poster.avif", "AVIF", quality=68)
    else:
        raise RuntimeError("This Pillow build does not include AVIF support.")
    print(f"Rendered circuit poster: {WIDTH}x{HEIGHT}")


if __name__ == "__main__":
    main()
