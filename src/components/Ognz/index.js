import React from 'react';
import { StrLib, ComLib, DataLib, TransManager } from 'common';
import { BasicButton as Button, Textfield, Label, BasicButton } from 'components';

class OgnzSelect extends React.Component {
	constructor(props) {
		super(props);

		this.loginUser = ComLib.getLoginUser();
		this.ognzInqRangCd = this.loginUser.ognzInqRangCd;
		this.state = {
			keyword: this.props.keyword || '',
			ognzCd: this.props.ognzCd || '',
			ognzNm: this.props.ognzNm || '',
			title: this.props.title || '조직',
			suggestions: [],
			showSuggestions: false,
			activeSuggestionIndex: -1,
			selectedOgnz: null,
			isMultiSelect: this.props.isMultiSelect || false
		};

		this.defaultState = this.state
		this.keywordInputRef = React.createRef(); // keyword 입력 필드 ref
		this.wrapperRef = React.createRef(); // 외부 클릭 감지용 ref
		this.isUserTyping = false; // 사용자 직접 입력 여부 플래그
	}

	static defaultProps = {
		id: null,
		name: null,
		keyword: '',
		ognzCd: '',
		ognzNm: '',
		placeholder: '검색어입력',
		// width: '100%',
		disabled: false,
		readOnly: false,
		authrt: true, // 권한 처리 여부
		onChange: () => {},
		onKeywordChange: null, // keyword 변경 감지 콜백
		onReady: null, // 권한 처리 완료 콜백
	}

	componentDidMount() {
		document.addEventListener('mousedown', this.handleClickOutside);
		// 권한 처리가 활성화된 경우 로그인 사용자 조직 정보 자동 설정
		if (this.props.authrt !== false) {
			this.setLoginUserOgnz();
		}
		
		// 전역 키 이벤트 리스너 추가
		this.globalKeyHandler = (e) => {
			// 현재 활성 요소가 입력 필드인지 확인 (클래스명으로 확인)
			if (document.activeElement && document.activeElement.classList.contains('scrm-input-text')) {
				if (this.state.showSuggestions) {
					// 방향키인 경우 직접 처리
					if ((e.key === 'ArrowDown' || e.keyCode === 40) || (e.key === 'ArrowUp' || e.keyCode === 38)) {
						this.handleKeyDown(e);
					}
				}
			}
		};
		document.addEventListener('keydown', this.globalKeyHandler);
		
		// 키 이벤트 캐처 (capture 단계에서 감지 및 처리)
		this.keyCapture = (e) => {
			// 방향키 처리
			if ((e.key === 'ArrowDown' || e.keyCode === 40) || (e.key === 'ArrowUp' || e.keyCode === 38)) {
				// 입력 필드에서 방향키가 눌렸고 제안 목록이 표시된 경우 직접 처리
				if (e.target && e.target.classList.contains('scrm-input-text') && this.state.showSuggestions) {
					e.preventDefault(); // 기본 동작 방지
					e.stopPropagation(); // 이벤트 전파 중단
					
					// handleKeyDown 직접 호출
					this.handleKeyDown(e);
				}
			}
			// Enter 키 처리
			else if (e.key === 'Enter' || e.keyCode === 13) {
				// 입력 필드에서 Enter 키가 눌렸고 제안 목록이 표시된 경우 직접 처리
				if (e.target && e.target.classList.contains('scrm-input-text') && this.state.showSuggestions) {
					e.preventDefault(); // 기본 동작 방지
					e.stopPropagation(); // 이벤트 전파 중단
					
					// handleKeyDown 직접 호출
					this.handleKeyDown(e);
				}
			}
		};
		document.addEventListener('keydown', this.keyCapture, true); // capture=true로 설정
		
		// 컴포넌트 마운트 후 입력 요소에 직접 이벤트 리스너 추가
		setTimeout(() => {
			// DOM 요소 찾기 시도 (여러 방법)
			let inputElement = null;
			
			if (this.keywordInputRef.current) {
				// 방법 1: ref가 DOM 요소를 직접 참조하는 경우
				if (this.keywordInputRef.current.tagName === 'INPUT') {
					inputElement = this.keywordInputRef.current;
				}
				// 방법 2: ref가 컴포넌트를 참조하고 querySelector가 가능한 경우
				else if (this.keywordInputRef.current.querySelector && typeof this.keywordInputRef.current.querySelector === 'function') {
					inputElement = this.keywordInputRef.current.querySelector('input');
					// input이 없으면 scrm-input-text 클래스로 시도
					if (!inputElement) {
						inputElement = this.keywordInputRef.current.querySelector('.scrm-input-text');
					}
				}
			}
			
			// 방법 4: 전체 문서에서 클래스명으로 찾기 (마지막 수단)
			if (!inputElement) {
				const inputs = document.querySelectorAll('.scrm-input-text');
				// Ognz 컴포넌트의 입력 필드 찾기 (부모 요소 확인)
				for (let input of inputs) {
					if (input.closest('.scrm-ognz-select') || input.placeholder === '검색어입력') {
						inputElement = input;
						break;
					}
				}
			}
			
			if (inputElement) {
				this.directKeyHandler = (e) => {
					if (this.state.showSuggestions && ((e.key === 'ArrowDown' || e.keyCode === 40) || (e.key === 'ArrowUp' || e.keyCode === 38))) {
						e.preventDefault();
						e.stopPropagation();
						this.handleKeyDown(e);
					}
				};
				inputElement.addEventListener('keydown', this.directKeyHandler);
				this.actualInputElement = inputElement; // cleanup을 위해 저장
			}
		}, 100);
	}

