/// <reference types="chrome" />

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

import type { BadKeywordCategory } from "../constants";

export const noop = () => {};

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function openOnboardingTab() {
  const onboardingUrl: string = `${chrome.runtime.getURL("static/onboarding.html")}?v=${Date.now()}`;
  chrome.tabs.create({ url: onboardingUrl });
}

export function formatCategoryLabel(category: BadKeywordCategory): string {
  if (category === "nsfw") {
    return "NSFW";
  }
  const firstLetter: string = category.charAt(0).toUpperCase();
  const rest: string = category.slice(1);
  return `${firstLetter}${rest}`;
}

export function getRandomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}
