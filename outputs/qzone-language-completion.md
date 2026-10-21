Implemented the English-default homepage and accessible English/中文 switch in the local React demo.

Translated sample fixtures, controls, error/status messages, image alternatives, accessible labels, page language, title, and description. Switching retains diary expansion, meetup filters, music playback, guestbook drafts, and submitted entries. Visitor-authored text remains literal. Refresh defaults to English.

Verification: all 28 Playwright desktop/phone tests pass, TypeScript and production build pass, existing syntax checks and all 9 backend tests pass. Reviewed refreshed desktop and 320/390/430px phone screenshots, English guestbook/dialog states, and a before/after comparison. Both language controls remain touch-sized and reachable on narrow phones.

Updated README, specification, screenshot capture helper, and visual QA report. Local preview remains at http://127.0.0.1:4173/. No deployment or backend changes. Physical-device coverage limitations remain documented.
