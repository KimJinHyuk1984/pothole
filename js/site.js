const STORAGE_KEYS = {
  theme: "pothole:theme",
  visited: "pothole:visited",
};

const currentSlug = document.body.dataset.page || getSlugFromLocation();

function getSlugFromLocation() {
  const filename = location.pathname.split("/").pop() || "index.html";
  return filename.replace(/\.html$/i, "") || "index";
}

function readVisited() {
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEYS.visited) || "[]");
    return Array.isArray(value) ? value.filter((item) => typeof item === "string") : [];
  } catch {
    return [];
  }
}

function recordVisit(slug) {
  const visited = new Set(readVisited());
  visited.add(slug);

  try {
    localStorage.setItem(STORAGE_KEYS.visited, JSON.stringify([...visited]));
  } catch {
    // 저장 공간이 차단된 환경에서도 콘텐츠 탐색은 계속 동작한다.
  }

  return visited;
}

function setupThemeToggle() {
  const button = document.querySelector("[data-theme-toggle]");
  if (!button) return;

  const label = button.querySelector("[data-theme-label]");
  const icon = button.querySelector("[data-theme-icon]");

  const sync = () => {
    const isLight = document.documentElement.dataset.theme === "light";
    button.setAttribute("aria-pressed", String(isLight));
    button.setAttribute("aria-label", isLight ? "다크 모드로 전환" : "라이트 모드로 전환");
    if (label) label.textContent = isLight ? "다크 모드" : "라이트 모드";
    if (icon) icon.textContent = isLight ? "☾" : "☀";
  };

  button.addEventListener("click", () => {
    const next = document.documentElement.dataset.theme === "light" ? "dark" : "light";
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem(STORAGE_KEYS.theme, next);
    } catch {
      // 로컬 저장소를 쓸 수 없어도 현재 문서의 테마는 전환한다.
    }
    sync();
  });

  sync();
}

function makeElement(tagName, className, text) {
  const element = document.createElement(tagName);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

function renderCurriculum(nav, visited) {
  const root = document.querySelector("[data-nav-tree]");
  if (!root) return;

  const partById = new Map(nav.parts.map((part) => [part.id, part]));
  const pagesByPart = new Map(nav.parts.map((part) => [part.id, []]));

  nav.pages.forEach((page) => {
    if (pagesByPart.has(page.part)) pagesByPart.get(page.part).push(page);
  });

  root.replaceChildren();
  root.removeAttribute("aria-busy");

  const home = nav.pages.find((page) => page.part === 0);
  if (home) {
    const origin = makeElement("a", "curriculum-origin");
    origin.href = home.href;
    origin.setAttribute("aria-current", home.slug === currentSlug ? "page" : "false");

    const position = makeElement("span", "curriculum-origin__position", String(home.index).padStart(2, "0"));
    const name = makeElement("span", "curriculum-origin__name", home.title);
    const branch = makeElement("span", "curriculum-origin__branch", "4 PARTS");
    const check = makeElement("span", "curriculum-origin__check", visited.has(home.slug) ? "✓" : "");
    check.setAttribute("aria-hidden", "true");

    origin.append(position, name, branch, check);
    root.append(origin);
  }

  nav.parts.forEach((part) => {
    const card = makeElement("article", "curriculum-card");
    card.dataset.part = String(part.id);

    const head = makeElement("header", "curriculum-card__head");
    const partLabel = makeElement("p", "curriculum-card__number", `PART ${String(part.id).padStart(2, "0")}`);
    const title = makeElement("h3", "curriculum-card__title", part.title);
    const subtitle = makeElement("p", "curriculum-card__subtitle", part.subtitle);
    const count = makeElement("span", "curriculum-card__count", `${pagesByPart.get(part.id).length}개 페이지`);

    const titleRow = makeElement("div", "curriculum-card__title-row");
    titleRow.append(title, count);
    head.append(partLabel, titleRow, subtitle);

    const list = makeElement("ol", "curriculum-list");
    pagesByPart.get(part.id).forEach((page) => {
      const item = makeElement("li", "curriculum-list__item");
      const link = makeElement("a", "curriculum-list__link");
      link.href = page.href;

      const position = makeElement("span", "curriculum-list__position", String(page.index).padStart(2, "0"));
      const name = makeElement("span", "curriculum-list__name", page.title);
      const check = makeElement("span", "curriculum-list__check", "✓");
      check.setAttribute("aria-hidden", "true");

      if (visited.has(page.slug)) {
        item.classList.add("is-visited");
        link.setAttribute("aria-label", `${page.title}, 방문함`);
      }
      if (page.slug === currentSlug) link.setAttribute("aria-current", "page");

      link.append(position, name, check);
      item.append(link);
      list.append(item);
    });

    card.append(head, list);
    root.append(card);
  });

  document.querySelectorAll("[data-course-page-count]").forEach((total) => {
    total.textContent = `${nav.course.totalPages} pages`;
  });

  document.dispatchEvent(new CustomEvent("pothole:navready", { detail: { nav, partById } }));
}

function renderLinkCards(links) {
  document.querySelectorAll("[data-link-key]").forEach((card) => {
    const key = card.dataset.linkKey;
    const url = typeof links[key] === "string" ? links[key].trim() : "";
    const status = card.querySelector("[data-link-status]");

    if (!url) {
      card.removeAttribute("href");
      card.removeAttribute("target");
      card.removeAttribute("rel");
      card.classList.add("is-disabled");
      card.setAttribute("aria-disabled", "true");
      card.setAttribute("tabindex", "-1");
      if (status) status.textContent = "준비 중";
      return;
    }

    card.href = url;
    card.target = "_blank";
    card.rel = "noopener noreferrer";
    card.classList.remove("is-disabled");
    card.removeAttribute("aria-disabled");
    card.removeAttribute("tabindex");
    if (status) status.textContent = "바로가기 ↗";
  });
}

function showLoadError(selector, message) {
  const target = document.querySelector(selector);
  if (!target) return;
  target.removeAttribute("aria-busy");
  target.replaceChildren(makeElement("p", "load-error", message));
}

async function loadHomeData(visited) {
  const navUrl = new URL("../data/nav.json", import.meta.url);
  const linksUrl = new URL("../data/links.json", import.meta.url);

  const [navResult, linksResult] = await Promise.allSettled([
    fetch(navUrl).then((response) => {
      if (!response.ok) throw new Error(`nav.json: ${response.status}`);
      return response.json();
    }),
    fetch(linksUrl).then((response) => {
      if (!response.ok) throw new Error(`links.json: ${response.status}`);
      return response.json();
    }),
  ]);

  if (navResult.status === "fulfilled") {
    renderCurriculum(navResult.value, visited);
  } else {
    console.error(navResult.reason);
    showLoadError("[data-nav-tree]", "목차를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.");
  }

  if (linksResult.status === "fulfilled") {
    renderLinkCards(linksResult.value);
  } else {
    console.error(linksResult.reason);
    renderLinkCards({});
  }
}

const visited = recordVisit(currentSlug);
setupThemeToggle();
loadHomeData(visited);
