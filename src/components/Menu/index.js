import React from 'react';
import ReactDOM from 'react-dom';
import {StrLib} from 'common';
import { Link } from 'react-router-dom';
class HeaderMenu extends React.Component {
	constructor(props)  {
		super(props);
		this.state = {
			open : false
		}
	}
	componentDidMount() {
		document.addEventListener('click', this.handleClickOutside, true);
	}
	componentWillUnmount() {
		document.removeEventListener('click', this.handleClickOutside, true);
	}
	handleClickOutside = (e) => {
		const domNode = ReactDOM.findDOMNode(this);
		if ( !domNode || !domNode.contains(e.target) ) this.closeMenuList();
	}
	closeMenuList = () => { this.setState({...this.state, open : false});}
	setMenuDivOpen = () => { this.setState({...this.state, open : !this.state.open});}
	render () {
		return (
			<React.Fragment>
				<div className="scrm-header-menu-container">
					<ul className="scrm-header-menu-ul">
						{
							this.props.menu.filter(item => StrLib.isNull(item.upMenuId) ).map((item, key) => {
								return <li className="scrm-header-menu-li" key={'menu_' + key} onClick={this.setMenuDivOpen}>{item.menuNm}</li>
							})
						}
					</ul>
				</div>
				<div id="_scrm_menu_area" className= {(this.state.open) ? "scrm-header-menu-active" : "scrm-header-menu-nested"}>
						<ul className="scrm-header-menu-ul">
							{
								this.props.menu.filter(item => StrLib.isNull(item.upMenuId)).map((item, key) => {
									return (
										<li className="scrm-header-menu-li" key={'div_menu_' + key} onClick={this.closeMenuList}>
											<ul className="scrm-header-submenu-ul">
												{
													this.props.menu.filter(menu => menu.upMenuId === item.menuId).map((subMenu, subKey) => {
														return <li  className="scrm-header-submenu-li" key={'submenu_' + subKey} id={'subMenu_' + subMenu.menuId}
																	onClick = {
																		(e) => {
																			this.props.openMenu(subMenu);
																			this.setState({...this.state, open : false});
																		}
																	}
																> {subMenu.menuNm} </li>;
													})
												}
											</ul>
										</li>
									);
								})
							}
						</ul>
					</div>
			</React.Fragment>
		)
	}
}
class Menu extends React.Component {
	onClick = () => {

	}
	setMenuOpen = (e) => {
		if (e.target.nextSibling.style.display === 'none' || e.target.nextSibling.style.display.length === 0) {
			e.target.nextSibling.style.display = 'block';
		} else {
			e.target.nextSibling.style.display = 'none';
		};
	}
	setMenuConfig = (data) => {
		let rtnUpMenu = [];
		data.map((item) => {
			if (item.upMenuId === null || item.upMenuId === '') {
				item = {...item, subMenuYn: 'N'};
				rtnUpMenu.push(item);
			} else {
				rtnUpMenu.map((arrJson) => {
					if (arrJson.menuId === item.upMenuId) {
						arrJson.subMenuYn = 'Y';
					}
					return arrJson;
				});
			}
		});
		return (
			rtnUpMenu.map((json, i) => {
				if (json.subMenuYn === 'N') {
					if (json.menuId === 'BASE') {
						return (
							<li key={'up_menu_li_' + i}>
								 <Link style={{ textDecoration: 'none', color: '#000000'}} to= {'/' + json.menuId }>
									<div className='scrm-menu-side-li-div'>{json.menuNm}</div>
								</Link>
							</li>
						);
					} else {
						return (
							<li key={'up_menu_li_' + i}>
								<div className='scrm-menu-side-li-div' onClick={this.setMenuOpen}> {json.menuNm} </div>
							</li>
						);
					}
				} else {
					return (
						<li key={'up_menu_li_' + i}>
							<div>
								<div className='scrm-menu-side-li-div' onClick={this.setMenuOpen}>{json.menuNm}</div>
								<div className='scrm-menu-side-li-div-hide'>
									<ul key = {'sub_menu_ul' + i} >
									{
										data.map((menu, index) => {
											if (menu.upMenuId === json.menuId) {
												return (
													<li key={'sub_mnu_li' + index}>
														<Link style={{ textDecoration: 'none', color: '#000000'}} to={menu.urlAddr}>
															<div className='scrm-menu-side-li-div' >{menu.menuNm}</div>
														</Link>
													</li>
												);
											}
										})
									}
									</ul>
								</div>
							</div>
						</li>
					);
				 }
			})
		);
	}
	render () {
		return (
			<nav className='scrm-menu-side'>
				<ul>
					{ this.setMenuConfig(this.props.data) }
				</ul>
			</nav>
		);
	}
}

export {Menu, HeaderMenu};