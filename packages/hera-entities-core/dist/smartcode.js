const SMARTCODE_RE = /^([A-Z0-9]+)(\.[A-Z0-9]+){3,}\.(v|V)\d+$/;
export function isValidSmartCode(code) {
    return SMARTCODE_RE.test(code);
}
export function assertSmartCode(code, ctx) {
    if (!isValidSmartCode(code)) {
        throw new Error(`Invalid SmartCode (${ctx}): ${code}`);
    }
}
