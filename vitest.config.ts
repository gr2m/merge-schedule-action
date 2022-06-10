/// <reference types="vitest" />
/// <reference types="vite/client" />

import { defineConfig } from "vite";

export default defineConfig({
  test: {
    setupFiles: ["./test/setup-test-env.ts"],
    deps: {
      inline: ["vitest-mock-process"],
    },
  },
});
