/**
 * Typed port of `components/datautil/get-initials.coffee`. Used by the 311 and
 * chicago ETL to derive a short category code from a complaint/crime name.
 */

/**
 * For a multi-word name, concatenate the first `len` chars of each word; for a
 * single word, take the first `len + 1` chars. Faithful to the legacy behavior.
 */
export function getInitials(name: string, len = 2): string {
  const words = name.split(' ');
  if (words.length > 1) {
    return words.map((word) => word.substring(0, len)).join('');
  }
  return name.substring(0, len + 1);
}
