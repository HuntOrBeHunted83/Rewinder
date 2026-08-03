chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && tab.url && tab.url.startsWith("http")) {
    checkWaybackMachine(tab.url, tabId);
  }
});

async function checkWaybackMachine(url, tabId) {
  const apiUrl =
    `https://web.archive.org/cdx/search/cdx?url=${encodeURIComponent(url)}` +
    `&output=json&fl=timestamp,original,statuscode,mimetype,digest` +
    `&collapse=timestamp:4`;

  console.log(`Checking Wayback CDX API for: ${url}`);

  try {
    const response = await fetch(apiUrl);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log("raw data:", data);

    if (!Array.isArray(data) || data.length <= 1) {
      console.log(`[Tab ${tabId}] No snapshots found for this URL.`);
      return;
    }

    const headers = data[0];
    const snapshots = data.slice(1).map(row =>
      Object.fromEntries(headers.map((h, i) => [h, row[i]]))
    );

    console.log(`[Tab ${tabId}] Found ${snapshots.length} yearly snapshots:`);
    snapshots.forEach((snap, index) => {
      console.log(
        `[${index + 1}] ${snap.timestamp} | ${snap.original} | ${snap.statuscode} | ${snap.mimetype} | ${snap.digest}`
      );
    });
  } catch (error) {
    console.error(`API Error on tab ${tabId}:`, error);
  }
}


