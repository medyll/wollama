// uno.config.ts
import { defineConfig } from 'unocss';
import presetTagify from '@unocss/preset-tagify';
import presetAttributify from '@unocss/preset-attributify';

export default defineConfig({
    presets: [
        presetAttributify({
            /* preset options */
        }),
        presetTagify({
            /* options */
        }),
        // ...other presets
    ],
});
