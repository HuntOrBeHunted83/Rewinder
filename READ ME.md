# Tab Rot
 
A Chrome extension that lets you rewind a webpage to see how it looked in the past, using the Wayback Machine.
 
## How to use it
 
1. Open a tab and click the extension icon to open the side panel.
2. Click Rewind. The extension looks up old saved versions of the page.
3. Drag the slider up and down to browse through dates.
4. Let go of the slider on a date to load that old version of the page in your tab.
5. Click "Return to live page" to go back to the real, current page.

## What each file does
 
- manifest.json — tells Chrome about the extension, its permissions, and where to find everything.
- background.js — runs in the background. It talks to the Wayback Machine, remembers snapshot data, and changes the tab's URL when you rewind or return home.
- popup.html — the layout of the popup you see (buttons, slider area).
- popup.css — the styling and colors.
- popup.js — makes the slider and date labels work, and talks to background.js.

## Notes
 
- Snapshot data is remembered for a day so it doesn't have to re-check every time.
- The slider gets taller or shorter depending on how many snapshots there are.
- The Rewind button shows "Searching…" and can't be clicked again while it's looking things up.
- The "Return to live page" button only turns on after you've actually rewound the page.

## Installing it yourself
 
1. Go to chrome://extensions in your browser.
2. Turn on Developer mode.
3. Click "Load unpacked" and choose this project's folder.
4. Click the extension icon on any page to try it.
 