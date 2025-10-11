// No-op guard for relative import resolution
export default async function guard() {
  return true;
}

export const demoGuard = guard;
export { guard };