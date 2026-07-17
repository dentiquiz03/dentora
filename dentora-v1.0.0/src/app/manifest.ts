import type { MetadataRoute } from "next";
export default function manifest(): MetadataRoute.Manifest { return {
  name: "Dentora Dental Revision", short_name: "Dentora", description: "Private dental question bank and revision tracker.",
  start_url: "/dashboard", display: "standalone", background_color: "#f6f8fb", theme_color: "#176b68",
  icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "maskable" }],
}; }
