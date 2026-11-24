import React from 'react';

class Label extends React.Component {

	constructor(props) {
		super(props);
	}

	static defaultProps = {
		color : '',
	}
	render () {
		return (
			
			<div  style={{...this.props.style}} className={'scrm-label-div ' + (this.props.className || '') }>
				{(this.props.content === undefined || !this.props.content)  					
					? <span className={'scrm-label-span' + (this.props.req ? ' req' : '')} style={{color : this.props.color}}>{this.props.value}</span>
					: <span className={'scrm-label-span' + (this.props.req ? ' req' : '')} style={{color : 'gray'}}>{this.props.value}</span>
				}
				{/* {
					(this.props.req)
					? <span className='scrm-label-span' style={{color : 'red'}}>{'*'}</span>
					: null
				} */}
			</div>
		);
	}
}

export default Label;