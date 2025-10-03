// Core DSL
export * from './core/dsl';
export * from './core/executor';

// Registry
export * from './registry';

// Adapters
export { universalApiAdapters } from './adapters/universalApiAdapter';
export { supabaseAdapters } from './adapters/supabaseAdapter';

// Industry Playbooks
export * from './salon';
export * from './jewelry';

// Entity Presets and Types
export * from './types';
export * from './presets';
export * from './playbooks';