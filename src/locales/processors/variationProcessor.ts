import { PostProcessorModule } from 'i18next';

/**
 * i18next post-processor that appends a "(variation)" suffix to translated strings.
 *
 * When a translation call includes `{ variation: "some text" }` in its options,
 * the output becomes `"Translated value (some text)"`.
 * Used for item/perk variants where the base name is shared but a qualifier is needed
 * (e.g. "Laser Rifle (Scoped)", "Stimpak (Super)").
 */
export const variationProcessor: PostProcessorModule = {
    type: 'postProcessor',
    name: 'variationAppend',
    process: (value, _, options) => {
        const variation = options['variation'];
        return variation && typeof variation === 'string' ? `${value} (${variation})` : value;
    },
};
