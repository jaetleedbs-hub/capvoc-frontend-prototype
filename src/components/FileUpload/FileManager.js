import React, { useCallback, useState, useEffect, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { ComLib } from "common";
import { BasicButton as Button } from 'components';
import iconExcel from '../../assets/images/icon_excel.svg';
import iconPpt from '../../assets/images/icon_ppt.svg';
import iconWord from '../../assets/images/icon_word.svg';
import iconList from '../../assets/images/icon_list.svg';
import './FileManager.css';

/**
 * FileManager 컴포넌트
 * 
 * react-dropzone 기반 파일 관리 컴포넌트
 * 
 * @prop {string} mode - 모드: 'multi' (다건 업로드), 'view' (다건 다운로드), 'single' (단건 업로드), 'single-view' (단건 다운로드)
 * @prop {number} maxFiles - 다건 업로드 시 최대 파일 개수 (default: 10)
 * @prop {number} height - 컴포넌트 높이 (multi, view 모드에서 사용)
 * @prop {array} initialFiles - 초기 파일 목록 [{fileId, fileName, fileSize}]
 * @prop {string} initialGroupId - 기존 데이터의 그룹 ID (수정 화면에서 사용)
 * @prop {string} downloadSource - 다운로드 소스: 비어있으면 자체 서버, 값이 있으면 AICC 외부 다운로드(값이 cmpyId로 사용, 예: 'apt001')
 * @prop {function} onUploadComplete - 업로드 완료 콜백
 * @prop {function} onFileDelete - 파일 삭제 콜백
 * @prop {function} onGroupIdChange - 그룹 ID 변경 콜백 (첫 파일 업로드 시 호출)
 * 
 * @example
 * // 신규 등록 - 다건 업로드
 * <FileManager 
 *   mode="multi" 
 *   maxFiles={5} 
 *   onUploadComplete={handleComplete}
 *   onGroupIdChange={(groupId) => setFormData({...formData, atchFileGroupId: groupId})}
 * />
 * 
 * // 수정 화면 - 기존 파일 + 추가 업로드
 * <FileManager 
 *   mode="multi"
 *   initialGroupId={formData.atchFileGroupId}
 *   initialFiles={existingFiles}
 *   onUploadComplete={handleComplete}
 *   onGroupIdChange={handleGroupIdChange}
 * />
 * 
 * // 다건 다운로드 전용
 * <FileManager mode="view" initialFiles={files} />
 * 
 * // 단건 업로드
 * <FileManager mode="single" onUploadComplete={handleComplete} />
 * 
 * // 단건 다운로드 전용
 * <FileManager mode="single-view" initialFiles={[file]} />
 */
class FileManager extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			existingFiles: this.props.initialFiles || [],
			uploadingFiles: [],  // { id, file, progress, status, fileId }
			currentGroupId: this.props.initialGroupId || null,  // 현재 파일 그룹 ID
			isDragOver: false
		};
		this.fileInputRef = React.createRef();
	}

	static defaultProps = {
		id: '',
		mode: 'multi',        // 'multi', 'view', 'single', 'single-view'
		height: 200,
		url: '/api/common/upload',
		deleteUrl: '/api/common/file/delete',  // 파일 삭제 API URL
		downloadUrl: '/api/common/download',
		downloadSource: '',      // 비어있으면 자체 서버, 값 있으면 AICC 외부 다운로드 (값 = cmpyId, 예: 'apt001')
		initialFiles: [],
		initialGroupId: null,    // 기존 데이터의 그룹 ID (수정 화면에서 사용)
		disabled: false,
		maxFiles: 10,
		maxSize: 100 * 1024 * 1024, // 100MB
		onUploadComplete: () => {},
		onFileDelete: () => {},
		onGroupIdChange: () => {},  // 그룹 ID 변경 콜백
		uploadValidation: () => true
	};

	componentDidMount() {
		// 1. initialGroupId가 없으면 자동으로 채번
		if (!this.props.initialGroupId) {
			this.generateGroupIdIfNeeded();
		} else {
			// 2. initialGroupId가 있으면 파일 목록 조회
			this.loadFileList(this.props.initialGroupId);
		}
	}

	componentDidUpdate(prevProps) {
		if (prevProps.initialFiles !== this.props.initialFiles) {
			this.setState({ existingFiles: this.props.initialFiles || [] });
		}
		// 그룹 ID 변경 시 (외부에서 변경된 경우)
		if (prevProps.initialGroupId !== this.props.initialGroupId) {
			if (this.props.initialGroupId) {
				this.setState({ currentGroupId: this.props.initialGroupId });
				this.loadFileList(this.props.initialGroupId);
			} else {
				this.setState({ currentGroupId: null });
			}
		}
	}

	// 그룹 ID 채번 (필요한 경우)
	generateGroupIdIfNeeded = async () => {
		// 이미 groupId가 있으면 스킵
		if (this.state.currentGroupId) {
			return;
		}

		try {
			const baseUrl = ComLib.getSession("SVR_URL") || '';
			const groupIdUrl = `${baseUrl}/api/common/file/group-id`;
			
			const groupIdResponse = await fetch(groupIdUrl, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				}
			});
			
			if (!groupIdResponse.ok) {
				const errorData = await groupIdResponse.json();
				console.error('Group ID generation error:', errorData.message || '파일 그룹 ID 생성에 실패했습니다.');
				return;
			}
			
			const groupIdResult = await groupIdResponse.json();
			if (groupIdResult.result !== '0') {
				console.error('Group ID generation error:', groupIdResult.message || '파일 그룹 ID 생성에 실패했습니다.');
				return;
			}
			
			const groupId = groupIdResult.data;
			this.setState({ currentGroupId: groupId });
			this.props.onGroupIdChange(groupId);
			
		} catch (error) {
			console.error('Group ID generation error:', error);
		}
	};

	// 파일 목록 조회
	loadFileList = async (groupId) => {
		if (!groupId) {
			return;
		}

		try {
			const baseUrl = ComLib.getSession("SVR_URL") || '';
			let fileListUrl;
			let isExternal = false;
			
			// downloadSource와 initialGroupId가 동시에 존재하면 외부 API 사용
			if (this.props.downloadSource && this.props.initialGroupId) {
				isExternal = true;
				fileListUrl = `${baseUrl}/api/common/external/files/meta/${groupId}?cmpyId=${encodeURIComponent(this.props.downloadSource)}`;
			} else {
				fileListUrl = `${baseUrl}/api/common/files/${groupId}`;
			}
			
			const response = await fetch(fileListUrl, {
				method: 'GET',
				headers: {
					'Content-Type': 'application/json',
				}
			});
			
			if (!response.ok) {
				console.error('File list load error:', response.status);
				return;
			}
			
			const result = await response.json();
			
			if (isExternal) {
				// 외부 API 응답: FileMetaResDto { result: "0", dataList: [FileMetaDto...] }
				if (result.result === '0' && result.dataList) {
					// FileMetaDto를 FileManager 형식으로 변환
					const fileList = result.dataList.map(file => ({
						fileId: file.fileId,
						fileName: file.fileName,
						fileSize: file.fileSize || 0
					}));
					
					this.setState({ existingFiles: fileList });
				}
			} else {
				// 내부 API 응답: FileListResDto { result: "0", data: [FileInfoDto...] }
				if (result.result === '0' && result.data) {
					// FileInfoDto를 FileManager 형식으로 변환
					const fileList = result.data.map(file => ({
						fileId: file.fileId,
						fileName: file.fileName,
						fileSize: file.fileSize || 0
					}));
					
					this.setState({ existingFiles: fileList });
				}
			}
			
		} catch (error) {
			console.error('File list load error:', error);
		}
	};

	// 파일 드롭 핸들러
	handleDrop = async (acceptedFiles) => {
		if (this.props.disabled) return;

		const { mode, maxFiles } = this.props;
		const { existingFiles, uploadingFiles } = this.state;

		// single 모드에서는 1개만 허용
		let filesToProcess = acceptedFiles;
		if (mode === 'single') {
			filesToProcess = [acceptedFiles[0]];
		}

		// 최대 파일 수 체크 (multi 모드)
		if (mode === 'multi') {
			const currentCount = existingFiles.length + uploadingFiles.length;
			const availableSlots = maxFiles - currentCount;
			if (availableSlots <= 0) {
				ComLib.openDialog('A', 'SYSI0010', [`최대 ${maxFiles}개의 파일만 업로드할 수 있습니다.`]);
				return;
			}
			filesToProcess = filesToProcess.slice(0, availableSlots);
		}

		// 검증
		const validFiles = filesToProcess.filter(file => {
			if (file.size > this.props.maxSize) {
				ComLib.openDialog('A', 'SYSI0010', [`${file.name}: 파일 크기는 100MB를 초과할 수 없습니다.`]);
				return false;
			}
			if (!this.props.uploadValidation([{ file }])) {
				return false;
			}
			return true;
		});

		if (validFiles.length === 0) return;

		// single 모드: 기존 파일 제거
		if (mode === 'single') {
			this.setState({ existingFiles: [], uploadingFiles: [] });
		}

		// groupId가 없으면 먼저 채번 (동시 업로드 시 같은 groupId 사용)
		let groupId = this.state.currentGroupId;
		if (!groupId) {
			try {
				const baseUrl = ComLib.getSession("SVR_URL") || '';
				const groupIdUrl = `${baseUrl}/api/common/file/group-id`;
				
				const groupIdResponse = await fetch(groupIdUrl, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					}
				});
				
				if (!groupIdResponse.ok) {
					const errorData = await groupIdResponse.json();
					ComLib.openDialog('A', 'SYSI0010', [errorData.message || '파일 그룹 ID 생성에 실패했습니다.']);
					return;
				}
				
				const groupIdResult = await groupIdResponse.json();
				if (groupIdResult.result !== '0') {
					ComLib.openDialog('A', 'SYSI0010', [groupIdResult.message || '파일 그룹 ID 생성에 실패했습니다.']);
					return;
				}
				
				groupId = groupIdResult.data;
				this.setState({ currentGroupId: groupId });
				this.props.onGroupIdChange(groupId);
				
			} catch (error) {
				console.error('Group ID generation error:', error);
				ComLib.openDialog('A', 'SYSI0010', [error.message || '파일 그룹 ID 생성에 실패했습니다.']);
				return;
			}
		}

		// 업로드 큐에 추가
		const newFiles = validFiles.map(file => ({
			id: `upload-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
			file,
			progress: 0,
			status: 'uploading',
			fileId: null
		}));

		this.setState(prev => ({
			uploadingFiles: mode === 'single' ? newFiles : [...prev.uploadingFiles, ...newFiles]
		}), () => {
			newFiles.forEach(fileItem => this.uploadFile(fileItem));
		});
	};

	// 파일 업로드
	uploadFile = async (fileItem) => {
		// groupId는 handleDrop에서 이미 채번되었으므로 state에서 가져옴
		const groupId = this.state.currentGroupId;
		
		if (!groupId) {
			console.error('GroupId is not available');
			this.updateFileStatus(fileItem.id, 'error');
			ComLib.openDialog('A', 'SYSI0010', ['파일 그룹 ID가 없습니다.']);
			return;
		}

		// 파일 업로드 (groupId 필수)
		const formData = new FormData();
		formData.append('file', fileItem.file);
		formData.append('groupId', groupId);  // 필수로 전달

		const url = ComLib.getSession("SVR_URL") + (this.props.url || '/api/common/upload');

		try {
			const xhr = new XMLHttpRequest();

			xhr.upload.onprogress = (e) => {
				if (e.lengthComputable) {
					const progress = Math.round((e.loaded / e.total) * 100);
					this.updateFileProgress(fileItem.id, progress);
				}
			};

			xhr.onload = () => {
				if (xhr.status === 200) {
					try {
						const response = JSON.parse(xhr.responseText);
						if (response.result === '0') {
							const savedFiles = response.data.savedFileList || [];
							const fileId = savedFiles.length > 0 ? savedFiles[0].fileId : null;
							const returnedGroupId = response.data.atchFileGroupId;
							
							// groupId는 이미 설정되어 있지만, 응답으로 받은 값과 일치 확인
							if (returnedGroupId && returnedGroupId !== groupId) {
								console.warn('Group ID mismatch:', groupId, returnedGroupId);
							}
							
							this.updateFileStatus(fileItem.id, 'done', fileId);
							
							this.props.onUploadComplete({
								id: this.props.id,
								msg: response.result,
								savedFileList: savedFiles,
								atchFileGroupId: groupId
							});
						} else {
							this.updateFileStatus(fileItem.id, 'error');
							ComLib.openDialog('A', 'SYSI0010', [response.message || '파일 업로드에 실패했습니다.']);
						}
					} catch (err) {
						this.updateFileStatus(fileItem.id, 'error');
						ComLib.openDialog('A', 'SYSI0010', ['파일 업로드 중 오류가 발생했습니다.']);
					}
				} else {
					this.updateFileStatus(fileItem.id, 'error');
					ComLib.openDialog('A', 'SYSI0010', ['파일 업로드에 실패했습니다.']);
				}
			};

			xhr.onerror = () => {
				this.updateFileStatus(fileItem.id, 'error');
				ComLib.openDialog('A', 'SYSI0010', ['파일 업로드에 실패했습니다.']);
			};

			xhr.open('POST', url, true);
			xhr.send(formData);

		} catch (error) {
			console.error('Upload error:', error);
			this.updateFileStatus(fileItem.id, 'error');
		}
	};

	updateFileProgress = (id, progress) => {
		this.setState(prev => ({
			uploadingFiles: prev.uploadingFiles.map(f =>
				f.id === id ? { ...f, progress } : f
			)
		}));
	};

	updateFileStatus = (id, status, fileId = null) => {
		this.setState(prev => ({
			uploadingFiles: prev.uploadingFiles.map(f =>
				f.id === id ? { ...f, status, fileId, progress: status === 'done' ? 100 : f.progress } : f
			)
		}));
	};

	// 파일 삭제 (업로드 중/기존 파일 통합)
	onRemove = async (identifier) => {
		// 1. 파일 타입 자동 판별
		const uploadingFile = this.state.uploadingFiles.find(f => f.id === identifier);
		const existingFile = this.state.existingFiles.find(f => f.fileId === identifier);
		const isUploading = !!uploadingFile;
		const fileItem = uploadingFile || existingFile;
		
		if (!fileItem) {
			console.warn('File not found:', identifier);
			return;
		}

		

		// 3. 서버 삭제 처리
		const needServerDelete = isUploading 
			? (fileItem.status === 'done' && fileItem.fileId) // 업로드 완료된 경우만
			: true; // 기존 파일은 항상

		
		if (needServerDelete) {

			const confirmDelete = await new Promise(resolve => {
				ComLib.openDialog(
					'C',
					null,
					['이미 업로드가 완료된 파일입니다. 삭제하시겠습니까?'],
					result => resolve(result === true)
				);
			});

			if (!confirmDelete) {
				return;
			}


			try {
				const fileIdToDelete = isUploading ? fileItem.fileId : identifier;
				await this.deleteFileFromServer(fileIdToDelete);
			} catch (error) {
				console.error('File delete error:', error);
				
				// 기존 파일 삭제 실패 시 에러 표시하고 중단
				if (!isUploading) {
					ComLib.openDialog('A', 'SYSI0010', [error.message || '파일 삭제에 실패했습니다.']);
					return;
				}
				// 업로드 중인 파일은 서버 삭제 실패해도 UI에서는 제거 (조용히 실패)
			}
		}

		// 4. UI에서 제거
		if (isUploading) {
			this.setState(prev => ({
				uploadingFiles: prev.uploadingFiles.filter(f => f.id !== identifier)
			}));
		} else {
			this.setState(prev => ({
				existingFiles: prev.existingFiles.filter(f => f.fileId !== identifier)
			}));
		}

		// 5. 콜백 호출 (기존 파일만)
		if (!isUploading) {
			this.props.onFileDelete(identifier);
		}
	};

	// 서버에서 파일 삭제 (POST 방식)
	deleteFileFromServer = async (fileId) => {
		const baseUrl = ComLib.getSession("SVR_URL") || '';
		const deleteUrl = `${baseUrl}${this.props.deleteUrl || '/api/common/file/delete'}`;
		
		const response = await fetch(deleteUrl, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({ fileId: fileId })
		});
		
		if (!response.ok) {
			const contentType = response.headers.get('content-type');
			if (contentType && contentType.includes('application/json')) {
				const errorData = await response.json();
				throw new Error(errorData.message || '파일 삭제에 실패했습니다.');
			} else {
				throw new Error(`파일 삭제 실패 (${response.status})`);
			}
		}
		
		const result = await response.json();
		if (result.result !== '0') {
			throw new Error(result.message || '파일 삭제에 실패했습니다.');
		}
		
		return result;
	};

	handleDownload = async (fileId) => {
		if (!fileId) {
			ComLib.openDialog('A', 'SYSI0010', ['다운로드할 파일 정보가 없습니다.']);
			return;
		}

		const baseUrl = ComLib.getSession("SVR_URL") || '';
		let downloadUrl;
		
		if (this.props.downloadSource) {
			// downloadSource에 cmpyId 값이 있으면 AICC 외부 다운로드
			downloadUrl = `${baseUrl}/api/common/external/download/${fileId}?cmpyId=${encodeURIComponent(this.props.downloadSource)}`;
		} else {
			// 비어있으면 자체 서버 다운로드 (디폴트)
			const downloadPath = this.props.downloadUrl || '/api/common/download';
			downloadUrl = `${baseUrl}${downloadPath}/${fileId}`;
		}

		try {
			// fetch로 blob 다운로드
			const response = await fetch(downloadUrl);
			
			// 응답 상태 체크
			if (!response.ok) {
				// 서버에서 JSON 오류 응답을 보낸 경우 처리
				const contentType = response.headers.get('content-type');
				if (contentType && contentType.includes('application/json')) {
					const errorData = await response.json();
					throw new Error(errorData.message || '파일 다운로드에 실패했습니다.');
				} else {
					// 일반적인 HTTP 오류
					if (response.status === 404) {
						throw new Error('파일을 찾을 수 없습니다.');
					} else if (response.status === 500) {
						throw new Error('서버 오류가 발생했습니다.');
					} else {
						throw new Error(`다운로드 실패 (${response.status})`);
					}
				}
			}

			// 응답을 blob으로 변환
			const blob = await response.blob();
			
			// blob 크기 체크 (빈 파일이거나 오류 응답인 경우)
			if (blob.size === 0) {
				throw new Error('파일이 비어있거나 존재하지 않습니다.');
			}

			// Content-Disposition 헤더에서 파일명 추출
			let fileName = 'download';
			const contentDisposition = response.headers.get('Content-Disposition');
			if (contentDisposition) {
				const fileNameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
				if (fileNameMatch && fileNameMatch[1]) {
					fileName = fileNameMatch[1].replace(/['"]/g, '');
					// ISO-8859-1에서 UTF-8로 디코딩 (한글 파일명 처리)
					try {
						fileName = decodeURIComponent(escape(fileName));
					} catch (e) {
						// 디코딩 실패 시 원본 사용
					}
				}
			}

			// blob을 다운로드
			const url = window.URL.createObjectURL(blob);
			const link = document.createElement('a');
			link.href = url;
			link.download = fileName;
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
			window.URL.revokeObjectURL(url);

		} catch (error) {
			console.error('Download error:', error);
			ComLib.openDialog('A', 'SYSI0010', [error.message || '파일 다운로드에 실패했습니다.']);
		}
	};

	handleDownloadAll = async () => {
		const { existingFiles } = this.state;
		
		// 파일 ID 배열 생성
		const fileIds = existingFiles
			.map(file => file.fileId)
			.filter(id => id); // null/undefined 제거
		
		if (fileIds.length === 0) {
			ComLib.openDialog('A', 'SYSI0010', ['다운로드할 파일이 없습니다.']);
			return;
		}
		
		// ZIP 다운로드 요청
		const baseUrl = ComLib.getSession("SVR_URL") || '';
		const downloadUrl = `${baseUrl}/api/common/download-zip`;
		
		try {
			// fetch로 POST 요청 후 Blob으로 다운로드
			const response = await fetch(downloadUrl, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					fileIds: fileIds,
					zipFileName: 'attachments.zip'
				})
			});

			// 응답 상태 체크
			if (!response.ok) {
				// 서버에서 JSON 오류 응답을 보낸 경우 처리
				const contentType = response.headers.get('content-type');
				if (contentType && contentType.includes('application/json')) {
					const errorData = await response.json();
					throw new Error(errorData.message || '파일 다운로드에 실패했습니다.');
				} else {
					throw new Error(`다운로드 실패 (${response.status})`);
				}
			}

			const blob = await response.blob();
			
			// blob 크기 체크
			if (blob.size === 0) {
				throw new Error('다운로드할 파일이 없거나 오류가 발생했습니다.');
			}

			// Blob을 다운로드
			const url = window.URL.createObjectURL(blob);
			const link = document.createElement('a');
			link.href = url;
			link.download = 'attachments.zip';
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
			window.URL.revokeObjectURL(url);

		} catch (error) {
			console.error('Download all error:', error);
			ComLib.openDialog('A', 'SYSI0010', [error.message || '파일 다운로드에 실패했습니다.']);
		}
	};

	// 외부 ref 메서드들
	getFiles = () => {
		const { existingFiles, uploadingFiles, currentGroupId } = this.state;
		
		const uploadedFiles = uploadingFiles
			.filter(f => f.status === 'done' && f.fileId)
			.map(f => ({
				fileId: f.fileId,
				fileName: f.file.name,
				fileSize: f.file.size,
			}));
		
		const normalizedExistingFiles = existingFiles.map(f => ({
			fileId: f.fileId,
			fileName: f.fileName,
			fileSize: f.fileSize
		}));
		
		return {
			existingFiles: existingFiles,
			uploadedFiles: uploadedFiles,
			allFiles: [...normalizedExistingFiles, ...uploadedFiles],
			groupId: currentGroupId  // 그룹 ID 포함
		};
	};

	// 현재 그룹 ID 조회
	getGroupId = () => {
		return this.state.currentGroupId;
	};

	// 그룹 ID 초기화 (신규 등록 시 사용)
	resetGroupId = () => {
		this.setState({ currentGroupId: null });
	};

	// 그룹 ID 설정 (외부에서 설정 필요 시)
	setGroupId = (groupId) => {
		this.setState({ currentGroupId: groupId });
	};

	isUploading = () => {
		return this.state.uploadingFiles.some(f => f.status === 'uploading');
	};

	clearFiles = () => {
		this.setState({
			existingFiles: [],
			uploadingFiles: []
			// 그룹 ID는 유지 (파일이 모두 삭제되어도 groupId 유지)
		});
	};

	clearAll = () => {
		this.setState({
			existingFiles: [],
			uploadingFiles: [],
			currentGroupId: null
		});
		this.props.onGroupIdChange(null);
	};

	formatFileSize = (bytes) => {
		if (!bytes || bytes === 0) return '0B';
		const k = 1024;
		const sizes = ['B', 'KB', 'MB', 'GB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + sizes[i];
	};

	getFileIconInfo = (fileName) => {
		if (!fileName) return { icon: '📄', image: iconList, color: '#6B7280', bgColor: '#F3F4F6' };
		
		const ext = fileName.split('.').pop()?.toLowerCase() || '';
		
		const iconMap = {
			ppt: { icon: 'P', image: iconPpt, color: '#D04423', bgColor: '#FDF2F0' },
			pptx: { icon: 'P', image: iconPpt, color: '#D04423', bgColor: '#FDF2F0' },
			xls: { icon: 'X', image: iconExcel, color: '#1D6F42', bgColor: '#F0FDF4' },
			xlsx: { icon: 'X', image: iconExcel, color: '#1D6F42', bgColor: '#F0FDF4' },
			csv: { icon: 'X', image: iconExcel, color: '#1D6F42', bgColor: '#F0FDF4' },
			doc: { icon: 'W', image: iconWord, color: '#2B579A', bgColor: '#F0F4FD' },
			docx: { icon: 'W', image: iconWord, color: '#2B579A', bgColor: '#F0F4FD' },
			pdf: { icon: 'PDF', image: iconList, color: '#B30B00', bgColor: '#FDF2F0' },
			jpg: { icon: 'IMG', image: iconList, color: '#6B7280', bgColor: '#F3F4F6' },
			jpeg: { icon: 'IMG', image: iconList, color: '#6B7280', bgColor: '#F3F4F6' },
			png: { icon: 'IMG', image: iconList, color: '#6B7280', bgColor: '#F3F4F6' },
			gif: { icon: 'IMG', image: iconList, color: '#6B7280', bgColor: '#F3F4F6' },
			zip: { icon: 'ZIP', image: iconList, color: '#6B7280', bgColor: '#F3F4F6' },
			rar: { icon: 'RAR', image: iconList, color: '#6B7280', bgColor: '#F3F4F6' },
			txt: { icon: 'TXT', image: iconList, color: '#6B7280', bgColor: '#F3F4F6' }
		};
		
		return iconMap[ext] || { icon: '📄', image: iconList, color: '#6B7280', bgColor: '#F3F4F6' };
	};

	render() {
		const { existingFiles, uploadingFiles } = this.state;
		const { mode, disabled, height, maxFiles } = this.props;
		
		const totalFiles = existingFiles.length + uploadingFiles.length;
		const canAddMore = totalFiles < maxFiles;

		// mode에 따라 다른 컴포넌트 렌더링
		switch (mode) {
			case 'view':
				return (
					<ViewModeWrapper
						existingFiles={existingFiles}
						height={height}
						disabled={disabled}
						formatFileSize={this.formatFileSize}
						getFileIconInfo={this.getFileIconInfo}
						onDownload={this.handleDownload}
						onDownloadAll={this.handleDownloadAll}
						onRemove={this.onRemove}
					/>
				);
			
			case 'single':
				return (
					<SingleUploadWrapper
						onDrop={this.handleDrop}
						disabled={disabled}
						existingFiles={existingFiles}
						uploadingFiles={uploadingFiles}
						formatFileSize={this.formatFileSize}
						getFileIconInfo={this.getFileIconInfo}
						onDownload={this.handleDownload}
						onRemove={this.onRemove}
					/>
				);
			
			case 'single-view':
				return (
					<SingleViewWrapper
						existingFiles={existingFiles}
						disabled={disabled}
						formatFileSize={this.formatFileSize}
						getFileIconInfo={this.getFileIconInfo}
						onDownload={this.handleDownload}
					/>
				);
			
			case 'multi':
			default:
				return (
					<MultiUploadWrapper
						onDrop={this.handleDrop}
						dropzoneDisabled={disabled || !canAddMore}
						rowDisabled={disabled}
						height={height}
						maxFiles={maxFiles}
						existingFiles={existingFiles}
						uploadingFiles={uploadingFiles}
						formatFileSize={this.formatFileSize}
						getFileIconInfo={this.getFileIconInfo}
						onDownload={this.handleDownload}
						onRemove={this.onRemove}
					/>
				);
		}
	}
}

/**
 * 다건 업로드 모드 (기존 DropzoneWrapper)
 */
const MultiUploadWrapper = ({
	onDrop,
	dropzoneDisabled,
	rowDisabled,
	height,
	maxFiles,
	existingFiles,
	uploadingFiles,
	formatFileSize,
	getFileIconInfo,
	onDownload,
	onRemove
}) => {
	const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
		onDrop,
		disabled: dropzoneDisabled,
		multiple: true,
		noClick: true,
		noKeyboard: true
	});

	const hasFiles = existingFiles.length > 0 || uploadingFiles.length > 0;
	const headerHeight = 40;
	const listMaxHeight = hasFiles ? height - headerHeight : 0;
	const totalFiles = existingFiles.length + uploadingFiles.length;

	const handleHeaderClick = (e) => {
		e.stopPropagation();
		if (!dropzoneDisabled) {
			open();
		}
	};

	return (
		<div 
			{...getRootProps()}
			className={`fud-container ${isDragActive ? 'fud-drag-active' : ''}`}
			style={{ height: height + 'px' }}
		>
			<input {...getInputProps()} />
			
			{isDragActive && (
				<div className="fud-drag-overlay">
					<div className="fud-drag-overlay-text">파일을 여기에 놓으세요</div>
				</div>
			)}

			<div 
				className={`fud-header ${isDragActive ? 'fud-drag-active' : ''}`}
				onClick={handleHeaderClick}
			>
				<span className="fud-header-text">
					파일을 끌어다 놓거나 클릭하여 선택 ({totalFiles}/{maxFiles})
				</span>
			</div>

			{hasFiles && (
				<div className="fud-file-list" style={{ maxHeight: listMaxHeight + 'px' }}>
					{existingFiles.map((file, idx) => (
						<FileRow
							key={file.fileId || `existing-${idx}`}
							fileName={file.fileName}
							fileSize={formatFileSize(file.fileSize)}
							status="done"
							iconInfo={getFileIconInfo(file.fileName)}
							onDownload={() => onDownload(file.fileId)}
							onRemove={() => onRemove(file.fileId)}
							disabled={rowDisabled}
						/>
					))}
					
					{uploadingFiles.map((item) => (
						<FileRow
							key={item.id}
							fileName={item.file.name}
							fileSize={formatFileSize(item.file.size)}
							status={item.status}
							progress={item.progress}
							iconInfo={getFileIconInfo(item.file.name)}
							onDownload={item.fileId ? () => onDownload(item.fileId) : null}
							onRemove={() => onRemove(item.id)}
							disabled={rowDisabled}
						/>
					))}
				</div>
			)}
		</div>
	);
};

/**
 * 다건 다운로드 전용 모드 (view)
 */
const ViewModeWrapper = ({
	existingFiles,
	height,
	disabled,
	formatFileSize,
	getFileIconInfo,
	onDownload,
	onDownloadAll,
	onRemove
}) => {
	const fileCount = existingFiles.length;
	const headerHeight = 40;
	const listMaxHeight = height - headerHeight;

	return (
		<div className="fud-container fud-view-mode" style={{ height: height + 'px' }}>
			{/* 헤더: 첨부파일 N개 + 모두저장 버튼 */}
			<div className="fud-view-header">
				<span className="fud-view-header-text">
					<span className="fud-view-icon"></span>
					첨부파일 {fileCount}개
				</span>
				{fileCount > 0 && (
					<button className="fud-download-all-btn" onClick={onDownloadAll}>
						<span className="fud-download-icon"></span> 모두저장
					</button>
				)}
			</div>

			{/* 파일 목록 */}
			{fileCount > 0 && (
				<div className="fud-file-list" style={{ maxHeight: listMaxHeight + 'px' }}>
					{existingFiles.map((file, idx) => (
						<ViewFileRow
							key={file.fileId || `view-${idx}`}
							fileName={file.fileName}
							fileSize={formatFileSize(file.fileSize)}
							iconInfo={getFileIconInfo(file.fileName)}
							onDownload={() => onDownload(file.fileId)}
						/>
					))}
				</div>
			)}

			{fileCount === 0 && (
				<div className="fud-empty-message">첨부된 파일이 없습니다.</div>
			)}
		</div>
	);
};

/**
 * View 모드 파일 행
 */
const ViewFileRow = ({
	fileName,
	fileSize,
	iconInfo,
	onDownload
}) => {
	const isEmojiIcon = iconInfo.icon.length > 2;

	return (
		<div className="fud-view-file-row">
			{/* 파일 아이콘 */}
			<div 
				className="fud-file-icon"
				style={{ 
					backgroundColor: isEmojiIcon ? 'transparent' : iconInfo.bgColor,
					color: iconInfo.color 
				}}
			>
				{iconInfo.image ? (
					<img src={iconInfo.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
				) : (
					iconInfo.icon
				)}
			</div>

			{/* 파일명 (클릭 시 다운로드) */}
			<span 
				className="fud-file-name fud-file-name-link" 
				title={fileName}
				onClick={onDownload}
			>
				{fileName}
			</span>

			{/* 파일 크기 */}
			<span className="fud-file-size">({fileSize})</span>
		</div>
	);
};

/**
 * 단건 업로드 모드 (single)
 */
const SingleUploadWrapper = ({
	onDrop,
	disabled,
	existingFiles,
	uploadingFiles,
	formatFileSize,
	getFileIconInfo,
	onDownload,
	onRemove
}) => {
	const { getRootProps, getInputProps, open } = useDropzone({
		onDrop,
		disabled,
		multiple: false,
		noClick: true,
		noKeyboard: true
	});

	const hasExistingFile = existingFiles.length > 0;
	const hasUploadingFile = uploadingFiles.length > 0;
	const file = hasExistingFile ? existingFiles[0] : (hasUploadingFile ? uploadingFiles[0] : null);

	const handleButtonClick = (e) => {
		e.stopPropagation();
		if (!disabled) {
			open();
		}
	};

	return (
		<div {...getRootProps()} className="fud-single-container">
			<input {...getInputProps()} />
			
			{/* 첨부파일 버튼 */}
			<button 
				type="button"
				className="fud-single-btn"
				onClick={handleButtonClick}
				disabled={disabled}
			>
				첨부파일
			</button>

			{/* 파일 정보 표시 */}
			{file && (
				<div className="fud-single-file-info">
					{hasExistingFile ? (
						<>
							<span 
								className="fud-single-file-name"
								onClick={() => onDownload(file.fileId)}
								title={file.fileName}
							>
								{file.fileName}
							</span>
							<span className="fud-single-file-size">({formatFileSize(file.fileSize)})</span>
							{!disabled && (
								<button 
									className="fud-single-delete-btn" 
									onClick={() => onRemove(file.fileId)}
									title="삭제"
								>
									×
								</button>
							)}
						</>
					) : (
						<>
							<span 
								className={`fud-single-file-name ${file.status === 'done' && file.fileId ? 'fud-single-file-name-clickable' : ''}`}
								title={file.file.name}
								onClick={file.status === 'done' && file.fileId ? () => onDownload(file.fileId) : undefined}
								style={file.status === 'done' && file.fileId ? { cursor: 'pointer' } : {}}
							>
								{file.file.name}
							</span>
							<span className="fud-single-file-size">({formatFileSize(file.file.size)})</span>
							{file.status === 'uploading' && (
								<span className="fud-single-progress">{file.progress}%</span>
							)}
							{file.status === 'done' && (
								<span className="fud-single-done">✓</span>
							)}
							{file.status === 'error' && (
								<span className="fud-single-error">오류</span>
							)}
							{!disabled && (
								<button 
									className="fud-single-delete-btn" 
									onClick={() => onRemove(file.id)}
									title="삭제"
								>
									×
								</button>
							)}
						</>
					)}
				</div>
			)}

			{!file && (
				<span className="fud-single-placeholder">선택된 파일이 없습니다.</span>
			)}
		</div>
	);
};

/**
 * 단건 다운로드 전용 모드 (single-view)
 */
const SingleViewWrapper = ({
	existingFiles,
	disabled,
	formatFileSize,
	getFileIconInfo,
	onDownload
}) => {
	const file = existingFiles.length > 0 ? existingFiles[0] : null;

	if (!file) {
		return (
			<div className="fud-single-view-container">
				<span className="fud-single-view-empty">첨부된 파일이 없습니다.</span>
			</div>
		);
	}

	const iconInfo = getFileIconInfo(file.fileName);
	const isEmojiIcon = iconInfo.icon.length > 2;

	return (
		<div className="fud-single-view-container">
			{/* 파일 아이콘 */}
			<div 
				className="fud-file-icon"
				style={{ 
					backgroundColor: isEmojiIcon ? 'transparent' : iconInfo.bgColor,
					color: iconInfo.color 
				}}
			>
				{iconInfo.image ? (
					<img src={iconInfo.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
				) : (
					iconInfo.icon
				)}
			</div>

			{/* 파일명 (클릭 시 다운로드) */}
			<span 
				className="fud-single-view-file-name"
				onClick={() => onDownload(file.fileId)}
				title={file.fileName}
			>
				{file.fileName}
			</span>

			{/* 파일 크기 */}
			<span className="fud-single-view-file-size">({formatFileSize(file.fileSize)})</span>
		</div>
	);
};

/**
 * 파일 행 컴포넌트 (multi 모드용)
 */
const FileRow = ({
	fileName,
	fileSize,
	status,
	progress = 0,
	iconInfo,
	onDownload,
	onRemove,
	disabled
}) => {
	const isUploading = status === 'uploading';
	const isDone = status === 'done';
	const isError = status === 'error';
	const isEmojiIcon = iconInfo.icon.length > 2;

	return (
		<div className="fud-file-row">
			{!disabled && (
				<button className="fud-delete-btn" onClick={onRemove} title="삭제">×</button>
			)}
			{disabled && <div className="fud-delete-placeholder" />}

			<div 
				className="fud-file-icon"
				style={{ 
					backgroundColor: isEmojiIcon ? 'transparent' : iconInfo.bgColor,
					color: iconInfo.color 
				}}
			>
				{iconInfo.image ? (
					<img src={iconInfo.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
				) : (
					iconInfo.icon
				)}
			</div>

			<span className="fud-file-name" title={fileName}>{fileName}</span>

			<div className="fud-actions">
				{isUploading && (
					<span className="fud-progress">{progress}%</span>
				)}
				{isDone && onDownload && (
					<button className="fud-action-btn" onClick={onDownload}>다운로드</button>
				)}
				{isError && (
					<span className="fud-error-text">오류</span>
				)}
			</div>

			<div className="fud-status">
				{isDone && (
					<>
						<span className="fud-check">✓</span>
						<span className="fud-status-text">일반첨부</span>
					</>
				)}
				{isUploading && (
					<span className="fud-status-text fud-status-uploading">업로드 중</span>
				)}
				{isError && (
					<span className="fud-status-text fud-status-error">실패</span>
				)}
			</div>

			<span className="fud-file-size">{fileSize}</span>
		</div>
	);
};

export default FileManager;
export { FileManager };
