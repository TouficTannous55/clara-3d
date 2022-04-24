import { defineConfig } from "vite";
import FullReload from "vite-plugin-full-reload";

import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), FullReload(["**/*"])],
});
