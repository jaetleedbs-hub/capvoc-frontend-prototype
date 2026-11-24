import React from 'react';
import { AgGridReact } from 'ag-grid-react';
import {ComLib, newScrmObj, StrLib, ExcelLib, DataLib} from 'common';
import {LFloatArea, RFloatArea, BasicButton as Button} from 'components';
import {DateComponent, TimeComponent, CheckboxRenderer, RangeDateComponent, RangeTimeComponent, DelRowButton, SelectboxRenderer, CustomEditor, ActionButton, CustomToolTip} from './components';

import {setGridHeader, checkHeaderProp} from './utils';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import "flatpickr/dist/themes/dark.css";

// header에 작성된 type
const columnTypes = {
	date: {	},
	datetime: {	},
	time: {	},
	number: {	},
	text: {	},
	select: {	},
	checkbox: {	},
	code: {	},
	account: {	},
	phone: {	},
	email: {	},
	rrn: {	},
	name: {	},
	rate: {	},
	address: {	},
	account11: {	},
	num: {	},
	centerColumn: {	}
};

class Grid extends React.Component {

	constructor (props) {
		super(props);
		this.initFlag = false;
		this.pageDataset = [];
		this.propDataset = [];
		this.gridDataset = DataLib.datalist.getInstance();
		this.state = { gridApi : null, columnApi : {}, columnDefs: [], rowData: [] };
		this.onActionCellClicked  = this.onActionCellClicked.bind(this);
		this.onCellClicked		  = this.onCellClicked.bind(this);
		this.onCellDoubleClicked  = this.onCellDoubleClicked.bind(this);
		this.onCellFocused		  = this.onCellFocused.bind(this);
		this.onRowClicked		  = this.onRowClicked.bind(this);
		this.onRowSelected		  = this.onRowSelected.bind(this);
		this.onRowDoubleClicked	  = this.onRowDoubleClicked.bind(this);
		this.onCellValueChanged	  = this.onCellValueChanged.bind(this);
		this.onGridReady		  = this.onGridReady.bind(this);
		this.onCellEditingStopped = this.onCellEditingStopped.bind(this);
		this.onRowDataChanged	  = this.onRowDataChanged.bind(this);
		this.onSelectionChanged	  = this.onSelectionChanged.bind(this);
		this.onPaginationChanged  = this.onPaginationChanged.bind(this);
		this.onBodyScroll		  = this.onBodyScroll.bind(this);
		this.onRowDataUpdated	  = this.onRowDataUpdated.bind(this);
		this.onSortChanged		  = this.onSortChanged.bind(this);
		this.onRowDragEnd		  = this.onRowDragEnd.bind(this);
		this.onColumnResized	  = this.onColumnResized.bind(this);
		this.onColumnGroupOpened  = this.onColumnGroupOpened.bind(this);
		this.treeHeaderMap = this.props.treeHeaderMap || this.treeHeaderMap;
		
		// 인피니트 스크롤 중복 처리 방지
		this.isProcessingInfiniteData = false;
		
		// 이전 데이터 길이 추적
		this.prevDataLength = 0;
	}
	// checkboxSelection: false,
	static defaultProps = {
		id : null,
		data : [],
		header : [],
		suppressMovableColumns : true,
		rowDrag : false,
		doNotScrollTop : true,
		suppressRowClickSelection : false,
		sort : true,
		filter : false,
		floatingFilter: false,
		rowSelection : 'single',
		addRowBtn : false,
		delRowBtn : false,
		dnlExcelBtn : false,
		autoFitMode : true,
		infoCheckBox : {
			use : false,
			colId : null,
		},
		onGridReady : () => {return;},
		onRowClicked : () => {return;},
		onCellFocused : () => {return;},
		onActionCellClicked : () => {return;},
		onCellClicked : () => {return;},
		onCellDoubleClicked : () => {return;},
		onCellValueChanged : () => {return;},
		onRowDoubleClicked : () => {return;},
		onCellEditingStopped  : () => {return;},
		onSelectionChanged  : () => {return;},
		onRowSelected  : () => {return;},
		onDeleteRow : () => {return;},
		onPaginationChanged : () => {return;},
		onBodyScroll : () => {return;},
		onScrollEnd : () => {return;},
		onRowDragEnd : () => {return ;},
		onBeforeInsertRow : () => {return { rtn : true, index : 0};},
		onBeforeDeleteRow : () => {return true;},
		onColumnGroupOpened : () => {return true;},

		treeHeaderMap: {
			id: 'ID',
			parentId: 'PARENT_ID',
			level: 'LEVEL',
			expand: 'EXPAND',
			displayName: 'VALUE',
			childCount: 'childCNT',
			rowType: 'rowtype',
		}
	};
	componentDidMount () { 
		// 인피니트 스크롤을 위한 콜백 등록
		if (this.props.infinite && this.props.data && this.props.data._gridUpdateCallback === undefined) {
			this.props.data._gridUpdateCallback = (records) => {
				console.log('Grid update callback triggered:', {
					recordsLength: records.length,
					hasGridApi: !!this.state.gridApi
				});
				
				if (this.state.gridApi) {
					const filteredData = records.filter(item => item['rowtype'] !== newScrmObj.constants.crud.destroy);
					console.log('Updating grid via callback:', {
						totalRecords: records.length,
						filteredRecords: filteredData.length
					});
					
					this.state.gridApi.updateGridOptions({ rowData: filteredData });
					
					setTimeout(() => {
						if (this.state.gridApi) {
							this.state.gridApi.refreshCells();
							console.log('Grid callback refresh - Row count:', this.state.gridApi.getDisplayedRowCount());
						}
					}, 10);
				}
			};
		}
	};
	shouldComponentUpdate (nextProps) {
		if (!this.props.infinite) {
			// 화면에서 setState시, 다른 컴포넌트의 데이터가 변경되는 경우에 prop 데이터의 변경이 없으면 render 하지 않음
			if (nextProps.data.records === this.propDataset && nextProps.data.records === this.props.data.records && this.props.data.records === this.propDataset) {
				return false;
			}
		} else {
			if (nextProps.data.records === this.pageDataset && nextProps.data.records === this.props.data.records && this.props.data.records === this.pageDataset) {
				return false;
			}
		}
		return true;

	}
	componentDidUpdate(prevProps) {
		console.log('Grid componentDidUpdate called:', {
			hasGridApi: !!this.state.gridApi,
			hasData: !!(this.props.data && this.props.data.getRecords),
			infinite: this.props.infinite,
			propsChanged: this.props !== prevProps,
			isProcessing: this.isProcessingInfiniteData
		});
		
		// gridApi가 없는 경우, 로직 pass 시킴
		if (this.state.gridApi === null) return;
		
		// 이미 처리 중인 경우 스킵
		if (this.isProcessingInfiniteData) {
			console.log('Grid componentDidUpdate: Already processing, skipping...');
			return;
		}

		if(!this.props.data || !this.props.data.getRecords){
			console.log('data is null');
			return;
		}

		if (this.props.data.getRecords().length === 0) {
			this.gridDataset.initRecords(this.props.data.getRecords());
			this.propDataset = this.props.data.records;
			// ⚠ 빈 결과는 null 이 아니라 <빈 배열>이다.
			//   ag-grid 에서 rowData=null 은 "아직 안 불러왔다"라 <로딩 오버레이가 계속 뜬다>.
			//   그래서 조회 결과가 0건인 그리드가 영원히 'Loading…' 에 멈춰 있었고,
			//   아래 localeText 에 준비해 둔 '조회된 결과가 존재하지 않습니다.' 는 한 번도 뜨지 못했다.
			//   실측(2026-09-03 dev): 카테고리설정 2개 그리드 · 회원사유형별 코드 관리의 코드 그리드 ·
			//   회원사 로그 관리가 모두 이 경로였다.
			this.state.gridApi.updateGridOptions({ rowData: [] });
			return;
		}

		// 인피니트 스크롤에서 데이터 길이 변화 감지는 나중에 처리

		if (this.props !== prevProps) {
			if (this.state.gridApi) {
				// 데이터 변경 처리

				if (!this.props.infinite) {
					// infinite가 아닌 경우, 그냥 리셋
					// 문제점 : 행 추가 시, 데이터셋 리셋은 안됨 + 재조회시에는 데이터셋 리셋
					// 그리드가 여러개인 경우, 화면에서 setState를 할 때마다 render가 일어나기 때문에 state가 변경된 그리드를 제외하고는 update 하지 않도록 로직 필요
					// -> shouldComponentUpdate에서 판단하여 render
					this.propDataset = this.props.data.records;
					if (this.props.tree !== undefined && this.props.tree.isTree) {
						this.gridDataset.initRecords(this.makeTreeData(this.props.data.getRecords()));
						this.state.gridApi.updateGridOptions({ rowData: this.getTreeData(this.gridDataset.getRecords().filter(item => item['rowtype'] !== newScrmObj.constants.crud.destroy)) });
					} else {
						this.gridDataset.initRecords(this.props.data.getRecords());
						this.state.gridApi.updateGridOptions({ rowData: this.gridDataset.getRecords().filter(item => item['rowtype'] !== newScrmObj.constants.crud.destroy) });
					}
				} else {
					// 중복 처리 방지
					if (this.isProcessingInfiniteData) {
						console.log('Infinite scroll: Already processing, skipping...');
						return;
					}
					
					console.log('Infinite scroll logic check:');
					console.log('- gridDatasetLength:', this.gridDataset.getRecords().length);
					console.log('- propDatasetLength:', this.propDataset.length);
					console.log('- propsDataLength:', this.props.data.getRecords().length);
					console.log('- pagingInfo:', this.props.data.paging);
					console.log('- isFirstPage:', this.props.data.paging && this.props.data.paging.first === true);
					
					this.isProcessingInfiniteData = true;
					
					// 인피니트 스크롤 데이터 처리 로직 개선
					const currentDataLength = this.gridDataset.getRecords().length;
					const newDataLength = this.props.data.getRecords().length;
					const isServerFirstPage = this.props.data.paging && this.props.data.paging.first === true;
					
					console.log('Grid: 인피니트 스크롤 데이터 처리 조건', {
						currentDataLength: currentDataLength,
						newDataLength: newDataLength,
						isServerFirstPage: isServerFirstPage,
						pagingInfo: this.props.data.paging
					});
					
					if (currentDataLength === 0 && newDataLength > 0) {
						// 첫 페이지 로드 (Grid에 데이터가 없는 경우)
						console.log('setInfiniteGridData(R) - Initial setup');
						this.setInfiniteGridData('R');
					} else if (newDataLength > 0 && currentDataLength > 0 && !isServerFirstPage) {
						// 기존 데이터가 있고 서버에서 첫 페이지가 아닌 경우에만 추가
						console.log('setInfiniteGridData(A) - Append new data (not first page)');
						this.setInfiniteGridData('A');
					} else if (newDataLength > 0 && isServerFirstPage) {
						// 서버에서 첫 페이지 데이터가 온 경우 초기화
						console.log('setInfiniteGridData(R) - Reset for new search (server first page)');
						this.setInfiniteGridData('R');
					}
					
					// 처리 완료 후 플래그 리셋
					setTimeout(() => {
						this.isProcessingInfiniteData = false;
					}, 100);
				}

			}
		}
		
		// 인피니트 스크롤에서 데이터 길이 변화 감지 (모든 처리 후)
		if (this.props.infinite && this.props.data && this.props.data.getRecords) {
			const currentDataLength = this.props.data.getRecords().length;
			if (currentDataLength !== this.prevDataLength) {
				console.log('Final data length check:', {
					prev: this.prevDataLength,
					current: currentDataLength,
					gridDatasetLength: this.gridDataset.getRecords().length
				});
				this.prevDataLength = currentDataLength;
				
				// gridDataset이 업데이트된 후에 Grid 강제 업데이트
				if (this.gridDataset.getRecords().length >= currentDataLength && this.gridDataset.getRecords().length > 0) {
					console.log('Forcing final grid update - gridDataset has data:', {
						gridDatasetLength: this.gridDataset.getRecords().length,
						currentDataLength: currentDataLength
					});
					
					const filteredData = this.gridDataset.getRecords().filter(item => item['rowtype'] !== newScrmObj.constants.crud.destroy);
					console.log('Setting final grid data:', {
						totalRecords: this.gridDataset.getRecords().length,
						filteredRecords: filteredData.length
					});
					
					this.state.gridApi.updateGridOptions({ rowData: filteredData });
					
					setTimeout(() => {
						if (this.state.gridApi) {
							this.state.gridApi.refreshCells();
							console.log('Final grid refresh - Row count:', this.state.gridApi.getDisplayedRowCount());
						}
					}, 50);
				}
			}
		}
		
	}
	/* Event Zone */
	onGridReady = (event) => {
		this.setState({
			...this.state, gridApi: event.api, columnApi: event.columnApi
		}, () => {
			if(!this.state || !this.props || !this.props.data || !this.props.data.getRecords){
				console.log('state or props or data is null');
				return;
			}

			
			if (this.state.gridApi !== undefined && this.state.gridApi !== null && Object.keys(this.state.gridApi).length !== 0) {
				this.pageDataset = this.props.data.getRecords();
				if (this.props.autoFitMode) {
					this.state.gridApi.sizeColumnsToFit(); // 컬럼 자동 조정 활성화
				}
			} 
			this.props.onGridReady({id : this.props.id, gridApi : this.state.gridApi, grid : this , columnApi : this.state.columnApi, api: this.state.gridApi});
		});
	};
	onColumnResized = (e) => { }
	onRowDataUpdated = (e) => {
		console.log('onRowDataUpdated called:', {
			displayedRowCount: e.api.getDisplayedRowCount(),
			totalRowCount: e.api.getModel().getRowCount(),
			infinite: this.props.infinite
		});
		
		// 컬럼 자동 조정 - autoFitMode props에 따라 결정
		if(this.props.data && this.props.data.getRecords && typeof this.props.data.getRecords === 'function' && this.props.data.getRecords().length > 0) {
			if (this.props.autoFitMode) {
				e.api.sizeColumnsToFit(); 
			}
		}
	}
	onBodyScroll = (e) => {
		// ⚠ gridApi 가 아직(또는 이미) 없는 채로 스크롤 이벤트가 올 수 있다.
		//   이 파일의 다른 8곳은 전부 null 을 막는데 여기만 빠져 있었다 —
		//   실측(2026-09-03 dev, BO402_S 회원사 로그 관리 · infinite:true):
		//   "Cannot read properties of null (reading 'getDisplayedRowAtIndex')" pageerror.
		if (this.props.infinite && this.state.gridApi) {
			if (this.state.gridApi.getDisplayedRowAtIndex(this.state.gridApi.getDisplayedRowCount()-1)) {
				let lastNode = this.state.gridApi.getDisplayedRowAtIndex(this.state.gridApi.getDisplayedRowCount()-1);

				// 소숫점 이하를 올림하여야 정확한 값을 찾을 수 있다.
				if ((lastNode.rowHeight + lastNode.rowTop) <= Math.ceil(this.state.gridApi.getVerticalPixelRange().bottom)) {
					if (this.props.totalRowCnt > this.propDataset.length) {
						this.props.onScrollEnd({ id : this.props.id, excelLoadAll: false});
						
					}
				}
			}
		}
	}
	onPaginationChanged = (e) => {
	};

