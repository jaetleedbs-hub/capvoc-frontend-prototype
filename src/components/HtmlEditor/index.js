import React from 'react';
import Style from 'style-it';
import DOMPurify from 'dompurify';

import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

/**
 * [B4/§10.96 · A3-10] 표시 직전 HTML 새니타이즈.
 *
 * 연혁. 이 에디터는 quill 1.x 를 쓰고 있었고 그 라인에는 XSS 권고에 대한 패치가 없었다
 * (react-quill 2.0.0 도 여전히 quill ^1.3.7 이라 올려도 안 닫혔다). 그래서 §10.96 에서
 * 먼저 <들어오는 HTML 을 걸러> 막았고, A3-10 에서 react-quill-new(quill 2.0.x)로 옮겨
 * 라이브러리 자체를 교체했다.
 *
 * <b>그래도 이 새니타이즈를 걷어내지 않는다.</b> quill 을 올린 것은 <에디터가 만드는>
 * HTML 의 문제를 닫은 것이고, 여기서 막는 것은 <DB 에 이미 저장된> HTML 이다.
 * 공지사항 본문처럼 저장된 값을 그대로 렌더하는 경로에는 교체 이전에 심어진 값이
 * 그대로 남아 있다. 라이브러리 교체는 과거 데이터를 소급해 고쳐 주지 않는다.
 *
 * 작성자가 관리자라 관리자→관리자 저장형 XSS 범위지만, 권한이 낮은 관리자가 높은
 * 관리자를 노릴 수 있으므로 "내부 사용자니까 괜찮다"로 둘 수 없다.
 *
 * 허용 목록은 아래 `formats` 가 실제로 만들어 내는 태그·속성에 맞춘다 —
 * 정상 콘텐츠에는 <아무것도 바뀌지 않아야> 한다. 바뀌면 커서가 튀거나 서식이 사라진다.
 */
const ALLOWED_TAGS = [
	'p', 'br', 'span', 'div', 'strong', 'em', 'u', 's', 'blockquote', 'code', 'pre',
	'ol', 'ul', 'li', 'a', 'img', 'iframe', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'sub', 'sup'
];
// data-list 는 quill 2 가 글머리 목록을 표현하는 방식이다 — <ol><li data-list="bullet">.
//  지우면 글머리표가 <번호>로 렌더된다. quill 1 은 <ul> 을 썼기에 이전에는 없어도 됐다.
const ALLOWED_ATTR = ['href', 'target', 'rel', 'src', 'alt', 'title', 'class', 'style', 'width', 'height', 'data-list'];

const sanitizeHtml = (html) => {
	if (typeof html !== 'string' || html === '') {
		return html;
	}
	return DOMPurify.sanitize(html, {
		ALLOWED_TAGS,
		ALLOWED_ATTR,
		// javascript: · data: URL 을 막는다. quill 의 link/image 는 http(s) 만 쓴다.
		ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto|tel):|[^a-z]|[a-z+.-]+(?:[^a-z+.\-:]|$))/i
	});
};

class HtmlEditor extends React.Component {
	constructor (props) {
		super(props);
		this.state = { }
		this.onChange  = this.onChange.bind(this);
	}
	static defaultProps = {
		toolbarHidden : false,
		readOnly : false,
		onChange : () => {return;}
	}
	modules = {
		toolbar : (!this.props.toolbarHidden) ? [
			["bold", "italic", "underline", "strike", "blockquote","link"],
			[{ size: ["small", false, "large", "huge"] }, { font: [] }, { color: [] }, { background: [] }],
			[{ list: "ordered" }, { list: "bullet" }, { indent: "-1" }, { indent: "+1" }, { align: [] }],
			["clean"]
		] : false,
		clipboard: { matchVisual: false }
	};
	// [A3-10] quill 2 에는 "bullet" 이라는 포맷이 없다 — quill 1 의 별도 포맷이었고
	//  2 에서는 list 의 <값>이 됐다(툴바의 { list: "bullet" } 은 그대로 유효하다).
	//  등록되지 않은 이름을 넘기면 quill 이 "Cannot import" 로 거른다.
	formats = [ "header", "bold", "italic", "underline", "strike", "blockquote", "size", "color", "list", "indent", "link", "image", "video", "align", "background", "code"];

	onChange = (e) => { this.props.onChange({ id: this.props.id, value : e}); }
	render (){
		return (
			<React.Fragment>
				<Style>
					{`
						.scrm-editor-contnents { width: 100%; box-sizing: border-box; }
						.scrm-editor-contnents .ql-editor{ width:  100%; height: ${this.props.height}px; overflow-y: auto; overflow-x: auto; }
					`}
				</Style>
				<ReactQuill theme = 'snow'
							id = {this.props.id}
							value = {sanitizeHtml(this.props.value)}
							onChange = {this.onChange}
							modules={this.modules}
							formats={this.formats}
							placeholder={'내용을 입력하세요.'}
							readOnly={this.props.readOnly}
							className = 'scrm-editor-contnents'
				/>
			</React.Fragment>
		);
	}
}
export default HtmlEditor;