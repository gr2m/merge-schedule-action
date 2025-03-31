import { defineConfig } from "vite";

export default defineConfig({
  test: {
    setupFiles: ["./test/setup-test-env.ts"], // These will be run before each test file.
  },
});
