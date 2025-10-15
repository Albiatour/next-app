export const THEMES = {
  sarrasin: {
    brand: '#7f4f24',
    brandContrast: '#FFFFFF',
    surface: '#FFFFFF',
    text: '#111111',
    accent: '#f5e9dd',
  },
  bistro: {
    brand: '#4f000b',
    brandContrast: '#FFFFFF',
    surface: '#FFFFFF',
    text: '#111111',
    accent: '#f2dada',
  },
};

export const DEFAULT_THEME = {
  brand: '#111111',
  brandContrast: '#FFFFFF',
  surface: '#FFFFFF',
  text: '#111111',
  accent: '#f3f3f3',
};

export function getThemeFor(slug) {
  return THEMES[slug] ?? DEFAULT_THEME;
}

