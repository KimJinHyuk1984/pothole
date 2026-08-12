const SVG_NS = "http://www.w3.org/2000/svg";
const GRAPH_WIDTH = 320;
const GRAPH_HEIGHT = 190;
const PADDING = 28;

const FUNCTIONS = [
  {
    key: "step",
    name: "Step",
    description: "0을 넘으면 1, 그렇지 않으면 0",
    fn: (x) => (x > 0 ? 1 : 0),
    yMin: -0.15,
    yMax: 1.15,
    format: (value) => value.toFixed(0),
  },
  {
    key: "sigmoid",
    name: "Sigmoid",
    description: "출력을 0과 1 사이로 압축",
    fn: (x) => 1 / (1 + Math.exp(-x)),
    yMin: -0.15,
    yMax: 1.15,
    format: (value) => value.toFixed(3),
  },
  {
    key: "relu",
    name: "ReLU",
    description: "음수는 0, 양수는 그대로",
    fn: (x) => Math.max(0, x),
    yMin: -0.7,
    yMax: 5.5,
    format: (value) => value.toFixed(1),
  },
  {
    key: "leaky-relu",
    name: "LeakyReLU",
    description: "음수에도 0.1의 작은 기울기",
    fn: (x) => (x >= 0 ? x : 0.1 * x),
    yMin: -0.7,
    yMax: 5.5,
    format: (value) => value.toFixed(1),
  },
];

function svgElement(name, attributes = {}) {
  const element = document.createElementNS(SVG_NS, name);
  Object.entries(attributes).forEach(([key, value]) => element.setAttribute(key, String(value)));
  return element;
}

function scaleX(value) {
  return PADDING + ((value + 5) / 10) * (GRAPH_WIDTH - PADDING * 2);
}

function scaleY(value, definition) {
  const ratio = (value - definition.yMin) / (definition.yMax - definition.yMin);
  return GRAPH_HEIGHT - PADDING - ratio * (GRAPH_HEIGHT - PADDING * 2);
}

function makePath(definition) {
  const points = [];
  for (let index = 0; index <= 160; index += 1) {
    const x = -5 + (index / 160) * 10;
    points.push(`${index === 0 ? "M" : "L"}${scaleX(x).toFixed(2)} ${scaleY(definition.fn(x), definition).toFixed(2)}`);
  }
  return points.join(" ");
}

function makeGraph(definition) {
  const card = document.createElement("article");
  card.className = "activation-graph";
  const heading = document.createElement("div");
  heading.className = "activation-graph__head";
  heading.innerHTML = `<h4>${definition.name}</h4><p>${definition.description}</p>`;

  const svg = svgElement("svg", {
    viewBox: `0 0 ${GRAPH_WIDTH} ${GRAPH_HEIGHT}`,
    role: "img",
    "aria-label": `${definition.name} 활성화 함수 그래프`,
  });
  svg.classList.add("activation-graph__svg");

  const xAxis = svgElement("line", {
    x1: PADDING,
    x2: GRAPH_WIDTH - PADDING,
    y1: scaleY(0, definition),
    y2: scaleY(0, definition),
    class: "activation-axis",
  });
  const yAxis = svgElement("line", {
    x1: scaleX(0),
    x2: scaleX(0),
    y1: PADDING,
    y2: GRAPH_HEIGHT - PADDING,
    class: "activation-axis",
  });
  const path = svgElement("path", { d: makePath(definition), class: "activation-line" });
  const guide = svgElement("line", { class: "activation-guide" });
  const point = svgElement("circle", { r: 5.5, class: "activation-point" });
  svg.append(xAxis, yAxis, path, guide, point);

  const output = document.createElement("output");
  output.className = "activation-graph__output";
  output.setAttribute("aria-live", "polite");
  card.append(heading, svg, output);
  return { card, svg, point, guide, output, definition };
}

function dispatchInput(input) {
  input.dispatchEvent(new Event("input", { bubbles: true }));
  input.focus();
}

function makeStepButton(label, accessibleLabel, onClick) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "range-step";
  button.textContent = label;
  button.setAttribute("aria-label", accessibleLabel);
  button.addEventListener("click", onClick);
  return button;
}

function makeSoftmaxControl(name, initial, onInput) {
  const row = document.createElement("div");
  row.className = "softmax-control";
  const label = document.createElement("label");
  label.className = "softmax-control__label";
  const labelText = document.createElement("span");
  labelText.textContent = name;
  const input = document.createElement("input");
  input.type = "range";
  input.min = "-2";
  input.max = "3";
  input.step = "0.1";
  input.value = String(initial);
  input.setAttribute("aria-label", `${name} 입력값`);
  const value = document.createElement("output");
  value.className = "softmax-control__input-value";
  value.textContent = Number(initial).toFixed(1);
  label.append(labelText, value);

  const minus = makeStepButton("−", `${name} 입력값 줄이기`, () => {
    input.stepDown();
    dispatchInput(input);
  });
  const plus = makeStepButton("+", `${name} 입력값 늘리기`, () => {
    input.stepUp();
    dispatchInput(input);
  });
  input.addEventListener("input", () => {
    value.textContent = Number(input.value).toFixed(1);
    onInput();
  });
  row.append(label, minus, input, plus);
  return { row, input };
}

