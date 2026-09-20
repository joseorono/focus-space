# Privacy Policy — FocusSpace

**Effective date:** September 17, 2026
**Extension:** FocusSpace: Pomodoro Timer, History Wipe & Tab Cleaner
**Publisher:** Exologic LLC

## Summary

FocusSpace does not collect, transmit, or sell any personal data. There is no
backend server, no analytics, no telemetry, and no account system. Everything
the extension does happens locally inside your browser.

## Single purpose

FocusSpace is a productivity and digital wellbeing tool. It eliminates
distractions by closing tabs that match user-selected distraction categories,
clearing recent browsing history on request, and providing a local Pomodoro
focus timer with task management.

## What data is stored, and where

FocusSpace stores your settings using the browser's local extension storage
(`chrome.storage.local`). That data never leaves your device. It consists of:

- Which distraction categories you have enabled
- Custom trigger keywords you have added
- Domains you have whitelisted
- Your current and archived tasks
- Pomodoro timer settings and session counts

You can erase all of it at any time by removing the extension from your browser.

## What data is NOT collected

- No browsing history is read, copied, uploaded, or retained.
- No tab URLs are stored. Tab URLs are matched against your keyword list in
  memory at the moment you click the cleaner, then discarded.
- No personal identifiers, email addresses, or account credentials.
- No analytics, crash reporting, advertising, or fingerprinting.
- No data is transferred to any third party, for any purpose.
- No data is used for creditworthiness or lending purposes.

## Network activity

FocusSpace makes no external network requests. The extension runs entirely
client-side within the browser's service worker and popup.

## Permissions and why they are needed

| Permission | Why it is required |
| :--- | :--- |
| `tabs` | To read the URLs of open tabs so tabs matching your selected distraction categories can be identified and closed when you click "Clean Session". |
| `history` | To clear browsing history within a time range you select, using `chrome.history.deleteRange`, so recent distractions stop appearing in address bar autocomplete. |
| `storage` | To save your preferences locally: enabled categories, custom keywords, whitelisted domains, tasks, and Pomodoro settings. |
| `alarms` | To schedule a reliable background alarm that fires when a Pomodoro focus or break interval ends, even if the popup is closed. |
| `notifications` | To show a desktop notification when a focus sprint or rest break completes. |

FocusSpace requests no host permissions and cannot read or modify the content of
any web page.

## Destructive actions are always user-initiated

Closing tabs and clearing history are irreversible browser operations. They run
only when you explicitly click the corresponding button in the extension popup.
FocusSpace never performs them automatically or on a schedule. Whitelisted
domains are never closed by the tab cleaner.

## Open source

FocusSpace is licensed under the GNU General Public License v3.0. The complete
source code is available for inspection, audit, or forking at
https://github.com/joseorono/focus-space

## Changes to this policy

Any changes to this policy will be committed to the public repository, and the
effective date above will be updated.

## Contact

Questions or concerns: https://github.com/joseorono/focus-space/issues