	onCellValueChanged = (e) => {
		let _newValue = e.newValue;

		if (e.oldValue !== _newValue) {
			if (e.data['rowtype'] !== newScrmObj.constants.crud.create) {
					const colId = e.column.getColId ? e.column.getColId() : e.column.colId;
					const recidRaw = e.data.recid;
					const tryVals = [recidRaw];
					const num = Number(recidRaw);
					if (!Number.isNaN(num)) tryVals.push(num);
					const str = String(recidRaw);
					if (str !== recidRaw) tryVals.push(str);
					let idx = -1;
					for (let i = 0; i < tryVals.length; i++) {
						idx = this.gridDataset.indexOf('recid', tryVals[i]);
						if (idx >= 0) break;
					}
					if (idx >= 0) {
						this.gridDataset.setValue(idx, colId, _newValue);
					} else if (typeof this.gridDataset.setValueByRecId === 'function') {
						this.gridDataset.setValueByRecId(str, colId, _newValue);
					} else if (e.node && typeof e.node.setDataValue === 'function') {
						e.node.setDataValue(colId, _newValue);
					}
			} else {
				let rowData = this.gridDataset.getRecords();
				Object.assign(rowData.filter(item => item['rowtype'] !== newScrmObj.constants.crud.destroy)[e.rowIndex], e.data);
				this.gridDataset.setRecords(rowData);
			}
			this.props.onCellValueChanged({ 
					id : this.props.id
				,	data : this.gridDataset.getRecords()
				,	index : e.node.id
				,	row: e.rowIndex
				,	col: e.column.colId
				,	node : e.node
				,	cellEditor : e.colDef.cellEditor
				,	cellEditorParams : e.colDef.cellEditorParams
				,	oldValue : e.oldValue
				,	newValue : _newValue
			});
		}
	}

