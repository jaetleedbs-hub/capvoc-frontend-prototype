import React, { Suspense } from 'react';
import ErrorBoundary from '../ErrorBoundary';
import PropTypes from 'prop-types';
import {getPopupRoutes} from 'routes/popupRoute.js';
import Draggable from 'react-draggable';
import DialogBox from 'react-modeless';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import * as appModuleActions from 'store/modules/appModule';
import {BasicButton as Button} from 'components';
import { removeDialogNotificationManager } from 'common/NotificationManager';
import { ComLib } from 'common';

class AlertDialog extends React.Component {
	static defaultProps = {
		open: false,
		message : '',
		onClose : () => {}
	};
	static propTypes = {
		open : PropTypes.bool.isRequired,
		message :  PropTypes.string.isRequired,
		onClose: PropTypes.func.isRequired
	};

	constructor(props) {
		super(props);
		this.state = {
			dialogSize: this.calculateDialogSize(props.message)
		};
		this.isClosing = false;
	}

	componentDidMount() {
		if (this.props.open) {
			this.focusConfirmButton();
			document.addEventListener('keydown', this.onKeyDown);
		}
	}

	componentDidUpdate(prevProps) {
		if (!prevProps.open && this.props.open) {
			this.focusConfirmButton();
			document.addEventListener('keydown', this.onKeyDown);
		} else if (prevProps.open && !this.props.open) {
			document.removeEventListener('keydown', this.onKeyDown);
		}
		
		// 메시지가 변경되면 크기 재계산
		if (prevProps.message !== this.props.message) {
			this.setState({
				dialogSize: this.calculateDialogSize(this.props.message)
			});
		}
	}

	componentWillUnmount() {
		document.removeEventListener('keydown', this.onKeyDown);
	}

	// 메시지 길이에 따른 다이얼로그 크기 계산
	calculateDialogSize = (message) => {
		if (!message) return { width: 400, height: 200 };
		const lines = message.split('\n');
		const maxLineLength = Math.max(...lines.map(line => line.length));
		
		// 기본 크기
		let width = Math.max(400, Math.min(800, maxLineLength * 12 + 80));
		let height = Math.max(200, Math.min(600, lines.length * 25 + 120));
		
		return { width, height };
	}

	// 메시지를 적절한 길이로 줄바꿈
	formatMessage = (message) => {
		if (!message) return '';
		
		const maxLineLength = Math.floor((this.state.dialogSize.width - 40) / 10);
		const lines = message.split('\n');
		const formattedLines = [];
		
		lines.forEach(line => {
			if (line.length <= maxLineLength) {
				formattedLines.push(line);
			} else {
				// 긴 줄을 적절히 나누기
				let remainingLine = line;
				while (remainingLine.length > maxLineLength) {
					let breakPoint = maxLineLength;
					// 단어 경계에서 자르기 시도
					const spaceIndex = remainingLine.lastIndexOf(' ', maxLineLength);
					if (spaceIndex > maxLineLength * 0.7) {
						breakPoint = spaceIndex;
					}
					
					formattedLines.push(remainingLine.substring(0, breakPoint));
					remainingLine = remainingLine.substring(breakPoint).trim();
				}
				if (remainingLine) {
					formattedLines.push(remainingLine);
				}
			}
		});
		
		return formattedLines.join('\n');
	}

	focusConfirmButton = () => {
		setTimeout(() => {
			const confirmButton = document.getElementById('alert-dialog-confirm-btn');
			if (confirmButton) {
				confirmButton.focus();
			}
		}, 100);
	}

	onClose = () => { 
		if (this.isClosing) return;
		this.isClosing = true;
		this.props.onClose();
	};

	onKeyDown = (e) => {
		if (this.isClosing) return;
		
		if (e.key === 'Enter' || e.key === ' ' || e.keyCode === 13 || e.keyCode === 32) {
			e.preventDefault();
			this.onClose();
		} else if (e.key === 'Escape' || e.keyCode === 27) {
			e.preventDefault();
			this.onClose();
		}
	}

