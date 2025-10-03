import type { Playbook } from './core/dsl';
export declare const playbookRegistry: Record<string, Playbook>;
export declare function resolvePlaybook(entitySmartCode: string): Playbook | undefined;