	doDisplayChange = (e) => {
		let gridDataset = e.gridDataset;

		for (let intA = 0; intA < gridDataset.length; intA ++) {
			if(e.data[this.treeHeaderMap.id] === gridDataset[intA][this.treeHeaderMap.id] && !e.isSub) {
				gridDataset[intA][this.treeHeaderMap.expand] = !gridDataset[intA][this.treeHeaderMap.expand];

			}
			if (gridDataset[intA][this.treeHeaderMap.parentId] !== '0') {
				if (gridDataset[intA][this.treeHeaderMap.parentId] === e.data[this.treeHeaderMap.id] ) {
					gridDataset[intA]['_display'] = !gridDataset[intA]['_display'];	
					if (gridDataset[intA][this.treeHeaderMap.level]) {
						gridDataset = this.doDisplayChange({gridDataset: gridDataset, data: gridDataset[intA], isSub: true});	
					}
				}
			}
		}		
		
		return gridDataset;
	}
	onActionCellClicked = (e) => {
		if (this.props.id === null || this.props.id === undefined) { return; }

		if (this.props.tree !== undefined && this.props.tree.isTree) {
			if (e.column.colId === '_HIERARCHY') {
				let gridDataset = this.gridDataset.getRecords();
				let newDataset = this.doDisplayChange({gridDataset: gridDataset, data: e.data, isSub: false});
				
				this.gridDataset.setRecords(newDataset);
				e.api.updateGridOptions({ rowData: this.getTreeData(this.gridDataset.getRecords().filter(item => item['rowtype'] !== newScrmObj.constants.crud.destroy)) });
			}
		}
		this.props.onActionCellClicked({ id : this.props.id, data : e.data, index : e.node.id, col : e.column.colId});
	};	
	onCellClicked = (e) => {
		if (this.props.id === null || this.props.id === undefined) { return; }

		if (this.props.tree !== undefined && this.props.tree.isTree) {
			if (e.column.colId === '_HIERARCHY') {
				let gridDataset = this.gridDataset.getRecords();
				let newDataset = this.doDisplayChange({gridDataset: gridDataset, data: e.data, isSub: false});
				
				this.gridDataset.setRecords(newDataset);
				e.api.updateGridOptions({ rowData: this.getTreeData(this.gridDataset.getRecords().filter(item => item['rowtype'] !== newScrmObj.constants.crud.destroy)) });
			}
		}
		this.props.onCellClicked({ id : this.props.id, data : e.data, index : e.node.id, col : e.column.colId});
	};
	onCellDoubleClicked = (e) => {
		if (this.props.id === null || this.props.id === undefined) { return; }
		this.props.onCellDoubleClicked({ id : this.props.id, data : e.data, index : e.node.id, col : e.column.colId});
	};
	onCellFocused = (e) => {
		if (this.props.id === null || this.props.id === undefined) { return; }
		this.props.onCellFocused({ id : this.props.id, data : e.data, index : e.node.id });
	};
	onRowClicked = (e) => {
		if (this.props.id === null || this.props.id === undefined) { return; }
		this.props.onRowClicked({ id : this.props.id, data : e.data, index : e.node.id });
	};
	onRowDoubleClicked = (e) => {
		if (this.props.id === null || this.props.id === undefined) { return; }
		this.props.onRowDoubleClicked({ id : this.props.id, data : e.data, index : e.node.id });
	};
	onCellEditingStopped = (e) => {
		if (this.props.id === null || this.props.id === undefined) { return; }
		this.props.onCellEditingStopped({ id : this.props.id, data : e.data, index : e.node.id });
	};
	onRowDataChanged = (e) => { 
		// 컬럼 자동 조정 - autoFitMode props에 따라 결정
		if (this.state.gridApi !== undefined && this.state.gridApi !== null && Object.keys(this.state.gridApi).length !== 0) {
			if(this.props.data && this.props.data.getRecords && typeof this.props.data.getRecords === 'function' && this.props.data.getRecords().length > 0) {
				if (this.props.autoFitMode) {
					e.api.sizeColumnsToFit();
				}
			}
		}
	};
	onSelectionChanged = (e) => {
		if (this.props.id === null || this.props.id === undefined) { return; }
		this.props.onSelectionChanged({ id : this.props.id, gridApi : e.api, columnApi : e.columnApi, event : e});
	};
	onRowSelected = (e) => {
		if (this.props.id === null || this.props.id === undefined) { return; }
		this.props.onRowSelected({ id : this.props.id, data : e.data, index : e.node.id, event : e});
	}
	onSortChanged = (e) => {
		if (this.props.rowNum) {
			e.api.refreshCells({ columns : ['_No'] });
		}
	}
	onColumnGroupOpened = (e) => {
		this.props.onColumnGroupOpened({ id : this.props.id , gridApi : e.api, columnApi : e.columnApi, extended : e.columnGroup.expanded});
	}
	findRowToMove =(e) => {
		let rtnArr  = [];
		let display = false;

		if (!e.isSub) {
			if (e.parentID === "0") {
				display = true;
			} else {
				for(let i = 0; i < e.org.length; i ++) {
					if (e.org[i][this.treeHeaderMap.parentId] === e.parentID) {
						display = e.org[i]["_display"];
						break;
					}
				}
			}
		}

		for (let i = 0; i < e.target.length; i ++) {
			let temp;
			if (!e.isSub) {
				temp = ComLib.structuredClone(e.target[i]["data"]);
			} else {
				temp = ComLib.structuredClone(e.target[i]);	
			}
			temp[this.treeHeaderMap.level] = e.parentLV + 1;
			if (!e.isSub) {
				temp[this.treeHeaderMap.pareantId] = e.parentID;
				display = (temp["_display"] && display);
			} else {
				display = (e.parnetOpen && temp['_display']);	
			}
			temp["_display"]  = display;
			if (temp['rowtype'] !== newScrmObj.constants.crud.create) {
				if (temp['rowtype'] === newScrmObj.constants.crud.read) {
					temp['rowtype'] = newScrmObj.constants.crud.update;
				}
			}
			let temp2 = [];
			for(let j = 0; j < e.org.length; j ++) {
				if (e.org[j][this.treeHeaderMap.pareantId] === temp[this.treeHeaderMap.id]) {
					let needToMove = this.findRowToMove({org: e.org, target : [e.org[j]], parentLV: temp[this.treeHeaderMap.level], parentID: temp[this.treeHeaderMap.id], isSub: true, parnetOpen: (display && e.org[j]['_display'])});
					for(let k = 0; k < needToMove.length; k ++) {
						temp2.push(needToMove[k])
					}
				}
			}
			if (temp2.length > 0) {
				temp[this.treeHeaderMap.level]  = temp2[0]['_display'];
				rtnArr.push(temp)

				for(let k = 0; k < temp2.length; k ++) {
					rtnArr.push(temp2[k])
				}
			} else {
				rtnArr.push(temp)
			}
		}
		return rtnArr;
	}

