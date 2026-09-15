import Box from "@mui/material/Box";
import CssBaseline from "@mui/material/CssBaseline";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React, { useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import { Provider } from "react-redux";

import PopUpTop from "~/views/pop-up-top";
// Redux Store
import { store, storeReady } from "~store/store";
import PopUpLayout from "~views/PopUpLayout";
import { themeOptionsLight, themeOptionsDark } from "~mui-themes";

import "./style.css";

function IndexPopup() {
  const prefersDarkMode = useMediaQuery("(prefers-color-scheme: dark)");
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);
  // Hold rendering until redux state has been hydrated from storage so the
  // popup never flashes default state (idle 25:00 timer, default settings).
  const [isStoreReady, setIsStoreReady] = useState<boolean>(false);
  // Create a client
  const queryClient = new QueryClient();

  React.useEffect(() => {
    let cancelled = false;
    storeReady.then(() => {
      if (!cancelled) setIsStoreReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  React.useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    const initialDark = savedTheme ? savedTheme === "dark" : prefersDarkMode;
    setIsDarkMode(initialDark);

    const handleStorageChange = () => {
      const theme = localStorage.getItem("theme");
      setIsDarkMode(theme === "dark");
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [prefersDarkMode]);

  const theme = React.useMemo(
    () => {
      const baseTheme = isDarkMode ? themeOptionsDark : themeOptionsLight;
      return createTheme(baseTheme);
    },
    [isDarkMode]
  );

  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider theme={theme}>
          <CssBaseline>
            {
              // Only show the test view in development mode
              // process.env.NODE_ENV === "development" && <TestView />
            }

            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                minHeight:'100svh',
                height: "600px",
                maxHeight: "600px",
                overflow: "hidden"
              }}>
              {isStoreReady && (
                <>
                  <PopUpTop />
                  <PopUpLayout />
                </>
              )}
            </Box>
            {/* configure global toast settings, like theme */}
            <Toaster
              toastOptions={{
                position: "bottom-center",

                // Aria
                ariaProps: {
                  role: "status",
                  "aria-live": "polite"
                },

                // Styling
                className: "",

                success: {
                  style: {
                    background: "#030e18",
                    color: "#fff",
                    fontWeight: "500"
                  }
                },
                error: {
                  style: {
                    background: "#d32f2f",
                    color: "#fff",
                    fontWeight: "500"
                  }
                }
              }}
            />
          </CssBaseline>
        </ThemeProvider>
      </QueryClientProvider>
    </Provider>
  );
}

export default IndexPopup;
