const SMARTCODE_RE = /^([A-Z0-9]+)(\.[A-Z0-9]+){3,}\.(v|V)\d+$/;

export function isValidSmartCode(code: string) {
  return SMARTCODE_RE.test(code);
}

export function assertSmartCode(code: string, ctx: string) {
  if (!isValidSmartCode(code)) {
    throw new Error(`Invalid SmartCode (${ctx}): ${code}`);
  }
}