import math
from PIL import Image, ImageDraw

def draw_star(draw, cx, cy, r_outer, r_inner, points, fill, rotation=0):
    coords = []
    for i in range(points * 2):
        angle = math.pi / points * i - math.pi / 2 + rotation
        r = r_outer if i % 2 == 0 else r_inner
        coords.append((cx + r * math.cos(angle), cy + r * math.sin(angle)))
    draw.polygon(coords, fill=fill)

def make_icon(size, path, maskable=False):
    img = Image.new("RGB", (size, size), "#7a2e2e")
    draw = ImageDraw.Draw(img)

    # radial-ish background: two-tone terracotta wash
    for y in range(size):
        t = y / size
        r = int(0x7a * (1 - t) + 0x4a * t)
        g = int(0x2e * (1 - t) + 0x14 * t)
        b = int(0x2e * (1 - t) + 0x10 * t)
        draw.line([(0, y), (size, y)], fill=(r, g, b))

    cx = cy = size / 2
    safe = size * (0.65 if maskable else 0.82)

    # 8-pointed Islamic star motif, layered
    draw_star(draw, cx, cy, safe * 0.5, safe * 0.5 * 0.42, 8, "#e8c77a", rotation=0)
    draw_star(draw, cx, cy, safe * 0.5 * 0.92, safe * 0.5 * 0.38, 8, "#c9a24a", rotation=math.pi / 8)

    # inner circle accent
    r2 = safe * 0.16
    draw.ellipse([cx - r2, cy - r2, cx + r2, cy + r2], fill="#7a2e2e")
    r3 = r2 * 0.7
    draw.ellipse([cx - r3, cy - r3, cx + r3, cy + r3], fill="#e8c77a")

    img.save(path)

make_icon(192, "icons/icon-192.png")
make_icon(512, "icons/icon-512.png")
make_icon(192, "icons/icon-maskable-192.png", maskable=True)
make_icon(512, "icons/icon-maskable-512.png", maskable=True)
print("done")
