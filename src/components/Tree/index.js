import React from 'react';
import ReactDOM from 'react-dom';
import {LFloatArea, RFloatArea, Textfield, Label, RelativeGroup, FlexPanel } from 'components';
import {TreeSelectbox} from './components';
import {ComLib, newScrmObj, DataLib} from 'common';

class Tree extends React.Component {
	constructor(props) {
		super(props);
		this.onChange = this.onChange.bind(this);	
		this.treeDataset = DataLib.datalist.getInstance();
		this.propDataset = [];
		this.defaultNode = null;
		this.initial     = true;
		this.titleField  = this.props.titleField || 'TITLE';
		this.parentField = this.props.parentField || 'PARENT_ID';
		this.idField = this.props.idField || 'ID';
		this.sortField = this.props.sortField || 'SORT_ORD';
		
		this.state = {
			treeData: [],
			expandedNodes: new Set(),
			selectedNode: null
		}
	}

	static defaultProps = {
		openAllonInitial : false,
		noName     : false,
		maxDepth   : 10,
		addToTop   : true,
		onChange      : () => {return;},
		onRowSelect   : () => {return;},
		onNodeClick   : () => {return;},
		onNodeDoubleClick : () => {return;},
	}	

	onChange = (treeData) => {
		let flatData = this.flattenTree(treeData);
		
		if (this.treeDataset !== flatData) {
			this.setState({treeData: treeData});
			this.treeDataset = flatData;
		}	
	}

	// 트리 데이터를 평면 배열로 변환
	flattenTree = (treeData, result = []) => {
		treeData.forEach(node => {
			result.push(node);
			if (node.children && node.children.length > 0) {
				this.flattenTree(node.children, result);
			}
		});
		return result;
	}

	// 평면 배열을 트리 구조로 변환
	buildTree = (flatData) => {
		const tree = [];
		const lookup = {};

		// 먼저 모든 노드를 lookup 객체에 저장
		flatData.forEach(node => {
			lookup[node.treeIndex] = { ...node, children: [] };
		});

		// 부모-자식 관계 설정
		flatData.forEach(node => {
			if (node.parent === 0) {
				tree.push(lookup[node.treeIndex]);
			} else if (lookup[node.parent]) {
				lookup[node.parent].children.push(lookup[node.treeIndex]);
			}
		});

		return tree;
	}

	// 노드 토글 (펼치기/접기)
	toggleNode = (nodeIndex) => {
		const newExpandedNodes = new Set(this.state.expandedNodes);
		if (newExpandedNodes.has(nodeIndex)) {
			newExpandedNodes.delete(nodeIndex);
		} else {
			newExpandedNodes.add(nodeIndex);
		}
		this.setState({ expandedNodes: newExpandedNodes });
	}

	// 노드 클릭 이벤트
	handleNodeClick = (node, e) => {
		// 이벤트 버블링 방지 (토글 버튼 클릭과 구분)
		e.stopPropagation();
		
		// 선택된 노드 상태 업데이트
		this.setState({ selectedNode: node.treeIndex });
		
		// 부모 컴포넌트에 콜백 호출
		if (typeof this.props.onNodeClick === 'function') {
			this.props.onNodeClick({
				id: this.props.id,
				node: node,
				data: node,
				event: e,
				// Tree의 idField에 해당하는 실제 ID 값 추가
				dataId: node[this.idField] || node.treeIndex
			});
		} else {
			console.warn('onNodeClick 콜백이 함수가 아닙니다:', this.props.onNodeClick);
		}
	}

	// 노드 더블클릭 이벤트 (하위 노드 펼치기/접기)
	handleNodeDoubleClick = (node, e) => {
		// 이벤트 버블링 방지
		e.stopPropagation();
		
		// 하위 노드가 있는 경우에만 토글
		const hasChildren = node.children && node.children.length > 0;
		if (hasChildren) {
			this.toggleNode(node.treeIndex);
		}
		
		// 부모 컴포넌트에 더블클릭 콜백 호출 (선택적)
		if (this.props.onNodeDoubleClick) {
			this.props.onNodeDoubleClick({
				id: this.props.id,
				node: node,
				data: node,
				event: e,
				hasChildren: hasChildren
			});
		}
	}

	// 트리 영역 클릭 시 선택 해제
	handleTreeAreaClick = (e) => {
		// 노드가 아닌 빈 영역을 클릭했을 때만 선택 해제
		if (e.target === e.currentTarget) {
			this.setState({ selectedNode: null });
		}
	}