	makeTreeData = (data) => {
		let rtnVal = data;
		if (this.props.tree.isTree) {
			if ( this.props.tree.stndCol && this.props.tree.stndCol.length > 0 ) {
				for ( let intA = 0; intA < rtnVal.length; intA++ ) {
					if (rtnVal[intA]['_display'] === undefined) {
						if (this.props.tree.open) {
							rtnVal[intA]['_display'] = true;
							rtnVal[intA][this.treeHeaderMap.expand] = true;
						} else {
							if (rtnVal[intA][this.treeHeaderMap.level] !== 1) {
								rtnVal[intA]['_display'] = false;
								rtnVal[intA][this.treeHeaderMap.expand] = false;
							} else {
								rtnVal[intA]['_display'] = true;
								rtnVal[intA][this.treeHeaderMap.expand] = false;
							}
						}
						let childCnt = 0;

						for (let intB = 0; intB < rtnVal.length; intB++) {
							if (rtnVal[intB][this.treeHeaderMap.parentId] === rtnVal[intA][this.treeHeaderMap.id]) {
								childCnt += 1;
								
							}
						}
						rtnVal[intA]['childCNT'] = childCnt;
					}
				}
			}
		}
		return rtnVal;
	};

	getTreeData = (data) => {
		let rtnVal = [];
		for (let intA = 0; intA < data.length; intA++ ) {
			if (data[intA][this.treeHeaderMap.level] > 1) {
				if (data[intA]['_display']) {
					if ( data.filter(item => item[this.treeHeaderMap.id] === data[intA][this.treeHeaderMap.parentId] && item['_display'] === true).length > 0) {
						rtnVal.push(data[intA]);
					}
				}
			} else {
				rtnVal.push(data[intA]);
			}
		}
		return rtnVal;
	};

