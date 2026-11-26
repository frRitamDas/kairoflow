/* Runs on every page. Remembers the last text field the user touched and writes Kairo output into it. */

(() => {
  if (window.__kairoContentReady) return;
  window.__kairoContentReady = true;

  const EDITABLE_INPUTS = new Set(["text", "search", "url", "email", "tel", "password", "number"]);

  function isEditable(el) {
    if (!el || !el.isConnected) return false;
    if (el instanceof HTMLTextAreaElement) return true;
    if (el instanceof HTMLInputElement) return EDITABLE_INPUTS.has(el.type);
    return Boolean(el.isContentEditable) || el.getAttribute?.("role") === "textbox";
  }

  function describe(el) {
    if (!isEditable(el)) return { hasTarget: false };
    return {
      hasTarget: true,
      tag: el.tagName.toLowerCase(),
      placeholder: el.getAttribute?.("placeholder") || el.getAttribute?.("aria-label") || "",
    };
  }

  let target = null;
  function remember(el) {
    if (!isEditable(el) || el === target) return;
    target = el;
    try {
      chrome.runtime.sendMessage({ type: "KAIRO_TARGET_CHANGED", info: describe(el) }).catch(() => {});
    } catch (_) { /* side panel may be closed */ }
  }

  document.addEventListener("focusin", (event) => remember(event.target), true);
  document.addEventListener("selectionchange", () => {
    const active = document.activeElement;
    if (isEditable(active)) remember(active);
  }, true);

  function currentTarget() {
    if (isEditable(target)) return target;
    if (isEditable(document.activeElement)) return document.activeElement;
    return null;
  }

  function readField(el, selectionOnly) {
    if (!el) return "";
    if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
      if (selectionOnly && el.selectionStart !== null && el.selectionEnd !== null) {
        return el.value.slice(el.selectionStart, el.selectionEnd);
      }
      return el.value || "";
    }
    if (selectionOnly) return String(window.getSelection() || "");
    return el.innerText || "";
  }

  function writeField(el, text, replaceSelection) {
    el.focus();

    if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
      const start = replaceSelection && el.selectionStart !== null ? el.selectionStart : (el.value?.length || 0);
      const end = replaceSelection && el.selectionEnd !== null ? el.selectionEnd : start;
      const next = (el.value || "").slice(0, start) + text + (el.value || "").slice(end);
      const setter = Object.getOwnPropertyDescriptor(el.constructor.prototype, "value")?.set;
      setter ? setter.call(el, next) : (el.value = next);
      const caret = start + text.length;
      el.setSelectionRange?.(caret, caret);
      el.dispatchEvent(new Event("input", { bubbles: true }));
      el.dispatchEvent(new Event("change", { bubbles: true }));
      return { ok: true, inserted: text.length };
    }

    if (replaceSelection && !String(window.getSelection() || "")) replaceSelection = false;
    if (replaceSelection) document.execCommand("insertText", false, text);
    else {
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(el);
      range.collapse(false);
      selection?.removeAllRanges();
      selection?.addRange(range);
      document.execCommand("insertText", false, text);
    }
    el.dispatchEvent(new Event("input", { bubbles: true }));
    return { ok: true, inserted: text.length };
  }

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    switch (message?.type) {
      case "KAIRO_TARGET":
        sendResponse(describe(currentTarget()));
        break;
      case "KAIRO_GET_TEXT":
        sendResponse({ text: readField(currentTarget(), Boolean(message.selectionOnly)) });
        break;
      case "KAIRO_INSERT": {
        const el = currentTarget();
        if (!el) return sendResponse({ ok: false, error: "Click a text field first, then try again." });
        sendResponse(writeField(el, String(message.text || ""), Boolean(message.replaceSelection)));
        break;
      }
      default:
        break;
    }
    return false;
  });
})();
