(globalThis.TURBOPACK = globalThis.TURBOPACK || []).push([typeof document === "object" ? document.currentScript : undefined, {

"[project]/src/components/pwa/ServiceWorkerProvider.tsx [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
__turbopack_context__.s({
    "ServiceWorkerProvider": ()=>ServiceWorkerProvider,
    "useServiceWorker": ()=>useServiceWorker
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature(), _s1 = __turbopack_context__.k.signature();
'use client';
;
const ServiceWorkerContext = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createContext"])({
    isUpdateAvailable: false,
    updateServiceWorker: ()=>{},
    registration: null
});
const useServiceWorker = ()=>{
    _s();
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useContext"])(ServiceWorkerContext);
};
_s(useServiceWorker, "gDsCjeeItUuvgOWf1v4qoK9RF6k=");
function ServiceWorkerProvider(param) {
    let { children } = param;
    _s1();
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "ServiceWorkerProvider.useEffect": ()=>{
            // PWA functionality has been removed from HERA
            // Clean up any existing service workers
            if ('serviceWorker' in navigator) {
                cleanupServiceWorkers();
            }
        }
    }["ServiceWorkerProvider.useEffect"], []);
    const cleanupServiceWorkers = async ()=>{
        try {
            // First, register the kill switch service worker
            const killSwitch = await navigator.serviceWorker.register('/sw-killswitch.js', {
                scope: '/'
            });
            console.log('[PWA Removal] Kill switch service worker registered');
            // After a delay, unregister all service workers
            setTimeout(async ()=>{
                const registrations = await navigator.serviceWorker.getRegistrations();
                for (const registration of registrations){
                    const success = await registration.unregister();
                    console.log('[PWA Removal] Service worker unregistered:', success);
                }
            }, 2000);
        } catch (error) {
            console.error('[PWA Removal] Error during cleanup:', error);
        }
    };
    // Provide dummy context values since PWA is removed
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(ServiceWorkerContext.Provider, {
        value: {
            isUpdateAvailable: false,
            updateServiceWorker: ()=>{},
            registration: null
        },
        children: children
    }, void 0, false, {
        fileName: "[project]/src/components/pwa/ServiceWorkerProvider.tsx",
        lineNumber: 52,
        columnNumber: 5
    }, this);
}
_s1(ServiceWorkerProvider, "OD7bBpZva5O2jO+Puf00hKivP7c=");
_c = ServiceWorkerProvider;
var _c;
__turbopack_context__.k.register(_c, "ServiceWorkerProvider");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/src/components/providers/QueryProvider.tsx [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
__turbopack_context__.s({
    "QueryProvider": ()=>QueryProvider
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$query$2d$core$2f$build$2f$modern$2f$queryClient$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@tanstack/query-core/build/modern/queryClient.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$react$2d$query$2f$build$2f$modern$2f$QueryClientProvider$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@tanstack/react-query/build/modern/QueryClientProvider.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$react$2d$query$2d$devtools$2f$build$2f$modern$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@tanstack/react-query-devtools/build/modern/index.js [app-client] (ecmascript)");
'use client';
;
;
;
// Create a client
const queryClient = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$query$2d$core$2f$build$2f$modern$2f$queryClient$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["QueryClient"]({
    defaultOptions: {
        queries: {
            staleTime: 60 * 1000,
            refetchOnWindowFocus: false
        }
    }
});
function QueryProvider(param) {
    let { children } = param;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$react$2d$query$2f$build$2f$modern$2f$QueryClientProvider$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["QueryClientProvider"], {
        client: queryClient,
        children: [
            children,
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$react$2d$query$2d$devtools$2f$build$2f$modern$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ReactQueryDevtools"], {
                initialIsOpen: false
            }, void 0, false, {
                fileName: "[project]/src/components/providers/QueryProvider.tsx",
                lineNumber: 25,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/providers/QueryProvider.tsx",
        lineNumber: 23,
        columnNumber: 5
    }, this);
}
_c = QueryProvider;
var _c;
__turbopack_context__.k.register(_c, "QueryProvider");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/src/components/universal/ui/HeraThemeProvider.tsx [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
__turbopack_context__.s({
    "HeraThemeProvider": ()=>HeraThemeProvider,
    "HeraThemeToggle": ()=>HeraThemeToggle,
    "useTheme": ()=>useTheme
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature(), _s1 = __turbopack_context__.k.signature(), _s2 = __turbopack_context__.k.signature();
'use client';
;
const ThemeContext = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createContext"])(undefined);
function useTheme() {
    _s();
    const context = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useContext"])(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}
_s(useTheme, "b9L3QQ+jgeyIrH0NfHrJ8nn7VMU=");
function HeraThemeProvider(param) {
    let { children, defaultTheme = 'dark', storageKey = 'hera-theme' } = param;
    _s1();
    const [theme, setTheme] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(defaultTheme);
    const [actualTheme, setActualTheme] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('dark');
    const [mounted, setMounted] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    // Prevent hydration mismatch
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "HeraThemeProvider.useEffect": ()=>{
            setMounted(true);
        }
    }["HeraThemeProvider.useEffect"], []);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "HeraThemeProvider.useEffect": ()=>{
            if (!mounted) return;
            // Load theme from localStorage or use default
            const savedTheme = localStorage.getItem(storageKey);
            if (savedTheme) {
                setTheme(savedTheme);
            }
        }
    }["HeraThemeProvider.useEffect"], [
        storageKey,
        mounted
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "HeraThemeProvider.useEffect": ()=>{
            if (!mounted) return;
            const root = window.document.documentElement;
            // Remove existing theme classes
            root.classList.remove('light', 'dark');
            let effectiveTheme = 'dark';
            if (theme === 'system') {
                const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                effectiveTheme = systemTheme;
            } else {
                effectiveTheme = theme;
            }
            // Apply theme class
            root.classList.add(effectiveTheme);
            setActualTheme(effectiveTheme);
            // Save to localStorage
            localStorage.setItem(storageKey, theme);
        }
    }["HeraThemeProvider.useEffect"], [
        theme,
        storageKey,
        mounted
    ]);
    // Listen for system theme changes
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "HeraThemeProvider.useEffect": ()=>{
            if (!mounted || theme !== 'system') return;
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            const handleChange = {
                "HeraThemeProvider.useEffect.handleChange": (e)=>{
                    setActualTheme(e.matches ? 'dark' : 'light');
                    const root = window.document.documentElement;
                    root.classList.remove('light', 'dark');
                    root.classList.add(e.matches ? 'dark' : 'light');
                }
            }["HeraThemeProvider.useEffect.handleChange"];
            mediaQuery.addEventListener('change', handleChange);
            return ({
                "HeraThemeProvider.useEffect": ()=>mediaQuery.removeEventListener('change', handleChange)
            })["HeraThemeProvider.useEffect"];
        }
    }["HeraThemeProvider.useEffect"], [
        theme,
        mounted
    ]);
    // Render children with fallback during hydration
    if (!mounted) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(ThemeContext.Provider, {
            value: {
                theme: defaultTheme,
                setTheme,
                actualTheme: defaultTheme === 'system' ? 'dark' : defaultTheme
            },
            children: children
        }, void 0, false, {
            fileName: "[project]/src/components/universal/ui/HeraThemeProvider.tsx",
            lineNumber: 97,
            columnNumber: 7
        }, this);
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(ThemeContext.Provider, {
        value: {
            theme,
            setTheme,
            actualTheme
        },
        children: children
    }, void 0, false, {
        fileName: "[project]/src/components/universal/ui/HeraThemeProvider.tsx",
        lineNumber: 104,
        columnNumber: 5
    }, this);
}
_s1(HeraThemeProvider, "TEdhLj7WdIeeQR/zr4a/5d8tlUE=");
_c = HeraThemeProvider;
function HeraThemeToggle(param) {
    let { className } = param;
    _s2();
    const { theme, setTheme, actualTheme } = useTheme();
    const toggleTheme = ()=>{
        if (theme === 'light') {
            setTheme('dark');
        } else if (theme === 'dark') {
            setTheme('system');
        } else {
            setTheme('light');
        }
    };
    const getIcon = ()=>{
        if (theme === 'system') {
            return '🖥️';
        }
        return actualTheme === 'dark' ? '🌙' : '☀️';
    };
    const getLabel = ()=>{
        if (theme === 'system') return 'System';
        return actualTheme === 'dark' ? 'Dark' : 'Light';
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
        onClick: toggleTheme,
        className: "\n        inline-flex items-center justify-center gap-2 \n        rounded-md px-3 py-2 text-sm font-medium \n        transition-colors duration-200\n        bg-background hover:bg-accent hover:text-accent-foreground \n        border border-border\n        ".concat(className, "\n      "),
        title: "Switch to ".concat(theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light', " theme"),
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                className: "text-base",
                children: getIcon()
            }, void 0, false, {
                fileName: "[project]/src/components/universal/ui/HeraThemeProvider.tsx",
                lineNumber: 149,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                children: getLabel()
            }, void 0, false, {
                fileName: "[project]/src/components/universal/ui/HeraThemeProvider.tsx",
                lineNumber: 150,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/universal/ui/HeraThemeProvider.tsx",
        lineNumber: 137,
        columnNumber: 5
    }, this);
}
_s2(HeraThemeToggle, "pAIbxkelpA97iVHg/+3qLGic3jM=", false, function() {
    return [
        useTheme
    ];
});
_c1 = HeraThemeToggle;
var _c, _c1;
__turbopack_context__.k.register(_c, "HeraThemeProvider");
__turbopack_context__.k.register(_c1, "HeraThemeToggle");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/src/lib/supabase.ts [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
__turbopack_context__.s({
    "getSupabase": ()=>getSupabase,
    "supabase": ()=>supabase
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = /*#__PURE__*/ __turbopack_context__.i("[project]/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$supabase$2f$supabase$2d$js$2f$dist$2f$module$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/@supabase/supabase-js/dist/module/index.js [app-client] (ecmascript) <locals>");
;
// Supabase configuration - get fresh values at runtime
const getSupabaseUrl = ()=>("TURBOPACK compile-time value", "https://awfcrncxngqwbhqapffb.supabase.co") || '';
const getSupabaseAnonKey = ()=>("TURBOPACK compile-time value", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3ZmNybmN4bmdxd2JocWFwZmZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ4MDk2MTUsImV4cCI6MjA3MDM4NTYxNX0.VBgaT6jg5k_vTz-5ibD90m2O6K5F6m-se2I_vLAD2G0") || '';
// Create a singleton instance that can be initialized later
let supabaseInstance = null;
const getSupabase = ()=>{
    if (!supabaseInstance) {
        const url = getSupabaseUrl();
        const key = getSupabaseAnonKey();
        // Only create client if we have valid configuration
        if (url && key && !url.includes('placeholder')) {
            supabaseInstance = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$supabase$2f$supabase$2d$js$2f$dist$2f$module$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["createClient"])(url, key, {
                auth: {
                    persistSession: true,
                    autoRefreshToken: true,
                    detectSessionInUrl: true
                }
            });
            // Log configuration status (not the actual values)
            if ("TURBOPACK compile-time truthy", 1) {
                console.log('Supabase client configuration:', {
                    hasUrl: !!url,
                    hasKey: !!key,
                    projectId: url.includes('supabase.co') ? url.split('.')[0].replace('https://', '') : 'unknown'
                });
            }
        } else {
            // For build time, create a no-op client
            const noop = ()=>Promise.reject(new Error('Supabase not configured'));
            supabaseInstance = {
                from: ()=>({
                        select: noop,
                        insert: noop,
                        update: noop,
                        delete: noop
                    }),
                auth: {
                    getSession: noop,
                    signIn: noop,
                    signOut: noop
                },
                storage: {
                    from: ()=>({
                            upload: noop,
                            download: noop
                        })
                },
                rpc: noop
            };
        }
    }
    return supabaseInstance;
};
const supabase = new Proxy({}, {
    get (_, prop) {
        const client = getSupabase();
        return client[prop];
    }
});
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/src/lib/supabase-client.ts [app-client] (ecmascript) <locals>": ((__turbopack_context__) => {
"use strict";

var { k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
// Re-export the singleton instance from supabase.ts to prevent multiple instances
__turbopack_context__.s({});
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/supabase.ts [app-client] (ecmascript)");
;
;
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/src/lib/supabase-client.ts [app-client] (ecmascript) <module evaluation>": ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s({});
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/supabase.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2d$client$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/src/lib/supabase-client.ts [app-client] (ecmascript) <locals>");
}),
"[project]/src/lib/supabase.ts [app-client] (ecmascript) <export supabase as supabaseClient>": ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s({
    "supabaseClient": ()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["supabase"]
});
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/supabase.ts [app-client] (ecmascript)");
}),
"[project]/src/components/auth/MultiOrgAuthProvider.tsx [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
__turbopack_context__.s({
    "MultiOrgAuthProvider": ()=>MultiOrgAuthProvider,
    "default": ()=>__TURBOPACK__default__export__,
    "useMultiOrgAuth": ()=>useMultiOrgAuth
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = /*#__PURE__*/ __turbopack_context__.i("[project]/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2d$client$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$module__evaluation$3e$__ = __turbopack_context__.i("[project]/src/lib/supabase-client.ts [app-client] (ecmascript) <module evaluation>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__supabase__as__supabaseClient$3e$__ = __turbopack_context__.i("[project]/src/lib/supabase.ts [app-client] (ecmascript) <export supabase as supabaseClient>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/navigation.js [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature(), _s1 = __turbopack_context__.k.signature();
'use client';
;
;
;
const MultiOrgAuthContextProvider = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createContext"])(null);
function MultiOrgAuthProvider(param) {
    let { children } = param;
    _s();
    // Core auth state
    const [user, setUser] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [session, setSession] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [isLoading, setIsLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(true);
    // Organization state
    const [organizations, setOrganizations] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [currentOrganization, setCurrentOrganization] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [isLoadingOrgs, setIsLoadingOrgs] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const router = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRouter"])();
    const pathname = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["usePathname"])();
    // Get subdomain from URL (works for both dev and production)
    const getSubdomain = ()=>{
        if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
        ;
        const hostname = window.location.hostname;
        const pathname = window.location.pathname;
        // Development: check for /~subdomain pattern on localhost
        if (hostname === 'localhost' && pathname.startsWith('/~')) {
            const match = pathname.match(/^\/~([^\/]+)/);
            return match ? match[1] : null;
        }
        // Development: check for *.lvh.me domains (resolves to 127.0.0.1)
        if (hostname.endsWith('.lvh.me')) {
            return hostname.split('.')[0];
        }
        // Development: check for *.localhost domains
        if (hostname.endsWith('.localhost')) {
            return hostname.split('.')[0];
        }
        // Production: check actual subdomain (e.g., mario.heraerp.com)
        const parts = hostname.split('.');
        if (parts.length >= 3 || parts.length === 2 && !parts[0].includes('localhost')) {
            return parts[0];
        }
        return null;
    };
    // Load user organizations
    const loadUserOrganizations = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "MultiOrgAuthProvider.useCallback[loadUserOrganizations]": async (authUser)=>{
            if (!authUser) return;
            try {
                setIsLoadingOrgs(true);
                // Get auth token
                const { data: { session: currentSession } } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__supabase__as__supabaseClient$3e$__["supabaseClient"].auth.getSession();
                const authToken = currentSession === null || currentSession === void 0 ? void 0 : currentSession.access_token;
                if (!authToken) {
                    console.warn('No auth token available for loading organizations');
                    return;
                }
                // Fetch user's organizations
                const response = await fetch('/api/v1/organizations', {
                    headers: {
                        'Authorization': "Bearer ".concat(authToken),
                        'Content-Type': 'application/json'
                    }
                });
                if (response.ok) {
                    const data = await response.json();
                    console.log('Organizations API response:', data);
                    // Handle both new format (with success property) and direct array response
                    const orgs = data.success ? data.organizations : data.organizations ? data.organizations : Array.isArray(data) ? data : [];
                    console.log('Parsed organizations:', orgs);
                    if (orgs && orgs.length > 0) {
                        setOrganizations(orgs);
                        // Set current organization based on subdomain or first org
                        const subdomain = getSubdomain();
                        if (subdomain) {
                            // Check settings.subdomain first, then fallback to metadata.subdomain for backwards compatibility
                            const org = orgs.find({
                                "MultiOrgAuthProvider.useCallback[loadUserOrganizations].org": (o)=>{
                                    var _o_settings, _o_metadata;
                                    return ((_o_settings = o.settings) === null || _o_settings === void 0 ? void 0 : _o_settings.subdomain) === subdomain || ((_o_metadata = o.metadata) === null || _o_metadata === void 0 ? void 0 : _o_metadata.subdomain) === subdomain || o.subdomain === subdomain;
                                }
                            }["MultiOrgAuthProvider.useCallback[loadUserOrganizations].org"]);
                            if (org) {
                                setCurrentOrganization(org);
                                // Store in localStorage for persistence
                                localStorage.setItem('current-organization-id', org.id);
                            }
                        } else if (orgs.length === 1) {
                            // If user has only one org, set it as current
                            setCurrentOrganization(orgs[0]);
                            localStorage.setItem('current-organization-id', orgs[0].id);
                        } else if (orgs.length > 1) {
                            // Try to restore from localStorage
                            const storedOrgId = localStorage.getItem('current-organization-id');
                            if (storedOrgId) {
                                const storedOrg = orgs.find({
                                    "MultiOrgAuthProvider.useCallback[loadUserOrganizations].storedOrg": (o)=>o.id === storedOrgId
                                }["MultiOrgAuthProvider.useCallback[loadUserOrganizations].storedOrg"]);
                                if (storedOrg) {
                                    setCurrentOrganization(storedOrg);
                                }
                            }
                        }
                    } else {
                        // No organizations found, check if this is a demo user
                        console.log('No organizations found from API, checking for demo user');
                        const userEmail = authUser.email || '';
                        console.log('User email:', userEmail);
                        // Universal demo user has access to all demo organizations
                        if (userEmail === 'demo@heraerp.com') {
                            const allDemoOrgs = [
                                {
                                    id: '519d9c67-6fa4-4c73-9c56-6d132a6649c1',
                                    name: 'Bella Beauty Salon (Demo)',
                                    subdomain: 'demo-salon',
                                    type: 'salon',
                                    subscription_plan: 'demo',
                                    role: 'owner',
                                    permissions: [
                                        '*'
                                    ],
                                    is_active: true
                                },
                                {
                                    id: '6c3bc585-eec9-40a2-adc5-a89bfb398a16',
                                    name: 'Kochi Ice Cream Manufacturing (Demo)',
                                    subdomain: 'demo-icecream',
                                    type: 'icecream',
                                    subscription_plan: 'demo',
                                    role: 'owner',
                                    permissions: [
                                        '*'
                                    ],
                                    is_active: true
                                },
                                {
                                    id: '3740d358-f283-47e8-8055-852b67eee1a6',
                                    name: "Mario's Restaurant (Demo)",
                                    subdomain: 'demo-restaurant',
                                    type: 'restaurant',
                                    subscription_plan: 'demo',
                                    role: 'owner',
                                    permissions: [
                                        '*'
                                    ],
                                    is_active: true
                                },
                                {
                                    id: '037aac11-2323-4a71-8781-88a8454c9695',
                                    name: 'Dr. Smith Family Practice (Demo)',
                                    subdomain: 'demo-healthcare',
                                    type: 'healthcare',
                                    subscription_plan: 'demo',
                                    role: 'owner',
                                    permissions: [
                                        '*'
                                    ],
                                    is_active: true
                                }
                            ];
                            setOrganizations(allDemoOrgs);
                            // Set current organization based on subdomain or pathname
                            const subdomain = getSubdomain();
                            const pathname = window.location.pathname;
                            let selectedOrg = null;
                            // Check subdomain first
                            if (subdomain) {
                                selectedOrg = allDemoOrgs.find({
                                    "MultiOrgAuthProvider.useCallback[loadUserOrganizations]": (o)=>o.subdomain === subdomain
                                }["MultiOrgAuthProvider.useCallback[loadUserOrganizations]"]) || null;
                            }
                            // If no subdomain match, check pathname for demo routes
                            if (!selectedOrg && pathname) {
                                const basePath = pathname.split('/')[1];
                                const demoRouteMap = {
                                    'salon': 'demo-salon',
                                    'salon-data': 'demo-salon',
                                    'icecream': 'demo-icecream',
                                    'restaurant': 'demo-restaurant',
                                    'healthcare': 'demo-healthcare'
                                };
                                if (demoRouteMap[basePath]) {
                                    selectedOrg = allDemoOrgs.find({
                                        "MultiOrgAuthProvider.useCallback[loadUserOrganizations]": (o)=>o.subdomain === demoRouteMap[basePath]
                                    }["MultiOrgAuthProvider.useCallback[loadUserOrganizations]"]) || null;
                                }
                            }
                            // Set the selected organization or default to first one
                            if (selectedOrg) {
                                setCurrentOrganization(selectedOrg);
                                localStorage.setItem('current-organization-id', selectedOrg.id);
                            } else if (allDemoOrgs.length > 0) {
                                setCurrentOrganization(allDemoOrgs[0]);
                                localStorage.setItem('current-organization-id', allDemoOrgs[0].id);
                            }
                        } else if ("TURBOPACK compile-time truthy", 1) {
                            // Use default organization for development
                            console.log('No organizations found, using default organization for development');
                            const defaultOrg = {
                                id: ("TURBOPACK compile-time value", "550e8400-e29b-41d4-a716-446655440000"),
                                name: 'Dubai Luxury Salon & Spa',
                                subdomain: 'salon',
                                type: 'salon',
                                subscription_plan: 'professional',
                                role: 'admin',
                                permissions: [
                                    '*'
                                ],
                                is_active: true
                            };
                            setOrganizations([
                                defaultOrg
                            ]);
                            setCurrentOrganization(defaultOrg);
                            localStorage.setItem('current-organization-id', defaultOrg.id);
                        }
                    }
                }
            } catch (error) {
                console.error('Failed to load organizations:', error);
            } finally{
                setIsLoadingOrgs(false);
            }
        }
    }["MultiOrgAuthProvider.useCallback[loadUserOrganizations]"], []);
    // Create user entity from auth user
    const createUserFromAuth = (authUser)=>{
        var _authUser_user_metadata, _authUser_email, _authUser_user_metadata1;
        return {
            id: authUser.id,
            auth_user_id: authUser.id,
            email: authUser.email || '',
            name: ((_authUser_user_metadata = authUser.user_metadata) === null || _authUser_user_metadata === void 0 ? void 0 : _authUser_user_metadata.name) || ((_authUser_email = authUser.email) === null || _authUser_email === void 0 ? void 0 : _authUser_email.split('@')[0]) || '',
            full_name: ((_authUser_user_metadata1 = authUser.user_metadata) === null || _authUser_user_metadata1 === void 0 ? void 0 : _authUser_user_metadata1.full_name) || ''
        };
    };
    // Clear all state
    const clearState = ()=>{
        setUser(null);
        setSession(null);
        setOrganizations([]);
        setCurrentOrganization(null);
    };
    // Initialize authentication
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "MultiOrgAuthProvider.useEffect": ()=>{
            const initializeAuth = {
                "MultiOrgAuthProvider.useEffect.initializeAuth": async ()=>{
                    try {
                        // Get initial session
                        const { data: { session: initialSession } } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__supabase__as__supabaseClient$3e$__["supabaseClient"].auth.getSession();
                        if (initialSession) {
                            setSession(initialSession);
                            setUser(createUserFromAuth(initialSession.user));
                            await loadUserOrganizations(initialSession.user);
                        }
                    } catch (error) {
                        console.error('Failed to initialize auth:', error);
                    } finally{
                        setIsLoading(false);
                    }
                }
            }["MultiOrgAuthProvider.useEffect.initializeAuth"];
            initializeAuth();
            // Listen for auth state changes
            const { data: authListener } = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__supabase__as__supabaseClient$3e$__["supabaseClient"].auth.onAuthStateChange({
                "MultiOrgAuthProvider.useEffect": async (event, newSession)=>{
                    console.log('Auth state changed:', event);
                    setSession(newSession);
                    if (event === 'SIGNED_IN' && newSession) {
                        setUser(createUserFromAuth(newSession.user));
                        await loadUserOrganizations(newSession.user);
                    } else if (event === 'SIGNED_OUT') {
                        clearState();
                    } else if (event === 'TOKEN_REFRESHED' && newSession) {
                        setUser(createUserFromAuth(newSession.user));
                    }
                }
            }["MultiOrgAuthProvider.useEffect"]);
            return ({
                "MultiOrgAuthProvider.useEffect": ()=>{
                    authListener.subscription.unsubscribe();
                }
            })["MultiOrgAuthProvider.useEffect"];
        }
    }["MultiOrgAuthProvider.useEffect"], [
        loadUserOrganizations
    ]);
    const login = async (email, password)=>{
        const { data, error } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__supabase__as__supabaseClient$3e$__["supabaseClient"].auth.signInWithPassword({
            email,
            password
        });
        if (error) {
            throw error;
        }
        if (data.session) {
            setSession(data.session);
            setUser(createUserFromAuth(data.session.user));
            await loadUserOrganizations(data.session.user);
        }
    };
    const logout = async ()=>{
        const { error } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__supabase__as__supabaseClient$3e$__["supabaseClient"].auth.signOut();
        if (error) {
            throw error;
        }
        clearState();
        router.push('/');
    };
    const register = async function(email, password) {
        let userData = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {};
        const { data, error } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__supabase__as__supabaseClient$3e$__["supabaseClient"].auth.signUp({
            email,
            password,
            options: {
                data: userData
            }
        });
        if (error) {
            throw error;
        }
        return data;
    };
    const createOrganization = async (data)=>{
        if (!(session === null || session === void 0 ? void 0 : session.access_token)) {
            throw new Error('No authentication token available');
        }
        const response = await fetch('/api/v1/organizations', {
            method: 'POST',
            headers: {
                'Authorization': "Bearer ".concat(session.access_token),
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        const result = await response.json();
        if (!response.ok || !result.success) {
            throw new Error(result.error || 'Failed to create organization');
        }
        // Refresh organizations list
        await refreshOrganizations();
        // Return the new organization
        const newOrg = organizations.find((org)=>org.id === result.organization.id);
        if (newOrg) {
            return newOrg;
        }
        // Fallback to constructing from response
        return {
            id: result.organization.id,
            name: result.organization.name,
            subdomain: result.organization.subdomain,
            type: result.organization.type,
            subscription_plan: 'trial',
            role: 'owner',
            permissions: [
                '*'
            ],
            is_active: true
        };
    };
    const switchOrganization = async (orgId)=>{
        const org = organizations.find((o)=>o.id === orgId);
        if (org) {
            setCurrentOrganization(org);
            localStorage.setItem('current-organization-id', org.id);
            // For demo organizations, don't redirect - just update state
            // The app will handle the organization context change
            if (org.subdomain && org.subdomain.startsWith('demo-')) {
                console.log("Switched to demo organization: ".concat(org.name));
                return;
            }
            // In production, redirect to organization subdomain
            if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
            ;
            else {
                // In development, use .lvh.me for proper subdomain simulation
                const currentHost = window.location.hostname;
                const currentPort = window.location.port;
                const protocol = window.location.protocol;
                // Use .lvh.me domains which resolve to 127.0.0.1
                const portSuffix = currentPort ? ":".concat(currentPort) : '';
                window.location.href = "".concat(protocol, "//").concat(org.subdomain, ".lvh.me").concat(portSuffix, "/org/salon");
            }
        }
    };
    const refreshOrganizations = async ()=>{
        if (session === null || session === void 0 ? void 0 : session.user) {
            await loadUserOrganizations(session.user);
        }
    };
    const checkSubdomainAvailability = async (subdomain)=>{
        try {
            const response = await fetch("/api/v1/organizations/check-subdomain?subdomain=".concat(encodeURIComponent(subdomain)), {
                method: 'GET'
            });
            if (response.ok) {
                const data = await response.json();
                return data.available;
            }
            return false;
        } catch (error) {
            console.error('Error checking subdomain:', error);
            return false;
        }
    };
    const getOrganizationBySubdomain = (subdomain)=>{
        return organizations.find((org)=>org.subdomain === subdomain) || null;
    };
    const value = {
        user,
        session,
        isAuthenticated: !!user,
        isLoading,
        organizations,
        currentOrganization,
        isLoadingOrgs,
        login,
        logout,
        register,
        createOrganization,
        switchOrganization,
        refreshOrganizations,
        checkSubdomainAvailability,
        getOrganizationBySubdomain
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(MultiOrgAuthContextProvider.Provider, {
        value: value,
        children: children
    }, void 0, false, {
        fileName: "[project]/src/components/auth/MultiOrgAuthProvider.tsx",
        lineNumber: 511,
        columnNumber: 5
    }, this);
}
_s(MultiOrgAuthProvider, "u8rGkTTECVY8i5AzAJQ96aCglnM=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRouter"],
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["usePathname"]
    ];
});
_c = MultiOrgAuthProvider;
const useMultiOrgAuth = ()=>{
    _s1();
    const context = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useContext"])(MultiOrgAuthContextProvider);
    if (!context) {
        throw new Error('useMultiOrgAuth must be used within a MultiOrgAuthProvider');
    }
    return context;
};
_s1(useMultiOrgAuth, "b9L3QQ+jgeyIrH0NfHrJ8nn7VMU=");
// Utility function to get subdomain from request
function getSubdomainFromRequest() {
    if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
    ;
    const hostname = window.location.hostname;
    // Local development
    if (hostname.includes('localhost')) {
        // Check for simulated subdomain in path
        const pathname = window.location.pathname;
        if (pathname.startsWith('/~')) {
            return pathname.split('/')[1].substring(1);
        }
        return null;
    }
    // Production
    const parts = hostname.split('.');
    if (parts.length >= 3) {
        return parts[0];
    }
    return null;
}
const __TURBOPACK__default__export__ = MultiOrgAuthProvider;
var _c;
__turbopack_context__.k.register(_c, "MultiOrgAuthProvider");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/src/components/auth/DemoAuthHandler.tsx [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
__turbopack_context__.s({
    "DemoAuthHandler": ()=>DemoAuthHandler
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/navigation.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$loader$2d$2$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Loader2$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/loader-2.js [app-client] (ecmascript) <export default as Loader2>");
;
var _s = __turbopack_context__.k.signature();
'use client';
;
;
;
function DemoAuthHandler(param) {
    let { children } = param;
    _s();
    const pathname = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["usePathname"])();
    const [isProcessing, setIsProcessing] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [message, setMessage] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "DemoAuthHandler.useEffect": ()=>{
            // Simplified demo auth handler - just check if it's a demo route
            const isDemoRoute = pathname.startsWith('/salon') || pathname.startsWith('/icecream') || pathname.startsWith('/restaurant');
            if (isDemoRoute) {
                console.log('Demo route detected:', pathname);
            // For now, just log - the MultiOrgAuthProvider will handle the actual auth
            }
        }
    }["DemoAuthHandler.useEffect"], [
        pathname
    ]);
    // Show loading state during demo auth
    if (isProcessing) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "text-center space-y-4",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$loader$2d$2$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Loader2$3e$__["Loader2"], {
                        className: "h-8 w-8 animate-spin text-blue-600 dark:text-blue-400 mx-auto"
                    }, void 0, false, {
                        fileName: "[project]/src/components/auth/DemoAuthHandler.tsx",
                        lineNumber: 27,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "text-sm text-gray-600 dark:text-gray-400",
                        children: message || 'Loading demo...'
                    }, void 0, false, {
                        fileName: "[project]/src/components/auth/DemoAuthHandler.tsx",
                        lineNumber: 28,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/auth/DemoAuthHandler.tsx",
                lineNumber: 26,
                columnNumber: 9
            }, this)
        }, void 0, false, {
            fileName: "[project]/src/components/auth/DemoAuthHandler.tsx",
            lineNumber: 25,
            columnNumber: 7
        }, this);
    }
    // Show message briefly
    if (message && !isProcessing) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "fixed top-4 right-4 z-50 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg animate-in slide-in-from-top-2 duration-300",
                    children: message
                }, void 0, false, {
                    fileName: "[project]/src/components/auth/DemoAuthHandler.tsx",
                    lineNumber: 38,
                    columnNumber: 9
                }, this),
                children
            ]
        }, void 0, true);
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
        children: children
    }, void 0, false);
}
_s(DemoAuthHandler, "7vNtKmn9wLb54lhZ5nAO7g2sFMw=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["usePathname"]
    ];
});
_c = DemoAuthHandler;
var _c;
__turbopack_context__.k.register(_c, "DemoAuthHandler");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/src/components/ui/use-toast.tsx [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
__turbopack_context__.s({
    "ToastProvider": ()=>ToastProvider,
    "toast": ()=>toast,
    "useToast": ()=>useToast
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature(), _s1 = __turbopack_context__.k.signature();
'use client';
;
const ToastContext = /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createContext"](undefined);
function ToastProvider(param) {
    let { children } = param;
    _s();
    const [toasts, setToasts] = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"]([]);
    const toast = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"]({
        "ToastProvider.useCallback[toast]": (props)=>{
            const id = Date.now().toString();
            const newToast = {
                ...props,
                id
            };
            setToasts({
                "ToastProvider.useCallback[toast]": (prev)=>[
                        ...prev,
                        newToast
                    ]
            }["ToastProvider.useCallback[toast]"]);
            // Auto dismiss after duration (default 5 seconds)
            const duration = props.duration || 5000;
            setTimeout({
                "ToastProvider.useCallback[toast]": ()=>{
                    setToasts({
                        "ToastProvider.useCallback[toast]": (prev)=>prev.filter({
                                "ToastProvider.useCallback[toast]": (t)=>t.id !== id
                            }["ToastProvider.useCallback[toast]"])
                    }["ToastProvider.useCallback[toast]"]);
                }
            }["ToastProvider.useCallback[toast]"], duration);
        }
    }["ToastProvider.useCallback[toast]"], []);
    const dismiss = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"]({
        "ToastProvider.useCallback[dismiss]": (toastId)=>{
            setToasts({
                "ToastProvider.useCallback[dismiss]": (prev)=>{
                    if (toastId) {
                        return prev.filter({
                            "ToastProvider.useCallback[dismiss]": (t)=>t.id !== toastId
                        }["ToastProvider.useCallback[dismiss]"]);
                    }
                    return [];
                }
            }["ToastProvider.useCallback[dismiss]"]);
        }
    }["ToastProvider.useCallback[dismiss]"], []);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(ToastContext.Provider, {
        value: {
            toasts,
            toast,
            dismiss
        },
        children: [
            children,
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "fixed bottom-0 right-0 z-50 p-4 space-y-4",
                children: toasts.map((toast)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "\n              relative flex items-start gap-3 p-4 pr-8 rounded-lg shadow-lg\n              transition-all duration-300 ease-in-out transform translate-x-0\n              ".concat(toast.variant === "destructive" ? "bg-red-600 text-white" : "bg-white text-gray-900 border border-gray-200", "\n            "),
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex-1",
                                children: [
                                    toast.title && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "font-semibold",
                                        children: toast.title
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/ui/use-toast.tsx",
                                        lineNumber: 65,
                                        columnNumber: 17
                                    }, this),
                                    toast.description && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "text-sm ".concat(toast.variant === "destructive" ? "text-red-100" : "text-gray-600"),
                                        children: toast.description
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/ui/use-toast.tsx",
                                        lineNumber: 68,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/ui/use-toast.tsx",
                                lineNumber: 63,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                onClick: ()=>dismiss(toast.id),
                                className: "\n                absolute top-2 right-2 p-1 rounded-md\n                ".concat(toast.variant === "destructive" ? "hover:bg-red-700" : "hover:bg-gray-100", "\n              "),
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                    className: "w-4 h-4",
                                    fill: "none",
                                    stroke: "currentColor",
                                    viewBox: "0 0 24 24",
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                        strokeLinecap: "round",
                                        strokeLinejoin: "round",
                                        strokeWidth: 2,
                                        d: "M6 18L18 6M6 6l12 12"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/ui/use-toast.tsx",
                                        lineNumber: 89,
                                        columnNumber: 17
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/src/components/ui/use-toast.tsx",
                                    lineNumber: 83,
                                    columnNumber: 15
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/src/components/ui/use-toast.tsx",
                                lineNumber: 73,
                                columnNumber: 13
                            }, this)
                        ]
                    }, toast.id, true, {
                        fileName: "[project]/src/components/ui/use-toast.tsx",
                        lineNumber: 52,
                        columnNumber: 11
                    }, this))
            }, void 0, false, {
                fileName: "[project]/src/components/ui/use-toast.tsx",
                lineNumber: 50,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/ui/use-toast.tsx",
        lineNumber: 48,
        columnNumber: 5
    }, this);
}
_s(ToastProvider, "Dfj/Dm7hf738sfBZqVXle+2Bqxc=");
_c = ToastProvider;
function useToast() {
    _s1();
    const context = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useContext"](ToastContext);
    if (!context) {
        throw new Error("useToast must be used within a ToastProvider");
    }
    return context;
}
_s1(useToast, "b9L3QQ+jgeyIrH0NfHrJ8nn7VMU=");
const toast = (props)=>{
    // This will only work within a ToastProvider context
    // For usage outside context, consider using a global toast system
    throw new Error("toast() must be used within useToast() hook inside ToastProvider");
};
var _c;
__turbopack_context__.k.register(_c, "ToastProvider");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
}]);

//# sourceMappingURL=src_1d751644._.js.map