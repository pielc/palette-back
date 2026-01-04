import "dotenv/config";
import sharp from "sharp";
import { kmeans } from "ml-kmeans";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.PUBLIC_SUPABASE_URL,
  process.env.PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY,
);

async function extractPalette(imagePath) {
  const image = sharp(imagePath);
  const { data, info } = await image
    .raw()
    .toBuffer({ resolveWithObject: true });

  const pixels = [];
  for (let i = 0; i < data.length; i += info.channels) {
    pixels.push([data[i], data[i + 1], data[i + 2]]);
  }

  const res = kmeans(pixels, 10, {
    // initialization: "kmeans++",
    maxIterations: 1000,
  });

  const palette = res.centroids.map((centroid) =>
    centroid.map((e) => Math.round(e)),
  );

  console.log(res.clusters.length);

  const array = new Uint8Array(res.clusters);

  const blob = new Blob([array], { type: "application/octet-stream" });

  const { data: filedata, error: fileerror } = await supabase.storage
    .from("labels")
    .upload("test.bin", blob, {
      contentType: "application/octet-stream",
      upsert: true,
    });

  console.log(fileerror);
  console.log(filedata);

  const dbPalette = {};

  palette.forEach((e, index) => (dbPalette[index] = rgbToHex(e)));

  const { error: dberror } = await supabase
    .from("ImageColors")
    .insert({ image_id: "test", palette: dbPalette });

  console.log(dberror);
}

function rgbToHex(rgb) {
  const [r, g, b] = rgb;
  return (
    "#" +
    ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase()
  );
}

export async function loadPalette() {
  const { data: paletteData } = await supabase.from("ImageColors").select();
  console.log(paletteData);
  return paletteData.pop().palette;
}

await extractPalette("./images/test.png");

// await loadPalette();
