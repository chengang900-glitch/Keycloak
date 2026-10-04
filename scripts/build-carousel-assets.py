#!/usr/bin/env python3
"""Build deterministic, local-only assets for the Keycloak login carousel."""

from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageFilter, ImageOps


THEME_ROOT = Path(__file__).resolve().parents[1]
WORKSPACE = THEME_ROOT.parent
PREVIEW_DIR = WORKSPACE / "design-previews" / "keycloak-login"
OUTPUT_DIR = (
    THEME_ROOT
    / "src/main/resources/theme/enterprise-ai/login/resources/img"
)

SLIDES = (
    ("keycloak-login-A-v3-knowledge-center.png", "slide-a.webp", (144, 82, 980, 866)),
    ("keycloak-login-D-enterprise-ai-foundation.png", "slide-d.webp", (144, 82, 1000, 866)),
    ("keycloak-login-E-goal-measurement.png", "slide-goal.webp", (165, 80, 957, 868)),
)
SHARED_BACKGROUND_SOURCE = PREVIEW_DIR / "carousel-shared-background-v4.png"
SOURCE_SIZE = (1659, 948)
CANVAS_SIZE = (868, 796)
LOGO_CLEAN_BOX = (40, 35, 320, 140)
LOGO_POSITION = (70, 54)
LOGO_MAX_SIZE = (190, 54)
EDGE_FEATHER_PX = 24
WEBP_QUALITY = 88


def fit(image: Image.Image, max_size: tuple[int, int]) -> Image.Image:
    copy = image.copy()
    copy.thumbnail(max_size, Image.Resampling.LANCZOS)
    return copy


def erase_embedded_company_logo(slide: Image.Image) -> Image.Image:
    """Replace the generated preview logo with the surrounding pale gradient."""
    left, top, right, bottom = LOGO_CLEAN_BOX
    clean = slide.copy()
    pixels = clean.load()
    top_left = slide.getpixel((left - 1, top - 1))
    top_right = slide.getpixel((right, top - 1))
    bottom_left = slide.getpixel((left - 1, bottom))
    bottom_right = slide.getpixel((right, bottom))

    width = max(1, right - left - 1)
    height = max(1, bottom - top - 1)
    for y in range(top, bottom):
        vertical = (y - top) / height
        for x in range(left, right):
            horizontal = (x - left) / width
            color = tuple(
                round(
                    channel_top_left * (1 - horizontal) * (1 - vertical)
                    + channel_top_right * horizontal * (1 - vertical)
                    + channel_bottom_left * (1 - horizontal) * vertical
                    + channel_bottom_right * horizontal * vertical
                )
                for channel_top_left, channel_top_right, channel_bottom_left, channel_bottom_right in zip(
                    top_left, top_right, bottom_left, bottom_right
                )
            )
            pixels[x, y] = color

    mask = Image.new("L", slide.size, 0)
    ImageDraw.Draw(mask).rectangle(LOGO_CLEAN_BOX, fill=255)
    mask = mask.filter(ImageFilter.GaussianBlur(8))
    return Image.composite(clean, slide, mask)


def load_shared_background() -> Image.Image:
    source = Image.open(SHARED_BACKGROUND_SOURCE).convert("RGB")
    background = ImageOps.fit(
        source,
        CANVAS_SIZE,
        method=Image.Resampling.LANCZOS,
        centering=(0.5, 0.5),
    )
    background.save(
        OUTPUT_DIR / "carousel-background.webp",
        format="WEBP",
        quality=WEBP_QUALITY,
        method=6,
    )
    return background


def feather_mask(size: tuple[int, int]) -> Image.Image:
    mask = Image.new("L", size, 0)
    ImageDraw.Draw(mask).rectangle(
        (
            EDGE_FEATHER_PX,
            EDGE_FEATHER_PX,
            size[0] - EDGE_FEATHER_PX - 1,
            size[1] - EDGE_FEATHER_PX - 1,
        ),
        fill=255,
    )
    return mask.filter(ImageFilter.GaussianBlur(EDGE_FEATHER_PX * 0.75))


def build_slide(
    slide: Image.Image,
    company: Image.Image,
    shared_background: Image.Image,
) -> Image.Image:
    cleaned = erase_embedded_company_logo(slide)
    canvas = shared_background.convert("RGBA")
    x = (CANVAS_SIZE[0] - cleaned.width) // 2
    y = (CANVAS_SIZE[1] - cleaned.height) // 2
    canvas.paste(cleaned.convert("RGBA"), (x, y), feather_mask(cleaned.size))

    logo = fit(company, LOGO_MAX_SIZE)
    canvas.alpha_composite(logo, LOGO_POSITION)
    return canvas.convert("RGB")


def normalize_logos() -> tuple[Image.Image, Image.Image]:
    company_source = Image.open(WORKSPACE / "品牌logo.png").convert("RGBA")
    company_bbox = company_source.getchannel("A").getbbox()
    expected_bbox = (460, 109, 2148, 583)
    if company_bbox != expected_bbox:
        raise ValueError(
            f"unexpected company logo alpha bbox: {company_bbox}, expected {expected_bbox}"
        )
    company = company_source.crop(company_bbox)
    company.save(OUTPUT_DIR / "company-logo.png", format="PNG", optimize=True)

    product_source = Image.open(WORKSPACE / "AI中台-logo2.png").convert("RGB")
    background = Image.new("RGB", product_source.size, "white")
    product_bbox = ImageChops.difference(product_source, background).getbbox()
    if product_bbox is None:
        raise ValueError("product logo contains no non-white pixels")
    left, top, right, bottom = product_bbox
    product = product_source.crop(
        (max(0, left - 20), max(0, top - 20), min(product_source.width, right + 20), min(product_source.height, bottom + 20))
    )
    product.save(OUTPUT_DIR / "product-logo.png", format="PNG", optimize=True)
    return company, product


def main() -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    company, _ = normalize_logos()
    shared_background = load_shared_background()

    for source_name, output_name, crop_box in SLIDES:
        source_path = PREVIEW_DIR / source_name
        source = Image.open(source_path)
        if source.size != SOURCE_SIZE:
            raise ValueError(
                f"unexpected preview size for {source_name}: {source.size}, expected {SOURCE_SIZE}"
            )
        slide = source.convert("RGB").crop(crop_box)
        build_slide(slide, company, shared_background).save(
            OUTPUT_DIR / output_name,
            format="WEBP",
            quality=WEBP_QUALITY,
            method=6,
        )

    print(
        f"built {len(SLIDES)} carousel slides, a shared background, and 2 logos in {OUTPUT_DIR}"
    )


if __name__ == "__main__":
    main()
