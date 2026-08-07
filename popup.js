document.addEventListener("DOMContentLoaded", init);

function init() {
    const rewind = document.getElementById("rewind");
    const home = document.getElementById("home");

    rewind.addEventListener("click", () => {
        setRewindLoading(true);
        setStatus("Looking up snapshots…");
        chrome.runtime.sendMessage({ type: "GET_WAYBACK_DATA" }, (response) => {
            setRewindLoading(false);
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

    // Slider length scales with how many snapshots there are, clamped to a
    // sane range so it never gets too cramped or absurdly tall.
    const THUMB = 20; // must match the ::-webkit-slider-thumb size in CSS
    const PER_ENTRY = 42; // px of track per snapshot, roughly enough for a label
    const MIN_HEIGHT = 200;
    const MAX_HEIGHT = 760;
    const trackHeight = Math.min(
        MAX_HEIGHT,
        Math.max(MIN_HEIGHT, PER_ENTRY * (entryCount - 1) + THUMB)
    );

    const trackWrap = document.createElement("div");
    trackWrap.className = "slider-track";
    trackWrap.style.setProperty("--slider-height", `${trackHeight}px`);

    const rangeInput = document.createElement("input");
    rangeInput.type = "range";
    rangeInput.id = "rangeInput";
    rangeInput.min = 0;
    rangeInput.max = entryCount - 1;
    rangeInput.step = 1;
    rangeInput.value = Math.max(0, entryCount - 1);

    // Horizontal date labels for every entry, always visible (not just on
    // drag). With vertical-lr + rtl the slider's max sits at the top, so
    // list newest-first to line up with the track.
    //
    // Positioned absolutely rather than with flex space-between: a range
    // thumb doesn't travel the full element height, it travels from
    // "half a thumb in" to "half a thumb from the end" — this formula
    // mirrors that exactly so each label sits at the thumb's real stop.
    const dateLabels = document.createElement("div");
    dateLabels.className = "date-labels";
    const orderedIdx = Object.keys(entries).slice().reverse();
    orderedIdx.forEach((idx, i) => {
        const tick = document.createElement("span");
        tick.textContent = formatShortDate(getDate(entries[idx].timestamp));
        tick.dataset.idx = idx;
        if (Number(idx) === Number(rangeInput.value)) tick.classList.add("active");

        const fraction = entryCount === 1 ? 0.5 : i / (entryCount - 1);
        const top = THUMB / 2 + fraction * (trackHeight - THUMB);
        tick.style.top = `${top}px`;

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

function setRewindLoading(loading) {
    const rewind = document.getElementById("rewind");
    if (!rewind) return;
    rewind.disabled = loading;
    rewind.innerHTML = loading
        ? `<span class="icon">⏳</span> Searching…`
        : `<span class="icon">⏪</span> Rewind`;
}

function setHomeEnabled(enabled) {
    const home = document.getElementById("home");
    if (home) home.disabled = !enabled;
}

function setStatus(text) {
    const status = document.getElementById("status");
    if (status) status.textContent = text;
}