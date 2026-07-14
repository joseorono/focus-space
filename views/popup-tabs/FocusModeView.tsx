import AccessAlarmIcon from "@mui/icons-material/AccessAlarm";
import AddIcon from "@mui/icons-material/Add";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CheckIcon from "@mui/icons-material/Check";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import DeleteIcon from "@mui/icons-material/Delete";
import PauseIcon from "@mui/icons-material/Pause";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import RefreshIcon from "@mui/icons-material/Refresh";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import StopIcon from "@mui/icons-material/Stop";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import Badge from "@mui/material/Badge";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Checkbox from "@mui/material/Checkbox";
import Chip from "@mui/material/Chip";
import Fade from "@mui/material/Fade";
import FormControlLabel from "@mui/material/FormControlLabel";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import { useTheme } from "@mui/material/styles";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useDispatch, useSelector } from "react-redux";

import { Storage } from "@plasmohq/storage";

import ViewContainer from "~components/view-container";
import {
  breakEncouragementMessages,
  FOCUS_VIEW_TRANSITION_DURATION,
  focusEncouragementMessages
} from "~constants";
import { sendNotification } from "~lib/notification";
import { getRandomElement } from "~lib/utils";
import {
  completeSession,
  pauseTimer,
  resetTimer,
  setCurrentTaskIndex,
  startTimer,
  switchMode,
  tick,
  updateTask
} from "~store/features/focus/focusSlice";
import type { RootState } from "~store/store";
import type { TimerMode } from "~types/focus";

import ViewHeader from "../../components/view-header";
import TaskSelectionView from "./TaskSelectionView";

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
};

const getModeLabel = (mode: TimerMode): string => {
  switch (mode) {
    case "work":
      return "Deep Work";
    case "shortBreak":
      return "Short Break";
    case "longBreak":
      return "Long Break";
  }
};

const getModeColor = (mode: TimerMode): string => {
  switch (mode) {
    case "work":
      return "#ef5350";
    case "shortBreak":
      return "#66bb6a";
    case "longBreak":
      return "#42a5f5";
  }
};

// Create storage instance outside component to avoid re-creation on every render
const storage = new Storage();

