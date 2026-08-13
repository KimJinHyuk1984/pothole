const RESOLUTIONS = [
  { label: "MNIST · 28×28", width: 28, height: 28 },
  { label: "Full HD · 1920×1080", width: 1920, height: 1080 },
  { label: "4K · 3840×2160", width: 3840, height: 2160 },
];

const format = new Intl.NumberFormat("ko-KR");

function make(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

export function calculateParameters(width, height) {
  return {
    mlp: width * height * 128 + 128,
    cnn: 3 * 3 * 1 * 32 + 32,
  };
}

export function mountParamExplosion(root) {
  const body = root.querySelector("[data-widget-body]");
  const controls = root.querySelector("[data-widget-controls]");
  if (!body || !controls) return;

  const summary = make("div", "param-summary");
  const resolution = make("p", "param-resolution");
  const mlpCard = make("article", "param-counter param-counter--mlp");
  const cnnCard = make("article", "param-counter param-counter--cnn");
  const mlpLabel = make("span", "param-counter__label", "MLP · Dense(128)");
  const cnnLabel = make("span", "param-counter__label", "CNN · Conv2D(32, 3×3)");
  const mlpValue = make("strong", "param-counter__value");
  const cnnValue = make("strong", "param-counter__value");
  const mlpFormula = make("code", "param-counter__formula");
  const cnnFormula = make("code", "param-counter__formula", "3×3×1×32 + 32 = 320");
  mlpCard.append(mlpLabel, mlpValue, mlpFormula);
  cnnCard.append(cnnLabel, cnnValue, cnnFormula);
  summary.append(resolution, mlpCard, cnnCard);

  const message = make("p", "param-message");
  body.replaceChildren(summary, message);

  const label = make("label", "range-control");
  const labelText = make("span", "control-bar__label", "해상도");
  const slider = document.createElement("input");
  slider.type = "range";
  slider.min = "0";
  slider.max = String(RESOLUTIONS.length - 1);
  slider.step = "1";
  slider.value = "0";
  slider.setAttribute("aria-label", "입력 이미지 해상도");
  const output = make("output", "range-output");
  label.append(labelText, slider, output);
  controls.replaceChildren(label);

  function update() {
    const current = RESOLUTIONS[Number(slider.value)];
    const result = calculateParameters(current.width, current.height);
    resolution.textContent = current.label;
    output.textContent = `${current.width}×${current.height}`;
    mlpValue.textContent = format.format(result.mlp);
    cnnValue.textContent = format.format(result.cnn);
    mlpFormula.textContent = `(${format.format(current.height)}×${format.format(current.width)}) × 128 + 128`;
    const ratio = Math.round(result.mlp / result.cnn);
    message.textContent = `해상도가 커져도 합성곱 필터는 320개로 고정입니다. 현재 MLP의 첫 층은 CNN 필터보다 약 ${format.format(ratio)}배 큽니다.`;
    root.dataset.mlpParameters = String(result.mlp);
    root.dataset.cnnParameters = String(result.cnn);
  }

  slider.addEventListener("input", update);
  update();
  root.dataset.mounted = "true";
}

document.querySelectorAll('[data-widget="param-explosion"]').forEach(mountParamExplosion);
