const root = document.documentElement;
const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
const HELP_SESSION_KEY = "pothole:present-help-shown";

function applyLineHighlight(pre, lines) {
  pre.querySelectorAll(".line-highlight").forEach((highlight) => highlight.remove());

  if (!lines) {
    pre.removeAttribute("data-line");
    return;
  }

  pre.dataset.line = lines;
  const lineHighlight = window.Prism?.plugins?.lineHighlight;
  if (lineHighlight) {
    lineHighlight.highlightLines(pre)();
  }
}

function lastLineOf(range) {
  return Math.max(
    ...range.split(",").flatMap((part) => part.split("-").map((value) => Number(value.trim()) || 0)),
  );
}

export class CodeStepper {
  constructor(figure) {
    this.figure = figure;
    this.pre = figure.querySelector("pre");
    this.note = figure.querySelector(".code-note");
    this.collapseToggle = figure.querySelector(".code-toggle");
    this.idleNote = this.note?.textContent.trim() || "단계를 시작하면 설명이 표시됩니다.";
    this.index = 0;
    this.noteTimer = 0;

    try {
      this.steps = JSON.parse(figure.dataset.steps);
    } catch (error) {
      console.error("data-steps JSON을 읽을 수 없습니다.", error);
      this.steps = [];
    }

    this.steps = this.steps.filter((step) => step?.lines && typeof step.note === "string");
    this.createControls();
    this.setStep(0, { immediate: true });
  }

  get length() {
    return this.steps.length;
  }

  createControls() {
    const controls = document.createElement("div");
    controls.className = "code-step-controls";
    controls.setAttribute("aria-label", "코드 줄 강조 단계");

    this.previousButton = document.createElement("button");
    this.previousButton.type = "button";
    this.previousButton.className = "code-step-button";
    this.previousButton.textContent = "이전";

    this.dots = document.createElement("ol");
    this.dots.className = "code-step-dots";
    this.dots.setAttribute("aria-hidden", "true");
    this.dotItems = this.steps.map(() => {
      const dot = document.createElement("li");
      dot.className = "code-step-dot";
      this.dots.append(dot);
      return dot;
    });

    this.status = document.createElement("span");
    this.status.className = "code-step-status";
    this.status.setAttribute("aria-live", "polite");

    this.nextButton = document.createElement("button");
    this.nextButton.type = "button";
    this.nextButton.className = "code-step-button";
    this.nextButton.textContent = "다음";

    controls.append(this.previousButton, this.dots, this.status, this.nextButton);
    this.figure.append(controls);

    this.previousButton.addEventListener("click", () => this.setStep(this.index - 1));
    this.nextButton.addEventListener("click", () => this.setStep(this.index + 1));
  }

  setStep(nextIndex, { immediate = false } = {}) {
    const clamped = Math.max(0, Math.min(this.length, nextIndex));
    this.index = clamped;
    this.figure.dataset.stepIndex = String(clamped);

    const step = clamped === 0 ? null : this.steps[clamped - 1];
    applyLineHighlight(this.pre, step?.lines || "");
    this.expandForHighlight(step?.lines);
    this.updateNote(step?.note || this.idleNote, immediate);
    this.updateControls();
  }

  expandForHighlight(lines) {
    const collapseAt = Number(this.figure.dataset.collapse);
    if (!lines || !collapseAt || lastLineOf(lines) <= collapseAt) return;

    this.figure.classList.remove("is-collapsed");
    if (this.collapseToggle) {
      this.collapseToggle.setAttribute("aria-expanded", "true");
      this.collapseToggle.textContent = "접기";
    }
  }

  updateNote(text, immediate) {
    if (!this.note) return;
    window.clearTimeout(this.noteTimer);

    if (immediate || motionQuery.matches) {
      this.note.textContent = text;
      this.note.classList.remove("is-changing");
      return;
    }

    this.note.classList.add("is-changing");
    this.noteTimer = window.setTimeout(() => {
      this.note.textContent = text;
      this.note.classList.remove("is-changing");
    }, 150);
  }

  updateControls() {
    this.previousButton.disabled = this.index === 0;
    this.nextButton.disabled = this.index === this.length;
    this.status.textContent = `${this.index} / ${this.length}`;

    this.dotItems.forEach((dot, dotIndex) => {
      const stepNumber = dotIndex + 1;
      dot.classList.toggle("is-active", stepNumber === this.index);
      dot.classList.toggle("is-complete", stepNumber < this.index);
    });
  }
}

