import fs from 'fs';
import path from 'path';
import {
  APP_AUDIT_ROUTE_NAMES,
  SCREEN_INVENTORY,
  getCoverageSummary,
  getRoutesByStack,
  getScreenInventory,
} from '../screen-inventory';

describe('review/screen-inventory', () => {
  it('covers every declared audit route without gaps', () => {
    const inventory = getScreenInventory();
    expect(inventory).toHaveLength(APP_AUDIT_ROUTE_NAMES.length);

    for (const route of APP_AUDIT_ROUTE_NAMES) {
      expect(SCREEN_INVENTORY[route]).toBeDefined();
    }
  });

  it('resolves inventory file paths that exist on disk', () => {
    const projectRoot = process.cwd();

    for (const entry of getScreenInventory()) {
      const fullPath = path.resolve(projectRoot, entry.filePath);
      expect(fs.existsSync(fullPath)).toBe(true);
    }
  });

  it('returns expected stack coverage summary', () => {
    const summary = getCoverageSummary();

    expect(summary.totalRoutes).toBe(31);
    expect(summary.byStack.Root).toBe(1);
    expect(summary.byStack.Auth).toBe(3);
    expect(summary.byStack.Home).toBe(12);
    expect(summary.byStack.Journal).toBe(2);
    expect(summary.byStack.Steps).toBe(3);
    expect(summary.byStack.Meetings).toBe(3);
    expect(summary.byStack.Profile).toBe(7);
    expect(summary.byStatus.active).toBe(31);
    expect(summary.byStatus['typed-only']).toBe(0);
    expect(summary.byRiskLevel['safety-critical']).toBe(4);
  });

  it('returns route slices by stack', () => {
    const homeRoutes = getRoutesByStack('Home').map((route) => route.route);
    expect(homeRoutes).toContain('Emergency');
    expect(homeRoutes).toContain('HomeMain');
    expect(homeRoutes).toContain('CompanionChat');
  });
});
