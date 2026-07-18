import { useState, type ChangeEvent, type KeyboardEvent } from "react";
import { useDispatch, useSelector } from "react-redux";
import { 
  Button, 
  Checkbox, 
  Box, 
  Dialog, 
  DialogActions, 
  DialogContent, 
  DialogContentText, 
  DialogTitle 
} from "@mui/material";
import { useTheme } from "@mui/material/styles";

import ViewContainer from "~components/view-container";
import ViewHeader from "~components/view-header";
import { badKeywordCategories } from "~constants";
import { cleanAllHistory } from "~lib/history";
import { checkboxColors } from "~mui-themes";
import type { BadKeywordCategory } from "~constants";
import { openOnboardingTab } from "~lib/utils";
import {
  addCustomKeyword,
  addWhitelistedDomain,
  removeCustomKeyword,
  removeWhitelistedDomain,
  resetSettings,
  toggleCategory,
  type SettingsState
} from "~store/features/settings/settingsSlice";
import type { RootState } from "~store/store";

// Simple function to format category labels
const formatCategoryLabel = (category: string): string => {
  return category
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

export default function SettingsView() {
  const dispatch = useDispatch();
  const settings = useSelector(
    (state: RootState) => state.settings
  ) as SettingsState;

  const [newKeyword, setNewKeyword] = useState("");
  const [newDomain, setNewDomain] = useState("");
  const [openResetDialog, setOpenResetDialog] = useState(false);

  const handleToggleCategory = (category: BadKeywordCategory) => {
    dispatch(toggleCategory(category));
  };

  const handleAddKeyword = () => {
    if (newKeyword.trim()) {
      dispatch(addCustomKeyword(newKeyword));
      setNewKeyword("");
    }
  };

  const handleRemoveKeyword = (keyword: string) => {
    dispatch(removeCustomKeyword(keyword));
  };

  const handleAddDomain = () => {
    if (newDomain.trim()) {
      dispatch(addWhitelistedDomain(newDomain));
      setNewDomain("");
    }
  };

  const handleRemoveDomain = (domain: string) => {
    dispatch(removeWhitelistedDomain(domain));
  };

  const handleOpenResetDialog = () => {
    setOpenResetDialog(true);
  };

  const handleCloseResetDialog = () => {
    setOpenResetDialog(false);
  };

  const handleConfirmReset = () => {
    dispatch(resetSettings());
    setOpenResetDialog(false);
  };

  return (
    <ViewContainer className="pb-1">
      <ViewHeader
        title="Settings"
        subtitle="Configure which content to clean from your browser"
      />

      <div className="mb-2 flex justify-end gap-2">
        <Button
          variant="outlined"
          size="small"
          onClick={() => openOnboardingTab()}>
          Go to Onboarding
        </Button>
        <Button
          variant="outlined"
          color="error"
          size="small"
          onClick={handleOpenResetDialog}>
          Reset Settings
        </Button>
      </div>

      {/* Categories Section */}
      <div className="mb-3 rounded-xl border border-gray-200 bg-white p-3 text-slate-900 transition-all duration-200 ease-in-out hover:border-blue-300 hover:shadow-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:hover:border-blue-600">
        <h2 className="mb-1.5 text-base font-semibold">Categories to Clean</h2>
        <div>
          <p className="mb-1.5 text-slate-600 dark:text-gray-400">Select categories to clean:</p>
          <div className="flex flex-wrap gap-1">
            {badKeywordCategories.map((category) => (
              <Box 
                key={category} 
                className="flex items-center rounded-md pr-2 py-0.5 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <Checkbox
                  checked={settings.selectedCategories.includes(category)}
                  onChange={() => handleToggleCategory(category)}
                  name={category}
                  sx={{
                    ...checkboxColors,
                    padding: '4px',
                    marginRight: '2px'
                  }}
                  size="small"
                />
                <span 
                  className="cursor-pointer text-sm" 
                  onClick={() => handleToggleCategory(category)}
                >
                  {formatCategoryLabel(category)}
                </span>
              </Box>
            ))}
          </div>
        </div>
      </div>

      {/* Custom Keywords Section */}
      <div className="mb-3 rounded-xl border border-gray-200 bg-white p-3 text-slate-900 transition-all duration-200 ease-in-out hover:border-blue-300 hover:shadow-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:hover:border-blue-600">
        <h2 className="mb-1.5 text-base font-semibold">Custom Keywords</h2>
        <p className="mb-1.5 text-slate-600 dark:text-gray-400">
          Add custom keywords to clean from your history
        </p>

        <div className="mb-3 flex">
          <input
            type="text"
            placeholder="New Keyword"
            className="mr-2 flex-1 rounded-md border border-gray-300 bg-white p-2 text-slate-900 placeholder:text-slate-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder:text-gray-400"
            value={newKeyword}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              setNewKeyword(e.target.value)
            }
            onKeyDown={(e: KeyboardEvent<HTMLInputElement>) =>
              e.key === "Enter" && handleAddKeyword()
            }
          />
          <button
            className="rounded-md bg-blue-500 px-4 py-1.5 text-sm text-white"
            onClick={handleAddKeyword}>
            Add
          </button>
        </div>

        <div className="flex flex-wrap">
          {settings.customKeywords.map((keyword: string) => (
            <span
              key={keyword}
              className="mb-2 mr-2 flex items-center rounded-md border border-gray-300 bg-white p-2 text-sm text-slate-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white">
              {keyword}
              <button
                className="ml-2 text-slate-500 hover:text-slate-900 dark:text-gray-400 dark:hover:text-white"
                onClick={() => handleRemoveKeyword(keyword)}
                aria-label="Remove keyword">
                &times;
              </button>
            </span>
          ))}
          {settings.customKeywords.length === 0 && (
            <p className="text-slate-600 dark:text-gray-400">No custom keywords added yet</p>
          )}
        </div>
      </div>

      {/* Whitelisted Domains Section */}
      <div className="mb-3 rounded-xl border border-gray-200 bg-white p-3 text-slate-900 transition-all duration-200 ease-in-out hover:border-blue-300 hover:shadow-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:hover:border-blue-600">
        <h2 className="mb-1.5 text-base font-semibold">Whitelisted Domains</h2>
        <p className="mb-1.5 text-slate-600 dark:text-gray-400">
          Add domains that should never be cleaned
        </p>

        <div className="mb-3 flex">
          <input
            type="text"
            placeholder="New Domain"
            className="mr-2 flex-1 rounded-md border border-gray-300 bg-white p-2 text-slate-900 placeholder:text-slate-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder:text-gray-400"
            value={newDomain}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              setNewDomain(e.target.value)
            }
            onKeyDown={(e: KeyboardEvent<HTMLInputElement>) =>
              e.key === "Enter" && handleAddDomain()
            }
          />
          <button
            className="rounded-md bg-blue-500 px-4 py-1.5 text-sm text-white"
            onClick={handleAddDomain}>
            Add
          </button>
        </div>

        <div className="flex flex-wrap">
          {settings.whitelistedDomains.map((domain: string) => (
            <span
              key={domain}
              className="mb-2 mr-2 flex items-center rounded-md border border-gray-300 bg-white p-2 text-sm text-slate-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white">
              {domain}
              <button
                className="ml-2 text-slate-500 hover:text-slate-900 dark:text-gray-400 dark:hover:text-white"
                onClick={() => handleRemoveDomain(domain)}
                aria-label="Remove domain">
                &times;
              </button>
            </span>
          ))}
          {settings.whitelistedDomains.length === 0 && (
            <p className="text-slate-600 dark:text-gray-400">No domains whitelisted yet</p>
          )}
        </div>
      </div>

      {/* Reset Confirmation Dialog */}
      <Dialog
        open={openResetDialog}
        onClose={handleCloseResetDialog}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description">
        <DialogTitle id="alert-dialog-title">Reset All Settings?</DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            This will reset all your settings to their default values,
            including:
            <ul style={{ marginTop: "8px", marginLeft: "16px" }}>
              <li>Selected categories</li>
              <li>Custom keywords</li>
              <li>Whitelisted domains</li>
            </ul>
            This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseResetDialog} color="primary">
            Cancel
          </Button>
          <Button
            onClick={handleConfirmReset}
            color="error"
            variant="contained"
            autoFocus>
            Reset
          </Button>
        </DialogActions>
      </Dialog>
    </ViewContainer>
  );
}