/* ***************************************************
 *	explain : 그리드 내부에서 필요한 util 정의
 *	written by hw.lee
 * ***************************************************/

 import {
    ComLib, DataLib, TransManager, StrLib, DateLib, newScrmObj
} from 'common';

const rowSpan = (params) => {
	let cnt = 0;
	let api = params.api;
	// index 위의 데이터 찾기
	let data  = [];
	api.forEachNodeAfterFilterAndSort((node) => {
		data.push({node : node, index : node['rowIndex']});
	});
	let prevVal;
	let presVal = params.data[params.column.colId];
	if (presVal === null || presVal === undefined) {
		return 1;
	}

	if (params.node.rowIndex > 0) {
		prevVal = api.getValue(params.column.colId , data[params.node.rowIndex-1]['node']);
		if (prevVal === presVal) {
			return 1;
		} else {
			for (let intA = 0; intA < data.length; intA++) {
				if (data[intA]['index'] >= params.node.rowIndex) {
					if (data[intA]['node']['data'][params.column.colId] === params.data[params.column.colId]) {
						cnt ++;
					} else {
						break;
					}
				}
			}
		}
	} else {
		for (let intA = 0; intA < data.length; intA++) {
			if (data[intA]['index'] >= params.node.rowIndex) {
				if (data[intA]['node']['data'][params.column.colId] === presVal) {
					cnt ++;
				} else {
					break;
				}
			}
		}
	}
	return cnt;
}
const valueRowSpan = (params) => {
	
	if (params['node']['rowIndex'] > 0) {
		let beforeData = params.api.getValue(params.column.colId, params.api.getDisplayedRowAtIndex(params['node']['rowIndex'] - 1));
		if (beforeData === null || beforeData === undefined) {
			return params.data[params.column.colId];
		} else {
			if (beforeData === params.data[params.column.colId]) {
				return '';
			} 
		}
	}
	return params.data[params.column.colId];
}
const setColumnProperty = (ele) => {
	if (ele['rowSpan'] === true) {
		ele['rowSpan'] = function (params) { return 1;};
		ele['valueFormatter'] = valueRowSpan
	}
	if (ele['autoHeight'] === true) {
		ele['cellStyle']['white-space'] = "normal";
	}

	let cellStyleTextAlign;
	if (ele['cellStyle'] === undefined || ele['cellStyle'] === null) ele['cellStyle'] = {};

	if (ele['textAlign'] !== undefined && ele['textAlign'] !== null) {
		cellStyleTextAlign = ele['textAlign'];
		delete ele['textAlign'];
	} else if (ele['align'] !== undefined && ele['align'] !== null) {
		cellStyleTextAlign = ele['align'];
		delete ele['align'];
	} else {
		if(typeof ele['cellStyle'] !== 'function' && ele['cellStyle']['textAlign'] !== undefined && ele['cellStyle']['textAlign'] !== null) {
			cellStyleTextAlign = ele['cellStyle']['textAlign'];
			delete ele['cellStyle']['textAlign'];
		}
	}

	if (typeof ele['cellStyle'] === 'function') {
		const originalCellStyle = ele['cellStyle'];
		ele['cellStyle'] = (params) => {
			let style = originalCellStyle(params) || {};
			let align = cellStyleTextAlign || style.textAlign || 'left';
			style.textAlign = align;
			if (align === 'right') style.justifyContent = 'flex-end';
			else if (align === 'center') style.justifyContent = 'center';
			else style.justifyContent = 'flex-start';
			return style;
		};
	} else {
		if (cellStyleTextAlign === undefined) cellStyleTextAlign = 'left';
		ele['cellStyle']['textAlign'] = cellStyleTextAlign;
		if (cellStyleTextAlign === 'right') {
			ele['cellStyle']['justifyContent'] = 'flex-end';
		} else if (cellStyleTextAlign === 'center') {
			ele['cellStyle']['justifyContent'] = 'center';
		} else {
			ele['cellStyle']['justifyContent'] = 'flex-start';
		}
	}

	if (ele['req']) {
		ele['headerName'] = ele['headerName'] + '*';
	}
	delete ele['req']

	let colType = ele['type'];
	// [W3-1] 아래 개인정보 컬럼(account/phone/email/rrn/name/account11)은 마스킹만 하고
	// 툴팁으로 원본을 내주지 않는다. 기존엔 tooltipValueGetter 가 params.value(원본)를 그대로
	// 돌려줘 셀에 마우스만 올리면 마스킹이 무의미했다. 원본이 필요하면 툴팁이 아니라 서버
	// reveal 관문(권한확인 + 필수감사)을 쓴다.
	if( ele['valueFormatter'] === undefined || ele['valueFormatter'] === null) {
		if(colType === 'date') {
			ele['valueFormatter'] = function(params) { return StrLib.setDateFormat(params.value, 'YYYY-MM-DD');};
		} else if(colType === 'number') {
			ele['valueFormatter'] = function(params) { return StrLib.setComma(params.value);};
		} else if(colType === 'datetime') {
			ele['valueFormatter'] = function(params) { return StrLib.setDateFormat(params.value, 'YYYY-MM-DD HH:mm:ss');};
		} else if(colType === 'time') {
			ele['valueFormatter'] = function(params) { return StrLib.setDateFormat(params.value, 'HH:mm:ss');};
		} else if(colType === 'account') {
			ele['valueFormatter'] = function(params) { return StrLib.maskAccountNumber(params.value);};
		} else if(colType === 'phone') {
			ele['valueFormatter'] = function(params) { return StrLib.maskPhoneNumber(params.value);};
		} else if(colType === 'email') {
			ele['valueFormatter'] = function(params) { return StrLib.maskEmail(params.value);};
		} else if(colType === 'rrn') {
			ele['valueFormatter'] = function(params) { return StrLib.maskRRN(params.value);};
		} else if(colType === 'name') {
			ele['valueFormatter'] = function(params) { return StrLib.maskName(params.value);};
		} else if(colType === 'account11') {
			ele['valueFormatter'] = function(params) { return StrLib.maskAccountNumber11(params.value);};
		}
	}

	return ele;
}

