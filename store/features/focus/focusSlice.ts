import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

import {
  DEFAULT_LONG_BREAK_MINUTES,
  DEFAULT_SESSIONS_UNTIL_LONG_BREAK,
  DEFAULT_SHORT_BREAK_MINUTES,
  DEFAULT_WORK_MINUTES,
  MAX_PAST_TASKS_ARCHIVED
} from "~constants";
import type { TimerMode, TimerStatus, ToDoTask } from "~types/focus";

import { applySessionCompletion } from "./session-completion";

export interface FocusState {
  timerMode: TimerMode;
  timerStatus: TimerStatus;
  timeRemaining: number;
  sessionsCompleted: number;
  currentSessionStartTime: number | null;
  // Epoch ms when the running session completes. This timestamp (not a
  // per-second counter) is the source of truth while the timer runs, so the
  // countdown survives service worker suspension and popup closes.
  sessionEndTime: number | null;
  currentTaskIndex: number;
  tasks: ToDoTask[];
  pastTasks: ToDoTask[];
  settings: {
    workDuration: number;
    shortBreakDuration: number;
    longBreakDuration: number;
    sessionsUntilLongBreak: number;
  };
}

const initialState: FocusState = {
  timerMode: "work",
  timerStatus: "idle",
  timeRemaining: 25 * 60,
  sessionsCompleted: 0,
  currentSessionStartTime: null,
  sessionEndTime: null,
  currentTaskIndex: 0,
  tasks: [],
  pastTasks: [],
  settings: {
    workDuration: DEFAULT_WORK_MINUTES * 60,
    shortBreakDuration: DEFAULT_SHORT_BREAK_MINUTES * 60,
    longBreakDuration: DEFAULT_LONG_BREAK_MINUTES * 60,
    sessionsUntilLongBreak: DEFAULT_SESSIONS_UNTIL_LONG_BREAK
  }
};

