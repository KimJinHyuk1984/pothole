const POINTS = [
  { x: 5, y: 13 },
  { x: 10, y: 31 },
  { x: 15, y: 22 },
  { x: 20, y: 50 },
];

function make(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

export function calculateMse(slope, intercept) {
  const rows = POINTS.map(({ x, y }) => {
    const prediction = slope * x + intercept;
    const error = prediction - y;
    return { x, y, prediction, error, absolute: Math.abs(error), squared: error ** 2 };
  });
  const errorSum = rows.reduce((sum, row) => sum + row.error, 0);
  const squaredSum = rows.reduce((sum, row) => sum + row.squared, 0);
  return { rows, errorSum, squaredSum, mse: squaredSum / rows.length };
}

function number(value) {
  return Number.isInteger(value) ? String(value) : value.toFixed(2).replace(/\.00$/, "");
}

export function mountMseCalculator(root) {
  const body = root.querySelector("[data-widget-body]");
  const controls = root.querySelector("[data-widget-controls]");
  if (!body || !controls) return;

  const tableWrap = make("div", "table-scroll mse-table-wrap");
  const table = make("table", "data-table mse-table");
  table.innerHTML = "<thead><tr><th>x</th><th>실제 y</th><th>예측</th><th>오차</th><th>절댓값</th><th>제곱</th></tr></thead><tbody></tbody>";
  tableWrap.append(table);
  const totals = make("div", "mse-totals");
  const errorTotal = make("article", "stat-card");
  const squareTotal = make("article", "stat-card");
  const mseTotal = make("article", "stat-card");
  errorTotal.innerHTML = '<span class="stat-card__value" data-error-sum></span><strong>오차의 단순 합</strong><p>양수와 음수가 상쇄됩니다.</p>';
  squareTotal.innerHTML = '<span class="stat-card__value" data-square-sum></span><strong>제곱 합계</strong><p>부호가 사라지고 큰 오차가 강조됩니다.</p>';
  mseTotal.innerHTML = '<span class="stat-card__value" data-mse></span><strong>MSE</strong><p>제곱 합계를 데이터 4개로 나눕니다.</p>';
  totals.append(errorTotal, squareTotal, mseTotal);
  body.replaceChildren(tableWrap, totals);

  function range(name, min, max, step, value) {
    const label = make("label", "range-control");
    const text = make("span", "control-bar__label", name);
    const input = document.createElement("input");
    input.type = "range";
    input.min = String(min);
    input.max = String(max);
    input.step = String(step);
    input.value = String(value);
    input.setAttribute("aria-label", `예측선 ${name}`);
    const output = make("output", "range-output");
    label.append(text, input, output);
    controls.append(label);
    return { input, output };
  }

  const slope = range("기울기", -1, 4, 0.1, 2);
  const intercept = range("절편", -20, 30, 1, 4);

  function update() {
    const slopeValue = Number(slope.input.value);
    const interceptValue = Number(intercept.input.value);
    const result = calculateMse(slopeValue, interceptValue);
    slope.output.textContent = number(slopeValue);
    intercept.output.textContent = number(interceptValue);
    const tbody = table.tBodies[0];
    tbody.replaceChildren(...result.rows.map((row) => {
      const tr = document.createElement("tr");
      [row.x, row.y, row.prediction, row.error, row.absolute, row.squared].forEach((value) => {
        const td = document.createElement("td");
        td.textContent = number(value);
        tr.append(td);
      });
      return tr;
    }));
    root.querySelector("[data-error-sum]").textContent = number(result.errorSum);
    root.querySelector("[data-square-sum]").textContent = number(result.squaredSum);
    root.querySelector("[data-mse]").textContent = number(result.mse);
    root.dataset.errorSum = String(result.errorSum);
    root.dataset.mse = String(result.mse);
  }

  slope.input.addEventListener("input", update);
  intercept.input.addEventListener("input", update);
  update();
  root.dataset.mounted = "true";
}

document.querySelectorAll('[data-widget="mse-calculator"]').forEach(mountMseCalculator);
