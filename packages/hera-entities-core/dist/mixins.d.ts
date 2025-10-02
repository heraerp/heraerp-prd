import type { EntityPreset } from './types.js';
export declare function withMixins<T extends EntityPreset>(base: T, mixins: Array<Partial<Pick<T, 'dynamicFields' | 'relationships' | 'metadata'>>>): T;
export declare const TAGGABLE: {
    relationships: {
        type: string;
        smart_code: string;
        cardinality: "many";
    }[];
};
