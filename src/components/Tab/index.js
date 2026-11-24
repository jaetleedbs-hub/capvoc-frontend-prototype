import React from 'react';
import PropTypes from 'prop-types';


class Tabs extends React.Component {
	static propTypes = {
		onClick : PropTypes.func.isRequired,
	}
	constructor(props) {
		super(props);

		if(!this.props || !this.props.children) {
			
		} else {
			const children = React.Children.toArray(this.props.children);

			let activeChildren = children.filter(child => child.props.display !== 'none') || [];

			this.state = { 
				active: (activeChildren.length === 0) 
						? 0 
						: activeChildren[0].props.index || 0 };
		}
	}
	static defaultProps = {
		onClick : () => {}
	}
	onClickTab = (index) => {
		this.setState({ active: index });
		this.props.onClick(index);
	}
	render () {
		return (
			<React.Fragment>
				<div className={'scrm-tabs-div ' + (this.props.className || '') }>
					<ul className ='scrm-tabs-ul'>
						{
							React.Children.toArray(this.props.children).filter(child => child.props.display !== 'none').map((tab) => {
									return (
										<Tab id={this.props.id} tabWidth= {this.props.tabWidth} active ={this.state.active} key ={tab.props.index} index= {tab.props.index} label = {tab.props.label} onClick = {this.onClickTab}/>
									)
							})

						}
					</ul>
				</div>
				<div className={'scrm-tab-container ' + (this.props.className || '') } style={{height: this.props.height}}>
					{   
						React.Children.toArray(this.props.children).filter(child => child.props.display !== 'none').map((child) => {
							return (
								<div key={child.props.index} style={{
									display: child.props.index === this.state.active ? 'block' : 'none',
									height: '100%'
								}}>
									{child.props.children}
								</div>
							);
						})
					}
				</div>
			</React.Fragment>
		);
	}
} 
class Tab extends React.Component {
	static propTypes = {
		active: PropTypes.number.isRequired,
		label: PropTypes.string.isRequired,
		onClick: PropTypes.func.isRequired,
		// 탭 폭은 선택값이다. 주지 않으면 CSS 가 폭을 정한다(대부분의 화면이 그렇게 쓴다).
		// isRequired 로 선언돼 있어 폭을 지정하지 않는 모든 화면에서 콘솔 경고가 났다.
		tabWidth: PropTypes.string
	};
	onClick = () => {
		this.props.onClick(this.props.index);
	}
	render () {
		let className = 'scrm-tabs-ul-li';
		if (this.props.active === this.props.index) {
			className += ' scrm-tabs-ul-li-active'
		}
		return (
			<li className ={className} style={{width: this.props.tabWidth}} onClick ={this.onClick}> {this.props.label} </li>
		);
	}
}
class TabPanel extends React.Component {
	static defaultProps = {
		index : 0,
		label : 'TAB'
	}; 
	render () {
		return ( <div id={this.props.id} className='scrm-tab-panel'> {this.props.children} </div> )
	}
}
export { Tabs, Tab, TabPanel };