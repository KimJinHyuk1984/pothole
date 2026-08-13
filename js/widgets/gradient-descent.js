const START_X = 4.2;
const CURVATURE = 1.25;

function make(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

export function descentStep(x, learningRate) {
  return x - learningRate * (2 * CURVATURE * x);
}

export function mountGradientDescent(root) {
  const body = root.querySelector("[data-widget-body]");
  const controls = root.querySelector("[data-widget-controls]");
  if (!body || !controls) return;

  const panel = make("div", "descent-stage");
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 700 340");
  svg.setAttribute("role", "img");
  svg.setAttribute("aria-label", "2차 손실 곡선 위에서 경사하강하는 공");
  svg.innerHTML = '<line class="descent-axis" x1="45" y1="300" x2="655" y2="300"/><line class="descent-axis" x1="350" y1="18" x2="350" y2="310"/><path class="descent-curve"/><polyline class="descent-trail"/><circle class="descent-ball" r="10"/><text class="descent-minimum" x="360" y="290">최저점</text>';
  panel.append(svg);
  const readout = make("div", "descent-readout");
  readout.innerHTML = '<span>현재 x <strong data-x></strong></span><span>Loss <strong data-loss></strong></span><span>상태 <strong data-status></strong></span>';
  body.replaceChildren(panel, readout);

  const curve = svg.querySelector(".descent-curve");
  const trail = svg.querySelector(".descent-trail");
  const ball = svg.querySelector(".descent-ball");
  const points = [];
  for (let index = 0; index <= 120; index += 1) {
    const x = -6 + index * 0.1;
    points.push(`${mapX(x)},${mapY(loss(x))}`);
  }
  curve.setAttribute("d", `M${points.join(" L")}`);

  const learningLabel = make("label", "range-control");
  const learningText = make("span", "control-bar__label", "학습률");
  const learning = document.createElement("input");
  learning.type = "range";
  learning.min = "0.01";
  learning.max = "1";
  learning.step = "0.01";
  learning.value = "0.1";
  learning.setAttribute("aria-label", "경사하강 학습률");
  const learningOutput = make("output", "range-output");
  learningLabel.append(learningText, learning, learningOutput);
  const stepButton = make("button", "control-button", "한 걸음");
  stepButton.type = "button";
  const autoButton = make("button", "control-button", "자동 실행");
  autoButton.type = "button";
  autoButton.setAttribute("aria-pressed", "false");
  const resetButton = make("button", "control-button", "리셋");
  resetButton.type = "button";
  controls.replaceChildren(learningLabel, stepButton, autoButton, resetButton);

  let x = START_X;
  let history = [x];
  let timer = 0;

  function loss(value) {
    return CURVATURE * value * value;
  }

  function mapX(value) {
    return 350 + value * 50;
  }

  function mapY(value) {
    return 300 - Math.min(value, 45) * 6.15;
  }

  function status() {
    if (Math.abs(x) > 6) return "발산 중";
    if (Math.abs(x) < 0.03) return "최저점 도착";
    if (Number(learning.value) <= 0.04) return "천천히 수렴";
    return "이동 중";
  }

  function render() {
    const visibleX = Math.max(-6, Math.min(6, x));
    ball.setAttribute("cx", String(mapX(visibleX)));
    ball.setAttribute("cy", String(mapY(loss(visibleX))));
    trail.setAttribute("points", history.slice(-14).map((value) => {
      const clamped = Math.max(-6, Math.min(6, value));
      return `${mapX(clamped)},${mapY(loss(clamped))}`;
    }).join(" "));
    learningOutput.textContent = Number(learning.value).toFixed(2);
    root.querySelector("[data-x]").textContent = x.toFixed(3);
    root.querySelector("[data-loss]").textContent = loss(x).toFixed(3);
    root.querySelector("[data-status]").textContent = status();
    root.dataset.descentStatus = status();
  }

  function oneStep() {
    x = descentStep(x, Number(learning.value));
    history.push(x);
    render();
    if (Math.abs(x) > 30 || Math.abs(x) < 0.002) stopAuto();
  }

  function stopAuto() {
    if (timer) window.clearInterval(timer);
    timer = 0;
    autoButton.setAttribute("aria-pressed", "false");
    autoButton.textContent = "자동 실행";
  }

  function reset() {
    stopAuto();
    x = START_X;
    history = [x];
    render();
  }

  stepButton.addEventListener("click", oneStep);
  autoButton.addEventListener("click", () => {
    if (timer) {
      stopAuto();
      return;
    }
    autoButton.setAttribute("aria-pressed", "true");
    autoButton.textContent = "일시정지";
    timer = window.setInterval(oneStep, 450);
  });
  resetButton.addEventListener("click", reset);
  learning.addEventListener("input", render);
  render();
  root.dataset.mounted = "true";
}

document.querySelectorAll('[data-widget="gradient-descent"]').forEach(mountGradientDescent);
