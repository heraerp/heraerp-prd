import type { Playbook, PlaybookContext, StepResult } from './dsl';
export interface ExecuteOptions {
    organizationId: string;
    actorId: string;
    actorRole: string;
    adapters: {
        setDynamic: (ctx: PlaybookContext, field: any) => void;
        link: (ctx: PlaybookContext, rel: any) => void;
        persist: (ctx: PlaybookContext) => Promise<void>;
        audit: (ctx: PlaybookContext, event: string, payload: any) => void;
        tx: (fn: () => Promise<void>) => Promise<void>;
        fetchEntityById: (id: string, opts?: any) => Promise<any>;
    };
}
export interface ExecuteResult {
    steps: StepResult[];
    output: any;
    state: any;
}
export declare function executePlaybook(playbook: Playbook, entity: any, opts: ExecuteOptions): Promise<ExecuteResult>;
