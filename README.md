# capvoc-frontend-prototype

CAPVOC prototype 화면. **Vite + React** (Create React App 아님).
backend 없이 자체 prototype 형태

---

## 처음 체크아웃했다면

> 이 절은 **사람과 에이전트 모두** 이것만 보고 띄울 수 있게 쓰여 있다.
> 막히는 자리가 있으면 여기를 고친다 — 다음 사람이 같은 데서 막힌다.

```bash
yarn install
yarn dev            # http://localhost:18031
```

**설정 파일을 만들 필요가 없다.** 기본값이 `vite.config.js` 에 들어 있고,
그 값이 로컬 capvoc-backend 를 가리킨다.

### ★ `--port` 를 붙이지 않는다

```bash
yarn dev            # ⭕
```

## 빌드

```bash
yarn build
yarn preview
```

---

## 규약

착수 전에 **`docs/CLAUDE.md`** 를 읽는다. 여기에 복사하지 않는다.
