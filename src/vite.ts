import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';

/**
 * Vite plugin that tells the studio which `@astryxdesign/core` version is installed.
 * Astryx does not export its package.json, so we locate it on disk from the resolved entry.
 */
export function astryxThemeStudio(): { name: string; config: () => { define: Record<string, string> } } {
  let version: string | null = null;
  try {
    const require = createRequire(join(process.cwd(), 'package.json'));
    let dir = dirname(require.resolve('@astryxdesign/core'));
    for (let i = 0; i < 6; i++) {
      try {
        const pkg = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8')) as { name?: string; version?: string };
        if (pkg.name === '@astryxdesign/core') {
          version = pkg.version ?? null;
          break;
        }
      } catch {
        /* keep walking up */
      }
      dir = dirname(dir);
    }
  } catch {
    /* version stays unknown; the studio will say so */
  }
  return {
    name: 'astryx-theme-studio:version',
    config: () => ({ define: { __ATS_ASTRYX_VERSION__: JSON.stringify(version) } }),
  };
}