class PresentationController {
  constructor() {
    this.doc = document.querySelector(".doc");
    this.beats = [...document.querySelectorAll("[data-beat]")];
    this.toggle = document.querySelector("[data-present-toggle]");
    this.exitButton = document.querySelector("[data-present-exit]");
    this.progress = document.querySelector("[data-present-progress]");
    this.indicator = document.querySelector("[data-present-indicator]");
    this.help = document.querySelector("[data-present-help]");
    this.currentIndex = 0;
    this.cursorTimer = 0;
    this.helpTimer = 0;
    this.scrollFrame = 0;
    this.steppers = new Map();

    document.querySelectorAll(".code[data-steps]").forEach((figure) => {
      const beat = figure.closest("[data-beat]");
      const stepper = new CodeStepper(figure);
      if (beat && stepper.length) this.steppers.set(beat, stepper);
    });

    document.querySelectorAll(".code[data-highlight]:not([data-steps])").forEach((figure) => {
      const pre = figure.querySelector("pre");
      if (pre) applyLineHighlight(pre, figure.dataset.highlight);
    });

    this.bindEvents();
    this.updateCurrentBeat();

    if (localStorage.getItem("pothole:mode") === "present") {
      this.currentIndex = 0;
      if ("scrollRestoration" in history) history.scrollRestoration = "manual";
      this.setPresent(true, { restore: true });
    } else {
      this.syncToggle();
    }
  }

  get isPresent() {
    return root.dataset.mode === "present";
  }

  get isBlackout() {
    return root.dataset.blackout === "true";
  }

  bindEvents() {
    this.toggle?.addEventListener("click", () => this.setPresent(!this.isPresent));
    this.exitButton?.addEventListener("click", () => this.setPresent(false));
    document.addEventListener("keydown", (event) => this.onKeydown(event));
    document.addEventListener("pothole:navready", () => this.refreshBeats());
    document.addEventListener("pothole:menuchange", (event) => {
      if (event.detail?.open) {
        delete root.dataset.cursor;
        window.clearTimeout(this.cursorTimer);
      } else {
        this.resetCursorTimer();
      }
    });
    document.addEventListener("pointermove", () => this.resetCursorTimer(), { passive: true });
    const scheduleBeatUpdate = () => {
      if (this.scrollFrame) return;
      this.scrollFrame = requestAnimationFrame(() => {
        this.scrollFrame = 0;
        this.updateCurrentBeat();
      });
    };
    this.doc?.addEventListener("scroll", scheduleBeatUpdate, { passive: true });
    window.addEventListener("scroll", scheduleBeatUpdate, { passive: true });
    window.addEventListener("resize", () => this.updateCurrentBeat(), { passive: true });
  }

  setPresent(active, { restore = false } = {}) {
    if (active) {
      root.dataset.mode = "present";
      localStorage.setItem("pothole:mode", "present");
      this.resetCursorTimer();
      this.showHelp();
      if (restore) {
        this.currentIndex = 0;
        if (this.doc) this.doc.scrollTop = 0;
        window.scrollTo(0, 0);
      }
      requestAnimationFrame(() => this.goToBeat(restore ? 0 : this.currentIndex, "stay", restore ? "auto" : undefined));
    } else {
      delete root.dataset.mode;
      delete root.dataset.cursor;
      delete root.dataset.blackout;
      localStorage.setItem("pothole:mode", "scroll");
      window.clearTimeout(this.cursorTimer);
      window.clearTimeout(this.helpTimer);
      this.help?.classList.remove("is-visible");
      requestAnimationFrame(() => {
        this.beats[this.currentIndex]?.scrollIntoView({
          behavior: motionQuery.matches ? "auto" : "smooth",
          block: "start",
        });
      });
    }
    this.syncToggle();
  }

  syncToggle() {
    if (!this.toggle) return;
    this.toggle.setAttribute("aria-pressed", String(this.isPresent));
    const label = this.toggle.querySelector("[data-present-label]");
    if (label) label.textContent = this.isPresent ? "발표 종료" : "발표 모드";
  }

  setBlackout(active) {
    if (!this.isPresent) return;
    if (active) root.dataset.blackout = "true";
    else delete root.dataset.blackout;
  }

  showHelp() {
    if (!this.help) return;
    try {
      if (sessionStorage.getItem(HELP_SESSION_KEY) === "true") return;
      sessionStorage.setItem(HELP_SESSION_KEY, "true");
    } catch {
      // 세션 저장소가 차단되어도 현재 페이지의 안내는 정상 표시한다.
    }
    window.clearTimeout(this.helpTimer);
    this.help.classList.remove("is-visible");

    if (motionQuery.matches) {
      this.help.classList.add("is-visible");
      requestAnimationFrame(() => this.help?.classList.remove("is-visible"));
      return;
    }

    requestAnimationFrame(() => this.help?.classList.add("is-visible"));
    this.helpTimer = window.setTimeout(() => {
      this.help?.classList.remove("is-visible");
    }, 2000);
  }

