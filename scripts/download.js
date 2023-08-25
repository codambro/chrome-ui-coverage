const DOWNLOAD = "download";
const TOGGLE_COLORS = "toggleColors";

function contextClick(info, tab) {
    const { menuItemId } = info;
    chrome.tabs.sendMessage(tab.id, { task: menuItemId });
}

chrome.contextMenus.removeAll();
chrome.contextMenus.create({
    id: DOWNLOAD,
    title: "Download Coverage Report",
    contexts: ["action"],
});
chrome.contextMenus.create({
    id: TOGGLE_COLORS,
    title: "Toggle Colors",
    contexts: ["action"],
});
chrome.contextMenus.onClicked.addListener(contextClick);