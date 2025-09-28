// Central theme token definitions for light and dark themes.
// Each token maps to a CSS variable name and a value.
export const baseTokens = {
  '--bg': '#fbf9f7',
  '--panel': '#ffffff',
  '--main-card-bg': 'var(--panel)',
  '--text': '#0b2135',
  '--muted': '#576a7a',
  '--accent': '#3b82f6',
  '--accent-2': '#ffd166',
  '--accent-rgb': '59,130,246',
  '--accent-2-rgb': '255,209,102',
  '--status-success': '#34d399',
  '--status-warning': '#fbbf24',
  '--status-error': '#ef4444',
  '--text-rgb': '11,33,53',
  '--border-rgb': '230,238,246',
  '--bg-rgb': '251,249,247',
  '--border': '#e6eef6',
  '--input-bg': '#ffffff',
  '--placeholder': '#9fb0bd',
  '--icon': '#2b3b46',
  '--gradient': 'linear-gradient(90deg, #fff8ec 0%, #eef6ff 100%)',
  '--button-text': '#081423',
  '--header-bg': 'rgba(var(--bg-rgb),0.06)',
  '--font-primary': "Inter, Poppins, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial",
};

export const darkTokens = {
  '--bg': '#0f1724',
  '--panel': '#0f1724',
  '--main-card-bg': '#0f1724',
  '--text': '#e6eef8',
  '--muted': '#93a3c0',
  '--accent': '#60a5fa',
  '--accent-2': '#fde047',
  '--status-success': '#34d399',
  '--status-warning': '#fbbf24',
  '--status-error': '#ef4444',
  '--border': '#374151',
  '--text-rgb': '230,238,248',
  '--border-rgb': '55,65,81',
  '--bg-rgb': '15,23,36',
  '--input-bg': '#232946',
  '--placeholder': '#9aa6bf',
  '--icon': '#cbd5e1',
  '--gradient': 'linear-gradient(90deg, rgba(var(--bg-rgb),0.06) 0%, rgba(var(--accent-rgb),0.06) 100%)',
  '--button-text': '#0b1220',
  '--header-bg': 'rgba(var(--bg-rgb),0.06)',
  '--font-primary': "Inter, Poppins, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial",
};

export const lightTokens = baseTokens;

export function mergeTokens(base = {}, overrides = {}) {
  return Object.assign({}, base, overrides);
}
