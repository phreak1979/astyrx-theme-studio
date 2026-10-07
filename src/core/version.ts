export const SUPPORTED_RANGE_LABEL = '^0.6.5';

export type CompatStatus = 'compatible' | 'unsupported' | 'unknown';

export interface CompatInfo {
  status: CompatStatus;
  installed: string | null;
  supported: string;
  message: string;
}

function parse(v: string): [number, number, number] | null {
  const m = /^(\d+)\.(\d+)\.(\d+)/.exec(v.trim());
  return m ? [Number(m[1]), Number(m[2]), Number(m[3])] : null;
}

/** Caret range for 0.x: >=0.6.5 <0.7.0. */
export function checkCompat(installed: string | null | undefined): CompatInfo {
  const base = { installed: installed ?? null, supported: SUPPORTED_RANGE_LABEL };
  if (!installed) {
    return {
      ...base,
      status: 'unknown',
      message:
        'Astryx version could not be detected. Pass `astryxVersion` to the studio or use the Vite plugin; token data may not match.',
    };
  }
  const p = parse(installed);
  if (!p) return { ...base, status: 'unknown', message: `Unrecognised Astryx version "${installed}".` };
  const [maj, min, patch] = p;
  const ok = maj === 0 && min === 6 && patch >= 5;
  return ok
    ? { ...base, status: 'compatible', message: 'Theme Studio schema is compatible.' }
    : {
        ...base,
        status: 'unsupported',
        message: `Installed Astryx ${installed} is outside the supported range ${SUPPORTED_RANGE_LABEL}. Tokens and export syntax may be wrong.`,
      };
}

declare const __ATS_ASTRYX_VERSION__: string | undefined;

/** Version injected by the `astryx-theme-studio/vite` plugin, if present. */
export function injectedAstryxVersion(): string | null {
  try {
    return typeof __ATS_ASTRYX_VERSION__ !== 'undefined' && __ATS_ASTRYX_VERSION__
      ? __ATS_ASTRYX_VERSION__
      : null;
  } catch {
    return null;
  }
}

/**
 * Import path used by exported theme code. Keyed on the supported range so a
 * future Astryx API change gets its own entry.
 */
export function themeImportPath(_version: string | null): string {
  return '@astryxdesign/core/theme';
}
