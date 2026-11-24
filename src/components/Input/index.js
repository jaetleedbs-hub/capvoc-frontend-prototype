import React from 'react';
import {  StrLib, DateLib } from 'common';
import Flatpickr from 'react-flatpickr';
import 'flatpickr/dist/themes/light.css';
import { Korean } from 'flatpickr/dist/l10n/ko.js';
import moment from 'moment';
import monthSelectPlugin from 'flatpickr/dist/plugins/monthSelect';
import 'flatpickr/dist/plugins/monthSelect/style.css';

class Checkbox extends React.Component {
	constructor(props) {
		super(props);
		this.onChange = this.onChange.bind(this);
		this.onClick = this.onClick.bind(this);
	}
	static defaultProps = {
		index : 0,
		onClick : () => {return;},
		onChange : () => {return;}

	}
	onClick = (e) => {
		if (this.props.disabled) {
			e.preventDefault();
			return;
		}
		this.props.onClick({ id : this.props.id, target : e.target, index : this.props.index, checked : document.getElementById(e.target.id).checked });
	}
	onChange = (e) => {
		if (this.props.disabled) {
			e.preventDefault();
			return;
		}
		this.props.onChange({ id : this.props.id, target : e.target, index : this.props.index, checked : document.getElementById(e.target.id).checked });
	}
	render () {
		return (
			<div className={'scrm-input-checkbox-div ' + (this.props.className || '') } style={{...this.props.style}}>
				<input	className = "scrm-input-checkbox-input"
						type = "checkbox"
						id = {'chk_' + this.props.id + '_' + this.props.index + '_' + this.props.keyProp}
						value = {this.props.keyProp}
						readOnly = {this.props.readOnly}
						disabled = {this.props.disabled}
						name = {this.props.id}
						checked = { this.props.checked === 'Y'}
						onClick = {this.onClick}
						onChange = {this.onChange}
						style={{...this.props.textStyle}}
				/>
				<label className = "scrm-input-checkbox-label" htmlFor={'chk_' + this.props.id + '_' + this.props.index + '_' + this.props.keyProp} readOnly = {this.props.readOnly}> {this.props.value} </label>
			</div>
		);
	}
}
class MultiCheckBox extends React.Component {
	constructor (props) {
		super(props);
		this.onChange = this.onChange.bind(this);
		this.onClick = this.onClick.bind(this);
	}
	static defaultProps = {
		onClick : () => {return;},
		onChange : () => {return;}
	}
	onClick = (e) => {
		this.props.onClick({target: e.target, id : this.props.id, index : e.index, checked: Array.from(document.getElementsByName(e.target.name))[e.index].checked});
	}
	onChange = (e) => {
		this.props.onChange({target: e.target, id : this.props.id, index : e.index, checked: Array.from(document.getElementsByName(e.target.name))[e.index].checked});
	}
	render () {
		return (
			<React.Fragment>
			{
				this.props.dataset.map((item, i) => {
					return (
						<Checkbox
							key = {'checkbox_' + this.props.id + "_"+ i}
							id = {this.props.id}
							index = {i}
							value = {item[this.props.value]}
							keyProp =  {item[this.props.keyProp]}
							checked = {item['value']}
							onChange = {this.onChange}
							onClick = {this.onClick}
							className = {this.props.className}
						/>
					)
				})
			}
			</React.Fragment>
		);
	}
}
class Radio extends React.Component {
	constructor (props) {
		super(props);
		this.state  = {
			selectedOption : this.props.selected || ((this.props.dataset[this.props.defaultSelected] || {})[this.props.keyProp])
		}
		this.onChange = this.onChange.bind(this);
	}
	static defaultProps = {
		onChange : () => { return; }
	}
	onChange = (e) => {
		this.props.onChange({ id: this.props.id, value : e.target.value});
	}
	componentDidMount () {

	}
	setRadio = (props) => {
		return (
			props.dataset.map((item, i) => {
				return (
					<div key={'radio_div_' + i} className={'scrm-input-radio-div ' + (this.props.className || '') } style={{...this.props.style}}>
						<input	className ='scrm-input-radio-input'
								key={'radio_'+ i}
								id = {'rdo_' + props.id + '_' + i + '_' + props.keyProp}
								type="radio"
								name={props.id}
								value={item[props.keyProp]}
								checked = {
									(props.selected === null)
									? props.defaultSelected === i
									: props.selected === item[props.keyProp]
								}
								readOnly = {this.props.readOnly}
								disabled = {this.props.disabled}
								onChange = {this.onChange}
								style={{...this.props.textStyle}}
						/>
						<label	className ='scrm-input-radio-label'
								key={'radio_label_' + i}
								htmlFor={'rdo_' + props.id + '_' + i + '_' + props.keyProp}
								readOnly = {this.props.readOnly}
								disabled = {this.props.disabled}
								style={{...this.props.labelStyle}}
						>
							{item[props.value]}
						</label>
					</div>
				);
			})
		);
	}
	render () {
		return (
			<div className='scrm-input-div' style={{width: this.props.width}}>
				{ this.setRadio(this.props) }
			 </div>
		);
	}
}
class Textfield extends React.Component {
	static defaultProps = {
		onKeyPress : () => {return;},
		onChange : () => {return;},
		onBlur : () => {return;},
		onClick : () => {return;},
		onFocus : () => {return;},
		onKeyDown : () => {return;},
		tooltip : false
	}
	rtnVal = (value) => {
		switch (this.props.type) {
			case 'onlyNum' :
				if(StrLib.isNull(value)) return value;
				return typeof value === 'string' ? value.replace(/[^0-9]/g,"") : value.toString().replace(/[^0-9]/g,"");
			case 'onlyKor' :
				if(StrLib.isNull(value)) return value;
				return value.replace(/[a-z0-9]|[ \]{}()<>?|`~!@#$%^&*-_+=,.;:'\\]/g,"");
			case 'onlyEng' :
				if(StrLib.isNull(value)) return value;
				return value.replace(/[^a-zA-Z]/g,"");
			default :
				if (StrLib.isNull(value)) {
					return '';
				} else {
					return value;
				}
		}
	}
	render () {
		return (
			<div className={'scrm-input-div ' + (this.props.className || '') } style={{width: this.props.width, ...this.props.style}}>
				<input	className = {`scrm-input-text ${this.props.className}`}
						type="text"
						id = {this.props.id}
						name = {this.props.name}
						value = {this.rtnVal(this.props.value)}
						placeholder = {this.props.placeholder}
						minLength =  {this.props.minLength}
						maxLength = {this.props.maxLength}
						readOnly = {this.props.readOnly}
						disabled = {this.props.disabled}
						onClick = {(e) => this.props.onClick(e)}
						onFocus = {(e) => this.props.onFocus(e)}
						onChange = {(e) => this.props.onChange(e)}
						onKeyPress= {(e) => this.props.onKeyPress(e)}
						onKeyDown = {(e) => this.props.onKeyDown(e)}
						onBlur = {(e) => {this.props.onBlur(e)}}
						autoComplete  = 'off'
						style={{...this.props.textStyle}}
				/>
			</div>
		);
	}
}
class TextPasswdfield extends React.Component {
  static defaultProps = {
		onKeyPress : () => {return;},
		onChange : () => {return;}
	}
	render () {
		return (
			<div className={'scrm-input-div ' + (this.props.className || '') } style={{...this.props.style}}>
				<input
					className = "scrm-input-password"
					type="password"
					id = {this.props.id}
					name = {this.props.name}
					value = {this.props.value}
					placeholder = {this.props.placeholder}
					maxLength = {this.props.maxlength}
					minLength =  {this.props.minlength}
					readOnly = {this.props.readOnly}
					onChange = {(e) => this.props.onChange(e)}
					onKeyPress= {(e) => this.props.onKeyPress(e)}
					autoComplete  = 'off'
					style={{...this.props.textStyle}}
				/>
			</div>
		);
	}
}
class InputCalendar extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			value: this.props.value ? this.formatDateForDisplay(this.props.value) : null,
		};
	}

	static defaultProps = { 
		onChange: () => {},
		disabled: false,
		direction: 'auto',
		placeholder: '일자를 선택하세요',
		inputWidth: '120px',
		plugins: []
	}

	// YYYYMMDD 또는 YYYYMM 형식을 YYYY-MM-DD 또는 YYYY-MM로 변환
	formatDateForDisplay = (dateStr) => {
		if (!dateStr) return null;
		// 숫자만 추출
		const numericStr = dateStr.toString().replace(/[^0-9]/g, '');
		
		// 월달력 모드: 6자리 숫자인 경우 (YYYYMM)
		if (numericStr.length === 6 && this.props.plugins === 'month') {
			const year = numericStr.substring(0, 4);
			const month = numericStr.substring(4, 6);
			
			// 유효한 월인지 검증
			const monthNum = parseInt(month, 10);
			
			if (monthNum >= 1 && monthNum <= 12) {
				return `${year}-${month}`;
			}
		}
		
		// 일달력 모드: 8자리 숫자인 경우 (YYYYMMDD)
		if (numericStr.length === 8) {
			const year = numericStr.substring(0, 4);
			const month = numericStr.substring(4, 6);
			const day = numericStr.substring(6, 8);
			
			// 유효한 날짜인지 검증
			const monthNum = parseInt(month, 10);
			const dayNum = parseInt(day, 10);
			
			if (monthNum >= 1 && monthNum <= 12 && dayNum >= 1 && dayNum <= 31) {
				return `${year}-${month}-${day}`;
			}
		}
		
		// 이미 YYYY-MM 형식인 경우 (월달력)
		if (/^\d{4}-\d{2}$/.test(dateStr)) {
			return dateStr;
		}
		
		// 이미 YYYY-MM-DD 형식인 경우 (일달력)
		if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
			return dateStr;
		}
		
		return null;
	}

	// YYYY-MM-DD 형식을 YYYYMMDD로, YYYY-MM 형식을 YYYYMM으로 변환
	formatDateForOutput = (dateStr) => {
		if (!dateStr) return null;
		// 숫자만 추출
		const numericStr = dateStr.toString().replace(/[^0-9]/g, '');
		
		// 월달력 모드: 6자리 숫자인 경우 (YYYYMM)
		if (numericStr.length === 6 && this.props.plugins === 'month') {
			return numericStr;
		}
		
		// 일달력 모드: 8자리 숫자인 경우 (YYYYMMDD)
		if (numericStr.length === 8) {
			return numericStr;
		}
		
		return null;
	}

	componentDidUpdate(prevProps) {
		if (prevProps.value !== this.props.value) {
			this.setState({
				value: this.props.value ? this.formatDateForDisplay(this.props.value) : null
			});
		}
	}

	// 입력 필드에서 포커스를 잃을 때 처리
	handleDateBlur = (selectedDates, dateStr, instance) => {
		// 현재 입력 필드의 값을 가져와서 처리
		const inputValue = instance.input.value;
		if (inputValue !== this.state.value) {
			const formattedDate = inputValue ? this.formatDateForOutput(inputValue) : null;
			this.setState({ value: inputValue });
			this.props.onChange({
				target: {
					id: this.props.id,
					value: formattedDate,
				}
			});
		}
	}

	render () {
		const { className, style, disabled, placeholder	 } = this.props;
		
		const flatpickrOptions = {
			locale: Korean,
			dateFormat: 'Y-m-d',
			allowInput: true,
			clickOpens: !disabled,
			position: 'auto',
			positionElement: undefined,
			static: false,
			appendTo: undefined,
		parseDate: (datestr, format) => {
			if (!datestr) return null;
			
			// 숫자만 추출
			const numericStr = datestr.replace(/[^0-9]/g, '');
			
			// 월달력 모드: YYYYMM 형식 (6자리)인 경우 파싱
			if (numericStr.length === 6 && this.props.plugins === 'month') {
				const year = parseInt(numericStr.substring(0, 4), 10);
				const month = parseInt(numericStr.substring(4, 6), 10);
				
				// 유효한 월인지 검증
				if (month >= 1 && month <= 12) {
					// JavaScript Date는 월이 0부터 시작, 일은 1일로 설정
					const date = new Date(year, month - 1, 1);
					return date;
				}
			}
			
			// 일달력 모드: YYYYMMDD 형식 (8자리)인 경우 파싱
			if (numericStr.length === 8) {
				const year = parseInt(numericStr.substring(0, 4), 10);
				const month = parseInt(numericStr.substring(4, 6), 10);
				const day = parseInt(numericStr.substring(6, 8), 10);
				
				// 유효한 날짜인지 검증
				if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
					// JavaScript Date는 월이 0부터 시작
					const date = new Date(year, month - 1, day);
					// 날짜가 유효한지 재확인 (예: 2월 30일 같은 경우 방지)
					if (date.getFullYear() === year && 
						date.getMonth() === month - 1 && 
						date.getDate() === day) {
						return date;
					}
				}
			}
			
			// YYYY-MM 형식인 경우 (월달력)
			if (/^\d{4}-\d{2}$/.test(datestr)) {
				const [year, month] = datestr.split('-').map(Number);
				if (month >= 1 && month <= 12) {
					return new Date(year, month - 1, 1);
				}
			}
			
			// YYYY-MM-DD 형식인 경우 (일달력)
			if (/^\d{4}-\d{2}-\d{2}$/.test(datestr)) {
				const date = new Date(datestr);
				if (!isNaN(date.getTime())) {
					return date;
				}
			}
			
			// 기본 Flatpickr 파서 사용 방지 - null 반환
			return null;
		},
			onReady: (selectedDates, dateStr, instance) => {
				// 자동 위치 조정을 위한 설정
				instance.config.positionElement = instance.element;
			},
			onClose: this.handleDateBlur,
			plugins: this.props.plugins === 'month' ? [new monthSelectPlugin({
				shorthand: true,
				dateFormat: "Y-m",
				altFormat: "F Y",
			})] : this.props.plugins
		};

		return (
			<div className={'scrm-input-calendar ' + (className || '')} style={{...style}}>
				<Flatpickr
					id={this.props.id ? this.props.id : ''}
					value={this.state.value}
					options={flatpickrOptions}
					placeholder={placeholder}
					disabled={disabled}
					style={{width:this.props.plugins === 'month' ? '84px' : this.props.inputWidth}}
					onChange={(selectedDates, dateStr) => {
						const formattedDate = dateStr ? this.formatDateForOutput(dateStr) : null;
						this.setState({ value: dateStr });
						this.props.onChange({
							target: {
								id: this.props.id,
								value: formattedDate,
							}
						});
					}}
				/>
			</div>
		);
	}
}
class RangeInputCalendar extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			startDate: this.props.startDate ? this.formatDateForDisplay(this.props.startDate) : null,
			endDate: this.props.endDate ? this.formatDateForDisplay(this.props.endDate) : null,
		};
	}

	static defaultProps = {
		startDate: null,
		endDate: null,
		className: '',
		onChange: () => {},
		disabled: false,
		direction: 'auto',
		inputWidth: '120px',
		useClearButton: false
	}

	// YYYYMMDD 또는 YYYYMM 형식을 YYYY-MM-DD 또는 YYYY-MM로 변환
	formatDateForDisplay = (dateStr) => {
		if (!dateStr) return null;
		// 숫자만 추출
		const numericStr = dateStr.toString().replace(/[^0-9]/g, '');
		
		// 월달력 모드: 6자리 숫자인 경우 (YYYYMM) - RangeInputCalendar는 월달력 미지원이지만 호환성 유지
		if (numericStr.length === 6) {
			const year = numericStr.substring(0, 4);
			const month = numericStr.substring(4, 6);
			
			// 유효한 월인지 검증
			const monthNum = parseInt(month, 10);
			
			if (monthNum >= 1 && monthNum <= 12) {
				return `${year}-${month}`;
			}
		}
		
		// 일달력 모드: 8자리 숫자인 경우 (YYYYMMDD)
		if (numericStr.length === 8) {
			const year = numericStr.substring(0, 4);
			const month = numericStr.substring(4, 6);
			const day = numericStr.substring(6, 8);
			
			// 유효한 날짜인지 검증
			const monthNum = parseInt(month, 10);
			const dayNum = parseInt(day, 10);
			
			if (monthNum >= 1 && monthNum <= 12 && dayNum >= 1 && dayNum <= 31) {
				return `${year}-${month}-${day}`;
			}
		}
		
		// 이미 YYYY-MM 형식인 경우
		if (/^\d{4}-\d{2}$/.test(dateStr)) {
			return dateStr;
		}
		
		// 이미 YYYY-MM-DD 형식인 경우
		if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
			return dateStr;
		}
		
		return null;
	}

	// YYYY-MM-DD 형식을 YYYYMMDD로, YYYY-MM 형식을 YYYYMM으로 변환
	formatDateForOutput = (dateStr) => {
		if (!dateStr) return null;
		// 숫자만 추출
		const numericStr = dateStr.toString().replace(/[^0-9]/g, '');
		
		// 월달력 형식: 6자리 숫자인 경우 (YYYYMM)
		if (numericStr.length === 6) {
			return numericStr;
		}
		
		// 일달력 형식: 8자리 숫자인 경우 (YYYYMMDD)
		if (numericStr.length === 8) {
			return numericStr;
		}
		
		return null;
	}

	componentDidUpdate(prevProps) {
		if (prevProps.startDate !== this.props.startDate || prevProps.endDate !== this.props.endDate) {
			this.setState({
				startDate: this.props.startDate ? this.formatDateForDisplay(this.props.startDate) : null,
				endDate: this.props.endDate ? this.formatDateForDisplay(this.props.endDate) : null
			});
		}
	}

	handleStartDateChange = (selectedDates, dateStr) => {
		const formattedDate = dateStr ? this.formatDateForOutput(dateStr) : null;
		const currentEndDate = this.state.endDate ? this.formatDateForOutput(this.state.endDate) : null;
		
		this.setState({ startDate: dateStr });
		
		// onChange 호출 시 안전한 이벤트 객체 생성
		if (this.props.onChange && typeof this.props.onChange === 'function') {
			this.props.onChange({
				target: {
					id: this.props.id || '',
				},
				startDate: formattedDate,
				endDate: currentEndDate,
			});
		}
	}

	// 시작일자 입력 필드에서 포커스를 잃을 때 처리
	handleStartDateBlur = (selectedDates, dateStr, instance) => {
		// 현재 입력 필드의 값을 가져와서 처리
		const inputValue = instance.input.value;
		if (inputValue !== this.state.startDate) {
			this.handleStartDateChange(selectedDates, inputValue);
		}
	}

	handleEndDateChange = (selectedDates, dateStr) => {
		const formattedDate = dateStr ? this.formatDateForOutput(dateStr) : null;
		const currentStartDate = this.state.startDate ? this.formatDateForOutput(this.state.startDate) : null;
		
		this.setState({ endDate: dateStr });
		
		// onChange 호출 시 안전한 이벤트 객체 생성
		if (this.props.onChange && typeof this.props.onChange === 'function') {
			this.props.onChange({
				target: {
					id: this.props.id || '',
				},
				startDate: currentStartDate,
				endDate: formattedDate,
			});
		}
	}

	// 종료일자 입력 필드에서 포커스를 잃을 때 처리
	handleEndDateBlur = (selectedDates, dateStr, instance) => {
		// 현재 입력 필드의 값을 가져와서 처리
		const inputValue = instance.input.value;
		if (inputValue !== this.state.endDate) {
			this.handleEndDateChange(selectedDates, inputValue);
		}
	}

	handleClearDates = () => {
		this.setState({ 
			startDate: null, 
			endDate: null 
		});
		
		// onChange 호출 시 안전한 이벤트 객체 생성
		if (this.props.onChange && typeof this.props.onChange === 'function') {
			this.props.onChange({
				target: {
					id: this.props.id || '',
				},
				startDate: null,
				endDate: null,
			});
		}
	}

	render () {
		const { className, style, disabled } = this.props;
		
	// 공통 parseDate 함수
	const parseDateFunc = (datestr, format) => {
		if (!datestr) return null;
		
		// 숫자만 추출
		const numericStr = datestr.replace(/[^0-9]/g, '');
		
		// YYYYMMDD 형식 (8자리)인 경우 파싱
		if (numericStr.length === 8) {
			const year = parseInt(numericStr.substring(0, 4), 10);
			const month = parseInt(numericStr.substring(4, 6), 10);
			const day = parseInt(numericStr.substring(6, 8), 10);
			
			// 유효한 날짜인지 검증
			if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
				// JavaScript Date는 월이 0부터 시작
				const date = new Date(year, month - 1, day);
				// 날짜가 유효한지 재확인 (예: 2월 30일 같은 경우 방지)
				if (date.getFullYear() === year && 
					date.getMonth() === month - 1 && 
					date.getDate() === day) {
					return date;
				}
			}
		}
		
		// YYYY-MM-DD 형식인 경우 기본 파싱
		if (/^\d{4}-\d{2}-\d{2}$/.test(datestr)) {
			const date = new Date(datestr);
			if (!isNaN(date.getTime())) {
				return date;
			}
		}
		
		// 기본 Flatpickr 파서 사용 방지 - null 반환
		return null;
	};
		
		const flatpickrStartOptions = {
			locale: Korean,
			dateFormat: 'Y-m-d',
			allowInput: true,
			clickOpens: !disabled,
			position: 'auto',
			static: false,
			parseDate: parseDateFunc,
			onReady: (selectedDates, dateStr, instance) => {
				// 자동 위치 조정을 위한 설정
				instance.config.positionElement = instance.element;
			},
			onClose: this.handleStartDateBlur
		};

		const flatpickrEndOptions = {
			locale: Korean,
			dateFormat: 'Y-m-d',
			allowInput: true,
			clickOpens: !disabled,
			position: 'auto',
			static: false,
			parseDate: parseDateFunc,
			onReady: (selectedDates, dateStr, instance) => {
				// 자동 위치 조정을 위한 설정
				instance.config.positionElement = instance.element;
			},
			onClose: this.handleEndDateBlur
		};

		return (
			<div className={'scrm-input-range-calendar ' + (className || '')} style={{...style}}>
				<div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
					<Flatpickr
						id={this.props.strtId ? this.props.strtId : ''}
						value={this.state.startDate}
						options={flatpickrStartOptions}
						placeholder="시작일자"
						disabled={disabled}
						onChange={this.handleStartDateChange}
						className="scrm-input-text"
						style={{width:this.props.inputWidth}}
					/>
					<span style={{ margin: '0 5px' }}>~</span>
					<Flatpickr
						id={this.props.endId ? this.props.endId : ''}
						value={this.state.endDate}
						options={flatpickrEndOptions}
						placeholder="종료일자"
						disabled={disabled}
						onChange={this.handleEndDateChange}
						className="scrm-input-text"
						style={{width:this.props.inputWidth}}
					/>
					<button
						type="button"
						className="scrm-btn scrm-btn-sm grey-o btn-icon icon-cancel"
						style={{display: this.props.useClearButton ? 'block' : 'none'}}
						onClick={this.handleClearDates}
						disabled={disabled}
						title="날짜 초기화"
					>						
					</button>
				</div>
			</div>
		);
	}
}
class NumberStepper extends React.Component {
	constructor(props) {
		super(props);
		this.handleIncrement = this.handleIncrement.bind(this);
		this.handleDecrement = this.handleDecrement.bind(this);
		this.handleChange = this.handleChange.bind(this);
		this.handleBlur = this.handleBlur.bind(this);
	}

	static defaultProps = {
		value: 0,
		min: 0,
		max: 999999,
		step: 1,
		disabled: false,
		readOnly: false,
		onChange: () => {},
		width: '100px'
	}

	handleIncrement = () => {
		if (this.props.disabled || this.props.readOnly) return;
		
		const currentValue = Number(this.props.value) || 0;
		const newValue = Math.min(currentValue + this.props.step, this.props.max);
		
		if (newValue !== currentValue) {
			this.props.onChange({
				target: {
					id: this.props.id,
					value: newValue
				}
			});
		}
	}

	handleDecrement = () => {
		if (this.props.disabled || this.props.readOnly) return;
		
		const currentValue = Number(this.props.value) || 0;
		const newValue = Math.max(currentValue - this.props.step, this.props.min);
		
		if (newValue !== currentValue) {
			this.props.onChange({
				target: {
					id: this.props.id,
					value: newValue
				}
			});
		}
	}

	handleChange = (e) => {
		let value = e.target.value;
		
		// 숫자만 허용
		value = value.replace(/[^0-9]/g, '');
		
		if (value === '') {
			value = 0;
		}
		
		let numValue = Number(value);
		
		// min/max 범위 체크
		if (numValue < this.props.min) {
			numValue = this.props.min;
		} else if (numValue > this.props.max) {
			numValue = this.props.max;
		}
		
		this.props.onChange({
			target: {
				id: this.props.id,
				value: numValue
			}
		});
	}

	handleBlur = (e) => {
		let value = Number(e.target.value) || 0;
		
		// min/max 범위 체크
		if (value < this.props.min) {
			value = this.props.min;
		} else if (value > this.props.max) {
			value = this.props.max;
		}
		
		if (value !== Number(this.props.value)) {
			this.props.onChange({
				target: {
					id: this.props.id,
					value: value
				}
			});
		}
	}

	render() {
		const { id, value, min, max, step, disabled, readOnly, width, className, style } = this.props;
		const displayValue = value !== undefined && value !== null ? value : 0;
		const isDecrementDisabled = disabled || readOnly || Number(displayValue) <= min;
		const isIncrementDisabled = disabled || readOnly || Number(displayValue) >= max;
		
		return (
			<div 
				className={'scrm-number-stepper-div ' + (className || '')} 
				style={{ width: width, ...style }}
			>
				<button
					type="button"
					className="scrm-number-stepper-btn scrm-number-stepper-btn-decrement"
					onClick={this.handleDecrement}
					disabled={isDecrementDisabled}
				>
					−
				</button>
				<input
					type="text"
					id={id}
					className="scrm-number-stepper-input"
					value={displayValue}
					onChange={this.handleChange}
					onBlur={this.handleBlur}
					disabled={disabled}
					readOnly={readOnly}
				/>
				<button
					type="button"
					className="scrm-number-stepper-btn scrm-number-stepper-btn-increment"
					onClick={this.handleIncrement}
					disabled={isIncrementDisabled}
				>
					+
				</button>
			</div>
		);
	}
}

// 이전 convertDate 함수는 더 이상 사용되지 않음 (react-dates 전용이었음)
// 새로운 flatpickr 기반 컴포넌트에서는 각 컴포넌트 내부의 format 함수들을 사용
export { MultiCheckBox, Checkbox, Radio, Textfield, InputCalendar, TextPasswdfield, RangeInputCalendar, NumberStepper}