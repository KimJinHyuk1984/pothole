# 딥러닝 CNN으로 포트홀을 찾아라

고등학생 대상 딥러닝(CNN) 강의를 인터랙티브 웹 교재로 재구성하는 GitHub Pages 프로젝트입니다.

## 로컬에서 실행하기

이 프로젝트는 빌드 단계가 없는 정적 사이트입니다. 저장소 루트에서 아래 명령을 실행합니다.

```sh
python -m http.server 8000
```

브라우저에서 <http://localhost:8000>을 엽니다. HTML 파일을 직접 열지 않고 로컬 서버를 사용하는 이유는 ES Modules 및 JSON 데이터 요청이 브라우저의 파일 접근 정책에 막히지 않게 하기 위해서입니다.

## 기술 구성

- 순수 HTML, CSS, JavaScript(ES Modules)
- 로컬 Pretendard 및 JetBrains Mono 웹폰트
- 로컬 Prism.js(문법 강조, 줄 번호, 줄 강조)
- 외부 CDN 런타임 의존 없음

## 디렉터리 구조

```text
.
├── assets/             # 제공된 WebP 강의 이미지
├── code/               # 학생 다운로드용 원본 노트북 5종
├── css/                # 디자인 토큰, 기본, 컴포넌트, 발표 모드 스타일
├── data/               # 내비게이션·위젯·외부 링크 데이터
├── js/                 # 사이트 동작 및 위젯 ES Modules
│   └── widgets/
├── vendor/             # 저장소에 포함한 폰트와 Prism.js
└── _source/            # 제작용 원천 자료(사이트 콘텐츠로 사용하지 않음)
```

## 콘텐츠 수정 원칙

- 모든 사이트 내부 링크와 자산 경로는 GitHub Pages의 `/pothole` 서브패스에서 동작하도록 상대 경로를 사용합니다.
- `_source/`는 제작 참고 자료입니다. 브라우저에 노출할 콘텐츠나 런타임 자산으로 참조하지 않습니다.
- `assets/*.webp`는 제공된 원본을 그대로 사용하며 재인코딩하거나 리사이즈하지 않습니다.
- `code/*.ipynb`는 학생 다운로드용 원본 노트북입니다. 웹 제작에 필요한 추출 코드와 메타데이터는 `_source/`에서 직접 읽습니다.
- 외부 링크는 `data/links.json`에서 관리합니다. 빈 값은 화면에서 비활성화된 “준비 중” 상태로 처리합니다.

## 코드블록을 수동으로 추가할 때

코드블록은 아래 구조를 그대로 사용합니다. 줄번호는 `<code>`의 텍스트가 아니라 Prism이 별도 요소로 만들기 때문에 복사 결과에는 포함되지 않습니다.

```html
<figure class="code"
  data-lang="python"
  data-file="example.py"
  data-steps='[{"lines":"2","note":"두 번째 줄 설명"}]'
  data-collapse="12">
  <figcaption>
    <span class="dots" aria-hidden="true"><i></i><i></i><i></i></span>
    <span class="fname">example.py</span>
    <button class="btn-copy" type="button">복사</button>
  </figcaption>
  <div class="code-viewport">
    <pre class="line-numbers"><code class="language-python">print("hello")</code></pre>
  </div>
  <div class="code-note" aria-live="polite">코드 설명</div>
</figure>
```

- `data-lang`은 언어 이름, `data-file`은 화면에 표시할 파일 식별자입니다. 실제 문법 강조 언어는 `<code class="language-python">`처럼 `language-*` 클래스로 지정합니다.
- `data-steps`는 `{ "lines": "4" 또는 "7-8", "note": "설명" }` 객체의 JSON 배열입니다. 줄 범위는 `<code>` 원문의 실제 줄번호와 일치해야 하며, 초기 0단계에서는 강조가 없습니다. 단계가 있는 코드블록의 상위 beat에는 `data-code-step-beat`도 둡니다.
- `data-collapse="12"`는 처음 12줄까지만 보이게 하는 선택 속성입니다. 접힌 범위의 줄이 단계에서 강조되면 자동으로 펼쳐집니다.
- `.code-viewport`는 긴 코드를 가로 스크롤하고 접힌 높이를 제어하는 창입니다. `<pre class="line-numbers">`는 Prism 줄번호 플러그인의 기준이며, 줄번호는 `<code>` 안에 직접 쓰지 않습니다.
- Prism은 manual 모드입니다. 코드블록이 있는 페이지는 테마 초기화 스크립트에서 `window.Prism = { manual: true };`를 먼저 설정하고, `vendor/prism/prism.css`, `vendor/prism/prism.js`, `js/codeblock.js`를 기존 코드 페이지와 같은 순서로 불러와야 합니다. `codeblock.js`가 `Prism.highlightAll()`을 한 번 호출하므로 별도로 다시 호출하지 않습니다.
- HTML 안의 코드 원문은 들여쓰기와 빈 줄까지 줄번호에 포함됩니다. 코드 앞뒤에 의도하지 않은 개행을 넣지 말고, `&`, `<`, `>`가 코드에 있으면 각각 `&amp;`, `&lt;`, `&gt;`로 이스케이프합니다. Python 문자열의 `\n`은 역슬래시와 `n`을 그대로 작성해야 합니다.

## 로컬 vendor 자산

- Pretendard Variable 1.3.9 — SIL Open Font License 1.1
- JetBrains Mono 2.304 — SIL Open Font License 1.1
- PrismJS 1.29.0 — MIT License

각 라이선스 전문은 해당 `vendor/` 하위 디렉터리에 포함되어 있습니다.