	setTreeOrder = (records, needTomove, parentID) => {
		let changed = [];

		if (needTomove[0][this.treeHeaderMap.parentId] === "0") {
			for(let j = 0; j < needTomove.length; j ++) {
				changed.push(needTomove[j]);
			}
		}

		for(let i = 0; i < records.length; i ++) {
			if (parentID === records[i][this.treeHeaderMap.id]) {
				changed.push(records[i]);

				for(let j = 0; j < needTomove.length; j ++) {
					changed.push(needTomove[j]);
				}

			} else if (parentID !== records[i][this.treeHeaderMap.id]) {
				let isMoved = false;
				
				for(let j = 0; j < needTomove.length; j ++) {
					if (records[i][this.treeHeaderMap.id] === needTomove[j][this.treeHeaderMap.id]) {
						isMoved = true;

						break;
					}
				}

				if (!isMoved) {
					changed.push(records[i]);
				}
			} 
		}
		
		for(let i = 0; i < changed.length; i ++) {
			let cnt = 0;
			for(let j = 0; j < changed.length; j ++) {
				if (changed[i][this.treeHeaderMap.id] === changed[j][this.treeHeaderMap.parentId]) {
					cnt += 1;
				}
			}
			changed[i]['childCNT'] = cnt;
		}

		return changed;
	};

