/**
 * Documentation entry point for web-interface package.
 * This file is only used for generating documentation and should not be imported in production code.
 * @module web-interface
 * @packageDocumentation
 */

// Main application components
export { default as App } from './app';

/**
 * App Flow components - Main application interface for SVG nesting.
 * @group App Flow
 */
export { AppFlow } from './app-flow';
export { SettingInput } from './app-flow/setting-input';
export { Statistics } from './app-flow/statistics';

/**
 * Splash Screen components - Initial application interface.
 * @group Splash Screen
 */
export { SplashScreen } from './splash-screen';

/**
 * Shared components - Reusable UI components.
 * @group Shared Components
 */
export { ButtonGroup } from './shared';
export { SharedDrawer } from './shared';

/**
 * Assets - Icons and visual components.
 * @group Assets
 */
export { default as Logo } from './assets/logo';
export { default as CheckIcon } from './assets/check';
export { default as StartIcon } from './assets/start';

// Types and enums
export * from './types';