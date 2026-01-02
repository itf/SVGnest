# svg-parser

SVG parsing and polygon extraction library.

## Overview

This package parses SVG files and extracts geometric shapes (paths, circles, ellipses, polygons, rectangles) into polygon
representations suitable for nesting operations.

## Features

-   Parse SVG elements into polygon data
-   Support for basic shapes (circle, ellipse, rect, polygon, polyline)
-   Path parsing and conversion to polygons
-   Transform matrix support (translate, scale, rotate)
-   SVG formatting and output

## Build

```bash
npm run build
```

Outputs:

-   `dist/svg-parser.js` - UMD bundle (47KB minified)

## Supported SVG Elements

-   `<circle>`
-   `<ellipse>`
-   `<rect>`
-   `<polygon>`
-   `<polyline>`
-   `<path>` (with command parsing)
-   `<line>`