	onRowDragEnd = (e) => {
		let gridData = this.gridDataset.getRecords();
		if (this.props.tree !== undefined && this.props.tree.isTree) {
			let standardNode =  (e.overIndex !== -1) ? ((e.overNode.rowIndex > 0 ) ? e.api.getDisplayedRowAtIndex(e.overNode.rowIndex - 1) : '') : '';
				
			let parentLV = standardNode === '' ? 0 : standardNode.data[this.treeHeaderMap.level];
			let parentID = standardNode === '' ? "0" : standardNode.data[this.treeHeaderMap.id];

			const records = ComLib.structuredClone(gridData);
				
			let needTomove = this.findRowToMove ({org: records, target: e.nodes, parentLV: parentLV, parentID: parentID, isSub: false})
		
			let changed = this.setTreeOrder(records, needTomove, parentID);

			for(let i = 0; i < changed.length; i ++) {
				Object.assign(gridData.filter(item => item['rowtype'] !== newScrmObj.constants.crud.destroy)[i], changed[i]);
			}
		} else {
			e.api.forEachNode((node, index) => {
				if (node['data']['rowtype'] !== newScrmObj.constants.crud.create) {
					if (node['data']['rowtype'] === newScrmObj.constants.crud.read) {
						if (node['rowIndex'] !== Number(node['id'])) {
							node['data']['rowtype'] = newScrmObj.constants.crud.update;
							
						}
					}
				}
				Object.assign(gridData.filter(item => item['rowtype'] !== newScrmObj.constants.crud.destroy)[index], node['data']);
			});
		}
		
	
		if (this.gridDataset.orgrecords.length > 0) {
			this.gridDataset.orgrecords.forEach(
				(item, index) => {
					for (let intA=0; intA < gridData.length; intA++) {
						if (item['recid'] === gridData[intA]['recid']) {
							if (gridData[intA]['rowtype'] === newScrmObj.constants.crud.update) {
								if (intA === index) {
									// 두 json 데이터 비교 (row type 비교)
									let tmpGrdData = ComLib.structuredClone(gridData[intA]);
									let tmpOrgData = ComLib.structuredClone(item);

									delete tmpGrdData.rowtype;
									delete tmpOrgData.rowtype;

									if (JSON.stringify(tmpGrdData) === JSON.stringify(tmpOrgData)) {
										gridData[intA]['rowtype'] = newScrmObj.constants.crud.read;
									}
								}
							}
						}
					}
				}
			)
		}

		this.gridDataset.setRecords(gridData);

		// // 데이터 재 배열 후, grid 재 셋팅
		if (this.props.tree !== undefined && this.props.tree.isTree) {
			e.api.updateGridOptions({ rowData: this.getTreeData(gridData.filter(item => item['rowtype'] !== newScrmObj.constants.crud.destroy)) });

		} else {
			e.api.redrawRows();
		}

		this.props.onRowDragEnd({ id : this.props.id, data : gridData,  dragData : e.nodes});
	}

	/* Method Zone */
	doFilter = (value) => {
		this.state.gridApi.updateGridOptions({ quickFilterText: value });
	};
	getSelectedRowIndex = () => {
		if (this.state.gridApi.getSelectedNodes().length === 0) {
			return null;
		}
		return Number(this.state.gridApi.getSelectedNodes()[0].rowIndex);
	};
	getSelectedRows = () => {
		if (this.state.gridApi.getSelectedRows().length === 0) {
			return [];
		}
		return this.state.gridApi.getSelectedRows();
	};
	getDeSelectedRows = () => {
		let deSelectRows = [];
		this.state.gridApi.forEachNode((node, index) => {  
			if (!node.isSelected()) deSelectRows.push(node.data);
		});
		return deSelectRows;
	};
	editStart = (row, col) => {
		this.state.gridApi.setFocusedCell(row, col);
		this.state.gridApi.startEditingCell({ rowIndex : row, colKey : col});
	};
	autoSizeFit = () => {
		this.state.gridApi.sizeColumnsToFit();
	};

	addGridRow = () => {
		let rtnJson = this.props.onBeforeInsertRow({ id : this.props.id });

		if (rtnJson['rtn'] !== false) rtnJson['rtn'] = true;

		if (rtnJson['rtn']) {
			let index = this.gridDataset.length;
			if (typeof rtnJson['index'] !== 'number') {
				index = (this.props.infinite) ? this.gridDataset.addRow(0) : this.gridDataset.addRow();
			} else {
				index = (this.props.infinite) ? this.gridDataset.addRow(0) : this.gridDataset.addRow(rtnJson['index']);
			}

			if (this.props.header.filter(item => StrLib.isNull(item['defaultValue']) === false).map((ele) => { return { colId : ele['colId'], value : ele['defaultValue']}}).length > 0) {
				this.props.header.filter(item => StrLib.isNull(item['defaultValue']) === false).map((ele) => { return { colId : ele['colId'], value : ele['defaultValue']}}).forEach(element => {
					this.gridDataset.setValue(index, element['colId'], element['value']);
				});
			}
			this.state.gridApi.updateGridOptions({ rowData: this.gridDataset.getRecords().filter(item => item['rowtype'] !== newScrmObj.constants.crud.destroy) });
			this.moveRow(index, true);

			if (this.props.id === null || this.props.id === undefined) { return; }
			this.props.onInsertRow({ 
					id : this.props.id
				,	data : this.gridDataset.getRecords().filter(item => item['rowtype'] !== newScrmObj.constants.crud.destroy)
				,	insertData : this.gridDataset.getRow(index)
				,	index : index
			});
		}
	};

	delGridRow = () => {
		if (this.state.gridApi.getSelectedNodes().length === 0) {
			ComLib.openDialog('A', 'SYSI0010', ['선택된 행이 없습니다.']);
		} else {
			let rtn = this.props.onBeforeDeleteRow({  id : this.props.id });
			if (rtn !== false) rtn = true;

			if (rtn) {
				let index = this.state.gridApi.getSelectedNodes()[this.state.gridApi.getSelectedNodes().length-1]['rowIndex'];
				let lstRecid = this.state.gridApi.getSelectedNodes()[this.state.gridApi.getSelectedNodes().length-1]['data']['recid'];
				let deleteData = this.state.gridApi.getSelectedNodes().map(item => item['data']);
				let rtnVal = this.gridDataset.getRecords();


				for (let intA = 0; intA < rtnVal.filter(item => item['rowtype'] !== newScrmObj.constants.crud.destroy).length; intA++) {
					for (let intB = 0; intB < this.state.gridApi.getSelectedNodes().length; intB++) {
						if (intA === this.state.gridApi.getSelectedNodes()[intB]['rowIndex']) {
							if (rtnVal.filter(item => item['rowtype'] !== newScrmObj.constants.crud.destroy)[intA]['rowtype'] === newScrmObj.constants.crud.create) {
								rtnVal.filter(item => item['rowtype'] !== newScrmObj.constants.crud.destroy)[intA]['rowtype'] = newScrmObj.constants.crud.remove;
							} else {
								ComLib.openDialog('A', 'SYSI0010', ['신규 행만 삭제가 가능합니다.']);
								return;
							}
						}
					}
				}
				this.gridDataset.setRecords(rtnVal.filter(item => item['rowtype'] !== newScrmObj.constants.crud.remove));
				this.state.gridApi.updateGridOptions({ rowData: this.gridDataset.getRecords().filter(item => item['rowtype'] !== newScrmObj.constants.crud.destroy) });
				
				this.moveRow(index, true);

				if (this.props.id === null || this.props.id === undefined) { return; }
				this.props.onDeleteRow({
						id : this.props.id
					,	data : rtnVal.filter(item => item['rowtype'] !== newScrmObj.constants.crud.remove)
					,	deleteData : deleteData
					,	index : index
					,	lstRecid : lstRecid
				});
			}
		}
	};