  onKeydown(event) {
    const code = event.code;
    const target = event.target;
    const typing = target instanceof Element
      && target.matches("input:not([type='range']), textarea, [contenteditable='true']");
    const rangeInput = target instanceof Element && target.matches("input[type='range']");
    const select = target instanceof Element && target.matches("select");
    const button = target instanceof Element && target.matches("button");

    if (!typing && code === "KeyP") {
      event.preventDefault();
      this.setPresent(!this.isPresent);
      return;
    }

    if (!this.isPresent) return;

    if (code === "Escape") {
      event.preventDefault();
      if (this.isBlackout) this.setBlackout(false);
      else this.setPresent(false);
      return;
    }

    if (!typing && code === "KeyB") {
      event.preventDefault();
      this.setBlackout(!this.isBlackout);
      return;
    }

    if (typing || select) return;
    if (rangeInput && ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(code)) return;
    if (button && ["Space", "Enter", "NumpadEnter"].includes(code)) return;

    const nextCodes = ["ArrowRight", "ArrowDown", "Space", "PageDown"];
    const previousCodes = ["ArrowLeft", "ArrowUp", "PageUp"];

    if (nextCodes.includes(code)) {
      event.preventDefault();
      this.next();
    } else if (previousCodes.includes(code)) {
      event.preventDefault();
      this.previous();
    } else if (code === "Home") {
      event.preventDefault();
      this.goToBeat(0, "forward");
    } else if (code === "End") {
      event.preventDefault();
      this.goToBeat(this.beats.length - 1, "backward");
    }
  }

  next() {
    const beat = this.beats[this.currentIndex];
    if (beat?.matches("[data-page-nav-beat]")) {
      const nextHref = beat.dataset.nextHref;
      if (nextHref) location.assign(nextHref);
      return;
    }
    const stepper = this.steppers.get(beat);
    if (stepper && stepper.index < stepper.length) {
      stepper.setStep(stepper.index + 1);
      return;
    }
    this.goToBeat(this.currentIndex + 1, "forward");
  }

  previous() {
    const beat = this.beats[this.currentIndex];
    const stepper = this.steppers.get(beat);
    if (stepper && stepper.index > 0) {
      stepper.setStep(stepper.index - 1);
      return;
    }
    this.goToBeat(this.currentIndex - 1, "backward");
  }

  goToBeat(index, direction = "stay", behavior) {
    const clamped = Math.max(0, Math.min(this.beats.length - 1, index));
    if (!this.beats[clamped]) return;

    this.currentIndex = clamped;
    const target = this.beats[clamped];
    const targetStepper = this.steppers.get(target);
    if (targetStepper && direction === "forward") targetStepper.setStep(0);
    if (targetStepper && direction === "backward") targetStepper.setStep(targetStepper.length);

    target.scrollIntoView({
      behavior: behavior || (motionQuery.matches ? "auto" : "smooth"),
      block: target.hasAttribute("data-tall") ? "start" : "center",
    });
    this.updateProgress();
  }

  refreshBeats() {
    const current = this.beats[this.currentIndex];
    this.beats = [...document.querySelectorAll("[data-beat]")];
    const refreshedIndex = current ? this.beats.indexOf(current) : -1;
    if (refreshedIndex >= 0) this.currentIndex = refreshedIndex;
    else this.currentIndex = Math.max(0, Math.min(this.currentIndex, this.beats.length - 1));
    this.updateProgress();
  }

  updateCurrentBeat() {
    if (!this.beats.length) return;
    const viewportCenter = window.innerHeight / 2;
    let closestIndex = 0;
    let closestDistance = Number.POSITIVE_INFINITY;

    this.beats.forEach((beat, index) => {
      const rect = beat.getBoundingClientRect();
      const visibleCenter = Math.max(0, Math.min(window.innerHeight, rect.top + rect.height / 2));
      const distance = Math.abs(visibleCenter - viewportCenter);
      if (rect.bottom > 0 && rect.top < window.innerHeight && distance < closestDistance) {
        closestDistance = distance;
        closestIndex = index;
      }
    });

    this.currentIndex = closestIndex;
    this.updateProgress();
  }

  updateProgress() {
    const current = this.currentIndex + 1;
    const total = this.beats.length;
    if (this.progress) {
      this.progress.style.width = `${(current / total) * 100}%`;
      const progressbar = this.progress.closest("[role='progressbar']");
      progressbar?.setAttribute("aria-valuenow", String(current));
      progressbar?.setAttribute("aria-valuemax", String(total));
    }
    if (this.indicator) {
      const digits = String(total).length;
      this.indicator.textContent = `${String(current).padStart(digits, "0")} / ${total}`;
    }
  }

  resetCursorTimer() {
    if (!this.isPresent) return;
    delete root.dataset.cursor;
    window.clearTimeout(this.cursorTimer);
    this.cursorTimer = window.setTimeout(() => {
      if (this.isPresent) root.dataset.cursor = "hidden";
    }, 3000);
  }
}

new PresentationController();
