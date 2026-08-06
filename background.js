let currentURL;
let url;

chrome.runtime.onInstalled.addListener(() => {
  // Configures the extension icon to act as a toggle for the side panel
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
});

// chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
//   window.open
// });

async function setStorageLocal(items) {
  try {
    await chrome.storage.local.set(items)
  } catch (error) {
    console.error("Failed to save data to local storage:", error, chrome.runtime.lastError);
  }
}

async function getStorageLocal(key) {
  try {
    let values = await chrome.storage.local.get(String(key))
    // Check if the key exists in the object, even if the value is false, 0, or ""
    if (values && String(key) in values) {
      return values[String(key)];
    }
    return null
  } catch (error) {
    console.error("Failed to get data from local storage:", error, chrome.runtime.lastError);
    return null
  }
}

async function removeStorageLocal(items) {
  try {
    await chrome.storage.local.remove(items)
  } catch (error) {
    console.error("Failed to remove data to local storage:", error);
  }
}

async function checkWaybackMachine(url) {
  const apiUrl =
    `https://web.archive.org/cdx/search/cdx?url=${encodeURIComponent(url)}` +
    `&output=json&fl=timestamp,original,statuscode,mimetype,digest` +
    `&collapse=timestamp:4` + `&from=2020&to=2026`;

  console.log(`Checking Wayback CDX API for: ${url}`);

  try {
    // const response = await fetch(apiUrl);

    // if (!response.ok) {
    //   throw new Error(`HTTP error! status: ${response.status}`);
    // }

    // const data = await response.json();
    // console.log("raw data:", data);
    // const timestamps = [];

    // for (let i = 1; i < data.length; i = i + 1) {
    //   timestamps.push(data[i][0]);
    // }

    // console.log("BG time", timestamps)

    // return timestamps;

    return [
      "20221206224830",
      "20230110210253",
      "20240101215109",
      "20250101074344",
      "20260101013318"
    ]



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
  } catch (error) {
    console.error(`API Error:`, error);
    return [];
  }
}


async function getCurrentTabInfo() {
  let queryOptions = { active: true, lastFocusedWindow: true };

  let [tab] = await chrome.tabs.query(queryOptions);
  console.log("CURRENT URL: ", tab.url, tab.id);
  return tab;
}

async function changeTabURL(tabID, newUrl) {
  await chrome.tabs.update(tabID, { url: newUrl })
}


chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
  const currentTab = await getCurrentTabInfo();
  if (message.type === "GET_WAYBACK_DATA") {
    const key = `${currentTab.id}|${currentTab.url}`;

    const result = await getStorageLocal(key);
    if (result && Object.keys(result.information).length > 0) {
      sendResponse({ data: result });
      return;
    } else {
      console.log("FAILED")
    }

    const data = {
      identifiers: {
        tabURL: currentTab.url,
        tabID: currentTab.id,
      },
      information: {}
    };

    const timestamps = await checkWaybackMachine(currentTab.url);

    for (let i = 0; i < timestamps.length; i++) {
      const timestamp = timestamps[i];
      const link = `https://web.archive.org/web/${timestamp}/${currentTab.url}`;
      data.information[i] = { timestamp, link };
    }

    console.log("BG onMessage GET_WAYBACK_DATA: ", data);

    await setStorageLocal({
      [key]: data,
    });

    sendResponse({ data });

  } else if (message.type === "REWIND_PAGE") {
    console.log("BG onMessage REWIND_PAGE Received link:", message.selectedLink);
    changeTabURL(currentTab.id, message.selectedLink);

  } else if (message.type === "RETURN_PAGE_TO_HOME") {
    const key = `${currentTab.id}|${currentTab.url}`;
    const result = getStorageLocal(key)
    changeTabURL(currentTab.id, result.identifiers[tabURL]);



  }
  // else if (message.type === "GET_STORED_WAYBACK_DATA") {
  //   const key = `${currentTab.id}|${currentTab.url}`;
  //   const result = await getStorageLocal(key);
  //   const data = result ? result[key] : undefined;

  //   console.log("BG onMessage GET_STORED_WAYBACK_DATA:", currentTab.id, data);

  //   sendResponse({ data });
  // }
});


chrome.tabs.onActivated.addListener(async (activeInfo) => {
  chrome.runtime.sendMessage({ type: "TAB_ACTIVATED" })
});