	// 트리 노드 렌더링
	renderTreeNode = (node, depth = 0, path = []) => {
		if (node.rowtype === newScrmObj.constants.crud.destroy) {
			return null;
		}

		const hasChildren = node.children && node.children.length > 0;
		const isExpanded = this.state.expandedNodes.has(node.treeIndex);
		const isSelected = this.state.selectedNode === node.treeIndex;
		
		const nodeStyle = {
			padding: '4px 8px 4px 5px',
			paddingLeft: `${depth * 25}px`, /* 들여쓰기 폭을 25px로 확대하여 계층 구조를 명확히 함 */
			display: 'flex',
			alignItems: 'center',
			cursor: 'pointer',
			backgroundColor: isSelected ? '#f5f6f8' : 'transparent',
			transition: 'background-color 0.2s ease',
			userSelect: 'none',
			minHeight: '32px'
		};

		let nodeContent = [];

		// 펼치기/접기 버튼
		if (hasChildren) {
			nodeContent.push(
				<button 
					key="toggle"
					onClick={(e) => {
						e.stopPropagation();
						this.toggleNode(node.treeIndex);
					}}
					style={{ 
						background: 'none', 
						border: 'none', 
						cursor: 'pointer',
						marginRight: '0px',
						fontSize: '14px',
						padding: '0px',
						width: '24px', /* 아이콘 영역 고정 폭 */
						height: '24px',
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						marginLeft: '5px'
					}}
					className={'scrm-tree-button'}
				>
					{/* 아이콘은 CSS에서 ::before로 표시 */}
				</button>
			);
		} else {
			// 하위 노드(화면)일 경우 '>' 아이콘 표시
			nodeContent.push(
				<span 
					key="leaf-icon" 
					className="scrm-tree-leaf-icon"
					style={{ 
						width: '14px', 
						display: 'inline-flex', 
						alignItems: 'center', 
						justifyContent: 'center',
						fontSize: '12px',
						color: '#94A3B8'
					}}
				>
					{/* 아이콘은 CSS에서 ::before로 표시 */}
				</span>
			);
		}

		// 노드 title 표시 (title 속성이 있으면 사용, 없으면 기본 필드들 조합)
		let displayTitle = node[this.titleField] || '';

		// 제목 표시 (클릭/더블클릭 가능)
		nodeContent.push(
			<span 
				key="title" 
				className={'scrm-tree-title'}
				onClick={(e) => {
					this.handleNodeClick(node, e);
				}}
				onDoubleClick={(e) => this.handleNodeDoubleClick(node, e)}
				style={{ 
					fontSize: '14px', 
					color: isSelected ? 'var(--primary, #007acc)' : 'var(--font-800, #333)',
					fontWeight: hasChildren ? '500' : 'normal',
					flex: 1,
					padding: '0px 4px 2px',
					borderRadius: '4px',
					cursor: 'pointer'
				}}
				title={hasChildren ? "더블클릭하여 펼치기/접기" : ""}
			>
				{displayTitle || `노드 ${node.treeIndex}`}
			</span>
		);

		const currentPath = [...path, node.treeIndex];

		return (
			<div key={node.treeIndex} className={'scrm-tree-div ' + (isExpanded ? 'expanded ' : '') + (this.props.className || '') }>
				<div 
					className={'scrm-tree-node'}
					style={nodeStyle}
					data-depth={depth}
					onClick={(e) => {
						this.handleNodeClick(node, e);
					}}
					onDoubleClick={(e) => this.handleNodeDoubleClick(node, e)}
					title={hasChildren ? "더블클릭하여 펼치기/접기" : ""}
				>
					{nodeContent}
				</div>
				{hasChildren && isExpanded && (
					<div>
						{node.children.map(child => 
							this.renderTreeNode(child, depth + 1, currentPath)
						)}
					</div>
				)}
			</div>
		);
	}

	getMaxTreeIndex = () => {
		let maxIndex = 0;
		const checkNode = (node) => {
			if (node.treeIndex > maxIndex) {
				maxIndex = node.treeIndex;
			}
			if (node.children) {
				node.children.forEach(checkNode);
			}
		};
		this.state.treeData.forEach(checkNode);
		return maxIndex;
	}

