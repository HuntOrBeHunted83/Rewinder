let currentURL;
let url;
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export function hostnameOf(url) {
  try {
    let newUrl = isArchiveUrl(url) ? originOf(url) : url
    return new URL(newUrl).hostname;
  } catch {
    return url;
  }
}


// https://web.archive.org/web/<ts>(if_)?/https://site/...
export function originOf(url) {
  const m = /^https?:\/\/web\.archive\.org\/web\/\d+(?:\w{2,3}_)?\/(.+)$/.exec(url || "");
  return m ? m[1] : url;
}

// true when the tab is already sitting on an archived page (mid-reverse).
export function isArchiveUrl(url) {
  return /^https?:\/\/web\.archive\.org\/web\/\d+/.test(url || "");
}


chrome.runtime.onInstalled.addListener(() => {
  // Configures the extension icon to act as a toggle for the side panel
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
});

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

async function getCurrentWaybackData(currentTab, key) {

  const data = {
    identifiers: {
      tabURL: currentTab.url,
      tabID: currentTab.id,
    },
    information: {}
  };

  const timestamps = await getWaybackDataFromApi(currentTab.url);

  for (let i = 0; i < timestamps.length; i++) {
    const timestamp = timestamps[i];
    const link = `https://web.archive.org/web/${timestamp}/${currentTab.url}`;
    data.information[i] = { timestamp, link };
  }
  data.identifiers["timestamp"] = Date.now()
  console.log("BG getCurrentWaybackData : ", data);

  await setStorageLocal({ [key]: data });
  return data
}

async function getWaybackDataFromApi(url) {
  const apiUrl =
    `https://web.archive.org/cdx/search/cdx?url=${encodeURIComponent(url)}` +
    `&output=json&fl=timestamp&collapse=timestamp:6`;

  console.log(`BG getWaybackDataFromApi url ${url}`);

  try {
    const response = await fetch(apiUrl);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log("BG getWaybackDataFromApi raw data:", data);
    const timestamps = [];

    for (let i = 1; i < data.length; i = i + 1) {
      timestamps.push(data[i][0]);
    }
    return timestamps;
  } catch (error) {
    console.error(`API Error:`, error);
    return [];
  }
}


async function getCurrentTabInfo() {
  let queryOptions = { active: true, lastFocusedWindow: true };

  let [tab] = await chrome.tabs.query(queryOptions);
  console.log("BG getCurrentTabInfo Key: ", tab.url, tab.id);
  return tab;
}

async function changeTabURL(tabID, newUrl) {
  await chrome.tabs.update(tabID, { url: newUrl })
}

async function getStoredWaybackData(key) {
  const storedWaybackData = await getStorageLocal(key);
  if (storedWaybackData) {
    if (Date.now() - storedWaybackData.identifiers["timestamp"] > ONE_DAY_MS || Object.keys(storedWaybackData.information).length == 0) {
      console.log("BG getStoredWaybackData waybackData is stale in storage, removing it")
      removeStorageLocal(key)
      return null
    } else {
      return storedWaybackData
    }
  } else {
    console.log("BG getStoredWaybackData waybackData not present in storage")
  }
  return null
}

chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
  const currentTab = await getCurrentTabInfo();
  const key = currentTab.id + ":" + hostnameOf(currentTab.url);

  if (message.type === "GET_WAYBACK_DATA") {
    console.log("BG onMessage GET_WAYBACK_DATA", key);
    let waybackData = await getStoredWaybackData(key)
    if (waybackData == null) {
      waybackData = await getCurrentWaybackData(currentTab, key)
    }
    sendResponse({ data: waybackData });

  } else if (message.type === "REWIND_PAGE") {
    console.log("BG onMessage REWIND_PAGE", key, message.selectedLink);
    changeTabURL(currentTab.id, message.selectedLink);

  } else if (message.type === "RETURN_PAGE_TO_HOME") {
    let waybackData = await getStoredWaybackData(key)
    if (waybackData) {
      await changeTabURL(currentTab.id, waybackData.identifiers.tabURL);
      sendResponse({ ok: true });
    } else {
      console.warn("No stored Wayback data found for this tab.");
      sendResponse({ ok: false });
    }
  }
});


chrome.tabs.onActivated.addListener(async (activeInfo) => {
  chrome.runtime.sendMessage({ type: "TAB_ACTIVATED" })
});