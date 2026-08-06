High Level Design 
    - The extension is installed
    - User opens a new tab ex: "youtube.com"
    - User clicks on the extension icon to open the popup
    - User then clicks the activate button on the popup 
    - When activate icon is clicked, the tab url and id are found for that tab
    - The tab url is used to call the WayBack API and find the past states of the tab per year
    - The past states + the year is saved + 
    - a message is sent to popup.js from background.js containing the past tab states, tab id. and the years
    - popup.js takes those values and uses the years to make a dynamic radio selecter (USER SEES THIS)
    - the value atribute in the radio selecter is set to the past tab states for that year
    - The user picks a specific year to rewind to
    - popup.js finds the value attribute for that option 
    - a message is sent to background.js from popup.js with that value attribute ( the wayback API)
    - using that value attribute ( the wayback API) and the previously saved tab ID the current tab (found via tabID) changes its url to wayBack APIs
    - The user then can change the rdio button to see other years of that tab! 


    user activates the extension 
    user opens a new tab 
    user clicks the activate button for that tab 
        PopUp -> BG GET_WAYBACK_DATA


    PopUp
        OnClick Activate Button
            Send  GET_WAYBACK_DATA to BG 
        
        OnMesssage
            

    BG
        OnMessage GET_WAYBACK_DATA message 
            check happens, does the tabID + url combo exists in local storage
                Yes 
                    Send message to PopUP with stored data
                NO
                    Send a request to WayBack and get wayback data
                    Store the wayback data in storage
                    Send message to PopUP with stored data

        TabOnActivated 
            Send CLEANUP message to PopUP


                        another check happens 
                            check if the current tabID + url equal to the tabID + url that was called
                                Yes 
                                    Load the previous a slider
                                No
                                    Do not create a slider
                    No 
                        Make a call to Wayback API and create the data which is sent to popup.js
                        Check if the the current tabID + url equal to the tabID + url that was called
                            Yes 
                                Create a new slider
                            No
                                Save data to the local storage with the old TABID + url combo
                                Do not make a slider

