import sharp from "sharp";
import { kmeans } from "ml-kmeans";

async function extractPalette(imagePath) {
  const image = sharp(imagePath);
  const { data, info } = await image
    .raw()
    .toBuffer({ resolveWithObject: true });

  const pixels = [];
  for (let i = 0; i < data.length; i += info.channels) {
    pixels.push([data[i], data[i + 1], data[i + 2]]);
  }

  const res = kmeans(pixels, 7, {
    initialization: "kmeans++",
    maxIterations: 100,
  });

  const palette = res.centroids.map((centroid) =>
    centroid.map((e) => Math.round(e)),
  );

  console.log(rgbArrayToHex(palette));

  console.log(res.clusters.length);
}

function rgbArrayToHex(rgbArray) {
  return rgbArray.map((rgb) => {
    const [r, g, b] = rgb;
    return (
      "#" +
      ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase()
    );
  });
}

extractPalette("./images/test.png");
