import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Nairobi Life",
    short_name: "Nairobi Life",
    description: "A life-sim set in Nairobi.",
    start_url: "/?source=pwa",
    display: "standalone",
    background_color: "#f6efe3",
    theme_color: "#1b1612",
    categories: ["games", "entertainment"],
    lang: "en-KE",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
