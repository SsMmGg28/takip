import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Ders Takip",
    short_name: "Ders Takip",
    description: "Ödev, kaynak, takvim, çalışma programı ve deneme takip sistemi",
    start_url: "/",
    display: "standalone",
    background_color: "#f5f8fd",
    theme_color: "#2563eb",
    orientation: "portrait",
    icons: [
      {
        src: "/icon.png",
        sizes: "824x824",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon.png",
        sizes: "824x824",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
