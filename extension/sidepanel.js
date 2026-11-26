/* Kairo Voice side panel — free dictation, polish and rewrite for any text field. */

const $ = (id) => document.getElementById(id);
const els = {
  orb: $("orb"), stage: document.querySelector(".stage"), hint: $("hint"), status: $("status"),
  text: $("text"), count: $("count"), insert: $("insert"), copy: $("copy"), clear: $("clear"),
  target: $("target"), targetTitle: $("targetTitle"), targetSub: $("targetSub"),
  tones: $("tones"), recentList: $("recentList"), recentCount: $("recentCount"),
  endpoint: $("endpoint"), apiKey: $("apiKey"), model: $("model"), language: $("language"), autoInsert: $("autoInsert"),
};

const DEFAULTS = {
  endpoint: "https://kairovoice.vercel.app",
  apiKey: "",
  model: "openrouter/free",
  language: "en",
  autoInsert: true,
  recent: [],
};

let settings = { ...DEFAULTS };
let mode = "voice";
let tone = "concise";
let activeTabId = null;
let recognition = null;
let recognizing = false;
let busy = false;
let finalText = "";
let interimText = "";
let shouldProcess = false;
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

function setStatus(label, kind = "") {
  els.status.querySelector("span").textContent = label;
  els.status.className = `status ${kind}`.trim();
}

function setBusy(value) {
  busy = value;
  els.orb.classList.toggle("busy", value);
  els.orb.disabled = value || recognizing;
  if (value) setStatus("Thinking…", "busy");
}

function updateOutput(text) {
  els.text.value = text;
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  els.count.textContent = `${words} ${words === 1 ? "word" : "words"}`;
  const hasText = Boolean(text.trim());
  els.insert.disabled = !hasText;
  els.copy.disabled = !hasText;
  els.clear.disabled = !hasText;
}

function setHint(message) { els.hint.textContent = message; }

async function getActiveTab() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    activeTabId = tab?.id ?? null;
    return activeTabId;
  } catch { return null; }
}

async function queryTarget() {
  if (!(await getActiveTab())) return;
  try {
    const result = await chrome.tabs.sendMessage(activeTabId, { type: "KAIRO_TARGET" });
    const active = Boolean(result?.hasTarget);
    els.target.classList.toggle("active", active);
    els.targetTitle.textContent = active ? `Ready in ${result.tag}` : "Click any text field";
    els.targetSub.textContent = active ? "Speak and Kairo will write straight into it." : "Then tap the orb and just speak.";
  } catch {
    els.target.classList.remove("active");
    els.targetTitle.textContent = "Open a website to start";
    els.targetSub.textContent = "Then click a text field and tap the orb.";
  }
}

chrome.runtime.onMessage.addListener((message) => {
  if (message?.type === "KAIRO_TARGET_CHANGED") {
    const active = Boolean(message.info?.hasTarget);
    els.target.classList.toggle("active", active);
    els.targetTitle.textContent = active ? `Ready in ${message.info.tag}` : "Click any text field";
    els.targetSub.textContent = active ? "Speak and Kairo will write straight into it." : "Then tap the orb and just speak.";
  }
});

/* ---------- Free, local text transforms (used when no key is added) ---------- */

function localPolish(text) {
  let out = text
    .replace(/\b(um+|umm|uh+|uhh|erm|like,?\s+you\s+know|you\s+know,?\s|hmm|matlab)\b/gi, " ")
    .replace(/\s{2,}/g, " ")
    .replace(/\s+([,.!?;:])/g, "$1")
    .replace(/([,.!?;:])\s+/g, "$1 ")
    .replace(/\bi\b/g, "I")
    .replace(/(^|[.!?।]\s+)([a-z])/g, (_m, prefix, letter) => prefix + letter.toUpperCase())
    .trim();
  if (out && !/[.!?।]$/.test(out)) out += ".";
  return out ? out.charAt(0).toUpperCase() + out.slice(1) : text.trim();
}

