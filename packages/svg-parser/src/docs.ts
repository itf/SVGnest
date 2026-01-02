/**
 * Documentation entry point for svg-parser package.
 * This file is only used for generating documentation and should not be imported in production code.
 * @module svg-parser
 * @packageDocumentation
 */

// Public API
export { default as SVGParser } from './svg-parser';

// Internal classes (documented but not part of public API)
export { default as BasicElementBuilder } from './basic-element-builder';
export { default as BasicShapeBuilder } from './shape-builders/basic-shape-builder';
export { default as Matrix } from './format-svg/matrix';

// Shape builders
export { default as ShapeCircleBuilder } from './shape-builders/circle-builder';
export { default as ShapeEllipseBuilder } from './shape-builders/ellipse-builder';
export { default as ShapeRectBuilder } from './shape-builders/rect-builder';
export { default as ShapePolygonBuilder } from './shape-builders/polygon-builder';
export { default as ShapePathBuilder } from './shape-builders/path-builder/path-builder';

// Transform builders
export { default as BasicTransformBuilder } from './format-svg/transform-builders/basic-transform-builder';
export { default as TransformPathBuilder } from './format-svg/transform-builders/path-builder';
export { default as TransformCircleBuilder } from './format-svg/transform-builders/circle-builder';
export { default as TransformEllipseBuilder } from './format-svg/transform-builders/ellipse-builder';
export { default as TransformLineBuilder } from './format-svg/transform-builders/line-builder';
export { default as TransformRectBuilder } from './format-svg/transform-builders/rect-builder';
export { default as TransformPolygonBuilder } from './format-svg/transform-builders/polygon-builder';

// Segment builders for curve linearization
export { default as BasicSegment } from './shape-builders/path-builder/segments/basic-segment';
export { default as CubicSegment } from './shape-builders/path-builder/segments/cubic-segment';
export { default as QuadraticSegment } from './shape-builders/path-builder/segments/quadratic-segment';
export { default as ArcSegment } from './shape-builders/path-builder/segments/arc-segment';

// Types and enums
export * from './types';

// Helper functions
export * from './helpers';

