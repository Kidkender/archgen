export function getNameError(name: string): string | null {
  if (!name || name.trim() === "") return "name cannot be empty";
  if (name.length > 214) return "name too long (max 214 chars)";
  if (/^[.\-_]/.test(name)) return "cannot start with . - _";
  if (!/^[a-z0-9-_]+$/.test(name)) return "only lowercase letters, numbers, - and _ allowed";
  return null;
}
