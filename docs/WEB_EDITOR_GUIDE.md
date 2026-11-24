# 웹 에디터 구현 가이드

## 📋 개요

AICC Admin Frontend 프로젝트에서 React Quill 기반의 웹 에디터를 사용하는 방법을 안내합니다.

## 🔧 설치된 플러그인

### React Quill
- **버전**: 1.3.5
- **설명**: Quill.js의 React wrapper로, 강력하고 확장 가능한 리치 텍스트 에디터
- **React 호환성**: React 16.14와 완벽 호환
- **라이선스**: BSD-3-Clause (상업적 사용 가능)

### 설치 확인
```json
{
  "dependencies": {
    "react": "^16.14.0",
    "react-quill": "^1.3.5"
  }
}
```

이미 `package.json`에 설치되어 있으므로 추가 설치가 필요하지 않습니다.

## 📦 프로젝트 구조

```
src/
├── components/
│   └── HtmlEditor/
│       └── index.js              # HtmlEditor 컴포넌트 (React Quill 기반)
├── containers/
│   ├── bo/
│   │   └── BO999_EDITOR/         # 웹 에디터 샘플 페이지 (신규 생성)
│   │       ├── index.js
│   │       └── styles.css
│   └── docsample/
│       ├── doc/
│       │   └── components/
│       │       └── HtmlEditor-Guide.md    # 상세 가이드 문서
│       └── examples/
│           └── HtmlEditor-Examples.js     # 다양한 예제 모음
```

## 🚀 사용 방법

### 1. 기본 사용법

```javascript
import React, { Component } from 'react';
import { HtmlEditor } from 'components';

class MyComponent extends Component {
  constructor(props) {
    super(props);
    this.state = {
      content: '<p>초기 내용</p>'
    };
  }

  handleContentChange = (eventObject) => {
    // eventObject = { id: 'editorId', value: '<p>HTML 내용</p>' }
    const content = eventObject.value;
    this.setState({ content });
  };

  render() {
    return (
      <HtmlEditor
        id="myEditor"
        value={this.state.content}
        onChange={this.handleContentChange}
        height={300}
      />
    );
  }
}
```

### 2. Props 속성

| 속성명 | 타입 | 기본값 | 필수 | 설명 |
|--------|------|--------|------|------|
| id | string | - | ✓ | 에디터 고유 ID |
| value | string | - | ✓ | HTML 내용 |
| onChange | function | () => {} | ✓ | 내용 변경 시 콜백 |
| height | number | 300 | - | 에디터 높이 (px) |
| toolbarHidden | boolean | false | - | 툴바 숨김 여부 |
| readOnly | boolean | false | - | 읽기 전용 여부 |

### 3. 이벤트 처리

HtmlEditor는 onChange 이벤트를 통해 `{ id, value }` 형태의 객체를 전달합니다:

```javascript
handleContentChange = (eventObject) => {
  // 안전한 처리 방법
  let safeContent = '';
  
  if (eventObject && typeof eventObject === 'object' && eventObject.value !== undefined) {
    safeContent = typeof eventObject.value === 'string' ? eventObject.value : '';
  } else if (typeof eventObject === 'string') {
    safeContent = eventObject;
  }
  
  this.setState({ content: safeContent });
};
```

## 🎨 지원 기능

### 텍스트 서식
- 굵게 (Bold)
- 기울임 (Italic)
- 밑줄 (Underline)
- 취소선 (Strike)
- 인용구 (Blockquote)

### 글꼴 스타일
- 크기 (Small, Normal, Large, Huge)
- 글꼴 (Font Family)
- 색상 (Color)
- 배경색 (Background)

### 목록 및 정렬
- 순서 있는 목록 (Ordered List)
- 순서 없는 목록 (Bullet List)
- 들여쓰기 (Indent)
- 내어쓰기 (Outdent)
- 정렬 (Left, Center, Right)

### 기타
- 초기화 (Clean)