export default function FocusModeView() {
  const dispatch = useDispatch();
  const theme = useTheme();
  const focus = useSelector((state: RootState) => state.focus);
  const [newTodoText, setNewTodoText] = useState("");
  const [autoBreak, setAutoBreak] = useState(false);
  const [showTaskSelection, setShowTaskSelection] = useState(false);
  const isDarkMode: boolean = theme.palette.mode === "dark";
  const dividerColor: string = isDarkMode
    ? "rgba(255,255,255,0.1)"
    : "rgba(0,0,0,0.08)";
  const hoverBackgroundColor: string = isDarkMode
    ? "rgba(255, 255, 255, 0.08)"
    : "rgba(0, 0, 0, 0.04)";
  const modeSelectorBackgroundColor: string = isDarkMode
    ? "#181e27"
    : "rgba(15, 23, 42, 0.06)";
  const modeOptionSelectedBackgroundColor: string = isDarkMode
    ? "rgba(255, 255, 255, 0.1)"
    : "rgba(0, 0, 0, 0.06)";
  const modeOptionHoverBackgroundColor: string = isDarkMode
    ? "rgba(255, 255, 255, 0.05)"
    : "rgba(0, 0, 0, 0.04)";
  const modeOptionSelectedHoverBackgroundColor: string = isDarkMode
    ? "rgba(255, 255, 255, 0.15)"
    : "rgba(0, 0, 0, 0.08)";
  const outlinedButtonBorderColor: string = isDarkMode
    ? "rgba(255, 255, 255, 0.1)"
    : "rgba(0, 0, 0, 0.12)";
  const outlinedButtonHoverBorderColor: string = isDarkMode
    ? "rgba(255, 255, 255, 0.2)"
    : "rgba(0, 0, 0, 0.2)";
  const outlinedButtonHoverBackgroundColor: string = isDarkMode
    ? "rgba(255, 255, 255, 0.05)"
    : "rgba(0, 0, 0, 0.03)";

  // Watch for storage changes from background timer
  useEffect(() => {
    // Set up storage watcher once on mount
    // Note: Plasmo storage watchers are persistent and don't return an unsubscribe function
    storage.watch({
      reduxState: (change) => {
        if (change.newValue?.focus) {
          // Dispatch action to update Redux state from storage
          dispatch({
            type: "focus/initializeFromStorage",
            payload: change.newValue
          });
        }
      }
    });

    // Note: Plasmo storage watchers are managed internally and persist across component lifecycle
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once on mount

  const handleStart = () => {
    // Prevent starting if already running
    if (focus.timerStatus === "running") {
      return;
    }

    // Prevent starting if time is zero
    if (focus.timeRemaining === 0) {
      toast.error("Please reset the timer before starting.");
      return;
    }

    // Dispatch Redux action immediately for instant UI feedback
    dispatch(startTimer());

    // Show toast immediately (non-blocking)
    if (focus.timerMode === "work") {
      toast.success("Deep Work session started!");
    } else {
      toast.success("Break time started!");
    }

    // Send notification asynchronously (non-blocking, runs in background)
    if (focus.timerMode === "work") {
      sendNotification(0, "🎯 Deep Work session started! Stay focused.").catch(
        (err) => {
          console.error("Notification error:", err);
        }
      );
    } else {
      sendNotification(0, "☕ Break time! Relax and recharge.").catch((err) => {
        console.error("Notification error:", err);
      });
    }
  };

  const handlePause = () => {
    dispatch(pauseTimer());
  };

  const handleReset = () => {
    dispatch(resetTimer());
  };

  const handleModeSwitch = (mode: TimerMode) => {
    // Prevent mode switching when timer is running
    if (focus.timerStatus === "running") {
      toast.error("Please pause or reset the timer before switching modes.");
      return;
    }
    dispatch(switchMode(mode));
  };

  const handleTaskSelect = (taskIndex: number) => {
    dispatch(setCurrentTaskIndex(taskIndex));
    setShowTaskSelection(false);
  };

  const handleShowTaskSelection = () => {
    setShowTaskSelection(true);
  };

  const handleBackToTimer = () => {
    setShowTaskSelection(false);
  };

  const handleSwitchTask = () => {
    const activeTasks = focus.tasks.filter((task) => !task.completed);
    if (activeTasks.length === 0) return;

    const currentTaskId = focus.tasks[focus.currentTaskIndex]?.id;
    const currentActiveIndex = activeTasks.findIndex(
      (task) => task.id === currentTaskId
    );

    const nextActiveIndex =
      currentActiveIndex === -1
        ? 0
        : (currentActiveIndex + 1) % activeTasks.length;
    const nextTask = activeTasks[nextActiveIndex];
    const nextTaskIndex = focus.tasks.findIndex(
      (task) => task.id === nextTask.id
    );

    dispatch(setCurrentTaskIndex(nextTaskIndex));
  };

  const handleDoneTask = () => {
    const currentTask = focus.tasks[focus.currentTaskIndex];
    if (currentTask) {
      dispatch(
        updateTask({ id: currentTask.id, updates: { completed: true } })
      );
      // Switch to next task if available
      const activeTasks = focus.tasks.filter((task) => !task.completed);
      if (activeTasks.length > 0) {
        const nextTask = activeTasks[0];
        const nextTaskIndex = focus.tasks.findIndex(
          (task) => task.id === nextTask.id
        );
        dispatch(setCurrentTaskIndex(nextTaskIndex));
      }
    }
  };

  const totalDuration = focus.settings[
    `${focus.timerMode}Duration` as keyof typeof focus.settings
  ] as number;
  const progress =
    ((totalDuration - focus.timeRemaining) / totalDuration) * 100;
  const modeColor = getModeColor(focus.timerMode);

  // Show task selection view if active
  if (showTaskSelection) {
    return (
      <TaskSelectionView
        onTaskSelect={handleTaskSelect}
        onTimerClick={handleBackToTimer}
      />
    );
  }

  const currentTask = focus.tasks[focus.currentTaskIndex];

  return (
    <Fade in timeout={FOCUS_VIEW_TRANSITION_DURATION}>
      <ViewContainer
        className="px-0"
        style={{
          display: "flex",
          flexDirection: "column",
          height: "100%"
        }}>
        {/* Current Task Title and Change Button */}
        <div
          id="focus-mode-top-bar"
          className="flex items-center justify-between border-b border-gray-200 px-6 py-2 dark:border-gray-700">
          <Stack
            className=""
            direction="column"
            spacing={0.75}
            sx={{
              mb: 0.5,
              justifyContent: "space-between",
              alignItems: "start",
              py: 0
            }}>
            <Typography
              variant="h6"
              sx={{
                color: "text.primary",
                fontWeight: 500,
                fontSize: "1.1rem",
                flex: 1,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                lineHeight: 1,
                display: "flex",
                alignItems: "center"
              }}>
              {focus.tasks.filter((task) => !task.completed).length === 0
                ? "Add a task"
                : currentTask?.name || "No task selected"}
            </Typography>
            <Stack
              className=""
              id="task-progress"
              direction="row"
              sx={{
                justifyContent: "start",
                alignItems: "center",
                mt: 0,
                pb: 0.75,
                mb: 1,
                gap: 0.25
                // borderBottom: `1px solid ${dividerColor}`
              }}>
              {currentTask ? (
                <>
                  {Array.from({ length: currentTask.pomsExpected }).map(
                    (_, index) => {
                      const isCompleted = index < currentTask.pomsTaken;
                      return (
                        <Box
                          key={index}
                          sx={{
                            width: 16,
                            height: 16,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center"
                          }}>
                          <AccessAlarmIcon
                            sx={{
                              fontSize: 14,
                              color: modeColor,
                              opacity: isCompleted ? 1 : 0.4
                            }}
                          />
                        </Box>
                      );
                    }
                  )}
                </>
              ) : (
                <Typography
                  variant="caption"
                  sx={{ color: "text.secondary", fontSize: "0.75rem" }}>
                  No task selected
                </Typography>
              )}
            </Stack>
          </Stack>
          {/* Task Progress Indicator */}
          <Button
            size="small"
            onClick={handleShowTaskSelection}
            endIcon={<SwapHorizIcon sx={{ fontSize: 20 }} />}
            sx={{
              color: "text.secondary",
              textTransform: "none",
              fontSize: "0.8rem",
              px: 1,
              py: 0,
              minWidth: "auto",
              height: 32,
              display: "flex",
              alignItems: "center",
              "&:hover": {
                backgroundColor: hoverBackgroundColor
              }
            }}>
            Tasks
          </Button>
        </div>

        <Box sx={{ flex: 1, overflow: "auto" }}>
          {/* Mode Selector */}
          <Stack
            id="modeSelectorButtons"
            direction="row"
            spacing={1}
            sx={{
              mt: 1,
              mb: 4,
              justifyContent: "center",
              borderRadius: "9999px",
              width: "fit-content",
              mx: "auto",
              backgroundColor: modeSelectorBackgroundColor,
              p: 1
            }}>
            {[
              { id: "work", label: "Deep Work", color: "#ef5350" },
              { id: "shortBreak", label: "Short", color: "#66bb6a" },
              { id: "longBreak", label: "Long", color: "#42a5f5" }
            ].map((mode) => (
              <Box
                key={mode.id}
                onClick={() => handleModeSwitch(mode.id as TimerMode)}
                sx={{
                  px: 2,
                  py: 0.75,
                  borderRadius: "9999px",
                  cursor: "pointer",
                  backgroundColor:
                    focus.timerMode === mode.id
                      ? modeOptionSelectedBackgroundColor
                      : "transparent",
                  transition: "all 0.2s ease",
                  "&:hover": {
                    backgroundColor:
                      focus.timerMode === mode.id
                        ? modeOptionSelectedHoverBackgroundColor
                        : modeOptionHoverBackgroundColor
                  }
                }}>
                <Typography
                  sx={{
                    fontSize: "0.8rem",
                    fontWeight: 600,
                    color:
                      focus.timerMode === mode.id
                        ? mode.color
                        : "text.secondary",
                    transition: "color 0.2s ease"
                  }}>
                  {mode.label}
                </Typography>
              </Box>
            ))}
          </Stack>

          {/* Timer Display with Circular Progress */}
          <Box
            sx={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              mb: 2
            }}>
            <Box sx={{ position: "relative", display: "inline-flex", mb: 2 }}>
              {/* Circular Progress Ring */}
              <svg
                width="220"
                height="220"
                style={{ transform: "rotate(-90deg)" }}>
                {/* Background circle */}
                <circle
                  cx="110"
                  cy="110"
                  r="100"
                  fill="none"
                  stroke="rgba(66, 165, 245, 0.2)"
                  strokeWidth="6"
                />
                {/* Progress circle */}
                <circle
                  cx="110"
                  cy="110"
                  r="100"
                  fill="none"
                  stroke={modeColor}
                  strokeWidth="6"
                  strokeDasharray={`${2 * Math.PI * 100}`}
                  strokeDashoffset={`${2 * Math.PI * 100 * (1 - progress / 100)}`}
                  strokeLinecap="round"
                />
              </svg>

              {/* Timer text in center */}
              <Box
                sx={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  textAlign: "center"
                }}>
                <Typography
                  variant="h2"
                  sx={{
                    fontWeight: 300,
                    fontSize: "3rem",
                    color: modeColor,
                    letterSpacing: "-0.02em"
                  }}>
                  {formatTime(focus.timeRemaining)}
                </Typography>
              </Box>
            </Box>

            {/* Control Buttons below timer */}
            <Stack direction="row" spacing={1.5}>
              {/* Stop button */}
              <IconButton
                onClick={handleReset}
                sx={{
                  width: 48,
                  height: 48,
                  backgroundColor: modeColor,
                  color: "white",
                  "&:hover": {
                    backgroundColor: modeColor,
                    opacity: 0.9
                  }
                }}>
                <StopIcon sx={{ fontSize: 24 }} />
              </IconButton>

              {/* Play/Pause button */}
              {focus.timerStatus === "running" ? (
                <IconButton
                  onClick={handlePause}
                  sx={{
                    width: 48,
                    height: 48,
                    backgroundColor: "white",
                    color: modeColor,
                    border: `2px solid ${modeColor}`,
                    "&:hover": {
                      backgroundColor: "rgba(255, 255, 255, 0.9)"
                    }
                  }}>
                  <PauseIcon sx={{ fontSize: 24 }} />
                </IconButton>
              ) : (
                <IconButton
                  onClick={handleStart}
                  sx={{
                    width: 48,
                    height: 48,
                    backgroundColor: "white",
                    color: modeColor,
                    border: `2px solid ${modeColor}`,
                    "&:hover": {
                      backgroundColor: "rgba(255, 255, 255, 0.9)"
                    }
                  }}>
                  <PlayArrowIcon sx={{ fontSize: 24 }} />
                </IconButton>
              )}
            </Stack>
          </Box>

          {/* Done and Switch Task buttons */}
          <Stack
            direction="row"
            spacing={1.5}
            sx={{ mb: 2, justifyContent: "center" }}>
            <Button
              variant="outlined"
              startIcon={<CheckIcon fontSize="small" />}
              onClick={handleDoneTask}
              sx={{
                color: "text.secondary",
                borderColor: outlinedButtonBorderColor,
                borderRadius: "12px",
                px: 3,
                py: 1,
                "&:hover": {
                  borderColor: outlinedButtonHoverBorderColor,
                  backgroundColor: outlinedButtonHoverBackgroundColor
                }
              }}>
              Done
            </Button>
            <Button
              variant="outlined"
              startIcon={<SwapHorizIcon fontSize="small" />}
              onClick={handleSwitchTask}
              sx={{
                color: "text.secondary",
                borderColor: outlinedButtonBorderColor,
                borderRadius: "12px",
                px: 3,
                py: 1,
                "&:hover": {
                  borderColor: outlinedButtonHoverBorderColor,
                  backgroundColor: outlinedButtonHoverBackgroundColor
                }
              }}>
              Switch task
            </Button>
          </Stack>

          {/* Reset Session button at bottom */}
          <Box
            id="reset-session-container"
            className="px-6"
            sx={{
              borderTop: `1px solid ${dividerColor}`,
              pt: 1.5,
              pb: 1.5,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between"
            }}>
            <Button
              variant="text"
              id="reset-session-button"
              startIcon={<RefreshIcon fontSize="small" />}
              onClick={handleReset}
              sx={{
                color: "text.secondary",
                textTransform: "none",
                fontSize: "0.75rem",
                py: 0.5,
                px: 1
              }}>
              Reset Session
            </Button>
            <Typography
              variant="caption"
              color="textSecondary"
              sx={{ fontSize: "0.75rem" }}>
              {focus.sessionsCompleted} /{" "}
              {focus.settings.sessionsUntilLongBreak}
            </Typography>
          </Box>
        </Box>
      </ViewContainer>
    </Fade>
  );
}
