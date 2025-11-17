/**
 * State Management Setup
 *
 * Zustand store configuration and middleware.
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

export interface StoreConfig {
  name: string;
  persist?: boolean;
  devtools?: boolean;
}

/**
 * Create a typed store with middleware
 */
export function createStore<T>(
  initializer: any,
  config: StoreConfig
) {
  let store = initializer;

  // Add immer for immutable updates
  store = immer(store);

  // Add persistence if requested
  if (config.persist) {
    store = persist(store, {
      name: config.name,
    });
  }

  // Add devtools in development
  if (config.devtools && __DEV__) {
    store = devtools(store, { name: config.name });
  }

  return create(store);
}

// Re-export Zustand utilities
export { useStore } from 'zustand';
export type { StateCreator } from 'zustand';