	componentWillUnmount() {
		document.removeEventListener('mousedown', this.handleClickOutside);
		
		// 전역 키 이벤트 리스너 제거 (존재하는 경우만)
		if (this.globalKeyHandler) {
			document.removeEventListener('keydown', this.globalKeyHandler);
		}
		
		// 키 캐처 이벤트 리스너 제거 (존재하는 경우만)
		if (this.keyCapture) {
			document.removeEventListener('keydown', this.keyCapture, true);
		}
		
		// 직접 이벤트 리스너 제거 - actualInputElement 사용 (더 안전함)
		if (this.actualInputElement && this.directKeyHandler) {
			this.actualInputElement.removeEventListener('keydown', this.directKeyHandler);
		}
		// 백업: ref를 통한 제거 시도 (validation 추가)
		else if (this.keywordInputRef.current && this.directKeyHandler) {
			try {
				// DOM 요소인지 확인
				if (this.keywordInputRef.current.tagName === 'INPUT') {
					this.keywordInputRef.current.removeEventListener('keydown', this.directKeyHandler);
				}
				// querySelector가 가능한 컴포넌트인지 확인
				else if (this.keywordInputRef.current.querySelector && typeof this.keywordInputRef.current.querySelector === 'function') {
					const inputElement = this.keywordInputRef.current.querySelector('input') || 
										this.keywordInputRef.current.querySelector('.scrm-input-text');
					if (inputElement) {
						inputElement.removeEventListener('keydown', this.directKeyHandler);
					}
				}
			} catch (error) {
				console.warn('Ognz 컴포넌트 이벤트 리스너 제거 중 오류:', error);
			}
		}
	}

	handleClickOutside = (event) => {
		if (this.wrapperRef.current && !this.wrapperRef.current.contains(event.target)) {
			this.setState({ showSuggestions: false });
		}
	};

	componentDidUpdate(prevProps, prevState) {
		// Props 변경 감지
		if (this.props.ognzCd !== prevProps.ognzCd || this.props.ognzNm !== prevProps.ognzNm) {
			// 외부에서 Props가 변경된 경우이므로 사용자 입력이 아님
			this.isUserTyping = false;
			this._updateOgnz({
				ognzCd: this.props.ognzCd,
				ognzNm: this.props.ognzNm,
						keyword: this.props.keyword || ''
			});
		}
		// authrt props 변경 감지
		if (this.props.authrt !== prevProps.authrt) {
			if (this.props.authrt) {
				this.setLoginUserOgnz();
			} else {
				// authrt가 false로 변경된 경우 조직 정보 초기화
				this._updateOgnz(null, true);
			}
		}
		// State의 keyword 변경 감지
		if (prevState.keyword !== this.state.keyword) {
			this.onKeywordChange(this.state.keyword, prevState.keyword);
		}
	}

	getOgnzId = () => {
		return this.state.ognzCd;
	}

	getOgnzNm = () => {
		return this.state.ognzNm;
	}

	// 조직 선택 제한 권한 여부 체크
	isRestricted = () => {
		if( this.props.authrt == false){
			return false;
		}

		// 자기 자신만 조회가능한 경우
		return ( this.ognzInqRangCd == '03');
	}

	// 로그인 사용자 조직 정보 설정
	setLoginUserOgnz = () => {

		if (this.loginUser && this.ognzInqRangCd != '01') {
			this._updateOgnz({
				ognzCd: this.loginUser.ognzCd || '',
				ognzNm: this.loginUser.ognzNm || ''
			}, true, true); // keyword 초기화, ready 콜백
		}
	}