	render () {
		const { dialogSize } = this.state;
		const formattedMessage = this.formatMessage(this.props.message);
		const needsScroll = this.props.message && (
			this.props.message.split('\n').length > 20 || 
			Math.max(...this.props.message.split('\n').map(line => line.length)) > 80
		);

		return (
			<DialogBox
				isOpen={this.props.open}
				onClose={this.onClose}
				style  = {{backgroundColor : "rgba(0, 0, 0, 0.3)", borderRadius: '4px', zIndex : '9994', ...this.props.style}}
				backdropStyle = {{ zIndex : '9993' }}
				noBackdrop={false}
				// 클래스 추가 2025-07-22 noah
				className={'scrm-alert-dialog ' + (this.props.className || '') }
			>
				<div 
					className="scrm-alert-modal-content"
					style={{
						width: `${dialogSize.width}px`,
						height: `${dialogSize.height}px`,
						minWidth: '400px',
						minHeight: '200px',
						maxWidth: '800px',
						maxHeight: '600px'
					}}
				>
					<div className="scrm-alert-modal-content-header">
						<button className="scrm-btn" style={{float: 'right'}} onClick={this.onClose}>
							<i className="xi-close"></i>
						</button>
					</div>
					<div 
						className="scrm-alert-modal-content-body"
						style={{
							height: `${dialogSize.height - 80}px`,
							overflow: needsScroll ? 'auto' : 'visible',
							padding: '10px 20px'
						}}
					>
						<div className="scrm-label-div">
							<pre style={{
								whiteSpace: 'pre-wrap',
								wordWrap: 'break-word',
								margin: 0,
								fontFamily: 'inherit',
								fontSize: 'inherit',
								lineHeight: '1.5'
							}}>
								{formattedMessage}
							</pre>
						</div>
					</div>
					<div style={{
						position: 'absolute', 
						bottom: '5px', 
						textAlign: 'center', 
						width: '100%', 
						padding: '5px'
					}}>
						<Button 
							id="alert-dialog-confirm-btn" 
							color={'blue'} 
							onClick={this.onClose} 
							value={'확인'} 
							mr={10} 
							autoFocus={true}
						/>
					</div>
				</div>
			</DialogBox>
		);
	}
}
class ConfirmDialog extends React.Component {
	constructor (props) {
		super(props);
		this.state = {
			returnVal : false,
			dialogSize: this.calculateDialogSize(props.message),
			focus : false
		}
		this.isClosing = false;
	}
	static defaultProps = {
		open: false ,
		message :  '',
		onReturnVal : () =>  {} ,
		onClose: () =>  {}
	};
	static propTypes = {
		open : PropTypes.bool.isRequired,
		message :  PropTypes.string.isRequired,
		onReturnVal : PropTypes.func.isRequired,
		onClose: PropTypes.func.isRequired
	};
	componentDidMount() {
		if (this.props.open) {
			this.focusConfirmButton();
			document.addEventListener('keydown', this.onKeyDown);
		}
	}

	componentDidUpdate(prevProps) {
		if (!prevProps.open && this.props.open) {
			this.focusConfirmButton();
			document.addEventListener('keydown', this.onKeyDown);
		} else if (prevProps.open && !this.props.open) {
			document.removeEventListener('keydown', this.onKeyDown);
		}
		
		// 메시지가 변경되면 크기 재계산
		if (prevProps.message !== this.props.message) {
			this.setState({
				dialogSize: this.calculateDialogSize(this.props.message)
			});
		}
	}

	componentWillUnmount() {
		document.removeEventListener('keydown', this.onKeyDown);
	}

	focusConfirmButton = () => {
		// setTimeout(() => {
		// 	const confirmButton = document.getElementById('btnConfirm');
		// 	if (confirmButton) {
		// 		confirmButton.focus();
		// 	}
		// }, 100);
	}


	// 메시지 길이에 따른 다이얼로그 크기 계산
	calculateDialogSize = (message) => {
		if (!message) return { width: 400, height: 200 };
		
		const lines = message.split('\n');
		const maxLineLength = Math.max(...lines.map(line => line.length));
		
		// 기본 크기
		let width = Math.max(400, Math.min(800, maxLineLength * 12 + 80));
		let height = Math.max(200, Math.min(600, lines.length * 25 + 120));
		
		return { width, height };
	}