export const focusSlice = createSlice({
  name: "focus",
  initialState,
  reducers: {
    initializeFromStorage: (
      state,
      action: PayloadAction<{ focus?: Partial<FocusState> }>
    ) => {
      if (action.payload?.focus) {
        const savedFocus = action.payload.focus;
        if (savedFocus.tasks !== undefined) {
          if (savedFocus.tasks.length === 0 && state.tasks.length > 0) {
            // Keep the initial mock tasks
          } else {
            state.tasks = savedFocus.tasks;
          }
        }
        if (savedFocus.sessionsCompleted !== undefined) {
          state.sessionsCompleted = savedFocus.sessionsCompleted;
        }
        if (savedFocus.settings) {
          state.settings = { ...state.settings, ...savedFocus.settings };
        }
        if (savedFocus.timerStatus !== undefined) {
          state.timerStatus = savedFocus.timerStatus;
        }
        if (savedFocus.timerMode !== undefined) {
          state.timerMode = savedFocus.timerMode;
        }
        if (savedFocus.timeRemaining !== undefined) {
          state.timeRemaining = savedFocus.timeRemaining;
        }
        if (savedFocus.currentSessionStartTime !== undefined) {
          state.currentSessionStartTime = savedFocus.currentSessionStartTime;
        }
        if (savedFocus.sessionEndTime !== undefined) {
          state.sessionEndTime = savedFocus.sessionEndTime;
        }
        if (savedFocus.currentTaskIndex !== undefined) {
          state.currentTaskIndex = savedFocus.currentTaskIndex;
        }
      }
    },

    startTimer: (state) => {
      state.timerStatus = "running";
      state.sessionEndTime = Date.now() + state.timeRemaining * 1000;
      if (state.currentSessionStartTime === null) {
        state.currentSessionStartTime = Date.now();
      }
    },

    pauseTimer: (state) => {
      // Freeze the remaining time derived from the end timestamp
      if (state.sessionEndTime !== null) {
        state.timeRemaining = Math.max(
          0,
          Math.round((state.sessionEndTime - Date.now()) / 1000)
        );
      }
      state.sessionEndTime = null;
      state.timerStatus = "paused";
    },

    resetTimer: (state) => {
      state.timerStatus = "idle";
      state.currentSessionStartTime = null;
      state.sessionEndTime = null;
      const duration =
        state.settings[
          `${state.timerMode}Duration` as keyof typeof state.settings
        ];
      state.timeRemaining = duration as number;
    },

    tick: (state) => {
      // Derive the remaining time from the end timestamp instead of
      // decrementing, so the displayed value can never drift from wall-clock
      // time no matter how many contexts tick or how long they were asleep.
      if (state.timerStatus === "running" && state.sessionEndTime !== null) {
        state.timeRemaining = Math.max(
          0,
          Math.ceil((state.sessionEndTime - Date.now()) / 1000)
        );
      }
    },

    completeSession: (state) => {
      applySessionCompletion(state);
    },

    switchMode: (state, action: PayloadAction<TimerMode>) => {
      state.timerMode = action.payload;
      state.timerStatus = "idle";
      state.currentSessionStartTime = null;
      state.sessionEndTime = null;
      const duration =
        state.settings[
          `${action.payload}Duration` as keyof typeof state.settings
        ];
      state.timeRemaining = duration as number;
    },

    addTask: (
      state,
      action: PayloadAction<{ name: string; pomsExpected: number }>
    ) => {
      const newTask: ToDoTask = {
        id: Date.now().toString(),
        name: action.payload.name,
        pomsExpected: action.payload.pomsExpected,
        pomsTaken: 0,
        completed: false,
        createdAt: Date.now()
      };
      state.tasks.push(newTask);
    },

    updateTask: (
      state,
      action: PayloadAction<{ id: string; updates: Partial<ToDoTask> }>
    ) => {
      const taskIndex = state.tasks.findIndex(
        (t) => t.id === action.payload.id
      );
      if (taskIndex !== -1) {
        const task = state.tasks[taskIndex];
        const wasCompleted = task.completed;
        Object.assign(task, action.payload.updates);
        if (!wasCompleted && task.completed) {
          task.completedAt = Date.now();
          state.pastTasks.unshift(task);
          state.tasks.splice(taskIndex, 1);
          if (state.currentTaskIndex >= state.tasks.length) {
            state.currentTaskIndex = Math.max(0, state.tasks.length - 1);
          }
          if (state.pastTasks.length > MAX_PAST_TASKS_ARCHIVED) {
            state.pastTasks.pop();
          }
        }
      }
    },

    deleteTask: (state, action: PayloadAction<string>) => {
      const taskIndex = state.tasks.findIndex((t) => t.id === action.payload);
      if (taskIndex !== -1) {
        state.tasks.splice(taskIndex, 1);
        if (state.currentTaskIndex >= state.tasks.length) {
          state.currentTaskIndex = Math.max(0, state.tasks.length - 1);
        }
      }
    },

    setCurrentTaskIndex: (state, action: PayloadAction<number>) => {
      if (action.payload >= 0 && action.payload < state.tasks.length) {
        state.currentTaskIndex = action.payload;
      }
    },

    incrementPomsTaken: (state) => {
      const currentTask = state.tasks[state.currentTaskIndex];
      if (currentTask) {
        currentTask.pomsTaken += 1;
        if (currentTask.pomsTaken >= currentTask.pomsExpected) {
          currentTask.completed = true;
        }
      }
    },

    updateSettings: (
      state,
      action: PayloadAction<Partial<FocusState["settings"]>>
    ) => {
      state.settings = { ...state.settings, ...action.payload };
      if (state.timerStatus === "idle") {
        const duration =
          state.settings[
            `${state.timerMode}Duration` as keyof typeof state.settings
          ];
        state.timeRemaining = duration as number;
      }
    },

    copyPastTask: (state, action: PayloadAction<string>) => {
      const pastTaskIndex = state.pastTasks.findIndex(
        (t) => t.id === action.payload
      );
      if (pastTaskIndex !== -1) {
        const pastTask = state.pastTasks[pastTaskIndex];
        const newTask: ToDoTask = {
          id: Date.now().toString(),
          name: pastTask.name,
          pomsExpected: pastTask.pomsExpected,
          pomsTaken: 0,
          completed: false,
          createdAt: Date.now()
        };
        state.tasks.push(newTask);
      }
    }
  }
});

export const {
  initializeFromStorage,
  startTimer,
  pauseTimer,
  resetTimer,
  tick,
  completeSession,
  switchMode,
  addTask,
  updateTask,
  deleteTask,
  setCurrentTaskIndex,
  incrementPomsTaken,
  updateSettings,
  copyPastTask
} = focusSlice.actions;

export default focusSlice.reducer;