	// keyword 변경 감지 이벤트 핸들러
	onKeywordChange = (newKeyword, prevKeyword) => {

		// keyword가 비어있으면 사용자 정보 초기화
		if (StrLib.isNull(newKeyword)) {
			// 이미 비어있는 상태라면 추가 처리 안함
			if (StrLib.isNull(this.state.ognzCd)) {
				return;
			}
		}
		
		// keyword가 8자 이상일 때 자동 검색 (단, 사용자가 직접 입력하지 않은 경우만)
		if (newKeyword.length >= 8 && newKeyword !== prevKeyword && !this.isUserTyping) {
			this._searchOgnz(newKeyword);
		}

		// 외부 onChange 콜백 호출 (필요시) 
		if (typeof this.props.onKeywordChange === 'function') {
			this.props.onKeywordChange(newKeyword, prevKeyword);
		}
	}

	_updateOgnz = (ognzInfo, clearKeyword = false, ready = false) => {
		const newState = ognzInfo || {
			ognzCd: "",
			ognzNm: ""
		};

		// clearKeyword가 true이거나 userId가 없을 때만 keyword 초기화
		if (clearKeyword || StrLib.isNull(newState.ognzCd)) {
			newState.keyword = '';
		} else {
			// 사용자를 찾은 경우 keyword는 현재 상태 유지
			newState.keyword = this.state.keyword;
		}

		// 프로그래밍적 변경이므로 isUserTyping = false 유지
		this.isUserTyping = false;

		this.setState(newState, () => {
			// onChange 호출을 Promise로 감싸서 완료 후 onReady 호출
			Promise.resolve().then(() => {
				if (typeof this.props.onChange === 'function') {
					this.props.onChange({
						ognzCd: this.state.ognzCd,
						ognzNm: this.state.ognzNm,
					});
				}
			}).then(() => {
				// onChange 완료 후 onReady 호출
				if (ready && typeof this.props.onReady === 'function') {
					this.props.onReady();
				}
			});
		});
	}
	
	_searchOgnz = async (keyword) => {
		// 조직 조회
		TransManager.get('/api/common-component/organization', { "keyword": keyword, "authrt": this.props.authrt}, (res) => {
			if (!res.data || res.data.length === 0) {
				this.setState({ suggestions: [], showSuggestions: false });
				this._updateOgnz({ ognzCd: '', ognzNm: '조회된 조직이 없습니다.' }, false);
				return;
			}

			// API 응답 구조에 따라 적절히 처리
			if (res.data.length === 1) {
				// 단일 조직 정보
				this.setState({ 
					suggestions: [], 
					showSuggestions: false,
					keyword: ''  // keyword 초기화
				});
				this._updateOgnz(res.data[0], false);

			} else {
				this.setState({
					suggestions: res.data,
					showSuggestions: true,
					activeSuggestionIndex: 0  // 첫 번째 항목을 기본 선택으로 설정
				});
			}
		});
	}

	handleInputChange = (e) => {
		const keyword = e.target.value;
		
		// 권한 처리 모드에서 제한된 권한만 입력 제한
		if ( this.isRestricted()) {
			return;
		}
		// 사용자가 직접 입력하고 있음을 표시
		this.isUserTyping = true;
		
		// keyword가 비어있으면 사용자 정보 초기화
		if (keyword.length === 0) {
			this._updateOgnz(null, true); // keyword도 함께 초기화
			return;
		}

		// setState - 실제 변경 감지는 componentDidUpdate에서 처리
		this.setState({ keyword }, () => {
			// setState 완료 후 플래그 초기화
			setTimeout(() => {
				this.isUserTyping = false;
			}, 0);
		});
	}

