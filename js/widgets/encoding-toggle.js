const ANIMALS = [
  { name: "강아지", en: "Dog", icon: "🐶", label: "1", oneHot: "[1, 0, 0]" },
  { name: "고양이", en: "Cat", icon: "🐱", label: "2", oneHot: "[0, 1, 0]" },
  { name: "앵무새", en: "Parrot", icon: "🦜", label: "3", oneHot: "[0, 0, 1]" },
];

function bindSegmentedKeys(group, buttons) {
  group.addEventListener("keydown", (event) => {
    if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.code)) return;
    const current = buttons.indexOf(document.activeElement);
    if (current < 0) return;
    event.preventDefault();
    event.stopPropagation();
    const delta = ["ArrowRight", "ArrowDown"].includes(event.code) ? 1 : -1;
    const next = (current + delta + buttons.length) % buttons.length;
    buttons[next].focus();
    buttons[next].click();
  });
}

export function mountEncodingToggle(root) {
  const body = root.querySelector("[data-widget-body]");
  const controls = root.querySelector("[data-widget-controls]");
  if (!body || !controls) return;

  body.classList.add("encoding-widget__body");
  const stage = document.createElement("div");
  stage.className = "encoding-stage";
  const cards = ANIMALS.map((animal) => {
    const card = document.createElement("article");
    card.className = "encoding-card";
    card.innerHTML = `<span class="encoding-card__icon" aria-hidden="true">${animal.icon}</span><h4>${animal.name} <small>${animal.en}</small></h4><output class="encoding-card__value" aria-label="${animal.name}의 인코딩 값">${animal.label}</output>`;
    stage.append(card);
    return card;
  });

  const explanation = document.createElement("div");
  explanation.className = "widget-copy encoding-explanation";
  explanation.setAttribute("aria-live", "polite");
  explanation.innerHTML = "<h4>레이블 인코딩</h4><p>동물마다 1·2·3이라는 번호를 붙입니다. 순서가 없는 동물도 모델은 숫자의 크기나 거리를 의미 있게 받아들일 수 있습니다.</p>";
  body.replaceChildren(stage, explanation);

  const label = document.createElement("span");
  label.className = "control-bar__label";
  label.textContent = "인코딩 방식";
  const group = document.createElement("div");
  group.className = "widget-toggle";
  group.setAttribute("role", "group");
  group.setAttribute("aria-label", "인코딩 방식 선택");

  const modes = [
    { key: "label", label: "레이블 인코딩" },
    { key: "oneHot", label: "원-핫 인코딩" },
  ];
  const buttons = modes.map((mode, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "control-button";
    button.textContent = mode.label;
    button.setAttribute("aria-pressed", String(index === 0));
    button.addEventListener("click", () => {
      buttons.forEach((item) => item.setAttribute("aria-pressed", String(item === button)));
      cards.forEach((card, cardIndex) => {
        card.querySelector("output").textContent = ANIMALS[cardIndex][mode.key];
        card.classList.toggle("is-one-hot", mode.key === "oneHot");
      });
      explanation.innerHTML = mode.key === "label"
        ? "<h4>레이블 인코딩</h4><p>동물마다 1·2·3이라는 번호를 붙입니다. 순서가 없는 동물도 모델은 숫자의 크기나 거리를 의미 있게 받아들일 수 있습니다.</p>"
        : "<h4>원-핫 인코딩</h4><p>동물마다 전용 스위치 하나만 1이 됩니다. 세 종류가 서로 독립적이며 어느 쪽도 더 크거나 앞선다는 뜻이 없습니다.</p>";
    });
    group.append(button);
    return button;
  });
  bindSegmentedKeys(group, buttons);
  controls.replaceChildren(label, group);
  root.dataset.mounted = "true";
}

document.querySelectorAll('[data-widget="encoding-toggle"]').forEach(mountEncodingToggle);
