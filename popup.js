document.addEventListener("DOMContentLoaded", init);

function init() {
    const rewind = document.getElementById("rewind");
    const home = document.getElementById("home");

    rewind.addEventListener("click", () => {
        setStatus("Looking up snapshots…");
        chrome.runtime.sendMessage({ type: "GET_WAYBACK_DATA" }, (response) => {
            if (chrome.runtime.lastError || !response || !response.data) {
                console.error("GET_WAYBACK_DATA failed:", chrome.runtime.lastError, response);
                setStatus("Couldn't load snapshots.");
                return;
            }
            setStatus("");
            createSlider(response.data);
        });
    });

    home.addEventListener("click", () => {
        // Reset the popup UI immediately — don't wait for a TAB_ACTIVATED
        // message, since navigating home on the same tab never fires one.
        clearSlider();
        setHomeEnabled(false);
        setStatus("Returned to the live page.");

        chrome.runtime.sendMessage({ type: "RETURN_PAGE_TO_HOME" }, () => {
            if (chrome.runtime.lastError) {
                console.error("RETURN_PAGE_TO_HOME failed:", chrome.runtime.lastError);
                setStatus("Couldn't return to the live page.");
            }
        });
    });
}

chrome.runtime.onMessage.addListener((message) => {
    if (message.type === "TAB_ACTIVATED") {
        clearSlider();
        setHomeEnabled(false);
        setStatus("");
    }
});

function createSlider(data) {
    clearSlider();

    const entries = data.information;
    const entryCount = Object.keys(entries).length;
    const section = document.getElementById("sliderSection");

    if (entryCount === 0) {
        const empty = document.createElement("p");
        empty.id = "emptyState";
        empty.className = "empty-state";
        empty.textContent = "No archived snapshots found for this page.";
        section.appendChild(empty);
        return;
    }

    const trackWrap = document.createElement("div");
    trackWrap.className = "slider-track";

    const rangeInput = document.createElement("input");
    rangeInput.type = "range";
    rangeInput.id = "rangeInput";
    rangeInput.min = 0;
    rangeInput.max = entryCount - 1;
    rangeInput.step = 1;
    rangeInput.value = Math.max(0, entryCount - 3);

    // Horizontal date labels for every entry, always visible (not just on
    // drag). With vertical-lr + rtl the slider's max sits at the top, so
    // list newest-first to line up with the track.
    const dateLabels = document.createElement("div");
    dateLabels.className = "date-labels";
    const orderedIdx = Object.keys(entries).slice().reverse();
    orderedIdx.forEach((idx) => {
        const tick = document.createElement("span");
        tick.textContent = formatShortDate(getDate(entries[idx].timestamp));
        tick.dataset.idx = idx;
        if (Number(idx) === Number(rangeInput.value)) tick.classList.add("active");
        dateLabels.appendChild(tick);
    });

    trackWrap.appendChild(rangeInput);
    trackWrap.appendChild(dateLabels);

    section.appendChild(trackWrap);

    rangeInput.addEventListener("input", (e) => {
        dateLabels.querySelectorAll("span").forEach((tick) => {
            tick.classList.toggle("active", tick.dataset.idx === e.target.value);
        });
    });

    rangeInput.addEventListener("change", (e) => {
        setStatus("Loading snapshot…");

        chrome.runtime.sendMessage(
            { type: "REWIND_PAGE", selectedLink: entries[e.target.value].link },
            (response) => {
                if (chrome.runtime.lastError) {
                    console.error("REWIND_PAGE failed:", chrome.runtime.lastError);
                    setStatus("Couldn't load that snapshot.");
                    return;
                }
                setStatus("");
                setHomeEnabled(true);
            }
        );
    });
}

function getDate(timestamp) {
    const year = parseInt(timestamp.substring(0, 4), 10);
    const month = parseInt(timestamp.substring(4, 6), 10) - 1; // Months are 0-11
    const day = parseInt(timestamp.substring(6, 8), 10);
    const hour = parseInt(timestamp.substring(8, 10), 10);
    const min = parseInt(timestamp.substring(10, 12), 10);
    const sec = parseInt(timestamp.substring(12, 14), 10);
    return new Date(year, month, day, hour, min, sec);
}

function formatShortDate(date) {
    return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    });
}

function clearSlider() {
    const section = document.getElementById("sliderSection");
    if (section) section.innerHTML = "";
}

function setHomeEnabled(enabled) {
    const home = document.getElementById("home");
    if (home) home.disabled = !enabled;
}

function setStatus(text) {
    const status = document.getElementById("status");
    if (status) status.textContent = text;
}