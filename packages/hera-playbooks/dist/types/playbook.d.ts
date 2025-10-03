/**
 * HERA Playbook Type Definitions
 */
export interface PlaybookStep {
    code: string;
    name: string;
    kind: string;
    policy: 'auto' | 'manual' | 'cron' | 'queued';
    input?: string[];
    produces?: string[];
    updates?: string[];
    effect?: string;
    link?: string;
    description?: string;
}
export interface PlaybookDefinition {
    code: string;
    name: string;
    description?: string;
    steps: PlaybookStep[];
}
