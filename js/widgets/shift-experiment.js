function make(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

function predictionCard(name) {
  const card = make("article", "shift-prediction");
  card.innerHTML = `<span>${name}</span><strong data-prediction></strong><p data-confidence></p>`;
  return card;
}

export async function mountShiftExperiment(root) {
  const body = root.querySelector("[data-widget-body]");
  const controls = root.querySelector("[data-widget-controls]");
  if (!body || !controls) return;

  let data;
  try {
    const response = await fetch(new URL("../../data/shift-results.json", import.meta.url));
    if (!response.ok) throw new Error(String(response.status));
    data = await response.json();
  } catch {
    body.textContent = "이동 실험 데이터를 불러오지 못했습니다. 로컬 서버에서 다시 확인해 주세요.";
    return;
  }

  const stage = make("div", "shift-stage");
  stage.innerHTML = '<svg viewBox="0 0 28 28" role="img" aria-label="오른쪽 아래로 이동하는 MNIST 숫자 7"><rect width="28" height="28" rx="2"/><g data-digit><path d="M7 6.5 C11 5.7 16 5.9 20.5 6.8 M19.5 7 C16.7 11.5 13.8 16.6 12.2 22"/></g></svg><p data-shift-label></p>';
  const compare = make("div", "shift-compare");
  const mlp = predictionCard("MLP 예측");
  const cnn = predictionCard("CNN 예측");
  compare.append(mlp, cnn);
  const source = make("p", "shift-source");
  body.replaceChildren(stage, compare, source);

  const label = make("label", "range-control");
  const text = make("span", "control-bar__label", "오른쪽·아래 이동");
  const slider = document.createElement("input");
  slider.type = "range";
  slider.min = "0";
  slider.max = "5";
  slider.step = "1";
  slider.value = "0";
  slider.setAttribute("aria-label", "MNIST 숫자 이동 칸 수");
  const output = make("output", "range-output");
  label.append(text, slider, output);
  const previous = make("button", "control-button", "− 1칸");
  previous.type = "button";
  const next = make("button", "control-button", "+ 1칸");
  next.type = "button";
  controls.replaceChildren(label, previous, next);

  function confidence(model) {
    return model.confidence === null ? "확률은 원본에 미표기" : `수업용 확률 ${(model.confidence * 100).toFixed(0)}%`;
  }

  function update() {
    const row = data.results[Number(slider.value)];
    const shift = row.shift;
    stage.querySelector("[data-digit]").setAttribute("transform", `translate(${shift * 0.72} ${shift * 0.72})`);
    stage.querySelector("[data-shift-label]").textContent = `dx=${shift}, dy=${shift}`;
    output.textContent = `${shift}칸`;
    mlp.querySelector("[data-prediction]").textContent = String(row.mlp.prediction);
    cnn.querySelector("[data-prediction]").textContent = String(row.cnn.prediction);
    mlp.querySelector("[data-confidence]").textContent = confidence(row.mlp);
    cnn.querySelector("[data-confidence]").textContent = confidence(row.cnn);
    mlp.classList.toggle("is-wrong", row.mlp.prediction !== data.actualLabel);
    cnn.classList.toggle("is-wrong", row.cnn.prediction !== data.actualLabel);
    source.textContent = `${row.source} · 실제 정답 ${data.actualLabel}. ${data.sourceNote}`;
    previous.disabled = shift === 0;
    next.disabled = shift === 5;
    root.dataset.mlpPrediction = String(row.mlp.prediction);
    root.dataset.cnnPrediction = String(row.cnn.prediction);
  }

  slider.addEventListener("input", update);
  previous.addEventListener("click", () => { slider.value = String(Math.max(0, Number(slider.value) - 1)); update(); });
  next.addEventListener("click", () => { slider.value = String(Math.min(5, Number(slider.value) + 1)); update(); });
  update();
  root.dataset.mounted = "true";
}

document.querySelectorAll('[data-widget="shift-experiment"]').forEach(mountShiftExperiment);