	handleKeyDown = (e) => {
		const { showSuggestions, suggestions, activeSuggestionIndex } = this.state;
		
		// 방향키 처리 - Enter 키보다 먼저 처리
		if ((e.key === 'ArrowDown' || e.keyCode === 40) || (e.key === 'ArrowUp' || e.keyCode === 38)) {
			if (showSuggestions && suggestions.length > 0) {
				e.preventDefault();
				e.stopPropagation(); // 이벤트 전파 중단
				
				let newIndex;
				if (e.key === 'ArrowDown' || e.keyCode === 40) {
					newIndex = activeSuggestionIndex < suggestions.length - 1 ? activeSuggestionIndex + 1 : 0;
				} else if (e.key === 'ArrowUp' || e.keyCode === 38) {
					newIndex = activeSuggestionIndex > 0 ? activeSuggestionIndex - 1 : suggestions.length - 1;
				}
				
				this.setState({ activeSuggestionIndex: newIndex }, () => {
					// 선택된 항목이 보이도록 스크롤 조정
					this.scrollToActiveItem(newIndex);
				});
				return; // 방향키 처리 후 즉시 리턴
			}
		}
		
		// Enter 키 처리
		if (e.key === 'Enter' || e.keyCode === 13) {
			e.preventDefault();
			
			if (showSuggestions && suggestions.length > 0 && activeSuggestionIndex >= 0 && activeSuggestionIndex < suggestions.length) {
				const selectedOgnz = suggestions[activeSuggestionIndex];
				
				// 선택된 조직의 ognzCd를 keyword로 설정하고 재조회
				if (selectedOgnz && selectedOgnz.ognzCd) {
					this.setState({ keyword: selectedOgnz.ognzCd }, () => {
						this._searchOgnz(selectedOgnz.ognzCd);
					});
				}
				
				// 조직 정보 업데이트 및 제안 목록 닫기
				this.handleSelectSuggestion(selectedOgnz);
			} else {
				this._searchOgnz(this.state.keyword);
			}
			return;
		}
		
		// Escape 키 처리
		if (e.key === 'Escape' || e.keyCode === 27) {
			if (showSuggestions) {
				e.preventDefault();
				this.setState({ showSuggestions: false, activeSuggestionIndex: -1 });
			}
		}
	}

	handleKeyPress = (e) => {
		
		// Enter 키 처리 (charCode 13 또는 key === 'Enter')
		if (e.key === 'Enter' || e.charCode === 13) {
			// 제안 목록이 표시된 상태에서는 handleKeyDown에서 이미 처리했으므로 중복 실행 방지
			if (this.state.showSuggestions) {
				e.preventDefault();
				return;
			}
			
			e.preventDefault();
			this._searchOgnz(this.state.keyword);
		}
	}
	
	openSelectOgnzPopup = () => {
		// 권한 처리 모드에서 제한된 권한만 팝업 제한
		if (this.isRestricted()) {
			return;
		}
		ComLib.openPop('SYS0020', '조직찾기', {modaless: false, width: '800px', height: '600px', param: { keyword: this.state.keyword, rowSelection: 'single', authrt: this.props.authrt }},
		(res) => {
			let ognzInfo = {};
			if( !res) {
				return;
			}

			if( res.length > 0) {
				ognzInfo = res[0];
			} else {
				ognzInfo = res;
			}
			
			// ognzInfo = res;
			if( ognzInfo.ognzCd) {
				this._updateOgnz(ognzInfo, true); // keyword 초기화
			} else {
				console.warn('조회된 조직 정보 형식이 올바르지 않음', ognzInfo);
			}
		});
	}

	handleSearchClick = () => {
		this._searchOgnz(this.state.keyword);
	}

	handleSelectSuggestion = (ognz) => {
		
		// 선택된 조직 정보로 업데이트
		this._updateOgnz(ognz, false);
		
		// 제안 목록 닫기
		this.setState({
			showSuggestions: false,
			suggestions: [],
			activeSuggestionIndex: -1
		});
	}

	handleClearClick = () => {
		// 권한 처리 모드에서 제한된 권한만 클리어 제한
		if (this.isRestricted()) {
			return;
		}
		// Clear는 프로그래밍적 변경이므로 사용자 입력이 아님
		this.isUserTyping = false;
		this._updateOgnz(null, true); // keyword도 함께 초기화
	}

	handleInputFocus = (e) => {
		// 텍스트 전체 선택하여 쉽게 지울 수 있도록 함
		e.target.select();
	}

	// 선택된 항목이 보이도록 스크롤 조정
	scrollToActiveItem = (activeIndex) => {
		if (activeIndex < 0) return;
		
		// 제안 목록 컨테이너 찾기
		const suggestionsContainer = this.wrapperRef.current?.querySelector('ul');
		if (!suggestionsContainer) return;
		
		// 활성 항목 찾기
		const activeItem = suggestionsContainer.children[activeIndex];
		if (!activeItem) return;
		
		// 컨테이너와 항목의 위치 정보
		const containerRect = suggestionsContainer.getBoundingClientRect();
		const itemRect = activeItem.getBoundingClientRect();
		
		// 스크롤 위치 계산
		const containerTop = suggestionsContainer.scrollTop;
		const containerBottom = containerTop + suggestionsContainer.clientHeight;
		const itemTop = activeItem.offsetTop;
		const itemBottom = itemTop + activeItem.offsetHeight;
		
		// 항목이 컨테이너 위쪽에 가려진 경우
		if (itemTop < containerTop) {
			suggestionsContainer.scrollTop = itemTop;
		}
		// 항목이 컨테이너 아래쪽에 가려진 경우
		else if (itemBottom > containerBottom) {
			suggestionsContainer.scrollTop = itemBottom - suggestionsContainer.clientHeight;
		}
	}