	// 메시지를 적절한 길이로 줄바꿈
	formatMessage = (message) => {
		if (!message) return '';
		
		const maxLineLength = Math.floor((this.state.dialogSize.width - 40) / 10);
		const lines = message.split('\n');
		const formattedLines = [];
		
		lines.forEach(line => {
			if (line.length <= maxLineLength) {
				formattedLines.push(line);
			} else {
				// 긴 줄을 적절히 나누기
				let remainingLine = line;
				while (remainingLine.length > maxLineLength) {
					let breakPoint = maxLineLength;
					// 단어 경계에서 자르기 시도
					const spaceIndex = remainingLine.lastIndexOf(' ', maxLineLength);
					if (spaceIndex > maxLineLength * 0.7) {
						breakPoint = spaceIndex;
					}
					
					formattedLines.push(remainingLine.substring(0, breakPoint));
					remainingLine = remainingLine.substring(breakPoint).trim();
				}
				if (remainingLine) {
					formattedLines.push(remainingLine);
				}
			}
		});
		
		return formattedLines.join('\n');
	}
	onClick = (e) => {
		if (this.isClosing) return;
		
		switch (e.target.id) {
			case 'btnConfirm' :  this.setState({...this.state, returnVal : true}, () => this.onClose()); break;
			case 'btnCancel' : this.setState({...this.state, returnVal : false}, () => this.onClose()); break;
			default : this.setState({...this.state, returnVal : false}, () => this.onClose()); break;
		}
	}

	onKeyDown = (e) => {
		if (this.isClosing) return;
		
		if (e.key === 'Enter' || e.key === ' ' || e.keyCode === 13 || e.keyCode === 32) {
			e.preventDefault();
			this.setState({...this.state, returnVal : true}, () => this.onClose());
		} else if (e.key === 'Escape' || e.keyCode === 27) {
			e.preventDefault();
			this.setState({...this.state, returnVal : false}, () => this.onClose());
		}
	}

	onClose = () => {
		if (this.isClosing) return;
		this.isClosing = true;
		this.props.onClose();
		this.props.onReturnVal(this.state.returnVal);
	};

	render () {
		const { dialogSize } = this.state;
		const formattedMessage = this.formatMessage(this.props.message);
		const needsScroll = this.props.message && (
			this.props.message.split('\n').length > 20 || 
			Math.max(...this.props.message.split('\n').map(line => line.length)) > 80
		);

		return (
			<DialogBox
				isOpen={this.props.open}
				noBackdrop={false}
				// false 작성 시 경고 발생 : 라이브러리 버그로 추정
				clickBackdropToClose={undefined}
				style  = {{backgroundColor : "rgba(0, 0, 0, 0.3)", borderRadius: '4px', zIndex : '9994', ...this.props.style}}
				backdropStyle = {{ zIndex : '9993' }}
				className={'scrm-confirm-dialog ' + (this.props.className || '') }
			>
				<div 
					className="scrm-alert-modal-content"
					style={{
						width: `${dialogSize.width}px`,
						height: `${dialogSize.height}px`,
						minWidth: '400px',
						minHeight: '200px',
						maxWidth: '800px',
						maxHeight: '600px'
					}}
				>
					<div className="scrm-alert-modal-content-header">
						<button className="scrm-btn" style={{float: 'right'}} onClick={this.onClick.bind(this)}>
							<i className="xi-close"></i>
						</button>
					</div>
					<div 
						className="scrm-alert-modal-content-body"
						style={{
							height: `${dialogSize.height - 80}px`,
							overflow: needsScroll ? 'auto' : 'visible',
							padding: '10px 20px'
						}}
					>
						<div className="scrm-label-div">
							<pre style={{
								whiteSpace: 'pre-wrap',
								wordWrap: 'break-word',
								margin: 0,
								fontFamily: 'inherit',
								fontSize: 'inherit',
								lineHeight: '1.5'
							}}>
								{formattedMessage}
							</pre>
						</div>
					</div>
					<div style={{
						position: 'absolute', 
						bottom: '5px', 
						textAlign: 'center', 
						width: '100%', 
						padding: '5px'
					}}>
						<Button 
							id='btnConfirm'	
							color={'blue'} 
							onClick={this.onClick.bind(this)} 
							value={'예'} 
							fiiled={true}
							mr={10}
							autoFocus={true}
						/>
						<Button 
							id='btnCancel'	
							color={'grey'} 
							fiiled={false}
							onClick={this.onClick.bind(this)} 
							value={'아니오'} 
							ml={10}
						/>
					</div>
				</div>
			</DialogBox>
		);
	}
}
class PopupDialog extends React.Component {
	constructor (props) {
		super(props);
		this.state = {
			open : false ,
			modal : true,
			bound : { top: 0, left : 0, right : 0, bottom : 0}
		}
		// react-draggable/scrollIntoView용 DOM 참조 — findDOMNode 대체(React18 경고 해소·React19 대응)
		this.nodeRef = React.createRef();
		this.onClose = this.onClose.bind(this);
		this.onMinimize = this.onMinimize.bind(this);
	}
	static defaultProps = {
		open: false,
		modaless : false,
		position : {x : 0, y: 0},
		onClose: () => {},
		onCallbackFunc: () => {},
		hideCloseButton: false,
		options: {
			width: '800px',
			height: '600px'
		}
	};
	static propTypes = { 
		onClose: PropTypes.func,
		onCallbackFunc: PropTypes.func 
	};
	componentDidMount () {
		// Dialog 컨텍스트 설정
		if (this.props.popupdivid) {
			ComLib.setDialogContext(this.props.popupdivid);
		}
		
		let bound = { 
			top: -(document.getElementById(this.props.popupdivid + "_inner_div").getBoundingClientRect().top),
			left: -(document.getElementById(this.props.popupdivid + "_inner_div").getBoundingClientRect().left)-400,
			right: document.getElementById(this.props.popupdivid + "_inner_div").getBoundingClientRect().left+400,
			bottom: document.getElementById(this.props.popupdivid + "_inner_div").getBoundingClientRect().top+400
		}
		this.nodeRef.current?.scrollIntoView();
		if (!this.props.modaless) {
			document.body.addEventListener('keydown', this.onKeyDown);
		}
		this.setState({bound : bound});
	}
	componentWillUnmount () {
		// Dialog 컨텍스트 해제
		if (this.props.popupdivid) {
			ComLib.clearDialogContext();
		}
		
		if (!this.props.modaless) {
			document.body.removeEventListener('keydown', this.onKeyDown);
		}
	}
	onFocus = (e) => {
		let current = e.target.parentElement.parentElement;
		current.style.zIndex = '9992';
		
		// Dialog가 포커스를 받을 때 컨텍스트 설정
		if (this.props.popupdivid) {
			ComLib.setDialogContext(this.props.popupdivid);
		}
	}
	onBlur = (e) => {
		let current = e.target.parentElement.parentElement;
		current.style.zIndex = '9991'
	}
	onKeyDown = (e) => {
		if (e.code === 'Tab' || e.key === 'Tab' || e.keyCode === 9) {
			if (e.shiftKey) {
				if (document.activeElement === document.getElementById(this.props.popupdivid + "_first_div")) {
					document.getElementById(this.props.popupdivid + "_last_div").focus();
					e.preventDefault();
				}
			} else {
				if (document.activeElement === document.getElementById(this.props.popupdivid + "_last_div")) {
					document.getElementById(this.props.popupdivid + "_first_div").focus();
					e.preventDefault();
				}
			}
			
		}
	}
	onClose = (e) => {
		// Dialog 컨텍스트 해제 및 알림 관리자 정리
		if (this.props.popupdivid) {
			ComLib.clearDialogContext();
			removeDialogNotificationManager(this.props.popupdivid);
		}
		this.props.onClose(e);
	}
	onMinimize = (e) => {
		const {AppModuleAction} = this.props;
		AppModuleAction.addPop({id : this.props.popupdivid, name : this.props.name});
		document.getElementById(this.props.popupdivid).hidden = true;

	}
	onCallbackFunc = (data) => {
		if (typeof this.props.onCallbackFunc === 'function') {
			this.props.onCallbackFunc(data);
		}
	}

