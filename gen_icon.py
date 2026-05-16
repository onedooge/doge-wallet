"""Generate Doge head icons (16/48/128) for the wallet extension."""
from PIL import Image, ImageDraw, ImageFilter
import os

OUT_DIR = os.path.join(os.path.dirname(__file__), "icons")

# Doge palette
FACE_LIGHT = (242, 199, 107)   # #F2C76B
FACE_MAIN  = (217, 154, 48)    # #D99A30
FACE_DARK  = (160, 105, 25)    # #A06919
WHITE      = (255, 250, 240)   # warm white
EYE        = (35, 25, 10)
NOSE       = (35, 25, 10)
SHADOW     = (140, 90, 20)


def draw_doge(size: int) -> Image.Image:
    # Work at 4x supersample then downscale for crisp edges
    s = size * 4
    img = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)

    cx, cy = s // 2, s // 2

    # ----- Ears (triangles) -----
    ear_w = int(s * 0.22)
    ear_h = int(s * 0.30)
    # left ear
    le = [
        (cx - int(s * 0.32), cy - int(s * 0.22)),
        (cx - int(s * 0.32) + ear_w, cy - int(s * 0.32)),
        (cx - int(s * 0.32) + int(ear_w * 0.5), cy - int(s * 0.45)),
    ]
    d.polygon(le, fill=FACE_DARK)
    # inner left ear
    lei = [
        (cx - int(s * 0.27), cy - int(s * 0.24)),
        (cx - int(s * 0.27) + int(ear_w * 0.6), cy - int(s * 0.30)),
        (cx - int(s * 0.27) + int(ear_w * 0.35), cy - int(s * 0.40)),
    ]
    d.polygon(lei, fill=(120, 70, 15))

    # right ear (mirror)
    re = [
        (cx + int(s * 0.32), cy - int(s * 0.22)),
        (cx + int(s * 0.32) - ear_w, cy - int(s * 0.32)),
        (cx + int(s * 0.32) - int(ear_w * 0.5), cy - int(s * 0.45)),
    ]
    d.polygon(re, fill=FACE_DARK)
    rei = [
        (cx + int(s * 0.27), cy - int(s * 0.24)),
        (cx + int(s * 0.27) - int(ear_w * 0.6), cy - int(s * 0.30)),
        (cx + int(s * 0.27) - int(ear_w * 0.35), cy - int(s * 0.40)),
    ]
    d.polygon(rei, fill=(120, 70, 15))

    # ----- Face (rounded square-ish, drawn as overlapping ellipses) -----
    # main face
    face_w = int(s * 0.78)
    face_h = int(s * 0.78)
    fx0 = cx - face_w // 2
    fy0 = cy - face_h // 2 + int(s * 0.02)
    d.ellipse((fx0, fy0, fx0 + face_w, fy0 + face_h), fill=FACE_MAIN)

    # lighter forehead patch
    patch_w = int(s * 0.50)
    patch_h = int(s * 0.30)
    px0 = cx - patch_w // 2
    py0 = cy - int(s * 0.30)
    d.ellipse((px0, py0, px0 + patch_w, py0 + patch_h), fill=FACE_LIGHT)

    # ----- Muzzle / chin (cream) -----
    muz_w = int(s * 0.42)
    muz_h = int(s * 0.32)
    mx0 = cx - muz_w // 2
    my0 = cy + int(s * 0.02)
    d.ellipse((mx0, my0, mx0 + muz_w, my0 + muz_h), fill=WHITE)

    # ----- Eyes -----
    eye_r = max(2, int(s * 0.035))
    eye_y = cy - int(s * 0.06)
    eye_dx = int(s * 0.16)
    d.ellipse(
        (cx - eye_dx - eye_r, eye_y - eye_r, cx - eye_dx + eye_r, eye_y + eye_r),
        fill=EYE,
    )
    d.ellipse(
        (cx + eye_dx - eye_r, eye_y - eye_r, cx + eye_dx + eye_r, eye_y + eye_r),
        fill=EYE,
    )
    # eye highlights
    hl = max(1, eye_r // 2)
    d.ellipse(
        (cx - eye_dx - hl // 2, eye_y - eye_r + hl // 2,
         cx - eye_dx + hl, eye_y - eye_r + hl + hl),
        fill=(255, 255, 255),
    )
    d.ellipse(
        (cx + eye_dx - hl // 2, eye_y - eye_r + hl // 2,
         cx + eye_dx + hl, eye_y - eye_r + hl + hl),
        fill=(255, 255, 255),
    )

    # ----- Eyebrows (small dark dashes above eyes — classic doge) -----
    brow_w = int(s * 0.07)
    brow_h = max(2, int(s * 0.018))
    brow_y = eye_y - int(s * 0.07)
    d.rectangle(
        (cx - eye_dx - brow_w // 2, brow_y, cx - eye_dx + brow_w // 2, brow_y + brow_h),
        fill=SHADOW,
    )
    d.rectangle(
        (cx + eye_dx - brow_w // 2, brow_y, cx + eye_dx + brow_w // 2, brow_y + brow_h),
        fill=SHADOW,
    )

    # ----- Nose -----
    nose_w = int(s * 0.10)
    nose_h = int(s * 0.07)
    nose_y = cy + int(s * 0.06)
    d.ellipse(
        (cx - nose_w // 2, nose_y - nose_h // 2,
         cx + nose_w // 2, nose_y + nose_h // 2),
        fill=NOSE,
    )

    # ----- Mouth: tiny tongue lick -----
    mouth_y = nose_y + int(s * 0.05)
    # vertical line under nose
    d.line(
        [(cx, nose_y + nose_h // 2), (cx, mouth_y)],
        fill=NOSE,
        width=max(1, int(s * 0.012)),
    )
    # smile curve
    smile_w = int(s * 0.12)
    d.arc(
        (cx - smile_w, mouth_y - int(s * 0.02),
         cx + smile_w, mouth_y + int(s * 0.06)),
        start=0, end=180, fill=NOSE, width=max(1, int(s * 0.012)),
    )

    # Downsample
    return img.resize((size, size), Image.LANCZOS)


def main() -> None:
    os.makedirs(OUT_DIR, exist_ok=True)
    for sz in (16, 48, 128):
        out = os.path.join(OUT_DIR, f"icon{sz}.png")
        img = draw_doge(sz)
        img.save(out, "PNG")
        print(f"wrote {out} ({sz}x{sz})")


if __name__ == "__main__":
    main()
