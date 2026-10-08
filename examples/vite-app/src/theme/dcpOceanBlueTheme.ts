/**
 * DCP Ocean Blue: Astryx theme for DCP Studio.
 * Palette: Deep Space Blue #0E354F, Air Force Blue #5490B8, Charcoal Blue #323949.
 * Requires the Inter font (see README: "DCP Ocean Blue theme").
 *
 * Copy this single file into your app and pass it to <Theme theme={dcpOceanBlueTheme}>.
 */
import { defineTheme } from '@astryxdesign/core/theme';

const DEEP_SPACE = '#0E354F';
const AIR_FORCE = '#5490B8';
const CHARCOAL = '#323949';

/**
 * Factory so nested <Theme> regions can use a separately named copy. Astryx injects unbuilt themes
 * by name, and a nested region sharing the app theme's name would remove the app's styles when it
 * unmounts. (Not needed once the theme is pre-built with `astryx theme build`.)
 */
function createDcpOceanBlueTheme(name: string) {
  return defineTheme({
    name,

    // App chrome (sidebar, top bar): Deep Space Blue in light mode, darker navy in dark mode.
    // Consume as `background: var(--dcp-chrome-background)` on an element OUTSIDE any forced-dark
    // nested <Theme>, so the light/dark pair resolves against the app's mode.
    localTokens: {
      '--dcp-chrome-background': [DEEP_SPACE, '#051C2B'],
      // Dark shadow in light mode, soft white glow in dark mode (light-dark() only works inside colours).
      '--dcp-chrome-shadow': '0 2px 10px light-dark(rgb(14 53 79 / 35%), rgb(255 255 255 / 14%))',
    },

    typography: {
      scale: { base: 14, ratio: 1.2 },
      body: {
        family: 'Inter Variable',
        fallbacks: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      },
      heading: {
        family: 'Inter Variable',
        fallbacks: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
        weights: { 3: 'bold', 4: 'bold' },
      },
    },

    tokens: {
      // Surfaces: [light, dark]
      '--color-background-body': ['#F5F8FD', '#161E26'],
      '--color-background-surface': ['#FFFFFF', '#1B2530'],
      '--color-background-card': ['#FFFFFF', '#1B2530'],
      '--color-background-popover': ['#FFFFFF', CHARCOAL],
      '--color-background-muted': ['#F1F7FB', '#222C37'],

      // Brand
      '--color-accent': [AIR_FORCE, AIR_FORCE],
      '--color-accent-muted': ['#EBF3FE', '#13284B'], // also the info alert tint
      '--color-neutral': [`${DEEP_SPACE}24`, '#FFFFFF1A'],

      // Text
      '--color-text-primary': ['#0F2233', '#F2F6FA'],
      '--color-text-secondary': ['#51647A', '#A7B4C2'],
      '--color-text-disabled': ['#9AA9B8', '#5F6E7E'],
      '--color-text-accent': ['#1F6A9A', '#7DB4DA'],
      '--color-on-accent': ['#FFFFFF', '#FFFFFF'],

      // Icons
      '--color-icon-accent': ['#2F7DB0', '#7DB4DA'],
      '--color-icon-primary': ['#0F2233', '#F2F6FA'],
      '--color-icon-secondary': ['#6B7E92', '#A7B4C2'],

      // Borders
      '--color-border': ['#E1E9F1', '#2C3846'],
      '--color-border-emphasized': ['#C9D6E3', CHARCOAL],

      // Status fills, shared by Banner and Badge (alert panel: info, warning, success, error)
      '--color-success': ['#12915E', '#35C48A'],
      '--color-warning': ['#D99A06', '#F2B93B'],
      '--color-error': ['#D93A4A', '#F0606E'],
      '--color-success-muted': ['#E2F8EE', '#094030'],
      '--color-warning-muted': ['#FEF7E6', '#463D26'],
      '--color-error-muted': ['#FEE7E9', '#44121E'],

      // Status colour families used by Badge variants (status pills in the programmes table)
      '--color-background-blue': ['#DEF0FE', '#16344F'],
      '--color-text-blue': ['#1D5F9A', '#8DC4EE'],
      '--color-border-blue': ['#B6D6F2', '#245A86'],
      '--color-icon-blue': ['#2F7DB0', '#7DB4DA'],
      '--color-background-green': ['#DBF5EB', '#173631'],
      '--color-text-green': ['#0F7A4F', '#6EDDA6'],
      '--color-border-green': ['#A9E4CC', '#1F6A55'],
      '--color-icon-green': ['#12915E', '#6EDDA6'],
      '--color-background-yellow': ['#FEEEC4', '#3E341D'],
      '--color-text-yellow': ['#8A5A00', '#F2C45E'],
      '--color-border-yellow': ['#F5D88A', '#6B5A2A'],
      '--color-icon-yellow': ['#C58800', '#F2B93B'],
      '--color-background-red': ['#FEE4E7', '#3F2124'],
      '--color-text-red': ['#B3202F', '#FF8C99'],
      '--color-border-red': ['#F6B7BE', '#7A2F38'],
      '--color-icon-red': ['#D93A4A', '#F0606E'],

      // Shape
      '--radius-none': '0px',
      '--radius-inner': '0.375rem',
      '--radius-element': '0.5rem',
      '--radius-container': '0.5rem',
      '--radius-page': '1rem',
      '--radius-full': '9999px',

      // Elevation
      '--shadow-low': '0 1px 2px light-dark(oklch(0.3 0.05 240 / 8%), oklch(0 0 0 / 30%)), 0 2px 6px light-dark(oklch(0.3 0.05 240 / 6%), oklch(0 0 0 / 30%))',
      '--shadow-med': '0 2px 4px light-dark(oklch(0.3 0.05 240 / 8%), oklch(0 0 0 / 40%)), 0 6px 14px light-dark(oklch(0.3 0.05 240 / 10%), oklch(0 0 0 / 45%))',
    },

    components: {
      // Alerts: tint from the status muted token, text/icon from the status family.
      banner: {
        'status:info': {
          '--color-text-primary': 'var(--color-text-blue)',
          '--color-text-secondary': 'var(--color-text-blue)',
          '--color-accent': 'var(--color-text-blue)',
        },
        'status:success': {
          '--color-text-primary': 'var(--color-text-green)',
          '--color-text-secondary': 'var(--color-text-green)',
          '--color-success': 'var(--color-text-green)',
        },
        'status:warning': {
          '--color-text-primary': 'var(--color-text-yellow)',
          '--color-text-secondary': 'var(--color-text-yellow)',
          '--color-warning': 'var(--color-text-yellow)',
        },
        'status:error': {
          '--color-text-primary': 'var(--color-text-red)',
          '--color-text-secondary': 'var(--color-text-red)',
          '--color-error': 'var(--color-text-red)',
        },
      },

      badge: {
        'variant:info': { backgroundColor: 'var(--color-background-blue)', color: 'var(--color-text-blue)' },
        'variant:success': { backgroundColor: 'var(--color-background-green)', color: 'var(--color-text-green)' },
        'variant:warning': { backgroundColor: 'var(--color-background-yellow)', color: 'var(--color-text-yellow)' },
        'variant:error': { backgroundColor: 'var(--color-background-red)', color: 'var(--color-text-red)' },
      },
    },
  });
}

export const dcpOceanBlueTheme = createDcpOceanBlueTheme('dcp-ocean-blue');

/** Use for nested <Theme mode="..."> regions inside an app themed with dcpOceanBlueTheme. */
export const dcpOceanBlueRegionTheme = createDcpOceanBlueTheme('dcp-ocean-blue-region');