const setGridHeader = (header, props) => {
	
	if (header === null || header === undefined) {
		return null;
	}
	if (props === undefined || props === null) {
		return header;
	}
	let rtnHeader;
	
	let _depthCol = [{	headerName: '_HIERARCHY', field: '_HIERARCHY',	colId: '_HIERARCHY', filter: false, resizable: false, lockPosition: true, cellStyle: {paddingLeft: '20px'}}];
	let numCol =	[{	headerName: 'No.', field: '_No', colId: '_No', minWidth: 40, maxWidth: 55, sortable: false, filter: false, resizable: false, lockPosition: true,
						// cellStyle 은 React 의 style 객체로 넘어간다 — CSS 표기('text-align')가 아니라
						// camelCase('textAlign') 여야 한다. 종전 표기는 스타일이 먹지 않을 뿐 아니라
						// rowNum 을 쓰는 <모든 그리드>에서 React 경고를 쏟았다
						// (실측 2026-09-03: BO403_S·SYS1010·SYS3010·SYS3040·SYS5040 …).
						valueGetter: function(params) { return params.node.rowIndex + 1;}, cellStyle: {textAlign : 'right'}
					}];
	let chkCol =	[{	headerName: '', field: '',	colId: '',	sort: false, filter: false, resizable: false, headerCheckboxSelection: true, checkboxSelection: true, lockPosition: true, maxWidth : 30}];
	let hideCol =	[{	headerName: 'CHK',	field: 'CHK',	colId: 'CHK',	hide: true }];
	let dragCol =	[{	headerName: '', field: '',	colId: '',	lockPosition: true, sort: false, filter: false, rowDrag: true, resizable: false, maxWidth : 30,
						rowDragText : function (params) { return params.rowNode.rowIndex + 1 + '행'} 
					}];

	if (typeof props.colPinned === 'number') {
		for (let intA = 0; intA < props.colPinned - 1; intA ++) {
			if (header.length < intA) {
				break;
			}
			header[intA]['pinned'] = 'left';
			header[intA]['suppressNavigable'] = true;
			header[intA]['lockPosition'] = true;
		}
		_depthCol[0]['pinned'] = 'left';
		numCol[0]['pinned'] = 'left';
		chkCol[0]['pinned'] = 'left';
		dragCol[0]['pinned'] = 'left';
	}

	rtnHeader = checkHeaderDepth(header, setColumnProperty);

	// tree 형태의 그리드인 경우, number 컬럼은 제외
	if (props.tree !== undefined && props.tree['isTree']) {
		_depthCol[0]['headerName'] = props.tree.headerName || _depthCol[0]['headerName'];
		_depthCol[0]['cellRenderer'] = 'test';
		rtnHeader = _depthCol.concat(rtnHeader);
	} else {
		if (props.rowNum) {
			rtnHeader = numCol.concat(rtnHeader);
		}
	}
	if (props.infoCheckBox && props.infoCheckBox['use']) {
		if (props.infoCheckBox['colId'] !== undefined && props.infoCheckBox['colId'] !== null && props.infoCheckBox['colId'] !== '') {
			hideCol[0]['headerName'] = props.infoCheckBox['colId'];
			hideCol[0]['field'] = props.infoCheckBox['colId'];
			hideCol[0]['colId'] = props.infoCheckBox['colId'];
		}
		rtnHeader = chkCol.concat(rtnHeader).concat(hideCol);
	}
	
	if (props.rowDrag) {
		rtnHeader = dragCol.concat(rtnHeader);
	}

	const noChildrenColumnsHeight = 60;
	const positionCorrection = -(noChildrenColumnsHeight / 2); // 위치 보정
	const hasGroupColumns = document.querySelectorAll('.ag-header-row-column-group').length > 0;
	const hasGroupName = document.querySelectorAll(`.${props.className}`).length > 0;
	
	if (hasGroupColumns && hasGroupName) {
		const groupColumns = document.querySelectorAll('.ag-header-row-column .ag-header-cell-text');
		header.forEach(item => {
			if(!item.hasOwnProperty('children')) {
				groupColumns.forEach(cellItem => {
					if(cellItem.innerText === item.headerName || cellItem.innerText === 'No.') {
						const headerCell = cellItem.closest('.ag-header-cell');
						// headerCell에 props.className이 있는지 확인
						if(headerCell && headerCell.classList.contains(props.className)) {
							headerCell.style.height = `${noChildrenColumnsHeight}px`;
							headerCell.style.top = `${positionCorrection}px`;
							headerCell.style.borderTop = 'unset';
						}
					}
				})
			}
		})
	}
	
	return rtnHeader;
}

const checkHeaderDepth = (arrData, _function) => {
	const _func = _function;
	for (let intA = 0; intA < arrData.length; intA ++) {
		if (arrData[intA].hasOwnProperty('children')) {
			arrData[intA]['children'] = checkHeaderDepth(arrData[intA]['children'], _func);
		} else {
			arrData[intA] = _func(arrData[intA]);
		}
	}
	return arrData;
}

const checkHeaderProp = (arrData, col) => {
	let rtnVal = false;
	for (let intA = 0; intA < arrData.length; intA ++) {
		if (arrData[intA].hasOwnProperty('children')) {
			rtnVal = checkHeaderProp(arrData[intA]['children'], col);
		} else {
			if (arrData[intA][col] !== undefined && arrData[intA][col] !== null) {
				rtnVal = true;
				return rtnVal;
			}
		}
	}
	return rtnVal;
}

const compareArray = (arr1, arr2) => {
	if (JSON.stringify(arr1) === JSON.stringify(arr2)) {
		return true;
	} else {
		return false;
	}
}

const setSubTotalRow = (data, column) => {

}

export { rowSpan, setGridHeader, checkHeaderDepth, compareArray, checkHeaderProp };