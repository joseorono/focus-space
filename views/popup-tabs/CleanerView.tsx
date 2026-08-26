import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";

import React, { useState } from "react";

import ViewContainer from "~components/view-container";

import TaskButton from "../../components/task-button";
import ViewHeader from "../../components/view-header";
import { cleanAllHistory } from "../../lib/history";
import { checkboxColors } from "~mui-themes";

// Simple error boundary component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; errorMessage: string }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, errorMessage: "" };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, errorMessage: error?.message || "Unknown error" };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("CleanerView error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 text-white">
          <h2>Something went wrong</h2>
          <p className="text-red-400">{this.state.errorMessage}</p>
          <Button
            variant="contained"
            color="primary"
            onClick={() =>
              this.setState({ hasError: false, errorMessage: "" })
            }>
            Try again
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}

type TimeRange = "15min" | "1hour" | "24hours" | "7days" | "30days" | "1year";

export default function CleanerView() {
  const theme = useTheme();
  const isDarkMode: boolean = theme.palette.mode === "dark";
  const selectorBackgroundColor: string = isDarkMode ? "#181e27" : "rgba(15, 23, 42, 0.06)";
  const selectorSelectedBackgroundColor: string = isDarkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.06)";
  const selectorHoverBackgroundColor: string = isDarkMode ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.04)";
  const selectorSelectedHoverBackgroundColor: string = isDarkMode ? "rgba(255, 255, 255, 0.15)" : "rgba(0, 0, 0, 0.08)";
  const [debugMessage, setDebugMessage] = useState<string>("");
  const [timeRange, setTimeRange] = useState<TimeRange>("24hours");
  const [onlyMatchingResults, setOnlyMatchingResults] = useState<boolean>(true);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const isMoreRange: boolean =
    timeRange === "7days" || timeRange === "30days" || timeRange === "1year";
  const moreRangeLabel: string =
    timeRange === "7days"
      ? "Last 7 days"
      : timeRange === "30days"
        ? "Last 30 days"
        : "Last year";

  const handleTimeRangeChange = (newTimeRange: TimeRange): void => {
    setTimeRange(newTimeRange);
    setAnchorEl(null);
  };

  const handleMoreClick = (event: React.MouseEvent<HTMLElement>): void => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = (): void => {
    setAnchorEl(null);
  };

  const handleCleanHistory = async (): Promise<boolean> => {
    try {
      setDebugMessage("Cleaning history...");
      await cleanAllHistory(timeRange);
      setDebugMessage("History cleaned successfully!");
      return true;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      setDebugMessage(`Error: ${errorMessage}`);
      console.error("Error cleaning history:", error);
      throw error;
    }
  };

  return (
    <ErrorBoundary>
      <ViewContainer>
        <ViewHeader
          title="Browser Cleaner"
          subtitle="Delete your browser's browsing history, cookies, cache, and more."
        />
        {/* Time Range Selector */}
        <Stack
          direction="row"
          spacing={1}
          sx={{ mb: 1, justifyContent: "space-around", borderRadius: "9999px", width: "100%", backgroundColor: selectorBackgroundColor, p: 1 }}>
          {[{ id: "15min", label: "Last 15 min" }, { id: "1hour", label: "Last hour" }, { id: "24hours", label: "Last 24 hours" }].map((option) => (
            <Box
              key={option.id}
              onClick={() => handleTimeRangeChange(option.id as TimeRange)}
              sx={{
                p: 0.75,
                borderRadius: "9999px",
                cursor: "pointer",
                backgroundColor: timeRange === option.id ? selectorSelectedBackgroundColor : "transparent",
                transition: "all 0.2s ease",
                "&:hover": {
                  backgroundColor:
                    timeRange === option.id
                      ? selectorSelectedHoverBackgroundColor
                      : selectorHoverBackgroundColor,
                },
              }}>
              <Typography
                sx={{
                  fontSize: "0.8rem",
                  fontWeight: 600,
                  color: timeRange === option.id ? "#42a5f5" : "text.secondary",
                  transition: "color 0.2s ease",
                }}>
                {option.label}
              </Typography>
            </Box>
          ))}
          {isMoreRange && (
            <Box
              onClick={() => handleTimeRangeChange(timeRange)}
              sx={{
                px: 2,
                py: 0.75,
                borderRadius: "9999px",
                cursor: "pointer",
                backgroundColor: selectorSelectedBackgroundColor,
                transition: "all 0.2s ease",
                "&:hover": { backgroundColor: selectorSelectedHoverBackgroundColor },
              }}>
              <Typography sx={{ fontSize: "0.8rem", fontWeight: 600, color: "#42a5f5", transition: "color 0.2s ease" }}>
                {moreRangeLabel}
              </Typography>
            </Box>
          )}
          <Box
            onClick={handleMoreClick}
            sx={{
              px: 2,
              py: 0.75,
              borderRadius: "9999px",
              cursor: "pointer",
              backgroundColor: "transparent",
              transition: "all 0.2s ease",
              "&:hover": { backgroundColor: selectorHoverBackgroundColor },
            }}>
            <Typography sx={{ fontSize: "0.8rem", fontWeight: 600, color: "text.secondary", transition: "color 0.2s ease" }}>
              More
            </Typography>
          </Box>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}>
            <MenuItem onClick={() => handleTimeRangeChange("7days")}>
              Last 7 days
            </MenuItem>
            <MenuItem onClick={() => handleTimeRangeChange("30days")}>
              Last 30 days
            </MenuItem>
            <MenuItem onClick={() => handleTimeRangeChange("1year")}>
              Last year
            </MenuItem>
          </Menu>
        </Stack>

        {/* Cleaning items list */}
        <Box className="space-y-2">
          {/* Browsing History */}
          <Box className="flex items-start gap-3 rounded-xl border border-gray-200 bg-white p-3 transition-all duration-200 ease-in-out hover:border-blue-300 hover:shadow-sm dark:border-gray-700 dark:bg-gray-800 dark:hover:border-blue-600">
            <Checkbox
              defaultChecked
              sx={checkboxColors}
            />
            <Box className="flex-1">
              <Typography
                variant="subtitle2"
                className="font-semibold text-slate-900 dark:text-white">
                Browsing history
              </Typography>
              <Typography variant="body2" className="text-slate-600 dark:text-gray-400">
                From github.com and 2 more sites (and more on synced devices)
              </Typography>
            </Box>
          </Box>

          {/* Cookies and site data */}
          <Box className="flex items-start gap-3 rounded-xl border border-gray-200 bg-white p-3 transition-all duration-200 ease-in-out hover:border-blue-300 hover:shadow-sm dark:border-gray-700 dark:bg-gray-800 dark:hover:border-blue-600">
            <Checkbox
              defaultChecked
              sx={checkboxColors}
            />
            <Box className="flex-1">
              <Typography
                variant="subtitle2"
                className="font-semibold text-slate-900 dark:text-white">
                Cookies and site data
              </Typography>
              <Typography variant="body2" className="text-slate-600 dark:text-gray-400">
                From 147 sites. To delete Google cookies from this device, use
                Chrome settings.
              </Typography>
            </Box>
          </Box>

          {/* Cached images and files */}
          <Box className="flex items-start gap-3 rounded-xl border border-gray-200 bg-white p-3 transition-all duration-200 ease-in-out hover:border-blue-300 hover:shadow-sm dark:border-gray-700 dark:bg-gray-800 dark:hover:border-blue-600">
            <Checkbox
              defaultChecked
              sx={checkboxColors}
            />
            <Box className="flex-1">
              <Typography
                variant="subtitle2"
                className="font-semibold text-slate-900 dark:text-white">
                Cached images and files
              </Typography>
              <Typography variant="body2" className="text-slate-600 dark:text-gray-400">
                Less than 317 MB
              </Typography>
            </Box>
          </Box>

          {/* Download history */}
          <Box className="flex items-start gap-3 rounded-xl border border-gray-200 bg-white p-3 transition-all duration-200 ease-in-out hover:border-blue-300 hover:shadow-sm dark:border-gray-700 dark:bg-gray-800 dark:hover:border-blue-600">
            <Checkbox
              defaultChecked
              sx={checkboxColors}
            />
            <Box className="flex-1">
              <Typography
                variant="subtitle2"
                className="font-semibold text-slate-900 dark:text-white">
                Download history
              </Typography>
              <Typography variant="body2" className="text-slate-600 dark:text-gray-400">
                None
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Debug message */}
        {debugMessage && (
          <Box className="mt-4 rounded border border-gray-200 bg-white p-2 dark:border-gray-700 dark:bg-gray-800">
            <Typography variant="body2">{debugMessage}</Typography>
          </Box>
        )}

        {/* Action button */}
        <Box className="mt-2 mb-2">
          <TaskButton
            text="Clear Data"
            successText="Data cleared successfully"
            errorText="Failed to clear data"
            fnQuery={handleCleanHistory}
            disabled={false}
          />
        </Box>
      </ViewContainer>
    </ErrorBoundary>
  );
}