function closeTabsByIds(tabIds: number[]): Promise<void> {
  return new Promise((resolve) => {
    chrome.tabs.remove(tabIds, () => resolve());
  });
}

export type tabsClosingResponse = {
  message?: string;
  tabIdsClosed: number[];
  tabsClosed: number;
};

export type CloseTabsParams = {
  keywords: string[];
  whitelistedDomains?: string[];
};

/**
 * Helper function to check if a URL is whitelisted
 */
function isUrlWhitelisted(url: string, whitelistedDomains: string[]): boolean {
  if (!whitelistedDomains || whitelistedDomains.length === 0) {
    return false;
  }

  const lowerUrl = url.toLowerCase();
  return whitelistedDomains.some((domain) => {
    const lowerDomain = domain.toLowerCase();
    // Check if the URL contains the whitelisted domain
    return lowerUrl.includes(lowerDomain);
  });
}

export async function cleanSession(
  params: CloseTabsParams
): Promise<tabsClosingResponse> {
  const { keywords = [], whitelistedDomains = [] } = params;

  // Add a small delay to simulate processing
  await new Promise((resolve) => setTimeout(resolve, 500));

  const tabs = await chrome.tabs.query({});

  const tabsToClose = tabs.filter((tab) => {
    const url = tab.url?.toLowerCase();

    if (!url) {
      return false;
    }

    if (isUrlWhitelisted(url, whitelistedDomains)) {
      return false;
    }

    return keywords.some((keyword) => url.includes(keyword.toLowerCase()));
  });

  const tabIdsClosed = tabsToClose
    .map((tab) => tab.id)
    .filter((id): id is number => id !== undefined);
  const tabsClosed = tabIdsClosed.length;

  console.log(`Closing ${tabsClosed} tabs with matching keywords`);

  // Wait for Chrome to actually remove the tabs so callers can re-query safely
  if (tabIdsClosed.length > 0) {
    await closeTabsByIds(tabIdsClosed);
  }

  return {
    message: `Closed ${tabsClosed} tabs`,
    tabIdsClosed,
    tabsClosed
  };
}

export async function getCurrentTab() {
  let queryOptions = { active: true, lastFocusedWindow: true };
  let [tab] = await chrome.tabs.query(queryOptions);
  return tab;
}

export async function getAllTabs() {
  try {
    const tabs = await chrome.tabs.query({});
    return tabs;
  } catch (error) {
    console.error("Error fetching tabs:", error);
  }
}