	// Tree API 객체 설정
	setupTreeApi = () => {
		this.treeApi = {
			// 선택된 노드들을 반환하는 메서드
			getSelectedNodes: () => {
				if (this.state.selectedNode === null) {
					return [];
				}
				
				// 선택된 노드를 찾아서 반환
				const selectedNodeData = this.findNodeByTreeIndex(this.state.treeData, this.state.selectedNode);
				if (selectedNodeData) {
					return [{
						data: selectedNodeData,
						id: selectedNodeData.treeIndex,
						selected: true
					}];
				}
				return [];
			},

			// 트리 데이터를 설정하는 메서드
			setRowData: (data) => {
				if (!Array.isArray(data)) {
					console.warn('Tree setRowData - data is not an array:', data);
					return;
				}

				// 데이터를 propDataset에 설정하고 Tree 업데이트
				this.propDataset = data;
				
				let tempRecords = [...data];

				// treeIndex와 parent 설정
				for(let i = 0; i < tempRecords.length; i++) {
					tempRecords[i]['treeIndex'] = i + 1;
					tempRecords[i]['parent'] = 0;
					
					for (let j = 0; j < tempRecords.length; j++) {
						if (tempRecords[j][this.idField] === tempRecords[i][this.parentField]) {
							tempRecords[i]['parent'] = j + 1;
							break;
						}
					}
				}

				this.updateTreeData(true, tempRecords);
			},

			// 모든 노드 데이터를 반환하는 메서드
			forEachNode: (callback) => {
				const processNode = (node) => {
					callback({ data: node });
					if (node.children) {
						node.children.forEach(processNode);
					}
				};
				this.state.treeData.forEach(processNode);
			},

			// 선택된 노드를 설정하는 메서드
			setSelectedNodes: (nodeIds) => {
				if (Array.isArray(nodeIds) && nodeIds.length > 0) {
					this.setState({ selectedNode: nodeIds[0] });
				} else {
					this.setState({ selectedNode: null });
				}
			}
		};

		// onTreeReady 콜백 호출
		if (this.props.onTreeReady && typeof this.props.onTreeReady === 'function') {
			this.props.onTreeReady(this.treeApi);
		}
	}

	componentDidMount() {
		
		this.defaultNode = {};
		this.defaultNode[this.idField] = "";
		this.defaultNode[this.parentField] = "";
		this.defaultNode['BAS_PARENT_ID'] = "";
		this.defaultNode[this.sortField] = "";
		this.defaultNode['parent'] = 0;
		this.defaultNode['recid'] = 1;
		this.defaultNode['treeIndex'] = 1;
		this.defaultNode['rowtype'] = newScrmObj.constants.crud.create;
		
		// Tree API 객체 생성 및 onTreeReady 콜백 호출
		this.setupTreeApi();
		
		// 초기 데이터 처리 (componentDidUpdate와 동일한 로직)
		if (this.props.data && this.props.data.records) {
			this.propDataset = this.props.data.records;
			
			let tempRecords = this.propDataset;

			// tempRecords가 배열인지 확인
			if (!Array.isArray(tempRecords)) {
				console.log('Tree componentDidMount - tempRecords is not an array:', tempRecords);
				return;
			}

			// treeIndex와 parent 설정
			for(let i = 0; i < tempRecords.length; i++) {
				tempRecords[i]['treeIndex'] = i + 1;
				tempRecords[i]['parent'] = 0;
				
				for (let j = 0; j < tempRecords.length; j++) {
					if (tempRecords[j][this.idField] === tempRecords[i][this.parentField]) {
						tempRecords[i]['parent'] = j + 1;
						break;
					}
				}
			}


			if (this.props.openAllonInitial) {
				const expandedNodes = new Set();
				// 모든 노드 확장
				tempRecords.forEach(node => expandedNodes.add(node.treeIndex));
				this.setState({ expandedNodes });
			} 
			// else {
			// 	// 하위항목만 자동으로 열림 (다른 노드의 parent가 되는 노드)
			// 	tempRecords.forEach(node => {
			// 		// 이 노드가 다른 노드의 parent인지 확인
			// 		const hasChildren = tempRecords.some(otherNode => 
			// 			otherNode[this.parentField] === node[this.idField]
			// 		);
			// 		if (hasChildren) {
			// 			expandedNodes.add(node.treeIndex);
			// 		}
			// 	});
			// }

			this.updateTreeData(true, tempRecords);
		}
	}

	componentDidUpdate(prevProps) {
		
		// Tree API가 아직 설정되지 않았다면 설정
		if (!this.treeApi) {
			this.setupTreeApi();
		}
		
		if (!this.props.data || !this.props.data.records) {
			console.log('Tree componentDidUpdate - early return: no data or records');
			return;
		}
		
		if (this.props.data.records !== this.propDataset) {
			this.propDataset = this.props.data.records;
			
			let tempRecords = this.propDataset;

			// tempRecords가 배열인지 확인
			if (!Array.isArray(tempRecords)) {
				console.log('Tree componentDidUpdate - tempRecords is not an array:', tempRecords);
				return;
			}

			// treeIndex와 parent 설정
			for(let i = 0; i < tempRecords.length; i++) {
				tempRecords[i]['treeIndex'] = i + 1;
				tempRecords[i]['parent'] = 0;
				
				for (let j = 0; j < tempRecords.length; j++) {
					if (tempRecords[j][this.idField] === tempRecords[i][this.parentField]) {
						tempRecords[i]['parent'] = j + 1;
						break;
					}
				}
			}

			if (this.props.openAllonInitial) {
				// 모든 노드 확장
				const expandedNodes = new Set();
				tempRecords.forEach(node => expandedNodes.add(node.treeIndex));
				this.setState({ expandedNodes });
			}
			// else {
			// 	// 하위항목만 자동으로 열림 (자식이 있는 노드만)
			// 	tempRecords.forEach(node => {
			// 		if (node.children && node.children.length > 0) {
			// 			expandedNodes.add(node.treeIndex);
			// 		}
			// 	});
			// }
			this.updateTreeData(true, tempRecords);
		} else {
			console.log('Tree componentDidUpdate - records unchanged, skipping update');
		}
	}