	// @Deprecated
	// 사용하지 않아야하는 method
	setGridData = (data) => {
		if (data.length < 1) return;
		if (this.gridDataset.getRecords().length > 0) {
			this.gridDataset.initRecords(data);
			this.state.gridApi.updateGridOptions({ rowData: this.gridDataset.getRecords().filter(item => item['rowtype'] !== newScrmObj.constants.crud.destroy) });
		} else {
			this.gridDataset.appendRecords(data);
			this.state.gridApi.updateGridOptions({ rowData: this.gridDataset.getRecords().filter(item => item['rowtype'] !== newScrmObj.constants.crud.destroy) });
		}

	}
	
	downExcelData = () => {
		let exelData = [];
		this.state.gridApi.forEachNode((item) => {
			if (item['data']['rowtype'] !== newScrmObj.constants.crud.destroy)  {
				let data = item['data'];
				data['node'] = item;
				exelData.push(data);
			}
		});

		let lengthCheck = this.gridDataset.getRecords().filter(item => item['rowtype'] !== newScrmObj.constants.crud.create)

		if (this.props.infinite && this.props.totalRowCnt <= lengthCheck.length) {	
			ExcelLib.exportToExcel(setGridHeader(this.props.header, this.props), exelData, true, this.props.areaName);

		} else if (this.props.infinite) {
			this.props.onScrollEnd({ id : this.props.id, excelLoadAll: true});
		} else {
			ExcelLib.exportToExcel(setGridHeader(this.props.header, this.props), exelData, true, this.props.areaName);
		}
		// ExcelLib.exportToExcel(setGridHeader(this.props.header, this.props), this.gridDataset.getRecords().filter(item => item['rowtype'] !== newScrmObj.constants.crud.destroy), true, this.props.areaName);
		
	}

