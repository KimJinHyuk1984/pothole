const INPUT = [
  [1, 2, 3, 2, 1, 0],
  [1, 1, 2, 1, 0, 2],
  [0, 0, 1, 2, 1, 2],
  [0, 1, 0, 1, 0, 3],
  [0, 0, 1, 1, 1, 3],
  [2, 1, 0, 2, 2, 4],
];

const POOL_SIZE = 2;
const STRIDE = 2;

function calculateResults(reducer) {
  const resultSize = Math.floor(INPUT.length / STRIDE);
  return Array.from({ length: resultSize }, (_, outputRow) => (
    Array.from({ length: resultSize }, (_, outputColumn) => {
      const values = sourceValues(outputRow, outputColumn);
      return reducer === "max"
        ? Math.max(...values)
        : values.reduce((sum, value) => sum + value, 0) / values.length;
    })
  ));
}

function sourceValues(outputRow, outputColumn) {
  const startRow = outputRow * STRIDE;
  const startColumn = outputColumn * STRIDE;
  const values = [];

  for (let rowOffset = 0; rowOffset < POOL_SIZE; rowOffset += 1) {
    for (let columnOffset = 0; columnOffset < POOL_SIZE; columnOffset += 1) {
      values.push(INPUT[startRow + rowOffset][startColumn + columnOffset]);
    }
  }
  return values;
}

function createGrid(values, className, onSelect) {
  const grid = document.createElement("div");
  grid.className = `pool-grid ${className}`;
  grid.style.setProperty("--cols", String(values[0].length));

  values.flat().forEach((value, index) => {
    const cell = document.createElement(onSelect ? "button" : "span");
    cell.className = "pool-cell";
    cell.textContent = String(value);

    if (onSelect) {
      cell.type = "button";
      const row = Math.floor(index / values[0].length);
      const column = index % values[0].length;
      cell.setAttribute("aria-label", `${className === "pool-max" ? "Max" : "Average"} Pooling ${row + 1}행 ${column + 1}열, 결과 ${value}`);
      cell.addEventListener("click", () => onSelect(row, column, cell));
    }
    grid.append(cell);
  });
  return grid;
}

function createSection(title, subtitle, grid) {
  const section = document.createElement("section");
  const heading = document.createElement("h4");
  heading.textContent = title;
  const description = document.createElement("p");
  description.className = "pool-layout__meta";
  description.textContent = subtitle;
  section.append(heading, description, grid);
  return section;
}

export function mountPoolingCompare(root) {
  const body = root.querySelector("[data-widget-body]");
  if (!body) return;

  const maxResults = calculateResults("max");
  const averageResults = calculateResults("average");
  const inputGrid = createGrid(INPUT, "pool-input");
  const note = document.createElement("output");
  note.className = "pool-note";
  note.setAttribute("aria-live", "polite");
  note.textContent = "Max 또는 Average 결과 셀을 선택하면 2×2 계산 과정이 표시됩니다.";

  let maxGrid;
  let averageGrid;

  function clearSelection() {
    inputGrid.querySelectorAll(".pool-cell").forEach((cell) => {
      cell.classList.remove("is-source-max", "is-source-average", "is-picked");
    });
    [maxGrid, averageGrid].forEach((grid) => {
      grid.querySelectorAll(".pool-cell").forEach((cell) => cell.classList.remove("is-current"));
    });
  }

  function select(mode, outputRow, outputColumn, resultCell) {
    clearSelection();
    const startRow = outputRow * STRIDE;
    const startColumn = outputColumn * STRIDE;
    const values = sourceValues(outputRow, outputColumn);
    const sourceCells = [];

    for (let rowOffset = 0; rowOffset < POOL_SIZE; rowOffset += 1) {
      for (let columnOffset = 0; columnOffset < POOL_SIZE; columnOffset += 1) {
        const inputIndex = (startRow + rowOffset) * INPUT[0].length + startColumn + columnOffset;
        sourceCells.push(inputGrid.children[inputIndex]);
      }
    }

    if (mode === "max") {
      sourceCells.forEach((cell) => cell.classList.add("is-source-max"));
      const maxValue = Math.max(...values);
      sourceCells[values.indexOf(maxValue)].classList.add("is-picked");
      note.textContent = `Max: max(${values.join(", ")}) = ${maxValue}`;
    } else {
      sourceCells.forEach((cell) => cell.classList.add("is-source-average"));
      const sum = values.reduce((total, value) => total + value, 0);
      note.textContent = `Average: (${values.join(" + ")}) ÷ 4 = ${sum / 4}`;
    }

    resultCell.classList.add("is-current");
    note.dataset.mode = mode;
  }

  maxGrid = createGrid(maxResults, "pool-result pool-max", (row, column, cell) => select("max", row, column, cell));
  averageGrid = createGrid(averageResults, "pool-result pool-average", (row, column, cell) => select("average", row, column, cell));

  const layout = document.createElement("div");
  layout.className = "pool-layout";
  layout.append(
    createSection("입력 6×6", "원본 크기", inputGrid),
    createSection("Max Pooling", "2×2 · stride 2 → 3×3", maxGrid),
    createSection("Average Pooling", "2×2 · stride 2 → 3×3", averageGrid),
  );
  body.replaceChildren(layout, note);
  root.dataset.mounted = "true";
}

document.querySelectorAll('[data-widget="pooling-compare"]').forEach(mountPoolingCompare);
