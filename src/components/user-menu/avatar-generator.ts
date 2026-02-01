/**
 * Avatar Gradient Utility
 * Generates unique gradient colors for user avatars based on email hash.
 */

/** Theme color palette */
const THEME_COLORS = [
  "#f59e0b",
  "#f97316",
  "#ec4899",
  "#3b82f6",
  "#06b6d4",
  "#14b8a6",
  "#ef4444",
  "#f43f5e",
  "#8b5cf6",
];

/**
 * Simple hash function for strings
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

/**
 * Generates a unique gradient based on email hash
 *
 * @param email - User's email address
 * @returns CSS gradient string
 */
export function generateAvatarGradient(email: string): string {
  const hash = hashString(email.toLowerCase().trim());
  const colorCount = THEME_COLORS.length;

  // Pick two different colors based on hash
  const fromIndex = hash % colorCount;
  const toIndex = (hash + Math.floor(hash / colorCount) + 1) % colorCount;

  const from = THEME_COLORS[fromIndex];
  const to =
    THEME_COLORS[toIndex === fromIndex ? (toIndex + 1) % colorCount : toIndex];

  return `linear-gradient(135deg, ${from}, ${to})`;
}