	render () {
		const { disabled, readOnly, width, placeholder, authrt } = this.props;
		const { keyword, ognzCd: ognzCd, ognzNm: ognzNm, showSuggestions, suggestions, activeSuggestionIndex } = this.state;
		// 권한 처리 모드에서 제한된 권한만 입력/버튼 비활성화
		const restricted = this.isRestricted();
		const isDisabled = disabled || restricted;
		const isReadOnly = readOnly || restricted;
		const containerStyle = {
			display: 'flex',
			alignItems: 'center',
			gap: '4px',
			width: '100%', // 상대 위치 컨테이너가 있으므로 100%로 고정
			lineHeight: '22px'
		};

		const buttonStyle = {
			flexShrink: 0,
			minWidth: '30px',
			height: 'auto',
			padding: '0 8px',
			borderRadius: '3px',
			border: '1px solid #ccc',
		};

		const suggestionsContainerStyle = {
			position: 'absolute',
			top: '100%',
			left: 0,
			right: 0,
			backgroundColor: 'white',
			border: '1px solid #d0d0d0',
			borderTop: 'none',
			borderRadius: '0 0 4px 4px',
			boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
			listStyle: 'none',
			padding: 0,
			margin: 0,
			zIndex: 1000,
			maxHeight: '200px',
			overflowY: 'auto'
		};

		const suggestionItemStyle = {
			padding: '8px 12px',
			cursor: 'pointer'
		};
		
		const activeSuggestionItemStyle = {
			...suggestionItemStyle,
			backgroundColor: '#e9e9e9'
		};

		return (
			<div style={{ display: 'flex', width: width || '100%' }} ref={this.wrapperRef}>
				<div className='scrm-ognz-select' style={containerStyle}>
					<div style={{display: 'flex', alignItems: 'center', gap: '4px', flex: '0 1 130px'}}>
						<Textfield
							ref={this.keywordInputRef}
							value={keyword}
							placeholder={placeholder}
							onChange={this.handleInputChange}
							onKeyDown={this.handleKeyDown}
							onKeyPress={this.handleKeyPress}
							onFocus={this.handleInputFocus}
							disabled={isDisabled}
							readOnly={isReadOnly}
							maxLength={8}
							style={{
								flex: 1,
								border: 'none',
								minWidth: '100px',
								borderRadius: '3px',
								backgroundColor: isDisabled || isReadOnly ? '#f9f9f9' : '#fff'
							}}
							width = '100px'
						/>
						<Button value="" color="grey" fiiled="o" className='icon-srchBlue' type='icon'
							onClick={this.openSelectOgnzPopup}
							disabled={isDisabled}
							style={buttonStyle}
						/>
					</div>
				
					<div style={{display: 'flex', alignItems: 'center', gap: '4px', flex: '1 1 80%'}}>
						<Textfield
							value={ognzCd}
							placeholder="조직"
							readOnly={true}
							disabled={isDisabled}
							style={{
								flex: 1,
								border: 'none',
								borderRadius: '3px',
								backgroundColor: '#eee',
								color: '#555',
								minWidth: '100px',
							}}
							width="100px"
						/>
						<Textfield
							value={ognzNm}
							placeholder="조직이름"
							readOnly={true}
							disabled={isDisabled}
							style={{
								flex: 2,
								border: 'none',
								borderRadius: '3px',
								backgroundColor: '#eee',
								color: '#555',
								minWidth: '150px',
							}}
							width = {this.props.ognzNmWidth}
						/>
					</div>
					
					<Button value="" color="grey" fiiled="o" className='icon-minus' type='icon'
						onClick={this.handleClearClick}
						disabled={isDisabled}
						style={buttonStyle}
					/>
				</div>
				{showSuggestions && suggestions.length > 0 && (
					<ul style={suggestionsContainerStyle}>
						{suggestions.map((suggestion, index) => (
							<li 
								key={suggestion.ognzCd}
								onClick={() => this.handleSelectSuggestion(suggestion)}
								style={index === activeSuggestionIndex ? activeSuggestionItemStyle : suggestionItemStyle}
								onMouseEnter={() => this.setState({ activeSuggestionIndex: index })}
							>
								[{suggestion.ognzCd}] {suggestion.ognzNm}
							</li>
						))}
					</ul>
				)}
			</div>
		);
	}
}

export default OgnzSelect;