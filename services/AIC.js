import axios from "axios";

// TODO: add signature, eg --header 'AIC-User-Agent: aic-bash (engineering@artic.edu)'
export async function getArts() {
  const response = await axios.get(
    "https://api.artic.edu/api/v1/artworks/search?query[bool][must][0][term][artist_id]=35809&query[bool][must][1][term][is_public_domain]=true&size=50&page=1",
  );
  const artIds = (response?.data?.data || []).map((art) => art.id);
  return artIds;
}

export async function getArtDetails(id) {
  const response = await axios.get(
    `https://api.artic.edu/api/v1/artworks/${id}`,
  );

  const rawArtDetails = response?.data || null;

  let artDetails = {};

  if (rawArtDetails) {
    const {
      title,
      artist_display,
      date_display,
      colorfulness,
      image_id,
      ...rest
    } = rawArtDetails.data;

    const iiif_url = rawArtDetails.config?.iiif_url || null;

    artDetails = {
      title: title.replaceAll("\n", " "),
      artist: artist_display.replaceAll("\n", " "),
      date: date_display.replaceAll("\n", " "),
      colorfulness: colorfulness,
      imageUrl:
        image_id != null && iiif_url != null
          ? `${iiif_url}/${image_id}/full/843,/0/default.jpg`
          : null,
    };
  }

  return artDetails;
}

export async function getImageBuffer(imageUrl) {
  const response = await axios.get(imageUrl, {
    responseType: "arraybuffer",
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Referer: "https://www.artic.edu/",
    },
  });

  const inputBuffer = Buffer.from(response.data);

  return inputBuffer;
}
