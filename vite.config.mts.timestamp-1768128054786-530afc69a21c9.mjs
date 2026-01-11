// vite.config.mts
import { defineConfig } from "file:///C:/Users/denni/Documents/GitHub/drei/node_modules/vite/dist/node/index.js";
import react from "file:///C:/Users/denni/Documents/GitHub/drei/node_modules/@vitejs/plugin-react/dist/index.mjs";
import glslifyPlugin from "file:///C:/Users/denni/Documents/GitHub/drei/node_modules/vite-plugin-glslify/dist/index.js";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { storybookTest } from "file:///C:/Users/denni/Documents/GitHub/drei/node_modules/@storybook/addon-vitest/dist/vitest-plugin/index.js";
import { playwright } from "file:///C:/Users/denni/Documents/GitHub/drei/node_modules/@vitest/browser-playwright/dist/index.js";
var __vite_injected_original_dirname = "C:\\Users\\denni\\Documents\\GitHub\\drei";
var __vite_injected_original_import_meta_url = "file:///C:/Users/denni/Documents/GitHub/drei/vite.config.mts";
var glslify = glslifyPlugin.default ?? glslifyPlugin;
var dirname = typeof __vite_injected_original_dirname !== "undefined" ? __vite_injected_original_dirname : path.dirname(fileURLToPath(__vite_injected_original_import_meta_url));
var vite_config_default = defineConfig({
  plugins: [react(), glslify()],
  test: {
    projects: [
      {
        extends: true,
        plugins: [
          // The plugin will run tests for the stories defined in your Storybook config
          // See options at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon#storybooktest
          storybookTest({
            configDir: path.join(dirname, ".storybook")
          })
        ],
        test: {
          name: "storybook",
          browser: {
            enabled: true,
            headless: true,
            provider: playwright({}),
            instances: [
              {
                browser: "chromium"
              }
            ]
          },
          setupFiles: [".storybook/vitest.setup.ts"]
        }
      }
    ]
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcubXRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiQzpcXFxcVXNlcnNcXFxcZGVubmlcXFxcRG9jdW1lbnRzXFxcXEdpdEh1YlxcXFxkcmVpXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxkZW5uaVxcXFxEb2N1bWVudHNcXFxcR2l0SHViXFxcXGRyZWlcXFxcdml0ZS5jb25maWcubXRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9DOi9Vc2Vycy9kZW5uaS9Eb2N1bWVudHMvR2l0SHViL2RyZWkvdml0ZS5jb25maWcubXRzXCI7Ly8vIDxyZWZlcmVuY2UgdHlwZXM9XCJ2aXRlc3QvY29uZmlnXCIgLz5cbmltcG9ydCB7IGRlZmluZUNvbmZpZyB9IGZyb20gJ3ZpdGUnXG5pbXBvcnQgcmVhY3QgZnJvbSAnQHZpdGVqcy9wbHVnaW4tcmVhY3QnXG5pbXBvcnQgZ2xzbGlmeVBsdWdpbiBmcm9tICd2aXRlLXBsdWdpbi1nbHNsaWZ5J1xuY29uc3QgZ2xzbGlmeSA9IChnbHNsaWZ5UGx1Z2luIGFzIHsgZGVmYXVsdD86IHR5cGVvZiBnbHNsaWZ5UGx1Z2luIH0pLmRlZmF1bHQgPz8gZ2xzbGlmeVBsdWdpblxuaW1wb3J0IHBhdGggZnJvbSAnbm9kZTpwYXRoJ1xuaW1wb3J0IHsgZmlsZVVSTFRvUGF0aCB9IGZyb20gJ25vZGU6dXJsJ1xuaW1wb3J0IHsgc3Rvcnlib29rVGVzdCB9IGZyb20gJ0BzdG9yeWJvb2svYWRkb24tdml0ZXN0L3ZpdGVzdC1wbHVnaW4nXG5pbXBvcnQgeyBwbGF5d3JpZ2h0IH0gZnJvbSAnQHZpdGVzdC9icm93c2VyLXBsYXl3cmlnaHQnXG5jb25zdCBkaXJuYW1lID0gdHlwZW9mIF9fZGlybmFtZSAhPT0gJ3VuZGVmaW5lZCcgPyBfX2Rpcm5hbWUgOiBwYXRoLmRpcm5hbWUoZmlsZVVSTFRvUGF0aChpbXBvcnQubWV0YS51cmwpKVxuXG4vLyBNb3JlIGluZm8gYXQ6IGh0dHBzOi8vc3Rvcnlib29rLmpzLm9yZy9kb2NzL25leHQvd3JpdGluZy10ZXN0cy9pbnRlZ3JhdGlvbnMvdml0ZXN0LWFkZG9uXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoe1xuICBwbHVnaW5zOiBbcmVhY3QoKSwgZ2xzbGlmeSgpXSxcbiAgdGVzdDoge1xuICAgIHByb2plY3RzOiBbXG4gICAgICB7XG4gICAgICAgIGV4dGVuZHM6IHRydWUsXG4gICAgICAgIHBsdWdpbnM6IFtcbiAgICAgICAgICAvLyBUaGUgcGx1Z2luIHdpbGwgcnVuIHRlc3RzIGZvciB0aGUgc3RvcmllcyBkZWZpbmVkIGluIHlvdXIgU3Rvcnlib29rIGNvbmZpZ1xuICAgICAgICAgIC8vIFNlZSBvcHRpb25zIGF0OiBodHRwczovL3N0b3J5Ym9vay5qcy5vcmcvZG9jcy9uZXh0L3dyaXRpbmctdGVzdHMvaW50ZWdyYXRpb25zL3ZpdGVzdC1hZGRvbiNzdG9yeWJvb2t0ZXN0XG4gICAgICAgICAgc3Rvcnlib29rVGVzdCh7XG4gICAgICAgICAgICBjb25maWdEaXI6IHBhdGguam9pbihkaXJuYW1lLCAnLnN0b3J5Ym9vaycpLFxuICAgICAgICAgIH0pLFxuICAgICAgICBdLFxuICAgICAgICB0ZXN0OiB7XG4gICAgICAgICAgbmFtZTogJ3N0b3J5Ym9vaycsXG4gICAgICAgICAgYnJvd3Nlcjoge1xuICAgICAgICAgICAgZW5hYmxlZDogdHJ1ZSxcbiAgICAgICAgICAgIGhlYWRsZXNzOiB0cnVlLFxuICAgICAgICAgICAgcHJvdmlkZXI6IHBsYXl3cmlnaHQoe30pLFxuICAgICAgICAgICAgaW5zdGFuY2VzOiBbXG4gICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBicm93c2VyOiAnY2hyb21pdW0nLFxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgXSxcbiAgICAgICAgICB9LFxuICAgICAgICAgIHNldHVwRmlsZXM6IFsnLnN0b3J5Ym9vay92aXRlc3Quc2V0dXAudHMnXSxcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgXSxcbiAgfSxcbn0pXG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQ0EsU0FBUyxvQkFBb0I7QUFDN0IsT0FBTyxXQUFXO0FBQ2xCLE9BQU8sbUJBQW1CO0FBRTFCLE9BQU8sVUFBVTtBQUNqQixTQUFTLHFCQUFxQjtBQUM5QixTQUFTLHFCQUFxQjtBQUM5QixTQUFTLGtCQUFrQjtBQVIzQixJQUFNLG1DQUFtQztBQUFtSixJQUFNLDJDQUEyQztBQUk3TyxJQUFNLFVBQVcsY0FBcUQsV0FBVztBQUtqRixJQUFNLFVBQVUsT0FBTyxxQ0FBYyxjQUFjLG1DQUFZLEtBQUssUUFBUSxjQUFjLHdDQUFlLENBQUM7QUFHMUcsSUFBTyxzQkFBUSxhQUFhO0FBQUEsRUFDMUIsU0FBUyxDQUFDLE1BQU0sR0FBRyxRQUFRLENBQUM7QUFBQSxFQUM1QixNQUFNO0FBQUEsSUFDSixVQUFVO0FBQUEsTUFDUjtBQUFBLFFBQ0UsU0FBUztBQUFBLFFBQ1QsU0FBUztBQUFBO0FBQUE7QUFBQSxVQUdQLGNBQWM7QUFBQSxZQUNaLFdBQVcsS0FBSyxLQUFLLFNBQVMsWUFBWTtBQUFBLFVBQzVDLENBQUM7QUFBQSxRQUNIO0FBQUEsUUFDQSxNQUFNO0FBQUEsVUFDSixNQUFNO0FBQUEsVUFDTixTQUFTO0FBQUEsWUFDUCxTQUFTO0FBQUEsWUFDVCxVQUFVO0FBQUEsWUFDVixVQUFVLFdBQVcsQ0FBQyxDQUFDO0FBQUEsWUFDdkIsV0FBVztBQUFBLGNBQ1Q7QUFBQSxnQkFDRSxTQUFTO0FBQUEsY0FDWDtBQUFBLFlBQ0Y7QUFBQSxVQUNGO0FBQUEsVUFDQSxZQUFZLENBQUMsNEJBQTRCO0FBQUEsUUFDM0M7QUFBQSxNQUNGO0FBQUEsSUFDRjtBQUFBLEVBQ0Y7QUFDRixDQUFDOyIsCiAgIm5hbWVzIjogW10KfQo=
