import { MAX_PAST_TASKS_ARCHIVED } from "~constants";

import type { FocusState } from "./focusSlice";

/*
    Single source of truth for what happens when a pomodoro session (work or
    break) completes. Used by both the focus slice reducer and the background
    service worker so the two can never diverge.

    Mutates the given state directly (safe inside immer reducers and on plain
    objects loaded from storage in the background worker).
*/
export function applySessionCompletion(focus: FocusState): void {
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
    if (focus.sessionsCompleted >= focus.settings.sessionsUntilLongBreak) {
      focus.sessionsCompleted = 0;
    }
  }

  focus.timerStatus = "idle";
  focus.currentSessionStartTime = null;
  focus.sessionEndTime = null;
}