function localRewrite(text, style) {
  const polished = localPolish(text);
  const openers = { concise: "In short: ", professional: "To summarize: ", friendly: "Quick note: " };
  const sentences = polished.split(/(?<=[.!?।])\s+/).filter(Boolean);
  if (style === "concise") {
    const short = sentences.slice(0, Math.max(1, Math.ceil(sentences.length / 2))).join(" ");
    return short.replace(/\.$/, "") + ".";
  }
  if (style === "professional") return polished.replace(/'m|'ve|'re|'ll/g, (m) => (
    { "'m": " am", "'ve": " have", "'re": " are", "'ll": " will" }[m]
  ));
  return polished.replace(/\.$/, "") + " Hope that helps.";
}

async function cleanText(text) {
  if (mode === "voice") return text.trim();
  if (!settings.apiKey) {
    const result = mode === "polish" ? localPolish(text) : localRewrite(text, tone);
    setStatus("Free local pass", "");
    return result;
  }
  const response = await fetch(`${settings.endpoint.replace(/\/$/, "")}/api/cleanup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      text,
      apiKey: settings.apiKey,
      model: settings.model,
      language: settings.language,
      mode,
      tone,
    }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || typeof data.text !== "string") throw new Error(data.error || "Free model unavailable");
  return data.text.trim();
}

async function writeIntoPage(text, replaceSelection = false) {
  if (!settings.autoInsert) return;
  await getActiveTab();
  if (!activeTabId) return;
  try {
    const result = await chrome.tabs.sendMessage(activeTabId, { type: "KAIRO_INSERT", text, replaceSelection });
    if (result?.ok) setStatus("Written into field", "");
    else setStatus(result?.error || "Click a text field", "");
  } catch {
    setStatus("Click a text field", "");
  }
}

async function rememberRecent(text) {
  settings.recent = [text, ...(settings.recent || []).filter((item) => item !== text)].slice(0, 8);
  await chrome.storage.local.set({ recent: settings.recent });
  renderRecent();
}

function renderRecent() {
  const items = settings.recent || [];
  els.recentCount.textContent = String(items.length);
  els.recentList.innerHTML = items.length
    ? items.map((item, index) => `<button class="recent-item" data-index="${index}" title="${item.replace(/"/g, "&quot;")}">${item}</button>`).join("")
    : `<div class="empty">Nothing yet — your last results will appear here.</div>`;
  els.recentList.querySelectorAll(".recent-item").forEach((button) => {
    button.addEventListener("click", async () => {
      await writeIntoPage(items[Number(button.dataset.index)]);
    });
  });
}

async function processText(text, replaceSelection = false, skipInsert = false) {
  const source = String(text || "").trim();
  if (!source) return;
  setBusy(true);
  setHint("Kairo is shaping your words…");
  let result;
  try {
    result = await cleanText(source);
  } catch (error) {
    result = mode === "rewrite" ? localRewrite(source, tone) : localPolish(source);
    setStatus("Free local fallback", "");
  }
  setBusy(false);
  updateOutput(result);
  setHint("Inserted automatically · edit anytime");
  await rememberRecent(result);
  if (!skipInsert) await writeIntoPage(result, replaceSelection);
  if (recognizing) setStatus("Listening…", "live");
}

/* ---------- Speech ---------- */

function ensureRecognition() {
  if (recognition) return recognition;
  recognition = new SpeechRecognition();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.maxAlternatives = 1;

  recognition.onresult = (event) => {
    let final = "";
    let interim = "";
    for (let i = 0; i < event.results.length; i++) {
      const item = event.results[i];
      const transcript = item[0]?.transcript || "";
      if (item.isFinal) final += `${transcript} `;
      else interim += transcript;
    }
    finalText = final.trim();
    interimText = interim.trim();
    updateOutput([finalText, interimText].filter(Boolean).join(" "));
  };

  recognition.onerror = (event) => {
    const messages = {
      "not-allowed": "Microphone blocked — allow it for this page.",
      "no-speech": "No speech heard. Tap the orb again.",
      "audio-capture": "No microphone found.",
      network: "Speech needs an internet connection.",
    };
    shouldProcess = false;
    setStatus(messages[event.error] || `Mic error: ${event.error}`, "");
    setHint("Tap the orb to try again");
  };

  recognition.onend = () => {
    recognizing = false;
    els.orb.classList.remove("live");
    els.stage.classList.remove("live");
    els.orb.disabled = false;
    const spoken = finalText || interimText || els.text.value.trim();
    if (shouldProcess) {
      shouldProcess = false;
      setStatus("Ready", "");
      processText(spoken).then(() => { finalText = ""; interimText = ""; });
    } else if (!busy) {
      setStatus("Ready", "");
      setHint("Tap to speak · your words appear below");
    }
  };
  return recognition;
}

