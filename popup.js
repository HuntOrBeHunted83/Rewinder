document.addEventListener("DOMContentLoaded", init);

function init() {
    const activate = document.getElementById("rewind");
    const home = document.getElementById("home");
    const container = document.getElementById("years");

    activate.addEventListener("click", () => {
        chrome.runtime.sendMessage({ type: "GET_WAYBACK_DATA" }, (response) => {
            if (chrome.runtime.lastError || !response || !response.data) {
                console.error("GET_WAYBACK_DATA failed:", chrome.runtime.lastError, response);
                return;
            }
            const data = response.data;
            console.log("popup", data, data.information);
            createSlider(data)
        });
    });

    home.addEventListener("click", () => {
        chrome.runtime.sendMessage({ type: "RETURN_PAGE_TO_HOME" })
    });



}


chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
    if (message.type === "TAB_ACTIVATED") {
        clearSlider()

    }
})



// function getOldData() {
//     chrome.runtime.sendMessage({ type: "GET_STORED_WAYBACK_DATA" }, (response) => {
//         const data = response.data;
//         console.log(data);
//         createSlider(data)
//     });
// }


function createSlider(data) {
    clearSlider();

    const entryCount = Object.keys(data.information).length;

    if (entryCount === 0) {
        const empty = document.createElement('p');
        empty.id = 'noResults';
        empty.textContent = 'No archived snapshots found for this page.';
        document.body.appendChild(empty);
        return;
    }



    const rangeInput = document.createElement('input');
    rangeInput.type = 'range';
    rangeInput.id = 'rangeInput';
    rangeInput.min = 0;
    rangeInput.max = entryCount - 1;
    rangeInput.step = 1;
    // rangeInput.orient = 'vertical'
    rangeInput.value = entryCount - 3;
    rangeInput.list = "volumeSteps"


    const label1 = document.createElement('label');
    label1.id = 'label1';

    const label2 = document.createElement('label');
    label2.id = 'label2';

    document.body.appendChild(rangeInput);
    document.body.appendChild(label1);
    document.body.appendChild(label2);

    rangeInput.addEventListener('input', (e) => {
        const timestamp = data.information[e.target.value].timestamp;
        label1.textContent = getDate(timestamp).toDateString();
    });

    rangeInput.addEventListener('change', (e) => {
        const timestamp = data.information[e.target.value].timestamp;
        label2.textContent = getDate(timestamp).toDateString();

        chrome.runtime.sendMessage(
            { type: "REWIND_PAGE", selectedLink: data.information[e.target.value].link },
            (response) => {
                if (chrome.runtime.lastError) {
                    console.error("REWIND_PAGE failed:", chrome.runtime.lastError);
                }
            }
        );
    });
}

function getDate(timestamp) {
    // Extract components based on fixed positions
    const year = parseInt(timestamp.substring(0, 4), 10);
    const month = parseInt(timestamp.substring(4, 6), 10) - 1; // Months are 0-11
    const day = parseInt(timestamp.substring(6, 8), 10);
    const hour = parseInt(timestamp.substring(8, 10), 10);
    const min = parseInt(timestamp.substring(10, 12), 10);
    const sec = parseInt(timestamp.substring(12, 14), 10);

    // Create the local Date object
    const date = new Date(year, month, day, hour, min, sec);
    return date
}

function clearSlider() {
    const range = document.getElementById("rangeInput");
    if (range) range.remove();

    const label1 = document.getElementById("label1");
    if (label1) label1.remove();

    const label2 = document.getElementById("label2");
    if (label2) label2.remove();

    const noResults = document.getElementById("noResults");
    if (noResults) noResults.remove();
}

//createSlider();


// "action": {
//   "default_title": "Click to view a popup",
//   "default_popup": "popup.html"
// },