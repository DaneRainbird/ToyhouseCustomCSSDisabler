/**
 * File: background.js
 * Author: Dane Rainbird (hello@danerainbird.me)
 * Purpose: Background script for the Toyhouse CSS Toggle extension, which listens for clicks on the extension icon and applies the saved state to Toyhouse tabs.
 */

const TOYHOUSE_URL = "https://toyhou.se";

// Set the badge text to "ON" when the extension is installed (i.e. should default to enabling styles)
chrome.runtime.onInstalled.addListener(() => {
    chrome.action.setBadgeText({
        text: "ON",
    });
});

/**
 * Helper function to toggle the disabled state of all style tags on the page
 * 
 * @param {boolean} enabled whether to enable or disable the style tags
 */
function toggleStyleTags(enabled) {
    const STYLETAGS = document.querySelectorAll('style');
    for (let i = 0; i < STYLETAGS.length; i++) {
        STYLETAGS[i].disabled = !enabled;
    }
    // Save the enabled state to local storage
    chrome.storage.local.set({styleTagsEnabled: enabled});
}
/**
 * Helper function to set the badge text for a tab
 * 
 * @param {string} tabId the id of the tab to set the badge text for
 * @param {string} text the text to set the badge to
 */
function setBadgeText(tabId, text) {
    chrome.action.setBadgeText({
        tabId: tabId,
        text: text,
    });
}

/**
 * Helper function to apply the saved state of the extension (i.e. whether to enable or disable the style tags on the page)
 * 
 * @param {string} tabId the id of the tab to apply the saved state to
 */
function applySavedState(tabId) {
    chrome.storage.local.get("styleTagsEnabled", (data) => {
        const enabled = data.styleTagsEnabled;
        // Default to true if not set
        const stateToApply = enabled !== undefined ? enabled : true;
        chrome.scripting.executeScript({
            target: {tabId: tabId},
            function: toggleStyleTags,
            args: [stateToApply],
        });

        // Update the badge text
        setBadgeText(tabId, stateToApply ? "ON" : "OFF");
    });
}

// Listen for when the extension icon is clicked in the browser
chrome.action.onClicked.addListener(async (tab) => {
    if (tab.url.startsWith(TOYHOUSE_URL)) {
        const prevState = await chrome.action.getBadgeText({tabId: tab.id});
        const nextState = prevState === 'ON' ? 'OFF' : 'ON';

        await setBadgeText(tab.id, nextState);

        const enabled = nextState === 'ON';
        await chrome.scripting.executeScript({
            target: {tabId: tab.id},
            function: toggleStyleTags,
            args: [enabled],
        });
    }
});

// Listen for when a tab is updated to a Toyhouse tab to apply the saved state
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (tab.url && tab.url.startsWith(TOYHOUSE_URL)) {
        applySavedState(tabId);
    }
});