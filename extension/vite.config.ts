import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";
import { copyFileSync } from "fs";

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory
  const env = loadEnv(mode, process.cwd(), '');

  return {
  plugins: [
    {
      name: "copy-manifest",
      generateBundle() {
        // Copy manifest.json to dist after build
        copyFileSync("public/manifest.json", "dist/manifest.json");
        console.log("✅ manifest.json copied to dist/");
      },
    },
  ],
  // Use Vite's public directory so files in `extension/public` are copied to `dist`
  publicDir: "public",
   css: {
  postcss: {
      plugins: [        require("autoprefixer"),
       // require("tailwindcss")({ config: "./tailwind.config.js" }),
      ],
    },
},
  build: {
    outDir: "dist",
    rollupOptions: {
      input: {
        popup: resolve(__dirname, "src/popup.html"),
        content: resolve(__dirname, "src/content.ts"),
        background: resolve(__dirname, "src/background.ts"),
      },
      output: {
        entryFileNames: "[name].js",
        chunkFileNames: "[name].js",
        assetFileNames: "[name].[ext]",
        format: "es",
        inlineDynamicImports: false,
      },
    },
    target: "esnext",
    minify: false,
    emptyOutDir: true,
    modulePreload: false,
  },
  define: {
    "process.env.NODE_ENV": JSON.stringify(
      process.env.NODE_ENV || "production"
    ),
    // Expose environment variables to extension
    "import.meta.env.VITE_MISTRAL_API_KEY": JSON.stringify(
      env.VITE_MISTRAL_API_KEY || ""
    ),
    "import.meta.env.VITE_MISTRAL_BASE_URL": JSON.stringify(
      env.VITE_MISTRAL_BASE_URL || "https://api.mistral.ai"
    ),
    "import.meta.env.VITE_SUPABASE_URL": JSON.stringify(
      env.VITE_SUPABASE_URL || ""
    ),
    "import.meta.env.VITE_SUPABASE_ANON_KEY": JSON.stringify(
      env.VITE_SUPABASE_ANON_KEY || ""
    ),
    "import.meta.env.VITE_BACKEND_API_URL": JSON.stringify(
      env.VITE_BACKEND_API_URL || ""
    ),
    "import.meta.env.VITE_DEBUG_MODE": JSON.stringify(
      env.VITE_DEBUG_MODE === "true"
    ),
  },
  };
});
