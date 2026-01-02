/**
 * Documentation entry point for web-interface package.
 * This file is only used for generating documentation and should not be imported in production code.
 * @module web-interface
 * @packageDocumentation
 */

/**
 * AppFlow - Main application, core application flow logic, components, hooks and utilities.
 * @group AppFlow
 */
export { default as App } from './app';
/** @group AppFlow */
export { SettingInput } from './app-flow/setting-input';
export { AppFlow } from './app-flow';
export { Statistics } from './app-flow/statistics';
export { default as useAppFlow } from './app-flow/hooks';
export { getModifiedButtons, toPercents } from './app-flow/helpers';
export { millisecondsToStr } from './app-flow/statistics/helpers';

/**
 * SplashScreen - Initial application interface and help system.
 * @group SplashScreen
 */
export { default as SplashScreen } from './splash-screen/component';

/**
 * Shared - Reusable UI components and utilities.
 * @group Shared
 */
export { ButtonGroup } from './shared';
export { SharedDrawer } from './shared';
export { useResize } from './shared/hooks';

/**
 * Assets - Icons and visual components.
 * @group Assets
 */
export { default as Logo } from './assets/logo';
export { default as CheckIcon } from './assets/check';
export { default as StartIcon } from './assets/start';

// Types and enums
export type { AppFlowProps } from './app-flow/types';
export type { SettingInputProps, InputProps } from './app-flow/setting-input/types';
export type { StatisticsProps } from './app-flow/statistics/types';
export type { SplashScreenProps } from './splash-screen/types';
export type { ButtonGroupProps } from './shared/button-group/types';
export { BUTTON_ACTION, FADE_STATUS } from './types';
export { INPUT_TYPE, SETTING_ID } from './app-flow/types';