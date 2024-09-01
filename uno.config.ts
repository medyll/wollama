import {
  defineConfig,
  presetWind,
  presetTagify,
  presetAttributify,
} from "unocss";
import transformerDirectives from "@unocss/transformer-directives";
import extractorSvelte from "@unocss/extractor-svelte";
import transformerVariantGroup from "@unocss/transformer-variant-group";
import presetUno from "@unocss/preset-uno";

export default defineConfig({
  extractors: [extractorSvelte()],
  transformers: [transformerVariantGroup(), transformerDirectives()],
  presets: [presetUno(), presetAttributify({}), presetTagify({}), presetWind()],
});
