import React from 'react';
import { StrLib, ComLib, DataLib, TransManager } from 'common';
import { BasicButton as Button, Textfield, Label } from 'components';

class UserMultiSelect extends React.Component {
	constructor(props) {
		super(props);

		this.loginUser = ComLib.getLoginUser();
		this.ognzInqRangCd = this.loginUser.ognzInqRangCd;
		this.state = {
			selectedUsers: this.props.selectedUsers || [],
			title: this.props.title || '사용자',
			searchKeyword: '', // 검색 키워드
			showAllTags: false, // 모든 태그 표시 여부
			isInputFocused: false, // 입력 필드 포커스 여부
			suggestions: [], // 검색 결과 목록 (UserSelect와 동일)
			showSuggestions: false, // 검색 결과 표시 여부
			activeSuggestionIndex: -1, // 활성화된 검색 결과 인덱스
		};

		this.wrapperRef = React.createRef(); // 외부 클릭 감지용 ref
		this.inputRef = React.createRef(); // 검색 입력 필드 ref
	}

	static defaultProps = {
		id: null,
		name: null,
		selectedUsers: [],
		placeholder: '사용자를 선택하세요',
		width: '100%',
		disabled: false,
		readOnly: false,
		authrt: true, // 권한 처리 여부
		maxUsers: null, // 최대 선택 가능한 사용자 수 (null이면 제한 없음)
		maxVisibleTags: 4, // 표시할 최대 태그 수 (기본값: 4개)
		onChange: () => {},
		onReady: null, // 권한 처리 완료 콜백
	}

	componentDidMount() {
		console.log('🏗️ UserMultiSelect 마운트 시작 - KeyCapture 방식 적용');
		
		// UserSelect와 동일한 keyCapture 방식으로 키 이벤트 처리
		this.keyCapture = (e) => {
			console.log('🎯 KeyCapture 감지:', {
				key: e.key,
				keyCode: e.keyCode,
				target: e.target?.tagName,
				targetClass: e.target?.className,
				showSuggestions: this.state.showSuggestions,
				hasScrmInputText: e.target?.classList.contains('scrm-input-text')
			});
			
			// 방향키 처리
			if ((e.key === 'ArrowDown' || e.keyCode === 40) || (e.key === 'ArrowUp' || e.keyCode === 38)) {
				console.log('🎯 KeyCapture - 방향키 감지');
				// 입력 필드에서 방향키가 눌렸고 제안 목록이 표시된 경우 직접 처리
				if (e.target && e.target.classList.contains('scrm-input-text') && this.state.showSuggestions) {
					console.log('✅ KeyCapture - 방향키 처리 시작');
					e.preventDefault(); // 기본 동작 방지
					e.stopPropagation(); // 이벤트 전파 중단
					
					// handleInputKeyDown 직접 호출
					this.handleInputKeyDown(e);
				} else {
					console.log('❌ KeyCapture - 방향키 처리 조건 불만족');
				}
			}
			// Enter 키 처리
			else if (e.key === 'Enter' || e.keyCode === 13) {
				console.log('🎯 KeyCapture - Enter키 감지');
				// 입력 필드에서 Enter 키가 눌렸고 제안 목록이 표시된 경우 직접 처리
				if (e.target && e.target.classList.contains('scrm-input-text') && this.state.showSuggestions) {
					console.log('✅ KeyCapture - Enter키 처리 시작');
					e.preventDefault(); // 기본 동작 방지
					e.stopPropagation(); // 이벤트 전파 중단
					
					// handleInputKeyDown 직접 호출
					this.handleInputKeyDown(e);
				} else {
					console.log('❌ KeyCapture - Enter키 처리 조건 불만족');
				}
			}
		};
		document.addEventListener('keydown', this.keyCapture, true); // capture=true로 설정
		console.log('✅ KeyCapture 이벤트 리스너 등록 완료 (capture=true)');

		// 외부 클릭 감지 (UserSelect와 동일)
		document.addEventListener('mousedown', this.handleClickOutside);
		
		// 권한 처리가 활성화된 경우 로그인 사용자 정보 자동 설정
		if (this.props.authrt !== false) {
			this.setLoginUser();
		}
		
		console.log('🏗️ UserMultiSelect 마운트 완료 - KeyCapture 방식 준비됨');
	}

