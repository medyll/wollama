// uno.config.ts
import { defineConfig, presetWind, presetTagify, presetAttributify } from 'unocss';

export default defineConfig({
    presets: [presetAttributify({}), presetTagify({}), presetWind()],
});
