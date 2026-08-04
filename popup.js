document.addEventListener("DOMContentLoaded", () => {
    const activate = document.getElementById("rewind");
    const container = document.getElementById("years");

    activate.addEventListener("click", () => {
        chrome.runtime.sendMessage({ type: "GET_URL" }, (response) => {
            const data = response.data;
            console.log(data);

            container.innerHTML = "";

            for (const [year, link] of Object.entries(data)) {
                const label = document.createElement("label");
                const radio = document.createElement("input");

                radio.type = "radio";
                radio.name = "years";
                radio.value = link;

                label.appendChild(radio);
                label.appendChild(document.createTextNode(year));
                container.appendChild(label);

            }





            // years.forEach((year) => {
            //     const label = document.createElement("label");
            //     const radio = document.createElement("input");

            //     radio.type = "radio";
            //     radio.name = "years";
            //     radio.value = 8278;

            //     label.appendChild(radio);
            //     label.appendChild(document.createTextNode(year));
            //     container.appendChild(label);
            // });
        });
    });
});