	componentWillUnmount() {
		// UserSelect와 동일한 방식으로 keyCapture 리스너 제거
		if (this.keyCapture) {
			document.removeEventListener('keydown', this.keyCapture, true);
		}
		document.removeEventListener('mousedown', this.handleClickOutside);
	}

	handleClickOutside = (event) => {
		if (this.wrapperRef.current && !this.wrapperRef.current.contains(event.target)) {
			this.setState({ 
				showSuggestions: false,
				activeSuggestionIndex: -1
			});
		}
	};

	componentDidUpdate(prevProps, prevState) {
		// Props 변경 감지
		if (this.props.selectedUsers !== prevProps.selectedUsers) {
			this._updateSelectedUsers(this.props.selectedUsers);
		}
		// authrt props 변경 감지
		if (this.props.authrt !== prevProps.authrt) {
			if (this.props.authrt) {
				this.setLoginUser();
			} else {
				// authrt가 false로 변경된 경우 사용자 정보 초기화
				this._updateSelectedUsers([], true);
			}
		}
	}

	getSelectedUsers = () => {
		return this.state.selectedUsers;
	}

	getUserIds = () => {
		return this.state.selectedUsers.map(user => user.userId);
	}

	getUserNames = () => {
		return this.state.selectedUsers.map(user => user.userNm);
	}

	// 사용자 선택 제한 권한 여부 체크
	isRestricted = () => {
		if( this.props.authrt == false){
			return false;
		}
		
		// 자기 자신만 조회가능한 경우
		return ( this.ognzInqRangCd == '03');
	}

	// 로그인 사용자 정보 설정
	setLoginUser = () => {
		if (this.loginUser && this.ognzInqRangCd != '01') {
			// 로그인 사용자 정보를 컴포넌트에 설정
			this._updateSelectedUsers([{
				userId: this.loginUser.userId || '',
				userNm: this.loginUser.userNm || ''
			}], true, true);
		}
	}

