import "dotenv/config";
import sharp from "sharp";
import { kmeans } from "ml-kmeans";
import convert from "color-convert";
import { getColorName } from "./Color.js";

const MODE = "HSL"; // "RGB"

function sortColorIndexes(colors, origin = [0, 0, 0]) {
  const n = colors.length;
  const sorted = [];
  const used = new Array(n).fill(false);
  let current = origin;

  for (let i = 0; i < n; i++) {
    let nearestIdx = -1;
    let minDist = Infinity;

    for (let j = 0; j < n; j++) {
      if (!used[j]) {
        const dist = distance(current, colors[j]);
        if (dist < minDist) {
          minDist = dist;
          nearestIdx = j;
        }
      }
    }

    sorted.push(nearestIdx);
    used[nearestIdx] = true;
    current = colors[nearestIdx];
  }

  return sorted;
}

function distance(a, b) {
  const dx = a[0] - b[0];
  const dy = a[1] - b[1];
  const dz = a[2] - b[2];
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

export async function extractPalette(imageBuffer, artId, artDetails, supabase) {
  const image = sharp(imageBuffer);
  // const image = sharp("images/test.png");
  // artId = "test";
  const { data, info } = await image
    .raw()
    .toBuffer({ resolveWithObject: true });

  const pixels = [];
  for (let i = 0; i < data.length; i += info.channels) {
    const pixelTrio =
      MODE == "HSL"
        ? convert.rgb.hsl(data[i], data[i + 1], data[i + 2])
        : [data[i], data[i + 1], data[i + 2]];
    pixels.push(pixelTrio);
  }

  const res = kmeans(pixels, 7, {
    // initialization: "kmeans++",
    maxIterations: 1000,
  });

  const palette = res.centroids.map((centroid) =>
    centroid.map((e) => Math.round(e)),
  );

  console.log(palette);

  const sizes = res
    .computeInformation(pixels)
    .map((centroid) => centroid.size / pixels.length);

  const array = new Uint8Array(res.clusters);

  const blob = new Blob([array], { type: "application/octet-stream" });

  const { data: filedata, error: fileerror } = await supabase.storage
    .from("labels")
    .upload(`${artId}.bin`, blob, {
      contentType: "application/octet-stream",
      upsert: true,
    });

  console.log(fileerror);
  console.log(filedata);

  const sortedIndex = sortColorIndexes(palette);

  const dbPalette = [];

  palette.forEach((e, index) =>
    dbPalette.push({
      id: index,
      color: `#${MODE == "HSL" ? convert.hsl.hex(e) : convert.rgb.hex(e)}`,
      sortedIndex: sortedIndex[index],
      size: sizes[index],
    }),
  );

  for (const element of dbPalette) {
    element.name = await getColorName(element.color.replaceAll("#", ""));
  }

  const dbArtDetails = {
    title: artDetails.title,
    artist: artDetails.artist,
    date: artDetails.date,
  };

  const { error: dberror } = await supabase
    .from("ImageColors")
    .insert({ image_id: artId, palette: dbPalette, art_info: dbArtDetails });

  console.log(dberror);
}

export async function loadPalette() {
  const { data: paletteData } = await supabase.from("ImageColors").select();
  console.log(paletteData);
  return paletteData.pop().palette;
}
