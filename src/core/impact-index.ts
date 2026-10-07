/** Development-only record of how many consumers each token had on each route. Never exported. */
export class ImpactIndex {
  private data = new Map<string, Map<string, number>>();
  private listeners = new Set<() => void>();
  private snap: Record<string, Record<string, number>> = {};

  subscribe = (fn: () => void) => {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  };

  getSnapshot = () => this.snap;

  record(token: string, route: string, count: number): void {
    let m = this.data.get(token);
    if (!m) this.data.set(token, (m = new Map()));
    if (m.get(route) === count) return;
    m.set(route, count);
    this.snap = Object.fromEntries([...this.data].map(([t, r]) => [t, Object.fromEntries(r)]));
    for (const l of [...this.listeners]) l();
  }

  routesFor(token: string): { route: string; count: number }[] {
    return [...(this.data.get(token) ?? [])].map(([route, count]) => ({ route, count })).sort((a, b) => b.count - a.count || a.route.localeCompare(b.route));
  }

  totalFor(token: string): number {
    return this.routesFor(token).reduce((n, r) => n + r.count, 0);
  }

  clear(): void {
    this.data.clear();
    this.snap = {};
    for (const l of [...this.listeners]) l();
  }
}

export function currentRoute(loc: Location = location): string {
  return loc.pathname + (loc.hash.startsWith('#/') ? loc.hash : '');
}
