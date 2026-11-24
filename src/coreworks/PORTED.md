# CoreWorks 이식 대장 (admin-frontend)

- **출처**: `call-system/project/apps/call-admin/call-admin-frontend/src/coreworks/`
  (그쪽 자체가 ai-pms/coreworks-frontend `bda81537` 의 이식본이다 — 그쪽 PORTED.md 참조)
- **가져온 날**: 2026-09-02
- **근거 문서**: `docs/design/design-admin-coreworks-reskin.md`

## 파일별 상태

| 파일 | 상태 |
|---|---|
| `coreworks.css` | **원문 그대로** (무수정) |
| `common/themePrefs.js` | **원문 그대로** (무수정) |
| `common/layoutPrefs.js` | **원문 그대로** (무수정) |
| `profile/ThemeColorSettings.js` | **원문 그대로** (무수정) |
| `login/AuthFormShell.js` | 고침 — ① react-i18next 제거(admin 은 i18n 이 없다) ② `/login` 뒤로가기 Link 제거(미인증이면 루트가 곧 로그인) ③ 푸터 `© 2026 ChatCall` |
| `login/LoginBrandAside.js` | 고침 — ① react-i18next 제거(문구를 한국어 리터럴로) ② 브랜딩 `CC` / `ChatCall Admin` |
| `common/ThemeContext.js` | **가져오지 않았다** — admin 은 클래스 컴포넌트 세계라 훅 컨텍스트를 쓸 곳이 없다. 기동 시 `applyTheme()` + storage 이벤트(창 간 동기화)로 충분하다 |

## 규율 (원본과 동일)

1. **이 폴더의 파일에 admin 규칙을 더하지 않는다.** admin 전용 규칙은
   `src/assets/styles/cw-shell.css` 에 쓴다. 섞으면 원본과 대조할 수 없다.
2. 고쳐야 하면 **이 파일에 무엇을 왜 고쳤는지 적는다.**
3. `.js` 안에 JSX 가 있다 — admin 의 vite 설정(`esbuild.loader:'jsx'`, `include:/\.js$/`)이
   이미 허용하므로 별도 플러그인이 필요 없다. **파일을 `.jsx` 로 개명하지 않는다**(원본 대조).

## 토큰·셸

- `src/assets/styles/tokens.css` — 원본 `styles/tokens.css` **원문 그대로**
- `src/assets/styles/cw-shell.css` — 원본 `styles/shell.css` 의 이식 + **admin 전용 규칙**
  (트레이 탭·GNB 위젯·서브메뉴 검색·MDI 조정). 원문과 섞인 파일이므로 대조는 절 단위로.