	_updateSelectedUsers = (users, clearAll = false, ready = false) => {
		const newUsers = users || [];

		this.setState({ selectedUsers: newUsers }, () => {
			// onChange 호출을 Promise로 감싸서 완료 후 onReady 호출
			Promise.resolve().then(() => {
				if (typeof this.props.onChange === 'function') {
					this.props.onChange({
						selectedUsers: this.state.selectedUsers,
						userIds: this.getUserIds(),
						userNames: this.getUserNames(),
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

	// 사용자 검색 API 호출 (SYS0040과 동일한 서비스 사용)
	_searchUser = async (keyword) => {
		// 키워드 유효성 검사
		if (!keyword || keyword.trim().length === 0) {
			return;
		}

		// 이미 선택된 사용자인지 확인
		const existingUser = this.state.selectedUsers.find(user => 
			user.userId.toLowerCase() === keyword.toLowerCase() || 
			user.userNm.toLowerCase() === keyword.toLowerCase()
		);
		if (existingUser) {
			ComLib.showStatusMessage('이미 선택된 사용자입니다.');
			this.setState({ searchKeyword: '', isInputFocused: false });
			return;
		}

		// SYS0040과 동일한 사용자 조회 API 사용
		let transManager = new TransManager();
		transManager.setTransId('UserMultiSelect_Search');
		transManager.setTransUrl("/api/cmm/user/search/r02");
		
		// 검색 조건 구성 (SYS0040과 동일)
		let searchData = {
			ognzCd: '', // 전체 조직에서 검색
			userIdOrNm: keyword.trim(),
			leaveRsgntnIncl: "N", // 퇴사자는 제외
			authrt: this.props.authrt
		};
		
		transManager.setFormData(searchData);
		transManager.setCallBack((res) => {
			// 오류 처리
			if (!res.result || res.data.error) {
				let errorMessage = '사용자 조회 중 오류가 발생했습니다.';
				if (res.data && res.data.message) {
					errorMessage = res.data.message;
				}
				ComLib.showStatusMessage(errorMessage);
				this.setState({ searchKeyword: '', isInputFocused: false });
				return;
			}

			// 조회 결과가 없는 경우
			if (!res.data || res.data.length === 0) {
				ComLib.showStatusMessage('조회된 사용자가 없습니다.');
				this.setState({ searchKeyword: '', isInputFocused: false });
				return;
			}

			// API 응답 구조에 따라 적절히 처리 (UserSelect와 동일한 방식)
			if (res.data.length === 1) {
				// 단일 사용자 정보 - 바로 추가
				const newUser = res.data[0];
				let updatedUsers = [...this.state.selectedUsers, newUser];
				
				// 최대 사용자 수 제한 체크
				if (this.props.maxUsers && updatedUsers.length > this.props.maxUsers) {
					ComLib.showStatusMessage(`최대 ${this.props.maxUsers}명까지만 선택할 수 있습니다.`);
					this.setState({ 
						searchKeyword: '',
						suggestions: [],
						showSuggestions: false 
					});
					return;
				}
				
				this.setState({ 
					searchKeyword: '',
					suggestions: [],
					showSuggestions: false 
				});
				this._updateSelectedUsers(updatedUsers);

			} else {
				// 여러 사용자 정보 - 하단에 드롭다운으로 표시 (UserSelect와 동일)
				this.setState({
					suggestions: res.data,
					showSuggestions: true,
					activeSuggestionIndex: 0  // 첫 번째 항목을 기본 선택으로 설정
				});
			}
		});
		
		// API 호출 실행
		transManager.agent();
	}

	openSelectUserPopup = () => {
		// 권한 처리 모드에서 제한된 권한만 팝업 제한
		if (this.isRestricted()) {
			return;
		}
		
		ComLib.openPop('SYS0040', '사용자찾기', {
			modaless: false, 
			width: '800px', 
			height: '600px',
			param: { 
				keyword: '', 
				rowSelection: 'multiple', // 다중 선택 모드
				authrt: this.props.authrt 
			},
		},
		(res) => {
			if (!res || res.length === 0) {
				return;
			}

			// 배열로 오지 않은 경우 배열로 변환
			const newUsers = Array.isArray(res) ? res : [res];
			
			// 중복 제거: 기존 선택된 사용자와 새로 선택된 사용자를 합치되, userId 기준으로 중복 제거
			const existingUserIds = this.state.selectedUsers.map(user => user.userId);
			const uniqueNewUsers = newUsers.filter(user => !existingUserIds.includes(user.userId));
			
			let updatedUsers = [...this.state.selectedUsers, ...uniqueNewUsers];
			
			// 최대 사용자 수 제한 체크
			if (this.props.maxUsers && updatedUsers.length > this.props.maxUsers) {
				ComLib.showStatusMessage(`최대 ${this.props.maxUsers}명까지만 선택할 수 있습니다.`);
				updatedUsers = updatedUsers.slice(0, this.props.maxUsers);
			}
			
			// 유효한 사용자 정보만 필터링
			const validUsers = updatedUsers.filter(user => user.userId);
			
			if (validUsers.length > 0) {
				this._updateSelectedUsers(validUsers);
			} else {
				console.warn('조회된 사용자 정보 형식이 올바르지 않음', res);
			}
		});
	}

	handleRemoveUser = (userIdToRemove) => {
		// 권한 처리 모드에서 제한된 권한만 제거 제한
		if (this.isRestricted()) {
			return;
		}
		
		const updatedUsers = this.state.selectedUsers.filter(user => user.userId !== userIdToRemove);
		this._updateSelectedUsers(updatedUsers);
	}

	handleClearAll = () => {
		// 권한 처리 모드에서 제한된 권한만 클리어 제한
		if (this.isRestricted()) {
			return;
		}
		
		this._updateSelectedUsers([]);
	}

	// 검색 입력 변경 핸들러
	handleInputChange = (e) => {
		this.setState({ searchKeyword: e.target.value });
	}

	// 검색 입력 키 다운 핸들러 (엔터키 처리)
	handleInputKeyDown = (e) => {
		const { showSuggestions, suggestions, activeSuggestionIndex } = this.state;
		console.log('⌨️ handleInputKeyDown 호출:', {
			key: e.key,
			keyCode: e.keyCode,
			showSuggestions,
			suggestionsLength: suggestions.length,
			activeSuggestionIndex,
			fromCapture: 'KeyCapture에서 호출됨'
		});
		
		// 방향키 처리 (UserSelect와 동일)
		if ((e.key === 'ArrowDown' || e.keyCode === 40) || (e.key === 'ArrowUp' || e.keyCode === 38)) {
			console.log('🎯 handleInputKeyDown - 방향키 처리 시작');
			if (showSuggestions && suggestions.length > 0) {
				console.log('✅ handleInputKeyDown - 방향키 조건 만족, 처리 진행');
				e.preventDefault();
				e.stopPropagation();
				
				if (e.key === 'ArrowDown' || e.keyCode === 40) {
					const newIndex = activeSuggestionIndex < suggestions.length - 1 ? activeSuggestionIndex + 1 : 0;
					console.log(`⬇️ ArrowDown: ${activeSuggestionIndex} → ${newIndex}`);
					this.setState({ activeSuggestionIndex: newIndex });
				} else if (e.key === 'ArrowUp' || e.keyCode === 38) {
					const newIndex = activeSuggestionIndex > 0 ? activeSuggestionIndex - 1 : suggestions.length - 1;
					console.log(`⬆️ ArrowUp: ${activeSuggestionIndex} → ${newIndex}`);
					this.setState({ activeSuggestionIndex: newIndex });
				}
				return;
			} else {
				console.log('❌ handleInputKeyDown - 방향키 조건 불만족:', {
					showSuggestions,
					suggestionsLength: suggestions.length
				});
			}
		}
		
		// Enter 키 처리
		if (e.key === 'Enter' || e.keyCode === 13) {
			e.preventDefault();
			e.stopPropagation();
			
			if (showSuggestions && suggestions.length > 0 && activeSuggestionIndex >= 0 && activeSuggestionIndex < suggestions.length) {
				// suggestion에서 선택
				const selectedUser = suggestions[activeSuggestionIndex];
				this.handleSelectSuggestion(selectedUser);
			} else {
				// 직접 검색
				this._searchUser(this.state.searchKeyword);
			}
		} else if (e.key === 'Escape' || e.keyCode === 27) {
			// ESC 키로 입력 취소
			if (showSuggestions) {
				e.preventDefault();
				this.setState({ 
					showSuggestions: false, 
					activeSuggestionIndex: -1 
				});
			} else {
				this.setState({ 
					searchKeyword: '', 
					isInputFocused: false 
				});
				if (this.inputRef.current) {
					this.inputRef.current.blur();
				}
			}
		}
	}

	handleKeyPress = (e) => {
		// Enter 키 처리 (charCode 13 또는 key === 'Enter')
		if (e.key === 'Enter' || e.charCode === 13) {
			// 제안 목록이 표시된 상태에서는 handleInputKeyDown에서 이미 처리했으므로 중복 실행 방지
			if (this.state.showSuggestions) {
				e.preventDefault();
				return;
			}
			
			e.preventDefault();
			this._searchUser(this.state.searchKeyword);
		}
	}

	// Suggestion 선택 처리 (UserSelect와 동일)
	handleSelectSuggestion = (user) => {
		// 이미 선택된 사용자인지 확인
		const existingUser = this.state.selectedUsers.find(selectedUser => selectedUser.userId === user.userId);
		if (existingUser) {
			ComLib.showStatusMessage('이미 선택된 사용자입니다.');
			this.setState({
				searchKeyword: '',
				showSuggestions: false,
				suggestions: [],
				activeSuggestionIndex: -1
			});
			return;
		}
		
		let updatedUsers = [...this.state.selectedUsers, user];
		
		// 최대 사용자 수 제한 체크
		if (this.props.maxUsers && updatedUsers.length > this.props.maxUsers) {
			ComLib.showStatusMessage(`최대 ${this.props.maxUsers}명까지만 선택할 수 있습니다.`);
			this.setState({
				searchKeyword: '',
				showSuggestions: false,
				suggestions: [],
				activeSuggestionIndex: -1
			});
			return;
		}
		
		// 선택된 사용자 정보로 업데이트
		this._updateSelectedUsers(updatedUsers);
		
		// 제안 목록 닫기
		this.setState({
			searchKeyword: '',
			showSuggestions: false,
			suggestions: [],
			activeSuggestionIndex: -1
		});
	}

	// 태그 컨테이너 클릭 핸들러
	handleTagsClick = (e) => {
		// 권한 처리 모드에서 제한된 권한만 입력 제한
		if (this.isRestricted()) {
			return;
		}
		
		// X 버튼이나 "더보기" 버튼 클릭 시에는 입력 활성화 안함
		if (e.target.tagName === 'BUTTON' || e.target.closest('button')) {
			return;
		}
		
		this.setState({ isInputFocused: true }, () => {
			if (this.inputRef.current) {
				this.inputRef.current.focus();
			}
		});
	}

	// 입력 필드 포커스 아웃 핸들러
	handleInputBlur = () => {
		// 약간의 지연을 주어 다른 이벤트가 처리될 시간을 줌
		setTimeout(() => {
			this.setState({ 
				isInputFocused: false,
				searchKeyword: '' 
			});
		}, 150);
	}

	// "더보기" 클릭 핸들러
	handleShowMoreClick = (e) => {
		e.stopPropagation();
		this.setState({ showAllTags: !this.state.showAllTags });
	}

	render () {
		const { disabled, readOnly, width } = this.props;
		const { selectedUsers, searchKeyword, showAllTags, isInputFocused, suggestions, showSuggestions, activeSuggestionIndex } = this.state;
		
		// 권한 처리 모드에서 제한된 권한만 입력/버튼 비활성화
		const restricted = this.isRestricted();
		const isDisabled = disabled || restricted;

		const containerStyle = {
			display: 'flex',
			alignItems: 'center',
			gap: '4px',
			width: width || '100%',
			height: '28px', // UserSelect와 동일한 높이로 변경
			lineHeight: '22px'
		};

		// 왼쪽: 검색 입력 영역 (UserSelect의 첫 번째 영역과 동일)
		const inputAreaStyle = {
			display: 'flex', 
			alignItems: 'center', 
			gap: '4px', 
			height: '28px', // UserSelect와 동일한 높이로 변경
			flex: '0 1 130px' // UserSelect와 동일한 flex 설정
		};

		// 오른쪽: 선택된 사용자 태그 표시 영역 (UserSelect보다 더 넓게)
		const tagsAreaStyle = {
			display: 'flex', 
			alignItems: 'center', 
			gap: '4px', 
			height: '28px', // UserSelect와 동일한 높이로 변경
			flex: '1 1 90%' // UserSelect보다 더 넓게 (80% → 90%)
		};

		const userTagsContainerStyle = {
			display: 'flex',
			alignItems: 'center',
			flexWrap: 'nowrap', // 한 줄로만 표시하도록 변경 (높이 일관성)
			gap: '1px',
			flex: 1,
			height: '28px', // UserSelect와 동일한 높이로 변경
			minHeight: '28px',
			maxHeight: '28px', // 최대 높이도 제한해서 높이 고정
			padding: '2px 2px', // 28px - 8px = 20px (태그 높이와 일치)
			border: '1px solid #d0d0d0',
			borderRadius: '3px',
			backgroundColor: '#eee', // 읽기 전용처럼 회색 배경
			color: '#555',
			overflow: 'hidden', // 높이를 벗어나는 내용은 숨김
			boxSizing: 'border-box' // 패딩과 보더를 포함한 전체 높이 계산
		};

		const userTagStyle = {
			display: 'inline-flex',
			alignItems: 'center',
			padding: '2px 2px',
			backgroundColor: '#e9ecef',
			borderRadius: '12px',
			fontSize: '12px',
			height: '18px', // 28px 컨테이너에 맞게 조정
			gap: '1px',
			flexShrink: 0 // 크기 축소 방지
		};

		const removeButtonStyle = {
			background: 'none',
			border: 'none',
			cursor: 'pointer',
			padding: '0',
			width: '12px', // 18px 태그에 맞게 조정
			height: '12px', // 18px 태그에 맞게 조정
			borderRadius: '50%',
			backgroundColor: '#6c757d',
			color: 'white',
			fontSize: '10px',
			lineHeight: '1',
			display: 'flex',
			alignItems: 'center',
			justifyContent: 'center'
		};

		const buttonStyle = {
			flexShrink: 0,
			minWidth: '30px',
			height: '28px', // UserSelect와 동일한 높이로 변경
			padding: '0 8px',
			borderRadius: '3px',
			border: '1px solid #ccc',
		};

		const placeholderStyle = {
			color: '#999',
			fontStyle: 'italic',
			fontSize: '14px'
		};

		const moreButtonStyle = {
			display: 'inline-flex',
			alignItems: 'center',
			padding: '2px 6px',
			backgroundColor: '#f8f9fa',
			borderRadius: '12px',
			fontSize: '12px',
			height: '18px', // 태그와 동일한 높이로 조정
			color: '#6c757d',
			cursor: 'pointer',
			border: 'none',
			flexShrink: 0 // 크기 축소 방지
		};

		// 왼쪽 검색 입력 필드 스타일 (UserSelect의 Textfield와 동일)
		const searchInputStyle = {
			flex: 1,
			border: 'none',
			minWidth: '100px',
			height: '28px', // UserSelect와 동일한 높이로 변경
			borderRadius: '3px',
			backgroundColor: isDisabled ? '#f9f9f9' : '#fff'
		};

		// Suggestions 스타일 (UserSelect와 동일)
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
			cursor: 'pointer',
			borderBottom: '1px solid #f5f5f5'
		};
		
		const activeSuggestionItemStyle = {
			...suggestionItemStyle,
			backgroundColor: '#e9e9e9'
		};

		// 표시할 사용자 결정 (maxVisibleTags 초과 시 제한)
		const maxVisibleTags = this.props.maxVisibleTags;
		const visibleUsers = showAllTags || selectedUsers.length <= maxVisibleTags 
			? selectedUsers 
			: selectedUsers.slice(0, maxVisibleTags);
		const hiddenCount = Math.max(0, selectedUsers.length - maxVisibleTags);

		return (
			<div style={{ position: 'relative', width: width || '100%' }} ref={this.wrapperRef}>
				<div className='scrm-user-multi-select' style={containerStyle}>
					{/* 왼쪽: 검색 입력 영역 - UserSelect의 첫 번째 영역과 동일 구조 */}
					<div style={inputAreaStyle}>
						<Textfield
							ref={this.inputRef}
							value={searchKeyword}
							placeholder="상담사명(ID)"
							onChange={this.handleInputChange}
							onKeyDown={this.handleInputKeyDown}
							onKeyPress={this.handleKeyPress}
							disabled={isDisabled}
							readOnly={false}
							maxLength={50}
							style={searchInputStyle}
							width="100px"
						/>
						<Button 
							value="" 
							color="purple" 
							fiiled="o" 
							innerImage={true} 
							icon={'srch'}
							onClick={this.openSelectUserPopup}
							disabled={isDisabled}
							style={buttonStyle}
							title="사용자 선택"
						/>
					</div>
					
					{/* 오른쪽: 선택된 사용자 태그 표시 영역 - UserSelect의 두 번째 영역과 동일 구조 */}
					<div style={tagsAreaStyle}>
						<div style={userTagsContainerStyle}>
							{selectedUsers.length === 0 ? (
								<></>
							) : (
								<>
									{/* 선택된 사용자 태그들 표시 */}
									{visibleUsers.map((user) => (
										<div key={user.userId} style={userTagStyle}>
											<span>{user.userNm}</span>
											{!isDisabled && (
												<button
													style={removeButtonStyle}
													onClick={() => this.handleRemoveUser(user.userId)}
													title="제거"
												>
													×
												</button>
											)}
										</div>
									))}
									
									{/* 3개 초과 시 "더보기" 버튼 표시 */}
									{!showAllTags && hiddenCount > 0 && (
										<button
											style={moreButtonStyle}
											onClick={this.handleShowMoreClick}
											title="더 보기"
										>
											{hiddenCount}more..
										</button>
									)}
									
									{/* 모든 태그를 보여주는 상태에서 "접기" 버튼 */}
									{showAllTags && selectedUsers.length > maxVisibleTags && (
										<button
											style={moreButtonStyle}
											onClick={this.handleShowMoreClick}
											title="접기"
										>
											접기
										</button>
									)}
								</>
							)}
						</div>
					</div>
					
					{/* 전체 제거 버튼 */}
					{selectedUsers.length > 0 && !isDisabled && (
						<Button 
							value="" 
							color="purple" 
							fiiled="o" 
							innerImage={true} 
							icon={'del'}
							onClick={this.handleClearAll}
							disabled={isDisabled}
							style={buttonStyle}
							title="전체 제거"
						/>
					)}
				</div>
				
				{/* 검색 결과 드롭다운 (UserSelect와 동일) */}
				{showSuggestions && suggestions.length > 0 && (
					<ul style={suggestionsContainerStyle}>
						{suggestions.map((suggestion, index) => (
							<li 
								key={suggestion.userId}
								onClick={() => this.handleSelectSuggestion(suggestion)}
								style={index === activeSuggestionIndex ? activeSuggestionItemStyle : suggestionItemStyle}
								onMouseEnter={() => this.setState({ activeSuggestionIndex: index })}
							>
								[{suggestion.userId}] {suggestion.userNm}
							</li>
						))}
					</ul>
				)}
			</div>
		);
	}
}

export default UserMultiSelect;