	render () {
		return (
			<DialogBox
				isOpen={this.props.open}
				noBackdrop={this.props.modaless}
				clickBackdropToClose={this.props.modaless ? true : undefined}
				style={{ zIndex : '9991', ...this.props.style}}
				backdropStyle = {{ zIndex : '9990' }}
				className={'scrm-popup-dialog ' + (this.props.className || '') }
			>
				<Draggable
					nodeRef={this.nodeRef}
					bounds={this.state.bound}
					defaultPosition = {this.props.position}
					positionOffset = {{x: '-50%', y: 0}}
					allowAnyClick ={false}
					handle = {'.scrm-popup-modal-content-header'}
				>
					<div ref={this.nodeRef} id={this.props.popupdivid + "_inner_div"} onFocus={this.onFocus} onBlur={this.onBlur} className = "scrm-popup-modal-content" style={{width: this.props.options.width, height: this.props.options.height}}>
						<div id={this.props.popupdivid + "_first_div"} tabIndex={0} className = "scrm-popup-modal-content-header">
						<div>
							{this.props.name}
						</div>
						<div className='btn-container'>
						{
							(this.props.modaless)
								?	<button className="scrm-btn"  style={{color: '#fff'}} onClick ={this.onMinimize}>
										<i className="xi-minus"/>
									</button>
								: null
						}
						{
							!this.props.hideCloseButton && (
								<button className="scrm-btn" id={'_btnClose'}  style={{color: '#fff'}} onClick ={this.onClose}> <i className="xi-close"></i> </button>
							)
						}
						</div>
						</div>
						<div className = "scrm-popup-modal-content-body" style={{overflow: 'auto'}}>
							<ErrorBoundary 
								showUserMessage={false}
								fallback={
									<div className="scrm-error-boundary">
										<div className="scrm-error-content">
											<div className="scrm-error-icon">⚠️</div>
											<h3>팝업을 불러올 수 없습니다</h3>
											<p>일시적인 오류가 발생했습니다.</p>
										</div>
									</div>
								}
							>
								<Suspense fallback={
									<div className="scrm-loading-container">
										<div className="scrm-loading-spinner"></div>
										<div className="scrm-loading-text">팝업을 불러오는 중...</div>
									</div>
								}>
									{
										(() => {
											const popupRoutes = getPopupRoutes();
											const matchedRoute = popupRoutes.find(item => item.id === this.props.url);
											
											if (!matchedRoute) {
												console.error(`❌ Dialog: 팝업 라우트를 찾을 수 없습니다 - ${this.props.url}`);
												console.log('📋 사용 가능한 팝업 라우트:', popupRoutes.map(r => r.id));
												return <div className="scrm-error-message">
													팝업 화면을 찾을 수 없습니다: {this.props.url}
													<br/>
													<small>사용 가능한 팝업: {popupRoutes.map(r => r.id).join(', ')}</small>
												</div>;
											}
											
											const Component = matchedRoute.component;
											return <Component 
												popupdivid={this.props.popupdivid} 
												onCallbackFunc={this.onCallbackFunc} 
												key={'pop_' + matchedRoute.id} 
												onClose={this.onClose} 
												options={this.props.options}
											/>;
										})()
									}
								</Suspense>
							</ErrorBoundary>
						</div>
						<div id={this.props.popupdivid + "_last_div"} tabIndex={0}/>
					</div>
				</Draggable>
			</DialogBox>
		);
	}
}
class ModalLoading extends React.Component {
	constructor() {
		super();
		this.state = { isOpen: false }
	};
	
