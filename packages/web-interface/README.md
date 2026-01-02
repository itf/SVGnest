# web-interface

React-based user interface for SVGnest polygon packing application.

## Overview

This package provides the web UI for uploading SVG files, configuring nesting parameters, running the packing algorithm, and
visualizing results.

## Features

-   SVG file upload and preview
-   Interactive nesting configuration
-   Real-time progress tracking
-   Result visualization
-   Multi-language support (i18next)
-   Responsive design with SCSS styling

## Build

```bash
npm run build
```

Outputs:

-   `dist/web-interface.js` - Minified UMD bundle (220KB)
-   `dist/style.css` - Extracted styles (6.8KB)

## Development

```bash
npm run watch
```

Starts Vite dev server with hot module replacement for fast development.

## Dependencies

-   React 18
-   react-i18next for internationalization
-   polygon-packer for nesting operations
-   svg-parser for SVG handling