	updateTreeData = (isFlatData, treeDataset) => {
		
		let treeDataState;

		if (treeDataset !== this.treeDataset) {
			// 배열인지 확인하고 안전하게 처리
			if (Array.isArray(treeDataset)) {
				if (isFlatData) {
					this.treeDataset = treeDataset.filter(item => item['rowtype'] !== newScrmObj.constants.crud.remove);
					treeDataState = this.buildTree(this.treeDataset);
				} else {
					this.treeDataset = treeDataset.filter(item => item['rowtype'] !== newScrmObj.constants.crud.remove);
					treeDataState = treeDataset;
				}
			} else {
				// 배열이 아닌 경우 빈 배열로 처리
				console.warn('Tree updateTreeData - treeDataset is not an array:', treeDataset);
				this.treeDataset = [];
				treeDataState = [];
			}

			this.setState({treeData: treeDataState});
			this.props.onChange({id: this.props.id, data: this.treeDataset});
		} else {
			console.log('Tree updateTreeData - dataset unchanged, skipping');
		}
	}

	datasetIndexOf = (column, value, records) => {
		if(records === undefined || records === null) {
			return -1;
		}

		for (var i = 0; i < records.length; i++) {
			if (records[i][column] === value) {
				return i;
			}
		}
		return -1;
	}

	findNodeByTreeIndex = (treeData, treeIndex) => {
		for (let node of treeData) {
			if (node.treeIndex === treeIndex) {
				return node;
			}
			if (node.children && node.children.length > 0) {
				const found = this.findNodeByTreeIndex(node.children, treeIndex);
				if (found) return found;
			}
		}
		return null;
	}

	updateNodeInTree = (treeData, treeIndex, updateFn) => {
		return treeData.map(node => {
			if (node.treeIndex === treeIndex) {
				return updateFn(node);
			}
			if (node.children && node.children.length > 0) {
				return {
					...node,
					children: this.updateNodeInTree(node.children, treeIndex, updateFn)
				};
			}
			return node;
		});
	}

	removeNodeFromTree = (treeData, treeIndex) => {
		return treeData.filter(node => {
			if (node.treeIndex === treeIndex) {
				return false;
			}
			if (node.children && node.children.length > 0) {
				node.children = this.removeNodeFromTree(node.children, treeIndex);
			}
			return true;
		});
	}

	event = {
		treeRow: {
			input: {
				onChange: (e) => {
					let target = e.target.id.substring(0, e.target.id.lastIndexOf("__"));
					let treeIndex = parseInt(target.substring(target.lastIndexOf("__") + 2));
					let column = target.substring(0, target.lastIndexOf("__"));
					
					const updatedTreeData = this.updateNodeInTree(this.state.treeData, treeIndex, (node) => ({
						...node,
						[column]: e.target.value
					}));

					this.updateTreeData(false, updatedTreeData);
				}
			},
		},
	}

	customPlaceholder = () => {
		if(!this || !this.props || !this.props.height){
			return '';
		}

		let height = (Number(this.props.height.substring(0, this.props.height.length - 2)) - 100) + 'px';

		return (
			<div style={{width: '100%', height: height, textAlign: 'center'}}>
				<div style={{display: 'inline-block', position: 'relative', top: '40%'}}>
					조회된 결과가 존재하지 않습니다.
				</div>
			</div>
		);
	}

	render() {
		return (
			<React.Fragment>
				<div id={this.props.id} className={'ag-theme-alpine ' + (this.props.className || '') } style={{
					width:'100%', 					
					borderRadius: '0.5em'
				}}>
					<div 
						style={{
							width:'100%', 
							height: this.props.height,
							overflow: 'auto',
							// backgroundColor: 'white'
						}}
						onClick={this.handleTreeAreaClick}
					>
						{this.state.treeData.length > 0 ? 
							this.state.treeData.map(node => this.renderTreeNode(node))
							: this.customPlaceholder()
						}
					</div>
				</div>
			</React.Fragment>
		);
	}
}

export default Tree;



	