import React from 'react';

class BasicButton extends React.Component{
	constructor (props) {
			super(props);
			this.state = { disbaled : this.props.disabled }
	}
	static defaultProps = {
		mt: '0px',
		mr: '0px',
		mb: '0px',
		ml: '0px',
		disabled: false,
		type : 'default',
		size : 'md',
		color : 'grey',
		filled : false,   // 올바른 prop명
		fiiled : false,   // 하위 호환 (기존 오타 지원)
		innerImage : false,
		className : '',   // 추가 CSS 클래스
		onClick : (e) => {return;}
	}
	render () {
		let filledClass, innerImage, btnClass, iconClass;

		// filled 또는 fiiled 둘 중 하나라도 true면 적용 (하위 호환)
		const isFilled = this.props.filled || this.props.fiiled;
		filledClass = isFilled ? '' : '-o';
		innerImage = (this.props.innerImage) ? ' i' : '';

		// 기본 클래스 생성
		btnClass = 'scrm-btn ' + this.props.size + ' ' + this.props.color + filledClass;
		btnClass += (this.props.value) ? '' : innerImage;
		
		// type 클래스 추가 (default가 아닌 경우에만)
		if (this.props.type && this.props.type !== 'default') {
			btnClass += ' btn-' + this.props.type;
		}
		
		// 사용자 정의 className 추가
		if (this.props.className) {
			btnClass += ' ' + this.props.className;
		}

		if (this.props.innerImage) {
			switch (this.props.icon) {
				case "save"    : iconClass = 'xi-diskette xi-x';  break;
				case "add"     : iconClass = 'xi-plus xi-x';      break;
				case "del"     : iconClass = 'xi-minus xi-x';     break;
				case "check"   : iconClass = 'xi-check xi-x';     break;
				case "trash"   : iconClass = 'xi-trash-o xi-x';   break;				
				case "undo"    : iconClass = 'xi-undo';           break;
				case "redo"    : iconClass = 'xi-redo';           break;
				case "arrowUp" : iconClass = 'xi-arrow-up';       break;
				case "arrowDn" : iconClass = 'xi-arrow-down';     break;
				case "up" 	   : iconClass = 'xi-angle-up-min';   break;
				case "down"    : iconClass = 'xi-angle-down-min'; break;
				case "close"   : iconClass = 'xi-close';          break;
				case "play"    : iconClass = 'xi-play xi-x';      break;
				case "pause"   : iconClass = 'xi-pause xi-x';     break;
				case "left"    : iconClass = 'xi-arrow-left xi-x c-grey-6';   break;
				case "right"   : iconClass = 'xi-arrow-right xi-x c-grey-6';  break;
				case "copy"    : iconClass = isFilled ? 'xi-documents xi-x'  : 'xi-documents-o xi-x'; break;
				case "download": iconClass = isFilled ? 'xi-download xi-x'   : 'xi-download-o xi-x';  break;
				case "srch"    : iconClass = isFilled ? 'xi-search xi-x'     : 'xi-search-o xi-x';    break;
				default : iconClass = null; break;
			}
		}
		return (
			<button className = {btnClass} ref = { (ref) => this.button = ref } id = {this.props.id} onClick = {(e) => { e.target.blur(); this.props.onClick(e);} } disabled={ this.props.disabled }
					tooltip = {this.props.tooltip} style={{ marginTop: this.props.mt, marginRight: this.props.mr, marginBottom: this.props.mb, marginLeft: this.props.ml, visibility : (this.props.hidden) ? 'hidden' :  'visible'}}
			>
				{(this.props.innerImage && iconClass !== null) ? <i onClick= {(e) => { e.stopPropagation(); this.button.click(); }} className={ iconClass }></i> :  null}
				{this.props.value}
			</button>
		);
	}
}

class IconButton extends React.Component{
	render () {
		return (
			<button tooltip = {this.props.tooltip} className= {this.props.classes} id = {this.props.id} style={this.props.style} onClick = {this.props.onClick}></button>
		);
	}
}
class BadgeButton extends React.Component{
	render () {
		return (
			<button tooltip = {this.props.tooltip} className= {this.props.classes} id = {this.props.id} onClick = {this.props.onClick}></button>
		);
	}
}
export {BasicButton, IconButton, BadgeButton};
