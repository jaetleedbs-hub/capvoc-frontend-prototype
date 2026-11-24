import React from 'react';
import {
	RadialBarChart, RadialBar, Legend, Tooltip, 
	LineChart, CartesianGrid, XAxis,YAxis, Line,
	BarChart , Bar,
	Surface,
	Symbols
} from 'recharts';
// https://recharts.org/en-US/guide <== API site
import _ from "lodash";
const data = [
	{"/dev/shm": 1},
	{"/": 16},
	{"/home": 52}
]
class ScrmLineBarChart extends React.Component {
	constructor (props) {
		super(props);
		this.state = { disabled: []};
	}
	onMouseEnter = (e) => {
		
	}
	onMouseMove = (e) => {
		
	}
	onMouseLeave = (e) => {
		
	}
	renderCusomizedLegend = ({ payload }) => {
		return (
			<div className="customized-legend" style={{textAlign: 'center'}}>				
				{payload.map((entry, index) => {
					const { key, color } = entry;
					const active = _.includes(this.state.disabled, key);
					const style = {
						marginRight: 10,
						color: active ? "#AAA" : color
					};
					return (
						<span
							className="legend-item"
							key={index + "_legend-item"}
							onClick={() => this.handleClick(key)}
							style={style}
						>
							{/* <Surface width={10} height={10} viewBox="0 0 10 10"></Surface> */}
							<Surface width={10} height={10} >
								<Symbols cx={5} cy={5} type="circle" size={50} fill={color} />
									{active && (
										<Symbols
											cx={5}
											cy={5}
											type="circle"
											size={25}
											fill={"#FFF"}
										/>
									)}
							</Surface>
							<span>{key}</span>
						</span>
					);
				})}
			</div>
		);
	};

	render () {		
		return (
			<div className="scrm-line-chart-div">
				<LineChart width={this.props.width} height={this.props.height} data={this.props.data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
					<CartesianGrid strokeDasharray="3 3" />
					<XAxis dataKey={this.props.options.XAsisKey} />
					<YAxis allowDecimals = {false}/>
					<Tooltip/>
						{
							this.props.options.dataKey.filter(item => !_.includes(this.state.disabled, item.key)).map((item, key) => {
								return <Line type="monotone" dataKey={item.key} key={key} stroke={item.color} unit = {'건'}/>
							})
						}
					<Legend
						height={36}
						payload={this.props.options.dataKey}
						content={this.renderCusomizedLegend}
					/>
				</LineChart>
			</div>
		)
	}
}
class ScrmRadialBarChart extends React.Component {
	render () {
		return (
			<div className="scrm-chart-div">
					{/* <RadialBar/> */}
					<RadialBarChart 
						width={730} 
						height={250} 
						innerRadius="10%" 
						outerRadius="80%" 
						data={data} 
						startAngle={180} 
						endAngle={0}
					>
						<RadialBar minAngle={15} label={{ fill: '#666', position: 'insideStart' }} background clockWise={true} dataKey='uv' />
						<Legend iconSize={10} width={120} height={140} layout='vertical' verticalAlign='middle' align="right" />
						<Tooltip />
					</RadialBarChart>
			</div>
		);
	}
}

class ScrmBarChart extends React.Component{
	render(){
		return(
			<div className="scrm-chart-div">					
					<BarChart width={this.props.width} height={this.props.height} data={this.props.data} layout={this.props.layout}>
					<XAxis type="number" domain={[0, 100]}  /> 
					<YAxis dataKey= {this.props.dailyOptions.YAsisKey} hide reversed type="category" />
					<Tooltip />
					<Legend />     
						{
								this.props.dailyOptions.dataKey.map((item, key) => {								
								return <Bar dataKey={item.key} key={key} fill={item.color} unit={'%'}/>
							})
						}
				</BarChart>
			</div>			
		)
	}
}

export {ScrmRadialBarChart, ScrmLineBarChart, ScrmBarChart};