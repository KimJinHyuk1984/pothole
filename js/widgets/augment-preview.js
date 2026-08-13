function make(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

export function mountAugmentPreview(root) {
  const body = root.querySelector("[data-widget-body]");
  const controls = root.querySelector("[data-widget-controls]");
  if (!body || !controls) return;

  function imagePanel(title, augmented = false) {
    const panel = make("figure", "augment-panel");
    const stage = make("div", "augment-stage");
    const image = document.createElement("img");
    image.src = "assets/slide-055-a.webp";
    image.alt = augmented ? "증강 설정이 적용된 MNIST 숫자 4" : "원본 MNIST 숫자 4";
    if (augmented) image.dataset.augmented = "";
    stage.append(image);
    panel.append(stage, make("figcaption", "", title));
    return panel;
  }

  const comparison = make("div", "augment-comparison");
  const original = imagePanel("원본");
  const transformed = imagePanel("증강 결과", true);
  comparison.append(original, transformed);
  const note = make("aside", "augment-note");
  note.innerHTML = "<strong>좌우반전은 데이터의 뜻을 먼저 확인합니다.</strong><p>알파벳 b/d처럼 반전하면 의미가 달라지는 대상에는 위험하지만, 방향에 관계없이 같은 포트홀에는 유용합니다.</p>";
  body.replaceChildren(comparison, note);

  function range(name, min, max, step, value, unit) {
    const label = make("label", "range-control");
    const text = make("span", "control-bar__label", name);
    const input = document.createElement("input");
    input.type = "range";
    input.min = String(min);
    input.max = String(max);
    input.step = String(step);
    input.value = String(value);
    input.setAttribute("aria-label", `증강 ${name}`);
    const output = make("output", "range-output");
    output.dataset.unit = unit;
    label.append(text, input, output);
    controls.append(label);
    return { input, output, unit };
  }

  const rotation = range("회전", -20, 20, 1, 0, "°");
  const zoom = range("확대", 80, 130, 5, 100, "%");
  const shift = range("이동", -5, 5, 1, 0, "칸");
  const flip = make("button", "control-button", "좌우반전");
  flip.type = "button";
  flip.setAttribute("aria-pressed", "false");
  controls.append(flip);

  const image = transformed.querySelector("[data-augmented]");

  function update() {
    const rotationValue = Number(rotation.input.value);
    const zoomValue = Number(zoom.input.value);
    const shiftValue = Number(shift.input.value);
    const flipped = flip.getAttribute("aria-pressed") === "true";
    image.style.transform = `translate(${shiftValue * 3}px, ${shiftValue * 3}px) rotate(${rotationValue}deg) scale(${zoomValue / 100}) scaleX(${flipped ? -1 : 1})`;
    rotation.output.textContent = `${rotationValue}${rotation.unit}`;
    zoom.output.textContent = `${zoomValue}${zoom.unit}`;
    shift.output.textContent = `${shiftValue}${shift.unit}`;
    root.dataset.transform = image.style.transform;
  }

  [rotation.input, zoom.input, shift.input].forEach((input) => input.addEventListener("input", update));
  flip.addEventListener("click", () => {
    flip.setAttribute("aria-pressed", String(flip.getAttribute("aria-pressed") !== "true"));
    update();
  });
  update();
  root.dataset.mounted = "true";
}

document.querySelectorAll('[data-widget="augment-preview"]').forEach(mountAugmentPreview);
