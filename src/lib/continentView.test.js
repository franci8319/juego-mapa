import { describe, expect, it } from 'vitest';
import { getContinentView } from './continentView.js';

describe('getContinentView', () => {
  it('centers Europa roughly over central Europe with a zoomed-in view', () => {
    const { center, zoom } = getContinentView('europa');
    expect(center[0]).toBeGreaterThan(5);
    expect(center[0]).toBeLessThan(25);
    expect(center[1]).toBeGreaterThan(45);
    expect(center[1]).toBeLessThan(60);
    expect(zoom).toBeGreaterThan(1.2);
  });

  it('centers Oceanía between New Zealand and Australia', () => {
    const { center } = getContinentView('oceania');
    expect(center[0]).toBeGreaterThan(140);
    expect(center[1]).toBeLessThan(-20);
  });

  it('returns a default world view for an unknown continent id', () => {
    expect(getContinentView('atlantida')).toEqual({ center: [0, 0], zoom: 1 });
  });

  it('always returns a zoom within the configured bounds for every real continent', () => {
    for (const id of ['america', 'europa', 'africa', 'asia', 'oceania']) {
      const { zoom } = getContinentView(id);
      expect(zoom).toBeGreaterThanOrEqual(1.2);
      expect(zoom).toBeLessThanOrEqual(6);
    }
  });
});
