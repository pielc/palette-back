import axios from "axios";

export async function getColorName(colorHex) {
  const response = await axios.get("https://api.color.pizza/v1", {
    params: { values: colorHex },
  });

  const colorName = response.data?.paletteTitle || null;

  return colorName;
}
