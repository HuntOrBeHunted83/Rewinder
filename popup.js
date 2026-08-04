document.addEventListener("DOMContentLoaded", () => {
    const activate = document.getElementById("rewind");
    let years
    let links
    activate.addEventListener("click", async () => {
        chrome.runtime.sendMessage({ type: "GET_URL" }, (response) => {
            years = response.years
            links = response.WAYBACK_API_LINKS
            console.log(response.years);
            console.log(response.WAYBACK_API_LINKS);
        });

    })

})