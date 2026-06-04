import type { MetadataRoute } from "next";

// Served at /manifest.webmanifest; Next injects the <link rel="manifest"> for us.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "RecklessBricks — Cedar Hollow / Cogwheel Archive",
    short_name: "RecklessBricks",
    description:
      "A centralized archive of the videos, documents, social posts, and police footage surrounding the Cedar Hollow / Cogwheel Collectibles incident.",
    start_url: "/",
    display: "standalone",
    background_color: "#0b0f14",
    theme_color: "#1d4ed8",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
