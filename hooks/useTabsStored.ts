import { useEffect, useState } from "react";
import { useSelector } from "react-redux";

import { useStorage } from "@plasmohq/storage/hook";

import { useGetKeywordsFromSettings } from "~hooks/useGetKeywordsFromSetting";
import { useInterval } from "~hooks/useInterval";
import { getAllTabs } from "~lib/tabs";
import type { SettingsState } from "~store/features/settings/settingsSlice";
import type { RootState } from "~store/store";

interface UseTabsPersistedReturn {
  tabs: chrome.tabs.Tab[];
  hasTabsWithKeywords: boolean;
  isLoading: boolean;
  refresh: () => Promise<void>;
}

export default function useTabsPersisted(): UseTabsPersistedReturn {
  const [tabs, setTabs] = useState<chrome.tabs.Tab[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hasFetched, setHasFetched] = useState<boolean>(false);

  // Persist filtered tabs to Plasmo Storage
  const [persistedTabs, setPersistedTabs] = useStorage<chrome.tabs.Tab[]>(
    "tabs_with_keywords",
    []
  );

  // Get settings from Redux store
  const settings = useSelector(
    (state: RootState) => state.settings
  ) as SettingsState;

  // Get focus mode state to determine if we should auto-check
  const focus = useSelector((state: RootState) => state.focus);

  const fetchAllTabs = async () => {
    setIsLoading(true);
    const allTabs = await getAllTabs();
    if (allTabs) {
      setTabs(allTabs);
      setHasFetched(true);
    }
    setIsLoading(false);
  };

  // Initial fetch on mount
  useEffect(() => {
    fetchAllTabs();
  }, []);

  // Only run interval when focus mode is active in work mode
  const shouldAutoCheck =
    focus.timerStatus === "running" && focus.timerMode === "work";

  // Use our custom useInterval hook with automatic cleanup
  // Pass null as delay when shouldAutoCheck is false to pause the interval
  useInterval(
    fetchAllTabs,
    shouldAutoCheck ? 60000 : null, // 60 seconds or null to pause
    false // Don't execute immediately (already done in useEffect above)
  );

  // Get keywords from settings using utility function
  const keywords = useGetKeywordsFromSettings(settings);
  // Stable dependency key: keywords is a fresh array on every render
  const keywordsKey = keywords.join("|");

  // Re-filter and persist whenever a fresh tab list or the settings change.
  // Only persist after a real fetch so the stored list is never overwritten
  // by the initial empty state, but IS cleared once the tabs are gone.
  useEffect(() => {
    if (!hasFetched) {
      return;
    }
    const tabsWithKeywords = tabs.filter((tab) => {
      const url = tab.url?.toLowerCase();
      return keywords.some((keyword) => url?.includes(keyword));
    });
    setPersistedTabs(tabsWithKeywords);
  }, [hasFetched, tabs, keywordsKey]);

  return {
    tabs: persistedTabs || [],
    hasTabsWithKeywords: (persistedTabs?.length || 0) > 0,
    isLoading,
    refresh: fetchAllTabs
  };
}