/// <reference types="chrome" />

import { Storage } from "@plasmohq/storage";

import { FOCUS_ALARM_NAME } from "~constants";
import type { FocusState } from "~store/features/focus/focusSlice";
import { applySessionCompletion } from "~store/features/focus/session-completion";

export {};

interface ReduxState {
  focus: FocusState;
  [key: string]: any;
}

console.log("Background Worker Active. You can now use the extension");

const storage = new Storage({ area: "local" });

/*
    Timer architecture (MV3-safe):

    The running session is represented by focus.sessionEndTime (an absolute
    epoch-ms timestamp set by the startTimer reducer), not by a per-second
    counter. A single chrome.alarms alarm scheduled at that timestamp wakes
    this service worker to complete the session and fire the notification,
    even if Chrome suspended the worker or the popup is closed. No setInterval,
    no in-memory cached state — every handler loads fresh state from storage.
*/

function scheduleOrClearAlarm(focus: FocusState | undefined | null) {
  if (focus?.timerStatus === "running" && focus.sessionEndTime) {
    // create() with the same name replaces any previous alarm, so calling
    // this on every state change is idempotent
    chrome.alarms.create(FOCUS_ALARM_NAME, { when: focus.sessionEndTime });
  } else {
    chrome.alarms.clear(FOCUS_ALARM_NAME);
  }
}

async function completeSessionAndNotify(state: ReduxState) {
  const focus = state.focus;

  applySessionCompletion(focus);
  await storage.set("reduxState", state);

  const nextMode = focus.timerMode === "work" ? "work" : "break";
  const message =
    nextMode === "work"
      ? " Break complete! Ready for another Deep Work session?"
      : " Session complete! Time for a well-deserved break.";

  chrome.notifications.create({
    type: "basic",
    iconUrl: chrome.runtime.getURL("icon.png"),
    title: "FocusSpace",
    message: message,
    priority: 2
  });
}

// Keep the completion alarm in sync with the timer status
storage.watch({
  reduxState: (change) => {
    scheduleOrClearAlarm(change.newValue?.focus);
  }
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name !== FOCUS_ALARM_NAME) return;

  try {
    const state = (await storage.get("reduxState")) as ReduxState | null;
    const focus = state?.focus;
    // The session may have been paused/reset since the alarm was scheduled,
    // or rescheduled further into the future — in both cases do nothing
    if (!focus || focus.timerStatus !== "running") return;
    if (focus.sessionEndTime && focus.sessionEndTime > Date.now() + 1000) {
      scheduleOrClearAlarm(focus);
      return;
    }

    await completeSessionAndNotify(state);
  } catch (error) {
    console.error("Timer completion error:", error);
  }
});

// Reconcile on worker startup: complete sessions that ended while the browser
// was closed, and re-schedule the alarm for ones still in flight
async function reconcileTimerState() {
  try {
    const state = (await storage.get("reduxState")) as ReduxState | null;
    const focus = state?.focus;
    if (focus?.timerStatus !== "running") return;

    if (!focus.sessionEndTime || focus.sessionEndTime <= Date.now()) {
      console.log("Completing session that ended while worker was down");
      await completeSessionAndNotify(state as ReduxState);
    } else {
      console.log("Re-scheduling completion alarm on startup");
      scheduleOrClearAlarm(focus);
    }
  } catch (error) {
    console.error("Timer reconciliation error:", error);
  }
}

chrome.runtime.onStartup.addListener(() => {
  reconcileTimerState();
});

reconcileTimerState();

chrome.runtime.onInstalled.addListener(
  ({ reason }: chrome.runtime.InstalledDetails): void => {
    if (reason === "install") {
      const onboardingUrl: string = `${chrome.runtime.getURL("static/onboarding.html")}?v=${Date.now()}`;
      chrome.tabs.create({ url: onboardingUrl });
    }
  }
);
