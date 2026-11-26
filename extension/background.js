/* Kairo Voice service worker: opens the side panel and relays insert requests. */

chrome.runtime.onInstalled.addListener(() => {
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(() => {});
});

chrome.commands.onCommand.addListener(async (command) => {
  if (command === "_execute_action") {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.id) chrome.sidePanel.open({ tabId: tab.id }).catch(() => {});
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type === "KAIRO_INSERT") {
    chrome.tabs.sendMessage(message.tabId, { type: "KAIRO_INSERT", text: message.text })
      .then((result) => sendResponse(result))
      .catch((error) => sendResponse({ ok: false, error: error.message }));
    return true;
  }

  if (message?.type === "KAIRO_TARGET") {
    (async () => {
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tab?.id) return sendResponse({ hasTarget: false });
        const result = await chrome.tabs.sendMessage(tab.id, { type: "KAIRO_TARGET" });
        sendResponse(result);
      } catch {
        sendResponse({ hasTarget: false });
      }
    })();
    return true;
  }
});
