/**
 * Adjusts the alpha channel of a color string (HEX or RGBA)
 * @param color - The input color string (HEX or RGBA)
 * @param alpha - The target alpha value (0-1)
 * @returns The adjusted color string
 */
export const adjustAlpha = (color: string, alpha: number): string => {
  if (!color || color.startsWith('var')) return color;
  
  if (color.startsWith('rgba')) {
    // Replace the alpha part of rgba(r, g, b, a)
    return color.replace(/[\d.]+\)$/g, `${alpha})`);
  }
  
  if (color.startsWith('#')) {
    // Handle short HEX and expand it
    const hex = color.length === 4 
      ? '#' + color[1] + color[1] + color[2] + color[2] + color[3] + color[3]
      : color;
    
    // Convert 0-1 alpha to 00-FF HEX
    const alphaHex = Math.round(alpha * 255).toString(16).padStart(2, '0');
    return `${hex}${alphaHex}`;
  }
  
  return color;
};

/**
 * Converts an RGBA color string to HEX
 */
export const rgbaToHex = (rgba: string): string => {
  const match = rgba.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d+(?:\.\d+)?))?\)$/);
  if (!match) return '#7c3aed';
  const r = parseInt(match[1]).toString(16).padStart(2, '0');
  const g = parseInt(match[2]).toString(16).padStart(2, '0');
  const b = parseInt(match[3]).toString(16).padStart(2, '0');
  return `#${r}${g}${b}`;
};

/**
 * Strips HTML tags from a TipTap HTML label string to produce plain text
 * @param html - The HTML string to strip
 * @returns Plain text content
 */
export const stripHtml = (html: string): string =>
  html.replace(/<[^>]*>/g, '').trim();
