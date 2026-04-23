function normalizeNewlines(text) {
  return text.replace(/\r\n?/g, "\n");
}

function collapseBlankLines(lines) {
  const out = [];
  let lastWasBlank = false;
  for (const line of lines) {
    const isBlank = line.length === 0;
    if (isBlank) {
      if (!lastWasBlank) out.push("");
      lastWasBlank = true;
      continue;
    }
    out.push(line);
    lastWasBlank = false;
  }
  while (out.length > 0 && out[0] === "") out.shift();
  while (out.length > 0 && out[out.length - 1] === "") out.pop();
  return out;
}

function cleanText(raw, opts) {
  const input = normalizeNewlines(raw);
  let lines = input.split("\n");

  if (opts.trimLines) {
    lines = lines.map((l) => l.trim());
  }
  if (opts.collapseSpaces) {
    lines = lines.map((l) => l.replace(/[ \t]+/g, " "));
  }
  if (opts.collapseBlankLines) {
    lines = collapseBlankLines(lines);
  }

  return lines.join("\n");
}

async function copyToClipboard(text) {
  if (!text) return { ok: false, reason: "Nothing to copy" };

  if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
    try {
      await navigator.clipboard.writeText(text);
      return { ok: true };
    } catch {
      // Fall back below.
    }
  }

  const ta = document.createElement("textarea");
  ta.value = text;
  ta.setAttribute("readonly", "");
  ta.style.position = "fixed";
  ta.style.top = "-9999px";
  ta.style.left = "-9999px";
  document.body.appendChild(ta);
  ta.focus();
  ta.select();
  try {
    const ok = document.execCommand("copy");
    return ok ? { ok: true } : { ok: false, reason: "Copy failed" };
  } finally {
    document.body.removeChild(ta);
  }
}

function plural(n, word) {
  return n === 1 ? `${n} ${word}` : `${n} ${word}s`;
}

function computeStats(before, after) {
  const b = normalizeNewlines(before);
  const a = normalizeNewlines(after);

  const beforeLines = b.length === 0 ? 0 : b.split("\n").length;
  const afterLines = a.length === 0 ? 0 : a.split("\n").length;

  return {
    beforeChars: b.length,
    afterChars: a.length,
    beforeLines,
    afterLines,
  };
}

function main() {
  const inputEl = document.getElementById("inputText");
  const outputEl = document.getElementById("outputText");
  const statusEl = document.getElementById("statusText");
  const statsEl = document.getElementById("statsText");
  const btnCopy = document.getElementById("btnCopy");
  const btnClear = document.getElementById("btnClear");

  const optTrimLines = document.getElementById("optTrimLines");
  const optCollapseSpaces = document.getElementById("optCollapseSpaces");
  const optCollapseBlankLines = document.getElementById("optCollapseBlankLines");

  function getOpts() {
    return {
      trimLines: Boolean(optTrimLines.checked),
      collapseSpaces: Boolean(optCollapseSpaces.checked),
      collapseBlankLines: Boolean(optCollapseBlankLines.checked),
    };
  }

  function render() {
    const raw = inputEl.value ?? "";
    const cleaned = cleanText(raw, getOpts());
    outputEl.value = cleaned;

    const s = computeStats(raw, cleaned);
    statsEl.textContent = `${plural(s.afterChars, "char")} • ${plural(
      s.afterLines,
      "line",
    )}${s.afterChars === s.beforeChars && s.afterLines === s.beforeLines ? "" : " • changed"}`;
  }

  function setStatus(msg) {
    statusEl.textContent = msg;
  }

  inputEl.addEventListener("input", () => {
    render();
    setStatus("Updated");
  });

  for (const el of [optTrimLines, optCollapseSpaces, optCollapseBlankLines]) {
    el.addEventListener("change", () => {
      render();
      setStatus("Options updated");
    });
  }

  btnClear.addEventListener("click", () => {
    inputEl.value = "";
    render();
    setStatus("Cleared");
    inputEl.focus();
  });

  btnCopy.addEventListener("click", async () => {
    const text = outputEl.value ?? "";
    setStatus("Copying…");
    const res = await copyToClipboard(text);
    setStatus(res.ok ? "Copied" : res.reason || "Copy failed");
  });

  render();
}

document.addEventListener("DOMContentLoaded", main);
