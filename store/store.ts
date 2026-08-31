import { configureStore } from "@reduxjs/toolkit";

import { Storage } from "@plasmohq/storage";

import { REDUX_STORAGE_DEBOUNCE_MS } from "~constants";

import counterReducer, {
  initializeFromStorage as initializeCounter
} from "./features/counter/counterSlice";
import focusReducer, {
  initializeFromStorage as initializeFocus,
  switchMode
} from "./features/focus/focusSlice";
import settingsReducer, {
  initializeFromStorage as initializeSettings
} from "./features/settings/settingsSlice";

// Configure store
export const store = configureStore({
  reducer: {
    counter: counterReducer,
    settings: settingsReducer,
    focus: focusReducer
  }
});

// Set up storage to sync state between browser contexts
const storage = new Storage();

let debounceTimer: ReturnType<typeof setTimeout> | null = null;

// Subscribe to Redux store changes and save to storage.
// Writes are debounced to avoid exceeding Chrome Storage Sync's
// MAX_WRITE_OPERATIONS_PER_MINUTE quota during rapid state changes.
store.subscribe(() => {
  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }

  debounceTimer = setTimeout(() => {
    const state = store.getState();
    storage.set("reduxState", state);
    debounceTimer = null;
  }, REDUX_STORAGE_DEBOUNCE_MS);
});

// Load state from storage on startup
async function loadStateFromStorage() {
  try {
    const savedState = await storage.get("reduxState");
    if (savedState) {
      // Dispatch actions to initialize each slice with saved state
      const reduxState = savedState as unknown as Record<string, unknown>;
      store.dispatch(initializeCounter(reduxState));
      store.dispatch(initializeSettings(reduxState));
      store.dispatch(initializeFocus(reduxState));

      const focusState = store.getState().focus;
      if (focusState.timerStatus !== "running") {
        store.dispatch(switchMode("work"));
      }
    }
  } catch (error) {
    console.error("Failed to load state from storage:", error);
  }
}

// Load state when the extension starts
loadStateFromStorage();

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch;
