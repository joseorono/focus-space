import AddIcon from "@mui/icons-material/Add";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import DeleteIcon from "@mui/icons-material/Delete";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import Fade from "@mui/material/Fade";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import { useTheme } from "@mui/material/styles";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import ViewContainer from "~components/view-container";
import { FOCUS_VIEW_TRANSITION_DURATION } from "~constants";
import {
  addTask,
  copyPastTask,
  deleteTask,
  setCurrentTaskIndex,
  updateTask
} from "~store/features/focus/focusSlice";
import type { RootState } from "~store/store";
import type { ToDoTask } from "~types/focus";

interface TaskSelectionViewProps {
  onTaskSelect: (taskIndex: number) => void;
  onTimerClick: () => void;
}

export default function TaskSelectionView({
  onTaskSelect,
  onTimerClick
}: TaskSelectionViewProps) {
  const dispatch = useDispatch();
  const theme = useTheme();
  const focus = useSelector((state: RootState) => state.focus);
  const [newTaskName, setNewTaskName] = useState("");
  const [newTaskPoms, setNewTaskPoms] = useState("1");
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const activeTasks = focus.tasks.filter((task) => !task.completed);
  const currentTaskIndex = focus.currentTaskIndex;

  const isDarkMode: boolean = theme.palette.mode === "dark";
  const hoverBackgroundColor: string = isDarkMode
    ? "rgba(255, 255, 255, 0.08)"
    : "rgba(0, 0, 0, 0.04)";

  const handleAddTask = () => {
    if (newTaskName.trim() && parseInt(newTaskPoms) > 0) {
      dispatch(
        addTask({
          name: newTaskName.trim(),
          pomsExpected: parseInt(newTaskPoms)
        })
      );
      setNewTaskName("");
      setNewTaskPoms("1");
    }
  };

  const handleDeleteTask = (taskId: string) => {
    dispatch(deleteTask(taskId));
  };

  const handleToggleComplete = (taskId: string, completed: boolean) => {
    dispatch(updateTask({ id: taskId, updates: { completed: !completed } }));
  };

  const handleCopyPastTask = (taskId: string) => {
    dispatch(copyPastTask(taskId));
  };

  const handleStartEditing = (
    task: ToDoTask,
    event: React.MouseEvent<HTMLElement>
  ) => {
    event.stopPropagation();
    setEditingTaskId(task.id);
    setEditingName(task.name);
  };

  const handleSaveEdit = (taskId: string) => {
    const trimmed = editingName.trim();
    if (trimmed) {
      dispatch(updateTask({ id: taskId, updates: { name: trimmed } }));
    }
    setEditingTaskId(null);
  };

  const handleCancelEdit = () => {
    setEditingTaskId(null);
  };

  const formatCompletionTime = (timestamp: number | undefined): string => {
    if (!timestamp) return "";
    const now = Date.now();
    const diffMs = now - timestamp;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  return (
    <Fade in timeout={FOCUS_VIEW_TRANSITION_DURATION}>
      <ViewContainer className="px-0">
        {/* Header with Tasks title and Timer button */}
        <div
          id="task-selection-top-bar"
          className="flex items-center justify-between border-b border-gray-200 px-6 py-2 dark:border-gray-700">
          <Stack
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
                lineHeight: 1,
                display: "flex",
                alignItems: "center"
              }}>
              Tasks
            </Typography>
            <Typography
              variant="caption"
              sx={{ color: "text.secondary", fontSize: "0.75rem" }}>
              {activeTasks.length} active tasks
            </Typography>
          </Stack>
          <Button
            size="small"
            onClick={onTimerClick}
            endIcon={<ArrowBackIcon sx={{ fontSize: 20 }} />}
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
            Timer
          </Button>
        </div>

        {/* Add Task Form */}
        <Box
          id="add-task-form"
          className="mx-4 mt-4 rounded-xl border border-gray-200 p-3 transition-all duration-200 ease-in-out hover:border-blue-300 hover:shadow-sm dark:border-gray-700 dark:hover:border-blue-600"
          sx={{
            mb: 2,
            backgroundColor: "background.paper"
          }}>
          <Typography
            variant="caption"
            sx={{
              display: "block",
              color: "text.secondary",
              fontSize: "0.75rem",
              fontWeight: 600,
              mb: 1,
              textTransform: "uppercase",
              letterSpacing: "0.5px"
            }}>
            Add New Task
          </Typography>
          <Stack direction="row" spacing={1} sx={{ alignItems: "flex-end" }}>
            <Box sx={{ flex: 1 }}>
              <Typography
                variant="caption"
                sx={{
                  display: "block",
                  color: "text.secondary",
                  fontSize: "0.7rem",
                  mb: 0.5
                }}>
                Task Name
              </Typography>
              <TextField
                size="small"
                placeholder="e.g., Design mockups"
                value={newTaskName}
                onChange={(e) => setNewTaskName(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleAddTask()}
                fullWidth
                sx={{
                  "& .MuiOutlinedInput-root": {
                    fontSize: "0.875rem"
                  }
                }}
              />
            </Box>
            <Box sx={{ width: 90 }}>
              <Typography
                variant="caption"
                sx={{
                  display: "block",
                  color: "text.secondary",
                  fontSize: "0.7rem",
                  mb: 0.5
                }}>
                Pomodoros
              </Typography>
              <TextField
                size="small"
                type="number"
                placeholder="1"
                value={newTaskPoms}
                onChange={(e) => setNewTaskPoms(e.target.value)}
                fullWidth
                inputProps={{ min: 1 }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    fontSize: "0.875rem"
                  }
                }}
              />
            </Box>
            <IconButton
              onClick={handleAddTask}
              color="primary"
              disabled={!newTaskName.trim() || parseInt(newTaskPoms) <= 0}
              sx={{
                mb: 0.5
              }}>
              <AddIcon />
            </IconButton>
          </Stack>
        </Box>

        {/* Task List */}
        <Stack spacing={1.5} sx={{ flex: 1, overflow: "auto", px: 2, pb: 2 }}>
          {activeTasks.length === 0 ? (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                height: "100%",
                color: "text.secondary",
                py: 4
              }}>
              <Typography variant="body2">No tasks available</Typography>
            </Box>
          ) : (
            <>
              {activeTasks.map((task) => {
                const taskIndex = focus.tasks.findIndex(
                  (t) => t.id === task.id
                );
                const isSelected = taskIndex === currentTaskIndex;
                return (
                  <Stack
                    key={task.id}
                    direction="row"
                    spacing={1}
                    className={`flex items-start gap-1 rounded-xl border border-gray-200 p-3 transition-all duration-200 ease-in-out hover:border-blue-300 hover:shadow-sm dark:border-gray-700 dark:bg-gray-800 dark:hover:border-blue-600 ${
                      isSelected ? "border-blue-500 dark:border-blue-500" : ""
                    }`}
                    sx={{
                      alignItems: "center",
                      backgroundColor: "background.paper",
                      cursor: "pointer"
                    }}
                    onClick={() => onTaskSelect(taskIndex)}>
                    <Box sx={{ flex: 1 }}>
                      {editingTaskId === task.id ? (
                        <TextField
                          autoFocus
                          variant="standard"
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleSaveEdit(task.id);
                            if (e.key === "Escape") handleCancelEdit();
                          }}
                          onBlur={() => handleSaveEdit(task.id)}
                          onClick={(e) => e.stopPropagation()}
                          sx={{
                            width: "100%",
                            "& .MuiInput-root": {
                              fontSize: "0.875rem",
                              marginTop: 0
                            },
                            "& .MuiInput-input": {
                              padding: "2px 0",
                              height: "auto",
                              lineHeight: 1.43
                            }
                          }}
                        />
                      ) : (
                        <Typography
                          variant="body2"
                          onClick={(e) => handleStartEditing(task, e)}
                          sx={{
                            color: "text.primary",
                            fontWeight: isSelected ? 500 : 400,
                            textDecoration: task.completed
                              ? "line-through"
                              : "none",
                            cursor: "text"
                          }}>
                          {task.name}
                        </Typography>
                      )}
                      <Typography variant="caption" color="text.secondary">
                        {task.pomsTaken} / {task.pomsExpected} pomodoros
                      </Typography>
                    </Box>
                    <Tooltip title="Mark complete">
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleComplete(task.id, task.completed);
                        }}
                        sx={{ color: "text.secondary" }}>
                        <CheckCircleIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton
                        className="!ml-0"
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteTask(task.id);
                        }}
                        sx={{ color: "text.secondary" }}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                );
              })}
              {focus.pastTasks.length > 0 && (
                <>
                  <Divider sx={{ my: 1 }} />
                  <Typography
                    variant="caption"
                    sx={{
                      display: "block",
                      color: "text.secondary",
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      px: 2
                    }}>
                    Completed Tasks
                  </Typography>
                  {focus.pastTasks.map((task) => (
                    <Stack
                      key={task.id}
                      direction="row"
                      spacing={1}
                      className="flex items-start gap-3 rounded-xl border border-gray-200 p-3 transition-all duration-200 ease-in-out hover:border-blue-300 hover:shadow-sm dark:border-gray-700 dark:bg-gray-800 dark:hover:border-blue-600"
                      sx={{
                        alignItems: "center",
                        backgroundColor: "background.paper",
                        opacity: 0.7
                      }}>
                      <Box sx={{ flex: 1 }}>
                        <Typography
                          variant="body2"
                          sx={{
                            color: "text.primary",
                            textDecoration: "line-through",
                            fontSize: "0.875rem"
                          }}>
                          {task.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatCompletionTime(task.completedAt)}
                        </Typography>
                      </Box>
                      <Tooltip title="Copy to current tasks">
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopyPastTask(task.id);
                          }}
                          sx={{ color: "text.secondary" }}>
                          <ContentCopyIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  ))}
                </>
              )}
            </>
          )}
        </Stack>
      </ViewContainer>
    </Fade>
  );
}
