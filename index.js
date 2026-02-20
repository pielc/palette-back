import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { extractPalette } from "./services/Palette.js";
import { getArtDetails, getArts, getImageBuffer } from "./services/AIC.js";

const supabase = createClient(
  process.env.PUBLIC_SUPABASE_URL,
  process.env.PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY,
);

const artIds = await getArts();

const artId = artIds[0];

const artDetails = await getArtDetails(artId);

console.log(artDetails);

const imageBuffer = await getImageBuffer(artDetails.imageUrl);

const { data: filedata, error: fileerror } = await supabase.storage
  .from("labels")
  .upload(`${artId}.jpg`, imageBuffer, {
    contentType: "image/jpeg",
    upsert: true,
  });

console.log(fileerror);
console.log(filedata);

await extractPalette(imageBuffer, artId, artDetails, supabase);
