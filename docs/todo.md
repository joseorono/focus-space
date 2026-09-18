# FocusSpace - Project TODO

## 🚀 Current Roadmap

### Critical / High Priority
- [ ] **UI Polish & Consistency**
  - [ ] Standardize view wrappers using `ViewContainer` across all views
  - [ ] Reduce icon-label gap in tabs (Settings tab already icon-only)
  - [ ] Fix any remaining MUI transition/ref issues

### Nice to Have
- [ ] **Enhanced Session Cleaner**
  - [ ] Show preview of tabs to be closed before execution
  - [ ] Add undo functionality for recently closed tabs
  - [ ] Move periodic tab checking to background script for persistence

- [ ] **Browser Cleaner Improvements**
  - [ ] Add time range scoping (last hour/day/week) with preview
  - [ ] Remove debug message UI from production
  - [ ] Better error handling and user feedback

- [ ] **Code Quality & Architecture**
  - [ ] Split `lib/history.ts` into pure functions + React Query hooks
  - [ ] Split `lib/tabs.ts` responsibilities and move mutations to hooks/
  - [ ] Add JSDoc documentation for public functions and hooks
  - [ ] Debounce Redux persistence writes to avoid excessive storage operations

- [ ] **Settings & UX**
  - [ ] Replace `confirm()` dialogs with MUI dialogs
  - [ ] Centralize toast messages in constants/utility module
  - [ ] Review and optimize naming conventions (e.g., `badKeywordCategories`)

## ✅ Completed Features

- [x] **Core Functionality**
  - [x] Panic Button (renamed to Session Cleaner)
  - [x] Clean All Browsing History by category
  - [x] Onboarding flow after install
  - [x] Redux persistence using @plasmohq/storage
  - [x] Settings view with categories, custom keywords, and whitelist
  - [x] Browser Cleaner view with time range selection
  - [x] Focus Mode with Pomodoro timer and task management
  - [x] Real-time notifications for distracting tabs
  - [x] Cross-context state synchronization

- [x] **UI/UX Foundation**
  - [x] Tab-based navigation layout
  - [x] Material UI integration with dark theme
  - [x] Responsive popup design
  - [x] Toast notifications system
  - [x] Error boundaries for robustness

## 📝 Notes

- The project uses Plasmo framework for Chrome extension development
- State management via Redux Toolkit with persistence
- UI built with React + Material-UI + Tailwind CSS
- All processing happens locally (privacy-focused)
- Extension targets Manifest V3

## 🔗 Related Docs

- See [docs/improvements.md](improvements.md) for detailed technical improvement suggestions
- Check [README.md](../README.md) for setup and development instructions
