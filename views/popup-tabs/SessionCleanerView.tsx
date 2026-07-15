import FiberManualRecordIcon from "@mui/icons-material/FiberManualRecord";
// import NotificationsIcon from "@mui/icons-material/Notifications";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useEffect, useRef, useState } from "react";
// import toast from "react-hot-toast";
import { useDispatch, useSelector } from "react-redux";

import ViewHeader from "~/components/view-header";
import SessionCleanerButton from "~components/session-cleaner-button";
import ViewContainer from "~components/view-container";
import { CATEGORIES } from "~constants";
import { useCloseTabsMutation } from "~hooks/mutations";
import { useGetKeywordsFromSettings } from "~hooks/useGetKeywordsFromSetting";
import { useInterval } from "~hooks/useInterval";
import useTabsPersisted from "~hooks/useTabsStored";
import { sendNotification } from "~lib/notification";
import {
  selectAllCategories,
  type SettingsState
} from "~store/features/settings/settingsSlice";
import type { RootState } from "~store/store";

export default function SessionCleanerView() {
  const [closedTabsCount, setClosedTabsCount] = useState<number>(0);
  const [isAnimating, setIsAnimating] = useState<boolean>(false);
  const dispatch = useDispatch();

  // Get settings from Redux store
  const settings = useSelector(
    (state: RootState) => state.settings
  ) as SettingsState;

  // Get focus mode state
  const focus = useSelector((state: RootState) => state.focus);

  // Use the proper mutation hook
  const closeTabsMutation = useCloseTabsMutation();

  const handleSelectAll = () => {
    dispatch(selectAllCategories());
  };

  // Handle the clean session action
  const handleCleanSession = () => {
    setIsAnimating(true);
    const keywords = useGetKeywordsFromSettings(settings);

    // Use the mutation to close tabs
    closeTabsMutation.mutate(
      {
        keywords,
        whitelistedDomains: settings.whitelistedDomains
      },
      {
        onSuccess: (data) => {
          setClosedTabsCount(data.tabsClosed);
          refreshTabsCheck(); // Refresh persisted tabs check
          setTimeout(() => setIsAnimating(false), 1000); // Reset animation after 1 second
        },
        onError: () => {
          setIsAnimating(false);
        }
      }
    );
  };

  const {
    tabs: tabsWithKeywords,
    hasTabsWithKeywords,
    isLoading: isLoadingPersistedTabs,
    refresh: refreshTabsCheck
  } = useTabsPersisted();

  // Use ref to access latest tabs count without causing interval restart
  const tabsCountRef = useRef(tabsWithKeywords.length);
  
  useEffect(() => {
    tabsCountRef.current = tabsWithKeywords.length;
  }, [tabsWithKeywords.length]);

  // Send notification every minute only when in Focus Mode work session
  const shouldAutoCheck =
    focus.timerStatus === "running" && focus.timerMode === "work";

  // Use our custom useInterval hook - only depends on focus state, not tabs count
  useInterval(
    () => {
      // Use ref to get current tabs count without adding it to dependencies
      if (tabsCountRef.current > 0) {
        sendNotification(tabsCountRef.current);
      }
    },
    shouldAutoCheck ? 60000 : null, // 60 seconds or null to pause
    false
  );

  return (
    <ViewContainer>
      <ViewHeader
        title="Session Cleaner"
        subtitle="Close tabs that might distract you from work"
      />

      {/* Auto-check indicator */}
      <Box sx={{ mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
        <FiberManualRecordIcon
          sx={{
            fontSize: "0.75rem",
            color:
              focus.timerStatus === "running" && focus.timerMode === "work"
                ? "success.main"
                : "grey.600",
            animation:
              focus.timerStatus === "running" && focus.timerMode === "work"
                ? "pulse 2s infinite"
                : "none"
          }}
        />
        <Typography variant="caption" color="textSecondary">
          {focus.timerStatus === "running" && focus.timerMode === "work"
            ? "Auto-checking every minute (Focus Mode active)"
            : "Auto-check paused (Start Focus Mode to enable)"}
        </Typography>
      </Box>

      {/* Display selected categories */}
      <Card
        sx={{
          mb: 2,
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            borderColor: 'primary.light',
            boxShadow: 1
          },
          '@media (prefers-color-scheme: dark)': {
            '&:hover': {
              borderColor: 'primary.dark'
            }
          }
        }}
        className="border border-gray-200 dark:border-gray-700"
      >
        <CardContent>
          <Stack
            direction="row"
            sx={{
              alignItems: "center",
              justifyContent: "space-between",
              mb: 1.5
            }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              Active Filters
            </Typography>
            <Button
              size="small"
              variant="outlined"
              onClick={handleSelectAll}
              disabled={
                settings.selectedCategories.length === CATEGORIES.length
              }>
              Select All
            </Button>
          </Stack>
          <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
            {settings.selectedCategories.map((category) => {
              const categoryMeta = CATEGORIES.find((c) => c.id === category);
              return (
                <Chip
                  key={category}
                  label={categoryMeta?.label || category}
                  size="small"
                  color="primary"
                  variant="outlined"
                />
              );
            })}
            {settings.customKeywords.length > 0 && (
              <Chip
                label={`+${settings.customKeywords.length} custom`}
                size="small"
                color="secondary"
                variant="outlined"
              />
            )}
            {settings.whitelistedDomains.length > 0 && (
              <Chip
                label={`${settings.whitelistedDomains.length} whitelisted`}
                size="small"
                color="secondary"
                variant="outlined"
              />
            )}
          </Stack>
        </CardContent>
      </Card>

      {/* Display tabs with keywords indicator */}
      {(hasTabsWithKeywords || isLoadingPersistedTabs) && (
        <Card sx={{ mb: 2, backgroundColor: "rgba(255, 193, 7, 0.1)" }}>
          <CardContent>
            <Typography variant="body2" sx={{ color: "warning.light" }}>
              ⚠️ Found {tabsWithKeywords.length} tab
              {tabsWithKeywords.length !== 1 ? "s" : ""} with distracting
              content
            </Typography>
          </CardContent>
        </Card>
      )}

      <Stack spacing={2} sx={{ alignItems: "center", pt: 2, pb: 2 }}>
        {/* Main session cleaner button */}
        <SessionCleanerButton
          onClick={handleCleanSession}
          disabled={closeTabsMutation.isPending || isAnimating}
          isLoading={closeTabsMutation.isPending}
          isAnimating={isAnimating}
        />

        {/* Status text */}
        <Typography variant="body2" sx={{ textAlign: "center" }}>
          {closeTabsMutation.isPending
            ? "Cleaning up tabs..."
            : closedTabsCount > 0
            ? `Closed ${closedTabsCount} distracting tabs`
            : `Currently open tabs with distractions: ${tabsWithKeywords.length}`}
        </Typography>

        {/* Test notification button
        <Button
          variant="contained"
          color="secondary"
          startIcon={<NotificationsIcon />}
          onClick={async () => {
            console.log("🧪 Test notification button clicked");
            toast.success("Sending test notification...");
            await sendNotification(tabsWithKeywords.length || 1);
          }}>
          Test Notification
        </Button>
        */}
      </Stack>
    </ViewContainer>
  );
}