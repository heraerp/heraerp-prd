// Runtime resolver shim for demo/guard module resolution
const Module = require("module");
const path = require("path");

const ORIGINAL_RESOLVE = Module._resolveFilename;

Module._resolveFilename = function patchedResolve(request, parent, isMain, options) {
  try {
    return ORIGINAL_RESOLVE.call(this, request, parent, isMain, options);
  } catch (error) {
    // Handle relative ./demo/guard imports that fail
    if (request === './demo/guard' && error.code === 'MODULE_NOT_FOUND') {
      try {
        // Try Next.js standalone bundled version
        const fallbacks = [
          path.join(process.cwd(), '.next/standalone/app/demo/guard.js'),
          path.join(process.cwd(), '.next/standalone/app/demo/guard.mjs'),
          path.join(process.cwd(), '.next/server/app/demo/guard.js'),
          path.join(process.cwd(), '.next/server/app/demo/guard.mjs')
        ];
        
        for (const fallback of fallbacks) {
          try {
            return require.resolve(fallback);
          } catch (_) {}
        }
      } catch (_) {}
    }
    throw error;
  }
};