function startListening() {
  if (!SpeechRecognition) {
    setStatus("Use Chrome or Edge", "");
    setHint("Web Speech is available in Chromium browsers.");
    return;
  }
  finalText = "";
  interimText = "";
  updateOutput("");
  shouldProcess = true;
  recognition = ensureRecognition();
  recognition.lang = settings.language === "hi" ? "hi-IN" : settings.language === "hinglish" ? "en-IN" : "en-US";
  try {
    recognition.start();
    recognizing = true;
    els.orb.classList.add("live");
    els.stage.classList.add("live");
    els.orb.disabled = false;
    setStatus("Listening…", "live");
    setHint("Speaking… tap the orb when you're done");
  } catch {
    setStatus("Could not start mic", "");
  }
}

function stopListening() {
  shouldProcess = true;
  recognition?.stop();
  setStatus("Finishing…", "busy");
}

/* ---------- Wiring ---------- */

els.orb.addEventListener("click", () => {
  if (busy) return;
  recognizing ? stopListening() : startListening();
});

document.querySelectorAll(".mode").forEach((button) => {
  button.addEventListener("click", async () => {
    const next = button.dataset.mode;
    if (next === mode) return;
    mode = next;
    document.querySelectorAll(".mode").forEach((b) => b.classList.toggle("active", b === button));
    els.tones.classList.toggle("hidden", mode !== "rewrite");
    setHint(mode === "voice" ? "Tap the orb for raw dictation" : `${mode} is on — tap the orb or edit the text above`);
    const existing = els.text.value.trim();
    if (existing && !recognizing) await processText(existing, false, true);
  });
});

document.querySelectorAll(".tone").forEach((button) => {
  button.addEventListener("click", async () => {
    tone = button.dataset.tone;
    document.querySelectorAll(".tone").forEach((b) => b.classList.toggle("active", b === button));
    if (mode === "rewrite" && els.text.value.trim() && !recognizing) await processText(els.text.value.trim(), false, true);
  });
});

els.insert.addEventListener("click", () => writeIntoPage(els.text.value));
els.copy.addEventListener("click", async () => {
  await navigator.clipboard.writeText(els.text.value);
  setStatus("Copied", "");
});
els.clear.addEventListener("click", () => {
  updateOutput("");
  finalText = "";
  interimText = "";
  setStatus("Ready", "");
  setHint("Tap to speak · your words appear below");
});

els.text.addEventListener("input", () => {
  const words = els.text.value.trim() ? els.text.value.trim().split(/\s+/).length : 0;
  els.count.textContent = `${words} ${words === 1 ? "word" : "words"}`;
  els.insert.disabled = !els.text.value.trim();
  els.copy.disabled = !els.text.value.trim();
  els.clear.disabled = !els.text.value.trim();
});

document.addEventListener("keydown", (event) => {
  if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
    event.preventDefault();
    els.orb.click();
  }
});

["endpoint", "apiKey", "model", "language", "autoInsert"].forEach((key) => {
  els[key].addEventListener("change", async () => {
    settings[key] = key === "autoInsert" ? els[key].checked : els[key].value;
    await chrome.storage.local.set({ [key]: settings[key] });
    setStatus("Settings saved", "");
  });
});

chrome.storage.local.get(Object.keys(DEFAULTS)).then((stored) => {
  settings = { ...DEFAULTS, ...stored };
  els.endpoint.value = settings.endpoint;
  els.apiKey.value = settings.apiKey;
  els.model.value = settings.model;
  els.language.value = settings.language;
  els.autoInsert.checked = settings.autoInsert;
  renderRecent();
});

queryTarget();
setInterval(queryTarget, 4000);
