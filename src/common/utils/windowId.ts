export function getWindowIdForInstance(pid: string, windowType: string = 'main'): string {
    return `${pid}_${windowType}`;
  }
  