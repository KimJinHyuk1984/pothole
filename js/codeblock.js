function fallbackCopy(text) {
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.append(textarea);
  textarea.select();
  const copied = document.execCommand("copy");
  textarea.remove();
  return copied;
}

async function copyText(text) {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // 권한이 없는 로컬 환경에서는 선택 영역 복사로 대체한다.
    }
  }
  return fallbackCopy(text);
}

function setupCopyButton(figure) {
  const button = figure.querySelector(".btn-copy");
  const code = figure.querySelector("code");
  if (!button || !code) return;

  let resetTimer = 0;
  button.addEventListener("click", async () => {
    const copied = await copyText(code.textContent);
    window.clearTimeout(resetTimer);
    button.textContent = copied ? "복사됨" : "복사 실패";
    resetTimer = window.setTimeout(() => {
      button.textContent = "복사";
    }, 1400);
  });
}

function setupCollapse(figure) {
  const collapseAt = Number(figure.dataset.collapse);
  const code = figure.querySelector("code");
  const button = figure.querySelector(".code-toggle");
  if (!collapseAt || !code || !button) return;

  const lineCount = code.textContent.replace(/\n$/, "").split("\n").length;
  if (lineCount <= collapseAt) {
    button.closest(".code-actions")?.remove();
    return;
  }

  figure.style.setProperty("--collapse-height", `${collapseAt * 1.75}em`);
  figure.classList.add("is-collapsed");
  button.setAttribute("aria-expanded", "false");
  button.textContent = "전체 보기";

  button.addEventListener("click", () => {
    const collapsed = figure.classList.toggle("is-collapsed");
    button.setAttribute("aria-expanded", String(!collapsed));
    button.textContent = collapsed ? "전체 보기" : "접기";
  });
}

document.querySelectorAll("figure.code").forEach((figure) => {
  setupCopyButton(figure);
  setupCollapse(figure);
});

window.Prism?.highlightAll();

function normalizeLineNumbers() {
  document.querySelectorAll("figure.code pre.line-numbers").forEach((pre) => {
    const code = pre.querySelector(":scope > code");
    const rows = code?.querySelector(":scope > .line-numbers-rows");
    if (!code || !rows) return;

    const lineCount = code.textContent.replace(/\n$/, "").split("\n").length;
    rows.replaceChildren(...Array.from({ length: lineCount }, () => document.createElement("span")));
    pre.append(rows);
  });
}

normalizeLineNumbers();
