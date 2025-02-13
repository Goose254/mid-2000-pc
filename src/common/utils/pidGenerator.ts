let instanceCount = 0;

export function generatePid(appId: string): string {
  instanceCount++;
  return `${appId}-${instanceCount}`;
}
