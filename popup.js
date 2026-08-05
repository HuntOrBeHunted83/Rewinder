document.addEventListener("DOMContentLoaded", init);

function init() {

    const activate = document.getElementById("rewind");
    const container = document.getElementById("years");
    getOldData(container)
    activate.addEventListener("click", () => {
        chrome.runtime.sendMessage({ type: "GET_URL" }, (response) => {
            const data = response.data;
            console.log(data);
            setRadioButtons(data, container);
        });
    });

    container.addEventListener("change", (event) => {
        if (event.target.matches('input[type="radio"][name="years"]')) {
            const selectedLink = event.target.value;
            chrome.runtime.sendMessage({ type: "REWIND_PAGE", selectedLink });
            console.log("selectedLINK", selectedLink);
        }
    });
}

function setRadioButtons(data, container) {
    container.innerHTML = "";

    for (const [year, link] of Object.entries(data.information)) {
        const label = document.createElement("label");
        const radio = document.createElement("input");

        radio.type = "radio";
        radio.name = "years";
        radio.value = link;

        label.appendChild(radio);
        label.appendChild(document.createTextNode(year.slice(0, 4)));
        container.appendChild(label);
    }
}

function getOldData(container) {
    chrome.runtime.sendMessage({ type: "GET_OLD_DATA" }, (response) => {
        if (response.data !== "NOTHING_FOUND") {
            setRadioButtons(response.data, container)
        } else {
            return;
        }
    });



}