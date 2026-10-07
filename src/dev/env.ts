/**
 * Primary protection is the host's `if (import.meta.env.DEV) import(...)`.
 * This is the defence-in-depth check inside the package. Optional chaining keeps it from
 * throwing in bundlers that do not define `import.meta.env`.
 */
export function isDevEnvironment(): boolean {
  try {
    return (import.meta as unknown as { env?: { DEV?: boolean } }).env?.DEV === true;
  } catch {
    return false;
  }
}
