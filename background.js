let currentURL;
let url;


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
    let values = await chrome.storage.local.get(key)
    // Check if the key exists in the object, even if the value is false, 0, or ""
    if (values && key in values) {
      return values[key];
    }
    return null
  } catch (error) {
    console.error("Failed to get data from local storage:", error, chrome.runtime.lastError);
    return null
  }
}

async function removeStorageLocl(items) {
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
  } catch (error) {
    console.error(`API Error:`, error);
  }
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

async function getCurrentTabId() {
  let queryOptions = { active: true, lastFocusedWindow: true };

  let [tab] = await chrome.tabs.query(queryOptions);
  let tabId;
  if (tab !== null && tab !== undefined) {
    tabId = tab.id;
  } else {
    tabId = undefined;
  }
  console.log("CURRENT TAB ID: ", tabId);
  return tabId;
}

async function changeTabURl(tabID, newUrl) {
  await chrome.tabs.update(tabID, { url: newUrl })
}


chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "GET_URL") {
    (async () => {
      let data = {
        identifiers: {
          tabURL: "",
          tabID: "",
        },
        information: {}
      }

      const currentURL = await getCurrentTabUrl();
      data.identifiers["tabURL"] = currentURL
      const tabID = await getCurrentTabId()
      data.identifiers["tabID"] = tabID
      const timestamps = await checkWaybackMachine(currentURL);

      for (let i = 0; i < timestamps.length; i++) {
        const timestamp = timestamps[i];
        const link = `https://web.archive.org/web/${timestamp}/${currentURL}`

        data.information[timestamp] = link
        console.log("timestamp: ", timestamp);
        console.log("API LINKS", link);
      }

      console.log("DATA ", data);

      await setStorageLocal({ [tabID]: data });
      sendResponse({
        data
      });
    })();

    return true;

  } else if (message.type === "REWIND_PAGE") {

    const selectedLink = message.selectedLink;
    console.log("Received link:", selectedLink);

    (async () => {
      const currentTabID = await getCurrentTabId();
      changeTabURl(currentTabID, selectedLink)
    })();


  }
});