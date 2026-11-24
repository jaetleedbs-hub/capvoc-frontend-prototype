import React from 'react';

class Table extends React.Component {
	setColGroup = (colGrp) => {
		if (colGrp === undefined) {
			return null;
		} else {
			if (colGrp.length === 0) {
				return null;
			}  else {
				return colGrp.map((colGrp, index) => {
					return (<col key={'col_' + index} style={{width: colGrp.width}}></col>)
				});
			}
		}
	}
	setBody = (body) => {
		if (body === undefined)  {
			return null;
		} else {
			return this.setRow(body);
		}
	}
	setRow = (rowArray) => {
		return rowArray.map((colArray, index) => {
			return (<tr key={'tr_' + index}>{this.setColumn(colArray)}</tr>)
		});
		
	}
	setColumn = (colArray) => {
		return colArray.map((colJson, index) => {
			// className과 required 속성 처리
			let className = '';
			if (colJson.type === 'T') {
				className = 'scrm-table-th';
				if (colJson.className) {
					className += ' ' + colJson.className;
				}
				if (colJson.required) {
					className += ' req';
				}
			} else {
				className = 'scrm-table-td';
				if (colJson.className) {
					className += ' ' + colJson.className;
				}
			}
			
			return (
			  (colJson.type === 'T') ?  <th className={className} key={'cobody_' + index} colSpan = {colJson.colSpan} rowSpan = {colJson.rowSpan}><span>{colJson.value}</span></th>
									 :  <td className={className} key={'cobody_' + index} colSpan = {colJson.colSpan} rowSpan = {colJson.rowSpan}>{colJson.value}</td>
			)
		});
	}
	render () {
		return (
			<table className = {'scrm-table ' + (this.props.className || '') } id = {this.props.id} style={{width: this.props.width, ...this.props.style}}>
				<colgroup>
					{ this.setColGroup(this.props.colGrp) }
				</colgroup>
				{ (this.props.head === null || this.props.head === undefined) ? <thead>{this.props.head}</thead> : <thead/> }
				<tbody>
					{ this.setBody(this.props.tbData) }
				</tbody>
				{ (this.props.footer === null || this.props.footer === undefined) ? <tfoot>{this.props.footer}</tfoot> : <tfoot></tfoot> }
			</table>
		);
	}
}
export default Table;