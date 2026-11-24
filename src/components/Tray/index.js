import React from 'react';
import {IconButton, LFloatArea} from 'components';

class TrayDiv extends React.Component {
  constructor(props)  {
		super(props);
		this.state = {
		}
	}
	selectMenu = (props) => {
		this.props.data.forEach((key, i) => {
			if (props.menuId === key.menuId) {
				if (document.getElementById(props.menuId) !== null) {
					document.getElementById(props.menuId).style.display = 'block';
					// tray selected 변경 처리
					this.props.onSelect(props);
				}
			} else {
				if (document.getElementById(key.menuId) !== null && document.getElementById(key.menuId) !== undefined) {
					document.getElementById(key.menuId).style.display = 'none';
				}
			}
		});
	}

	removeMenu = (props) => { this.props.onClose(props);}

	render () {
		return (
			<React.Fragment>
				<LFloatArea>
					<div className={'scrm-tray-div ' + (this.props.className || '') } id = {this.props.id} style={{...this.props.style}}>
						<ul id = { '_ul' + this.props.id}>
							{
								this.props.data.map((item, key) => {
									// this.props.selected가 없으면 선택되지 않은 상태로 처리
									const selectedMenuId = this.props.selected ? this.props.selected.menuId : null;
									
									return (
										<li className = {(item.menuId === selectedMenuId) ? 'scrm-tray-div-li-selected' : null}
											key={'scrm-tray-div' + key} id={'tray_li_' + item.menuId} onClick={(e) => { this.selectMenu(item)}}
										>
											<div className='scrm-tray-div-li-div' id={'tray_div_item_' + item.menuId}>{item.menuNm}</div>

											{item.closeable !== false? <button className='scrm-tray-div-btn-close' onClick={(e) => {e.stopPropagation(); this.removeMenu(item)}}></button> : <span style={{width: '12px'}}></span>}	

										</li>
									)
								})
							}
						</ul>
					</div>
				</LFloatArea>
			</React.Fragment>
		)
	}
}

export {TrayDiv};