import sharp from 'sharp'

const TILE_CSS_PX = 200

// radius: CSS blur() radius, a Gaussian standard deviation in CSS px (sharp's sigma is the same measure).
// scale: device pixels per CSS px. The soft tile has no detail a 2x bitmap would keep.
const layers = [
  { name: 'soft', radius: 23, scale: 1 },
  { name: 'sharp', radius: 3, scale: 2 },
] as const

await Promise.all(
  layers.map(async ({ name, radius, scale }) => {
    const width = TILE_CSS_PX * scale
    const tile = await sharp('assets/icon.png').resize({ width }).png().toBuffer()
    const { height = width } = await sharp(tile).metadata()

    // Blurring a 3×3 grid and keeping the center makes the blur wrap across tile edges.
    const grid = await sharp({
      create: {
        width: width * 3,
        height: height * 3,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      },
    })
      .composite(
        [0, 1, 2].flatMap((x) =>
          [0, 1, 2].map((y) => ({ input: tile, left: x * width, top: y * height })),
        ),
      )
      .png()
      .toBuffer()

    // sharp runs composite after blur within one pipeline, so each step gets its own pass.
    const blurred = await sharp(grid).blur(radius * scale).png().toBuffer()

    return sharp(blurred)
      .extract({ left: width, top: height, width, height })
      .png({ compressionLevel: 9 })
      .toFile(`assets/mosaic-${name}.png`)
  }),
)
