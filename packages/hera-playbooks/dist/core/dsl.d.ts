export type PlaybookVersion = `v${number}`;
export type StepKind = 'validate' | 'enforce' | 'transform' | 'post' | 'audit' | 'branch' | 'tx';
export type StepStatus = 'ok' | 'skipped' | 'failed' | 'rolled_back';
export interface PlaybookContext<I = any> {
    orgId: string;
    actor: {
        id: string;
        role: string;
    };
    entity: {
        type: string;
        id?: string;
        name?: string;
        smartCode: string;
        payload: Record<string, any>;
    };
    state: Record<string, any>;
    out: {
        headers?: Record<string, any>;
        lines?: Array<Record<string, any>>;
        relationships?: Array<{
            type: string;
            from: string;
            to: string;
            smartCode: string;
        }>;
        dynamicFields?: Array<{
            name: string;
            value: any;
            smartCode: string;
            type: string;
        }>;
    };
    util: {
        now(): string;
        getDynamic(name: string): any;
        setDynamic(name: string, value: any, opts: {
            smartCode: string;
            type: string;
        }): void;
        link(type: string, toEntityId: string, smartCode: string): void;
        fetchEntityById(id: string, opts?: {
            includeDynamic?: boolean;
            includeRelationships?: boolean;
        }): Promise<any>;
        tx<T>(fn: () => Promise<T>): Promise<T>;
        log(event: string, data?: any): void;
    };
}
export interface StepResult {
    kind: StepKind;
    id: string;
    status: StepStatus;
    message?: string;
    data?: any;
    error?: any;
}
export type StepFn<C extends PlaybookContext = PlaybookContext> = (ctx: C) => Promise<StepResult> | StepResult;
export interface Playbook<C extends PlaybookContext = PlaybookContext> {
    id: string;
    entityType: string;
    version: PlaybookVersion;
    steps: StepFn<C>[];
}
export declare const validate: (id: string, fn: (ctx: PlaybookContext) => void | string | Promise<void | string>) => StepFn;
export declare const enforce: (id: string, fn: (ctx: PlaybookContext) => void | Promise<void>) => StepFn;
export declare const transform: (id: string, fn: (ctx: PlaybookContext) => void | Promise<void>) => StepFn;
export declare const post: (id: string, fn: (ctx: PlaybookContext) => Promise<void>) => StepFn;
export declare const audit: (id: string, fn: (ctx: PlaybookContext) => void | Promise<void>) => StepFn;
export declare const branch: (id: string, cond: (ctx: PlaybookContext) => boolean, whenTrue: StepFn[], whenFalse?: StepFn[]) => StepFn;
export declare const tx: (id: string, steps: StepFn[]) => StepFn;