function softmax(values) {
  const max = Math.max(...values);
  const exponents = values.map((value) => Math.exp(value - max));
  const total = exponents.reduce((sum, value) => sum + value, 0);
  return exponents.map((value) => value / total);
}

export function mountActivationPlayground(root) {
  const body = root.querySelector("[data-widget-body]");
  const controls = root.querySelector("[data-widget-controls]");
  if (!body || !controls) return;
  body.classList.add("activation-widget__body");

  const graphGrid = document.createElement("div");
  graphGrid.className = "activation-graphs";
  const graphs = FUNCTIONS.map((definition) => makeGraph(definition));
  graphs.forEach(({ card }) => graphGrid.append(card));

  const softmaxPanel = document.createElement("section");
  softmaxPanel.className = "softmax-panel";
  softmaxPanel.innerHTML = "<div class=\"softmax-panel__head\"><p class=\"eyebrow\">OUTPUT LAYER</p><h4>Softmax · 세 점수를 확률로</h4><p>입력값 하나를 바꾸면 세 확률이 함께 달라지지만 총합은 항상 1입니다.</p></div>";
  const softmaxLayout = document.createElement("div");
  softmaxLayout.className = "softmax-layout";
  const softmaxControls = document.createElement("div");
  softmaxControls.className = "softmax-controls";
  const bars = document.createElement("div");
  bars.className = "softmax-bars";
  bars.setAttribute("aria-label", "Softmax 출력 확률");
  const names = ["Class A", "Class B", "Class C"];
  const barParts = names.map((name) => {
    const item = document.createElement("div");
    item.className = "softmax-bar";
    const track = document.createElement("div");
    track.className = "softmax-bar__track";
    const fill = document.createElement("span");
    fill.className = "softmax-bar__fill";
    const output = document.createElement("output");
    output.className = "softmax-bar__value";
    const label = document.createElement("span");
    label.className = "softmax-bar__label";
    label.textContent = name;
    track.append(fill);
    item.append(output, track, label);
    bars.append(item);
    return { fill, output };
  });
  const sum = document.createElement("output");
  sum.className = "softmax-sum";
  sum.setAttribute("aria-live", "polite");
  bars.append(sum);

  let controlParts = [];
  const updateSoftmax = () => {
    if (!controlParts.length) return;
    const probabilities = softmax(controlParts.map(({ input }) => Number(input.value)));
    probabilities.forEach((probability, index) => {
      barParts[index].fill.style.height = `${probability * 100}%`;
      barParts[index].output.textContent = probability.toFixed(3);
    });
    sum.textContent = `합계 ${probabilities.reduce((total, value) => total + value, 0).toFixed(3)}`;
  };
  controlParts = [2, 1, 0.1].map((initial, index) => makeSoftmaxControl(names[index], initial, updateSoftmax));
  controlParts.forEach(({ row }) => softmaxControls.append(row));
  softmaxLayout.append(softmaxControls, bars);
  softmaxPanel.append(softmaxLayout);
  body.replaceChildren(graphGrid, softmaxPanel);

  const label = document.createElement("label");
  label.className = "control-bar__label";
  label.htmlFor = `${root.id || "activation"}-input`;
  label.textContent = "공통 입력값 x";
  const input = document.createElement("input");
  input.type = "range";
  input.id = label.htmlFor;
  input.min = "-5";
  input.max = "5";
  input.step = "0.1";
  input.value = "0";
  const output = document.createElement("output");
  output.className = "range-output activation-input-output";
  output.setAttribute("for", input.id);
  output.textContent = "0.0";

  const updateGraphs = () => {
    const x = Number(input.value);
    output.textContent = x.toFixed(1);
    graphs.forEach(({ svg, point, guide, output: graphOutput, definition }) => {
      const y = definition.fn(x);
      const cx = scaleX(x);
      const cy = scaleY(y, definition);
      point.setAttribute("cx", cx.toFixed(2));
      point.setAttribute("cy", cy.toFixed(2));
      guide.setAttribute("x1", cx.toFixed(2));
      guide.setAttribute("x2", cx.toFixed(2));
      guide.setAttribute("y1", cy.toFixed(2));
      guide.setAttribute("y2", scaleY(0, definition).toFixed(2));
      graphOutput.textContent = `f(${x.toFixed(1)}) = ${definition.format(y)}`;
      svg.setAttribute("aria-label", `${definition.name} 함수에서 입력 ${x.toFixed(1)}, 출력 ${definition.format(y)}`);
    });
  };
  input.addEventListener("input", updateGraphs);
  const minus = makeStepButton("−", "공통 입력값 줄이기", () => {
    input.stepDown();
    dispatchInput(input);
  });
  const plus = makeStepButton("+", "공통 입력값 늘리기", () => {
    input.stepUp();
    dispatchInput(input);
  });
  const range = document.createElement("div");
  range.className = "range-control activation-range";
  range.append(minus, input, plus, output);
  controls.replaceChildren(label, range);

  updateGraphs();
  updateSoftmax();
  root.dataset.mounted = "true";
}

document.querySelectorAll('[data-widget="activation-playground"]').forEach(mountActivationPlayground);
