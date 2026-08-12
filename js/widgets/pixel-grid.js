const DIGIT_FIVE = [
  [0, 0, 18, 96, 184, 232, 232, 88, 0, 0],
  [0, 8, 168, 255, 255, 255, 248, 72, 0, 0],
  [0, 24, 240, 248, 96, 32, 8, 0, 0, 0],
  [0, 36, 255, 232, 72, 0, 0, 0, 0, 0],
  [0, 24, 224, 255, 248, 192, 72, 8, 0, 0],
  [0, 0, 56, 144, 208, 255, 248, 112, 0, 0],
  [0, 0, 0, 0, 16, 112, 255, 216, 24, 0],
  [0, 0, 0, 0, 0, 64, 248, 232, 32, 0],
  [0, 16, 104, 144, 184, 248, 232, 104, 0, 0],
  [0, 48, 200, 248, 232, 176, 72, 8, 0, 0],
];

const CHANNELS = [
  { key: "red", label: "R", name: "빨강" },
  { key: "green", label: "G", name: "초록" },
  { key: "blue", label: "B", name: "파랑" },
];

function cellColor(value, channel) {
  if (channel === "red") return `rgb(${value} 0 0)`;
  if (channel === "green") return `rgb(0 ${value} 0)`;
  if (channel === "blue") return `rgb(0 0 ${value})`;
  return `rgb(${value} ${value} ${value})`;
}

function bindRovingGrid(grid, cells, columns) {
  const focusCell = (index) => {
    const clamped = Math.max(0, Math.min(cells.length - 1, index));
    cells.forEach((cell, cellIndex) => {
      cell.tabIndex = cellIndex === clamped ? 0 : -1;
    });
    cells[clamped].focus();
  };

  grid.addEventListener("keydown", (event) => {
    const current = cells.indexOf(event.target);
    if (current < 0) return;
    const moves = {
      ArrowLeft: -1,
      ArrowRight: 1,
      ArrowUp: -columns,
      ArrowDown: columns,
      Home: -current,
      End: cells.length - 1 - current,
    };
    if (!(event.code in moves)) return;
    event.preventDefault();
    event.stopPropagation();
    focusCell(current + moves[event.code]);
  });
}

function makePixelGrid(channel, onInspect) {
  const grid = document.createElement("div");
  grid.className = "pixel-grid";
  grid.setAttribute("role", "grid");
  grid.setAttribute("aria-label", channel === "gray" ? "숫자 5의 흑백 픽셀 격자" : `${channel} 채널 픽셀 격자`);
  grid.style.setProperty("--pixel-columns", String(DIGIT_FIVE[0].length));

  const cells = [];
  DIGIT_FIVE.forEach((row, rowIndex) => {
    row.forEach((value, columnIndex) => {
      const cell = document.createElement("button");
      cell.type = "button";
      cell.className = "pixel-grid__cell";
      cell.setAttribute("role", "gridcell");
      cell.setAttribute("aria-rowindex", String(rowIndex + 1));
      cell.setAttribute("aria-colindex", String(columnIndex + 1));
      cell.setAttribute("aria-label", `${rowIndex + 1}행 ${columnIndex + 1}열, 값 ${value}`);
      cell.tabIndex = cells.length === 0 ? 0 : -1;
      cell.style.backgroundColor = cellColor(value, channel);

      const inspect = () => onInspect({ row: rowIndex + 1, column: columnIndex + 1, value, channel });
      cell.addEventListener("pointerenter", inspect);
      cell.addEventListener("focus", inspect);
      cell.addEventListener("click", inspect);
      cells.push(cell);
      grid.append(cell);
    });
  });

  bindRovingGrid(grid, cells, DIGIT_FIVE[0].length);
  return grid;
}

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

export function mountPixelGrid(root) {
  const body = root.querySelector("[data-widget-body]");
  const controls = root.querySelector("[data-widget-controls]");
  if (!body || !controls) return;

  body.classList.add("pixel-widget__body");
  const stage = document.createElement("div");
  stage.className = "pixel-widget__stage";
  const readout = document.createElement("output");
  readout.className = "pixel-readout";
  readout.setAttribute("aria-live", "polite");
  readout.textContent = "픽셀에 마우스를 올리거나 탭하세요.";

  const inspect = ({ row, column, value, channel }) => {
    const label = channel === "gray" ? "밝기" : `${CHANNELS.find((item) => item.key === channel)?.label || channel}값`;
    readout.textContent = `${row}행 · ${column}열 · ${label} ${value}`;
  };

  const grayPanel = document.createElement("div");
  grayPanel.className = "pixel-widget__panel";
  const grayHeading = document.createElement("p");
  grayHeading.className = "pixel-grid__label";
  grayHeading.textContent = "GRAYSCALE · 값 1개";
  grayPanel.append(grayHeading, makePixelGrid("gray", inspect));

  const rgbPanel = document.createElement("div");
  rgbPanel.className = "pixel-channels";
  rgbPanel.hidden = true;
  CHANNELS.forEach((channel) => {
    const panel = document.createElement("section");
    panel.className = "pixel-channel";
    const heading = document.createElement("p");
    heading.className = "pixel-grid__label";
    heading.textContent = `${channel.label} · ${channel.name} 채널`;
    panel.append(heading, makePixelGrid(channel.key, inspect));
    rgbPanel.append(panel);
  });

  const copy = document.createElement("div");
  copy.className = "widget-copy";
  copy.innerHTML = "<h4>밝기는 0부터 255까지</h4><p>0은 검정, 255는 흰색입니다. 흑백 이미지는 픽셀마다 값 하나를 갖고, RGB로 나누면 같은 회색을 R·G·B의 세 값으로 표현합니다.</p>";
  stage.append(grayPanel, rgbPanel);
  body.replaceChildren(stage, copy, readout);

  const label = document.createElement("span");
  label.className = "control-bar__label";
  label.textContent = "보기 방식";
  const group = document.createElement("div");
  group.className = "widget-toggle";
  group.setAttribute("role", "group");
  group.setAttribute("aria-label", "픽셀 채널 보기 방식");

  const modes = [
    { key: "gray", label: "흑백 값" },
    { key: "rgb", label: "RGB 채널 분리" },
  ];
  const buttons = modes.map((mode, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "control-button";
    button.textContent = mode.label;
    button.setAttribute("aria-pressed", String(index === 0));
    button.addEventListener("click", () => {
      buttons.forEach((item) => item.setAttribute("aria-pressed", String(item === button)));
      grayPanel.hidden = mode.key !== "gray";
      rgbPanel.hidden = mode.key !== "rgb";
      readout.textContent = mode.key === "gray"
        ? "흑백 픽셀은 밝기 값 하나로 표현합니다."
        : "회색 픽셀은 R·G·B 세 채널의 값이 서로 같습니다.";
    });
    group.append(button);
    return button;
  });
  bindSegmentedKeys(group, buttons);
  controls.replaceChildren(label, group);
  root.dataset.mounted = "true";
}

document.querySelectorAll('[data-widget="pixel-grid"]').forEach(mountPixelGrid);
