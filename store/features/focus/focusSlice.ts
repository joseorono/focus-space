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

export interface FocusState {
  timerMode: TimerMode;
  timerStatus: TimerStatus;
  timeRemaining: number;
  sessionsCompleted: number;
  currentSessionStartTime: number | null;
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
        if (savedFocus.currentTaskIndex !== undefined) {
          state.currentTaskIndex = savedFocus.currentTaskIndex;
        }
      }
    },

    startTimer: (state) => {
      state.timerStatus = "running";
      if (state.currentSessionStartTime === null) {
        state.currentSessionStartTime = Date.now();
      }
    },

    pauseTimer: (state) => {
      state.timerStatus = "paused";
    },

    resetTimer: (state) => {
      state.timerStatus = "idle";
      state.currentSessionStartTime = null;
      const duration =
        state.settings[
          `${state.timerMode}Duration` as keyof typeof state.settings
        ];
      state.timeRemaining = duration as number;
    },

    tick: (state) => {
      if (state.timerStatus === "running" && state.timeRemaining > 0) {
        state.timeRemaining -= 1;
      }
    },

    completeSession: (state) => {
      if (state.timerMode === "work") {
        state.sessionsCompleted += 1;
        const shouldTakeLongBreak =
          state.sessionsCompleted % state.settings.sessionsUntilLongBreak === 0;
        state.timerMode = shouldTakeLongBreak ? "longBreak" : "shortBreak";
        state.timeRemaining = shouldTakeLongBreak
          ? state.settings.longBreakDuration
          : state.settings.shortBreakDuration;
      } else {
        // Completing a break (short or long)
        state.timerMode = "work";
        state.timeRemaining = state.settings.workDuration;

        // Reset sessions counter after completing a long break
        // This ensures the counter cycles: 1/4, 2/4, 3/4, 4/4, then back to 0/4
        if (
          state.timerMode === "work" &&
          state.sessionsCompleted >= state.settings.sessionsUntilLongBreak
        ) {
          state.sessionsCompleted = 0;
        }
      }
      state.timerStatus = "idle";
      state.currentSessionStartTime = null;
    },

    switchMode: (state, action: PayloadAction<TimerMode>) => {
      state.timerMode = action.payload;
      state.timerStatus = "idle";
      state.currentSessionStartTime = null;
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
