export function formatCrumbSegment(segment: string): string {
  return segment.replace(/_/g, " ").replace(/(?:^|\s)\w/g, (c) => c.toUpperCase());
}
