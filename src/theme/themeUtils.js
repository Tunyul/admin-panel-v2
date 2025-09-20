import { mergeTokens } from './themes';

// Apply a tokens object to a root element (documentElement or a provided element)
export function applyTokens(tokens = {}, { el = document.documentElement } = {}) {
  if (!el || typeof el.style === 'undefined') return;
  Object.entries(tokens).forEach(([key, value]) => {
    try {
      el.style.setProperty(key, value);
    } catch {
      // ignore
    }
  });
}

// Apply tokens to the light (root) and dark (html.dark) scopes.
export function applyTheme({ light = {}, dark = {}, overrides = {} } = {}) {
  // Apply merged light tokens to :root
  const mergedLight = mergeTokens(light, overrides.light || {});
  applyTokens(mergedLight, { el: document.documentElement });

  // Apply merged dark tokens to the .dark class (create a style tag for dark vars)
  const styleId = 'theme-dark-vars';
  let styleEl = document.getElementById(styleId);
  const mergedDark = mergeTokens(dark, overrides.dark || {});
  const cssBody = Object.entries(mergedDark)
    .map(([k, v]) => `  ${k}: ${v};`)
    .join('\n');

  const css = `.dark {\n${cssBody}\n}`;

  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = styleId;
    document.head.appendChild(styleEl);
  }
  styleEl.innerHTML = css;
}

// Update a single token at runtime for the current theme scope (root or .dark)
export function updateToken(key, value, { target = 'root' } = {}) {
  if (target === 'root') {
    document.documentElement.style.setProperty(key, value);
    return;
  }
  // For dark target, update the style element produced by applyTheme
  const styleEl = document.getElementById('theme-dark-vars');
  if (!styleEl) return;
  // naive replace or append
  const regex = new RegExp(`(${key}:)([^;]+);`);
  if (regex.test(styleEl.innerHTML)) {
    styleEl.innerHTML = styleEl.innerHTML.replace(regex, `${key}: ${value};`);
  } else {
    // append before closing }
    styleEl.innerHTML = styleEl.innerHTML.replace(/\}\s*$/, `  ${key}: ${value};\n}`);
  }
}
