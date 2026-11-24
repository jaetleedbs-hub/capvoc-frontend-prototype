# frontend/docs — 화면 개발 표준

PPTX 로 설계한 화면을 **AI(Claude Code·Cursor)로 만드는** 데 쓰는 표준이다.
AI 는 저장소 루트의 `CLAUDE.md`(Cursor 는 `AGENTS.md`)를 통해 이 폴더로 안내된다.

| 문서 | 무엇 | 누가 |
|---|---|---|
| [ai-prompt.md](ai-prompt.md) | 그림과 함께 붙여 넣는 **요청문** | 개발자 |
| [screen-standard.md](screen-standard.md) | **화면 개발 표준서** — 작업 순서 · 화면기능정의 · 명명 규칙 · 배치 표준 · 코드 골격 · 메뉴 등록 | AI · 개발자 |
| [spec-template.md](spec-template.md) | 화면기능정의(`SPEC.md`) 양식 | AI |
| [design-standard.md](design-standard.md) | 디자인 표준 — 색 · 글꼴 · 간격 · 버튼 · 폼 · 그리드 | AI · 개발자 |
| [component-reference.md](component-reference.md) | 부품의 속성 · 이벤트 · 쓰지 않는 부품 | AI |

**처음이면** — 개발자는 [ai-prompt.md](ai-prompt.md) 의 「흐름」부터,
AI 는 [screen-standard.md](screen-standard.md) §1 부터 읽는다.

> 이 문서들은 **지금 코드가 실제로 하는 것**을 적는다. 코드와 문서가 다르면 그 자체가 결함이다 —
> 어느 쪽이 맞는지 확인하고 틀린 쪽을 고친다. 추측으로 문서를 고치지 않는다.