	static defaultProps = {
		isOpen: false,
		progressMessage: ''
	};
	
	render() {
		const { isOpen, progressMessage } = this.props;
		
		// 진행률 정보 파싱 (예: "2/5" 형태)
		const progressMatch = progressMessage ? progressMessage.match(/(\d+)\/(\d+)/) : null;
		const currentCount = progressMatch ? parseInt(progressMatch[1]) : 0;
		const totalCount = progressMatch ? parseInt(progressMatch[2]) : 0;
		const showProgress = totalCount > 1; // 1개 이상일 때만 표시
		
		return (
			<DialogBox	
				isOpen={isOpen} 
				defaultPosition={{x: 0, y: 0}} 
				backdropStyle={{background: 'transparent'}} 
				noBackdrop={false}
				style={{backgroundColor: "rgba(0, 0, 0, 0)", borderRadius: '90px', ...this.props.style}}
				className={'scrm-modal-loading ' + (this.props.className || '') }
			> 
				{/* 큰 로딩 스피너와 중앙 건수 표시 */}
				<div style={{
					position: 'fixed',
					zIndex: '9999',
					top: '50%',
					left: '50%',
					transform: 'translate(-50%, -50%)',
					display: 'flex',
					flexDirection: 'column',
					alignItems: 'center',
					gap: '20px'
				}}>
					{/* 큰 스피너 컨테이너 */}
					<div style={{
						position: 'relative',
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center'
					}}>
						{/* 큰 CSS 스피너 */}
						<div className="scrm-modern-spinner-large"></div>
						
						{/* 스피너 중앙에 건수 표시 */}
						{showProgress && (
							<div style={{
								position: 'absolute',
								top: '50%',
								left: '50%',
								transform: 'translate(-50%, -50%)',
								fontSize: '18px',
								fontWeight: 'bold',
								color: '#007bff',
								textAlign: 'center',
								lineHeight: '1'
							}}>
								<div>{currentCount}</div>
								<div style={{
									fontSize: '12px',
									color: '#666',
									marginTop: '2px'
								}}>/ {totalCount}</div>
							</div>
						)}
					</div>
				</div>
			</DialogBox>
		);
	}
}
export default {
	AlertDialog, ConfirmDialog, ModalLoading,
	PopupDialog : connect(
		(state) => ({
			popupList : state.appModule.popupList,
		}),
		(dispatch) => ({
			AppModuleAction : bindActionCreators(appModuleActions, dispatch)
		})
	)(PopupDialog)
}