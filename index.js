import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { extractPalette } from "./services/Palette.js";
import { getArtDetails, getArts, getImageBuffer } from "./services/AIC.js";

const supabase = createClient(
  process.env.PUBLIC_SUPABASE_URL,
  process.env.PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY,
);

const artIds = await getArts();

let iteration = 0;
for (const artId of artIds) {
  if (iteration++ > 31) break;
  console.log(iteration);

  const artDetails = await getArtDetails(artId);
  if (artDetails.colorfulness < 15) continue;

  console.log(artDetails);

  const imageBuffer = await getImageBuffer(artDetails.imageUrl);

  const { data: filedata, error: fileerror } = await supabase.storage
    .from("labels")
    .upload(`${artId}.jpg`, imageBuffer, {
      contentType: "image/jpeg",
      upsert: true,
    });

  console.log("file error:");
  console.log(fileerror);
  console.log("file data:");
  console.log(filedata);

  await extractPalette(
    imageBuffer,
    artId,
    artDetails,
    { month: 3, day: iteration },
    supabase,
  );
}

// TODO: remove, test only

// const artDetails = {
//   title: "Cliff Walk at Pourville",
//   artist: "Claude Monet (French, 1840–1926)",
//   date: "1882",
// };
// await extractPalette(null, null, artDetails, supabase);
