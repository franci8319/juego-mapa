import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

afterEach(() => {
  cleanup();
});

// jsdom (as of 25.x) does not implement the SVG `viewBox` IDL attribute
// (SVGAnimatedRect) — `getAttribute('viewBox')` works, but `svgEl.viewBox`
// is `undefined`. react-simple-maps' <ComposableMap> renders an <svg
// viewBox="..."> and its <ZoomableGroup>, when given a non-default
// `center`/`zoom`, imperatively calls d3-zoom's `zoom.transform` on mount
// to recenter. d3-zoom's `defaultExtent()` reads `svgEl.viewBox.baseVal`,
// which throws "Cannot read properties of undefined (reading 'baseVal')"
// under jsdom. Real browsers implement `viewBox` fully, so this is a test
// environment gap, not a bug in the app. Polyfill just enough of the IDL
// attribute (derived from the already-working `viewBox` content attribute)
// for d3-zoom's read to succeed.
if (typeof SVGElement !== 'undefined' && !Object.getOwnPropertyDescriptor(SVGElement.prototype, 'viewBox')) {
  Object.defineProperty(SVGElement.prototype, 'viewBox', {
    configurable: true,
    get() {
      const [x, y, width, height] = (this.getAttribute('viewBox') || '0 0 0 0').split(/\s+/).map(Number);
      return { baseVal: { x, y, width, height } };
    },
  });
}