	moveRow = (index, selected) => {
		let data, rtnNode;
		this.state.gridApi.forEachNode((node, idx) => {if (idx === index) data = node;});

		if (data === undefined) {
			this.state.gridApi.forEachNode((node, idx) => {
				if (idx === (this.gridDataset.getRecords().filter(item => item['rowtype'] !== newScrmObj.constants.crud.destroy).length-1)) rtnNode = node;
			});
			if (rtnNode) {
				if (selected) {
					rtnNode.setSelected(true);
				}
				this.state.gridApi.ensureIndexVisible(rtnNode['rowIndex'], 'top');
			}
		} else {
			if (selected) data.setSelected(true);
			this.state.gridApi.ensureIndexVisible(index, 'top');
		}
	};
	undoCellEditng = () => {
		this.state.gridApi.undoCellEditing();
	}
	redoCellEditng = () => {
		this.state.gridApi.redoCellEditing();
	}
	setInfiniteGridData = (type) => {
		if (type === 'A') {
			// 인피니트 스크롤 데이터 추가
			this.pageDataset = this.props.data.records;
			this.propDataset = this.propDataset.concat(ComLib.structuredClone(this.pageDataset));
			
			// appendRecords를 사용하여 기존 데이터에 추가
			console.log('setInfiniteGridData(A) - Before appendRecords:', {
				gridDatasetLength: this.gridDataset.getRecords().length,
				newDataLength: this.props.data.getRecords().length
			});
			
			this.gridDataset.appendRecords(this.props.data.getRecords());
			
			console.log('setInfiniteGridData(A) - After appendRecords:', {
				gridDatasetLength: this.gridDataset.getRecords().length
			});
			
			const filteredData = this.gridDataset.getRecords().filter(item => item['rowtype'] !== newScrmObj.constants.crud.destroy);
			console.log('setInfiniteGridData(A) - Setting grid data:', {
				totalRecords: this.gridDataset.getRecords().length,
				filteredRecords: filteredData.length,
				firstRecord: filteredData[0],
				lastRecord: filteredData[filteredData.length - 1]
			});
			
			this.state.gridApi.updateGridOptions({ rowData: filteredData });
			
			// 강제로 그리드 새로고침
			setTimeout(() => {
				if (this.state.gridApi) {
					this.state.gridApi.refreshCells();
					console.log('Grid refreshed - Final row count:', this.state.gridApi.getDisplayedRowCount());
				}
			}, 10);
		} else {
			// 첫 페이지 또는 리셋
			this.propDataset = this.props.data.records;
			this.pageDataset = this.props.data.records;
			this.gridDataset.initRecords(this.props.data.getRecords());
			this.state.gridApi.updateGridOptions({ rowData: this.gridDataset.getRecords().filter(item => item['rowtype'] !== newScrmObj.constants.crud.destroy) });
			this.state.gridApi.ensureIndexVisible(0, 'top');
		}
	}
	render () {
		return (
			<React.Fragment>
				<div className= {"ag-theme-alpine"} style={ {width:'100%', height: this.props.height} }>
					<AgGridReact 
						onGridReady={this.onGridReady}
						alwaysShowVerticalScroll = { false }
						frameworkComponents = {{
							agDateColumnFilter : DateComponent,
							rangeDate : RangeDateComponent,
							rangeTime : RangeTimeComponent,
							time : TimeComponent,
							checkbox: CheckboxRenderer,
							selectbox : SelectboxRenderer,
							delButton : DelRowButton,
							customEditor : CustomEditor,
							actionButton : ActionButton,							
							customTooltip: CustomToolTip,
						}}
						tooltipShowDelay={0}

						// cellRender 전용 추후 컴토후 컴포넌트화
						// domLayout = {'autoHeight'}
						components = { this.props.components }
						context = {{ componentParent : this }}
						suppressMovableColumns = {this.props.suppressMovableColumns}
						multiSortKey = {'ctrl'}
						headerHeight = {30}
						rowHeight = {30}
						defaultColDef = {{ 
								resizable: true
							,	sortable : this.props.sort
							,	editable : false
							,	filter : this.props.filter
							,	floatingFilter: this.props.floatingFilter
							,   headerClass: this.props.className
						}}
						// row drag props
						rowDragManaged = {this.props.rowDrag}
						enableMultiRowDragging = {true}


						suppressDragLeaveHidesColumns={true}
						suppressRowClickSelection = {this.props.suppressRowClickSelection}
						suppressRowDeselection = {(this.props.suppressRowDeselection) ? this.props.suppressRowDeselection : false}
						stopEditingWhenGridLosesFocus = {true}

						columnDefs = { setGridHeader(this.props.header, this.props) }
						rowBuffer = {100}

						undoRedoCellEditing = {true}
						enableCellChangeFlash = {false}
						undoRedoCellEditingLimit = {10}
						
						localeText = {{noRowsToShow: '조회된 결과가 존재하지 않습니다.'}}
						rowSelection= {this.props.rowSelection}
						colResizeDefault= {'shift'}

						// 로우 스판
						suppressRowTransform={checkHeaderProp(this.props.header, 'rowSpan')}
						// 로우 스크롤 시, 신규 데이터에 대한 Scroll Top이동을 막을 건지 설정
						suppressScrollOnNewData={this.props.doNotScrollTop || this.props.infinite}


						// event
						onRowClicked         = {this.onRowClicked}
						onActionCellClicked  = {this.onActionCellClicked}
						onCellClicked        = {this.onCellClicked}
						onCellDoubleClicked  = {this.onCellDoubleClicked}
						onCellValueChanged   = {this.onCellValueChanged}
						onCellEditingStopped = {this.onCellEditingStopped}
						onRowDataChanged     = {this.onRowDataChanged}
						onSelectionChanged   = {this.onSelectionChanged}
						onRowSelected        = {this.onRowSelected}
						onBodyScroll         = {this.onBodyScroll}
						onRowDataUpdated     = {this.onRowDataUpdated}
						onSortChanged        = {this.onSortChanged}
						onRowDragEnd         = {this.onRowDragEnd}
						onRowDoubleClicked   = {this.onRowDoubleClicked}
						onColumnResized      = {this.onColumnResized}
						onColumnGroupOpened  = {this.onColumnGroupOpened}

						rowMultiSelectWithClick = {true}

						columnTypes={columnTypes}
						
						getRowStyle={this.props.getRowStyle} // 행 스타일 적용
					/>
				</div>
				{	(this.props.noName && !this.props.addRowBtn && !this.props.delRowBtn && !this.props.dnlExcelBtn) ?
						null
					:	<div style={{width:'100%', height : '30px', borderBottom: '1px solid var(--line-surface-alt)', display:this.props.infinite && this.props.totalRowCnt > 0 ? 'block' : 'none'}}>
							<LFloatArea>
								{
									(this.props.noName) 
									?
									null 
									:	
									<LFloatArea>
										<div className = "scrm-component-panel-namearea" style={{display:'none'}}>
											<span> {(this.props.areaName) ? this.props.areaName : '그리드'} </span>
										</div>
									</LFloatArea>
								}
								{
									(this.props.infinite && this.props.totalRowCnt > 0 && !this.props.noCntDsply) 
									?
									<LFloatArea>
										<div className = "scrm-component-panel-namearea">									 
											<span>&nbsp;전체&nbsp;:&nbsp;{this.props.totalRowCnt}&nbsp;건</span>
										</div>
									</LFloatArea>
									:
									null

								}
							</LFloatArea>
							<RFloatArea style={{display:'none'}}>
								{/* <button className="scrm-btn xs grey-o i"onClick={this.undoCellEditng}><i className="xi-undo"/></button>
								<button className="scrm-btn xs grey-o i"onClick={this.redoCellEditng}><i className="xi-redo"/></button> */}
								{(this.props.addRowBtn) ? <Button onClick={this.addGridRow} size="xs" innerImage={true} icon = {'add'} ml="5px" tooltip={"추가"}/> : null}
								{(this.props.delRowBtn) ? <Button onClick={this.delGridRow} size="xs" innerImage={true} icon = {'del'} ml="5px" tooltip={"삭제"}/> : null}
								{(this.props.dnlExcelBtn) ? <Button onClick={this.downExcelData} size="xs" innerImage={true} icon = {'save'} ml="5px" tooltip={"엑셀다운로드"}/> : null}
							</RFloatArea>
						</div>
				}

			</React.Fragment>
			
		)
	}
}
export default Grid;