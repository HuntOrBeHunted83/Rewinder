let currentURL;
let url;

// chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
//   if (changeInfo.status === "complete" && tab.url && tab.url.startsWith("http")) {
//     checkWaybackMachine(tab.url, tabId);
//   }
// });

async function checkWaybackMachine(url) {
  const apiUrl =
    `https://web.archive.org/cdx/search/cdx?url=${encodeURIComponent(url)}` +
    `&output=json&fl=timestamp,original,statuscode,mimetype,digest` +
    `&collapse=timestamp:4`;

  console.log(`Checking Wayback CDX API for: ${url}`);

  // try {
  const response = await fetch(apiUrl);

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  console.log("raw data:", data);
  const timestamps = [];

  for (let i = 1; i < data.length; i = i + 1) {
    timestamps.push(data[i][0]);
  }

  return timestamps;

  //   if (!Array.isArray(data) || data.length <= 1) {
  //     console.log(` No snapshots found for this URL.`);
  //     return;
  //   }

  //   const headers = data[0];
  //   const snapshots = data.slice(1).map(row =>
  //     Object.fromEntries(headers.map((h, i) => [h, row[i]]))
  //   );

  //   console.log(` Found ${snapshots.length} yearly snapshots:`);
  //   snapshots.forEach((snap, index) => {
  //     console.log(
  //       `[${index + 1}] ${snap.timestamp} | ${snap.original} | ${snap.statuscode} | ${snap.mimetype} | ${snap.digest}`
  //     );
  //   });
  //   console.log("RAW SNAPSHOT DATA", snapshots)
  // } catch (error) {
  //   console.error(`API Error:`, error);
  // }
}

async function getCurrentTabUrl() {
  let queryOptions = { active: true, lastFocusedWindow: true };

  let [tab] = await chrome.tabs.query(queryOptions);
  if (tab !== null && tab !== undefined) {
    url = tab.url;
  } else {
    url = undefined;
  }
  console.log("CURRENT URL: ", url);
  return url;
}

chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
  if (message.type === "GET_URL") {
    const waybackApiLinks = [];
    const years = []
    currentURL = await getCurrentTabUrl();
    const timestamps = await checkWaybackMachine(currentURL);

    for (let i = 0; i < timestamps.length; i = i + 1) {
      const timestamp = timestamps[i];
      waybackApiLinks.push(`https://web.archive.org/web/${timestamp}/${currentURL}`);
    }

    for (let i = 0; i < timestamps.length; i = i + 1) {
      years.push(timestamps[i].slice(0, 4));
    }


    console.log("YEARS: ", years);
    console.log("API LINKS", waybackApiLinks);

    sendResponse({
      years,
      waybackApiLinks,
    });

    return true;
  }
});