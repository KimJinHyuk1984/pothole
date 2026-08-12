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

## 로컬 vendor 자산

- Pretendard Variable 1.3.9 — SIL Open Font License 1.1
- JetBrains Mono 2.304 — SIL Open Font License 1.1
- PrismJS 1.29.0 — MIT License

각 라이선스 전문은 해당 `vendor/` 하위 디렉터리에 포함되어 있습니다.
