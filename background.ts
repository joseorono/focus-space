import { Storage } from "@plasmohq/storage";

import {
  BACKGROUND_TIMER_PERSIST_INTERVAL_MS,
  MAX_PAST_TASKS_ARCHIVED
} from "~constants";
import type { FocusState } from "~store/features/focus/focusSlice";

export {};

interface ReduxState {
  focus: FocusState;
  [key: string]: any;
}

console.log("Background Worker Active. You can now use the extension");

const storage = new Storage();
let timerInterval: NodeJS.Timeout | null = null;

// Background timer that persists when popup is closed
async function startBackgroundTimer() {
  // Note: Caller should clear any existing interval before calling this
  let persistTickCount = 0;
  const persistIntervalTicks = Math.max(
    1,
    Math.floor(BACKGROUND_TIMER_PERSIST_INTERVAL_MS / 1000)
  );

  timerInterval = setInterval(async () => {
    try {
      const state = (await storage.get("reduxState")) as ReduxState | null;
      if (!state || !state.focus) return;

      const focus = state.focus;

      // Only tick if timer is running and time remaining
      if (focus.timerStatus === "running" && focus.timeRemaining > 0) {
        // Decrement time, ensuring it never goes below zero
        const newTimeRemaining = Math.max(0, focus.timeRemaining - 1);
        focus.timeRemaining = newTimeRemaining;

        // Check if session completed (reached zero)
        if (newTimeRemaining === 0) {
          await handleSessionComplete(state);
        } else {
          persistTickCount += 1;
          // Persist timer state periodically instead of every second
          // to avoid Chrome Storage Sync write quota errors
          if (persistTickCount % persistIntervalTicks === 0) {
            await storage.set("reduxState", state);
          }
        }
      }
      // Note: Don't auto-stop the interval here, let the storage watcher handle it
      // This prevents the timer from freezing after session completion
    } catch (error) {
      console.error("Timer error:", error);
    }
  }, 1000);
}

async function handleSessionComplete(state: ReduxState) {
  const focus = state.focus;

  // Complete the session
  if (focus.timerMode === "work") {
    // Increment pomodoros taken for the current task
    const currentTask = focus.tasks[focus.currentTaskIndex];
    if (currentTask && !currentTask.completed) {
      currentTask.pomsTaken += 1;

      // Mark task as completed if it reached the expected pomodoros
      if (currentTask.pomsTaken >= currentTask.pomsExpected) {
        currentTask.completed = true;
        currentTask.completedAt = Date.now();

        // Move to past tasks
        focus.pastTasks.unshift(currentTask);
        focus.tasks.splice(focus.currentTaskIndex, 1);

        // Adjust current task index
        if (focus.currentTaskIndex >= focus.tasks.length) {
          focus.currentTaskIndex = Math.max(0, focus.tasks.length - 1);
        }

        // Limit past tasks to prevent unlimited growth
        if (focus.pastTasks.length > MAX_PAST_TASKS_ARCHIVED) {
          focus.pastTasks.pop();
        }
      }
    }

    // Increment sessions completed
    focus.sessionsCompleted += 1;
    const shouldTakeLongBreak =
      focus.sessionsCompleted % focus.settings.sessionsUntilLongBreak === 0;
    focus.timerMode = shouldTakeLongBreak ? "longBreak" : "shortBreak";
    focus.timeRemaining = shouldTakeLongBreak
      ? focus.settings.longBreakDuration
      : focus.settings.shortBreakDuration;
  } else {
    // Completing a break (short or long)
    focus.timerMode = "work";
    focus.timeRemaining = focus.settings.workDuration;

    // Reset sessions counter after completing a long break
    // This ensures the counter cycles: 1/4, 2/4, 3/4, 4/4, then back to 0/4
    if (
      focus.timerMode === "work" &&
      focus.sessionsCompleted >= focus.settings.sessionsUntilLongBreak
    ) {
      focus.sessionsCompleted = 0;
    }
  }

  focus.timerStatus = "idle";
  focus.currentSessionStartTime = null;

  // Save state
  await storage.set("reduxState", state);

  // Send notification
  const nextMode = focus.timerMode === "work" ? "work" : "break";
  const message =
    nextMode === "work"
      ? " Break complete! Ready for another Deep Work session?"
      : " Session complete! Time for a well-deserved break.";

  chrome.notifications.create({
    type: "basic",
    iconUrl: chrome.runtime.getURL("icon.png"),
    title: "FocusSpace",
    message: message,
    priority: 2
  });
}

// Watch for storage changes to start/stop timer
storage.watch({
  reduxState: (change) => {
    const timerStatus = change.newValue?.focus?.timerStatus;
    const oldTimerStatus = change.oldValue?.focus?.timerStatus;

    // Start timer if status changed to running
    if (timerStatus === "running" && oldTimerStatus !== "running") {
      console.log("Starting background timer from storage watch");
      if (timerInterval) {
        clearInterval(timerInterval);
      }
      startBackgroundTimer();
    } else if (timerStatus !== "running" && timerInterval) {
      console.log("Stopping background timer from storage watch");
      clearInterval(timerInterval);
      timerInterval = null;
    }
  }
});

// Initialize timer on startup if it was running
(async () => {
  const state = (await storage.get("reduxState")) as ReduxState | null;
  if (state?.focus?.timerStatus === "running") {
    console.log("Initializing timer on startup");
    startBackgroundTimer();
  }
})();

chrome.runtime.onInstalled.addListener(({ reason }) => {
  if (reason === "install") {
    chrome.tabs.create({ url: "static/onboarding.html" });
  }
});
