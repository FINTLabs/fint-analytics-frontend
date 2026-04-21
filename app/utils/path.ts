export function formatPath(path?: string | null): string {
  if (!path) return "-";

  try {
    return decodeURIComponent(path);
  } catch {
    return path;
  }
}
