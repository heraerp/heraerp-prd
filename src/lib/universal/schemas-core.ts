type Safe<T> = { success: true; data: T } | { success: false; error: any };

function makeSchema<T = any>() {
  return {
    parse(v: T): T { return v; },
    safeParse(v: T): Safe<T> { return { success: true, data: v }; },
  };
}

// Export the shapes your routes import
export const DynamicBatchBody     = makeSchema<any>();
export const DynamicSetBody       = makeSchema<any>();
export const DynamicGetQuery      = makeSchema<any>();
export const RelationshipBatchBody= makeSchema<any>();
export const RelationshipQuery    = makeSchema<any>();
export const TxnBatchBody         = makeSchema<any>();
export const TxnEmitBody          = makeSchema<any>();
export const TxnSearchQuery       = makeSchema<any>();

// Add any other schema symbols here if the build later asks for them.