## 📝 샘플 페이지

### BO999_EDITOR
새로 생성된 샘플 페이지에서 다음 기능을 확인할 수 있습니다:

1. **기본 에디터**
   - 제목과 내용 입력
   - 저장 및 내용 지우기
   - 글자 수 표시

2. **템플릿 기반 에디터**
   - 공지사항, 이메일, 보고서, 회의록 템플릿
   - HTML 파일로 내보내기

3. **읽기 전용 / 편집 모드 전환**
   - 읽기 전용 모드
   - 편집 모드 전환
   - 툴바 숨김/표시

### 접근 방법
```
경로: /bo/BO999_EDITOR
파일: src/containers/bo/BO999_EDITOR/index.js
```

## 💡 개발 팁

### 1. 콘텐츠 검증
```javascript
// HTML 태그 제거하여 순수 텍스트 추출
const textContent = htmlContent.replace(/<[^>]*>/g, '').trim();

// 최소/최대 길이 검증
if (textContent.length < 10) {
  alert('최소 10자 이상 입력해주세요.');
}
```

### 2. HTML Sanitization (XSS 방지)
```javascript
// 위험한 태그 제거
const sanitizeHtml = (html) => {
  const forbiddenTags = /<(script|iframe|embed|object)[^>]*>.*?<\/\1>/gi;
  return html.replace(forbiddenTags, '');
};
```

### 3. 템플릿 활용
```javascript
const templates = {
  notice: {
    name: '공지사항',
    content: '<h2>📢 공지사항</h2><p>[내용]</p>'
  }
};
```

### 4. HTML 내보내기
```javascript
const exportToHtml = (content) => {
  const htmlContent = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>문서</title>
</head>
<body>
    ${content}
</body>
</html>`;
  
  const blob = new Blob([htmlContent], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'document.html';
  a.click();
  URL.revokeObjectURL(url);
};
```

## 🔍 추가 예제

### 읽기 전용 모드
```javascript
<HtmlEditor
  id="readOnlyEditor"
  value={content}
  onChange={this.handleChange}
  readOnly={true}
  toolbarHidden={true}
  height={300}
/>
```

### 높이 조절
```javascript
<HtmlEditor
  id="tallEditor"
  value={content}
  onChange={this.handleChange}
  height={500}  // 500px 높이
/>
```

## 📚 참고 문서

### 프로젝트 내부 문서
- **상세 가이드**: `src/containers/docsample/doc/components/HtmlEditor-Guide.md`
- **예제 모음**: `src/containers/docsample/examples/HtmlEditor-Examples.js`
- **컴포넌트 소스**: `src/components/HtmlEditor/index.js`

### 외부 문서
- [React Quill 공식 문서](https://github.com/zenoamaro/react-quill)
- [Quill.js 공식 문서](https://quilljs.com/)
- [React 16.14 문서](https://16.reactjs.org/)

## ⚠️ 주의사항

### 1. React Quill 버전
- 현재 버전: 1.3.5
- React 16.14와 호환
- 업그레이드 시 호환성 확인 필요

### 2. 이벤트 객체 구조
- onChange는 `{ id, value }` 형태의 객체를 전달
- 안전한 타입 체크 필수

### 3. 보안
- 사용자 입력 HTML은 반드시 sanitization 필요
- XSS 공격 방지를 위한 검증 필수

### 4. 성능
- 대용량 콘텐츠 처리 시 성능 저하 가능
- debounce 처리 권장

## 🎯 요약

1. **플러그인**: React Quill 1.3.5 (이미 설치됨)
2. **컴포넌트**: `src/components/HtmlEditor/index.js`
3. **샘플 페이지**: `src/containers/bo/BO999_EDITOR/`
4. **React 호환성**: React 16.14 완벽 호환
5. **상업적 사용**: BSD-3-Clause 라이선스로 가능

---

**작성일**: 2026-01-21  
**버전**: 1.0.0  
**작성자**: AI Assistant
