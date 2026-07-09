import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Birim testleri saf yardımcı modüller içindir (ör. deneme belgesi normalize
// katmanı). "@/..." yol takma adı tsconfig ile aynı şekilde çözülür.
export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
