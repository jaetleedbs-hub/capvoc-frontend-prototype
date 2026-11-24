import React from 'react';
import ReactDOM from 'react-dom';
import iconCheck from '../../assets/images/icon_check.svg';
import iconSelectDef from '../../assets/images/icon_select_def.png';

class ComboList extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			open: false,
			query: ''
		};
		this.boxRef = React.createRef();
		this.onChange = this.onChange.bind(this);
		this.handleClickOutside = this.handleClickOutside.bind(this);
	}

	static defaultProps = {
		onChange: () => { return; },
		placeholder: '선택',
		searchPlaceholder: '검색...',
	}

	componentDidMount() {
		document.addEventListener('mousedown', this.handleClickOutside);
	}

	componentWillUnmount() {
		document.removeEventListener('mousedown', this.handleClickOutside);
	}

	handleClickOutside(e) {
		if (this.boxRef.current && !this.boxRef.current.contains(e.target)) {
			this.setState({ open: false });
		}
	}

	toggleOpen = () => {
		if (this.props.readOnly || this.props.disabled) return;
		this.setState(prev => ({ open: !prev.open }));
	}

	onChange(item) {
		if (this.props.readOnly) return;
		this.props.onChange({
			target: {
				id: this.props.id,
				name: this.props.name || this.props.id,
				value: item.value
			},
			id: this.props.id
		});
		this.setState({ open: false, query: '' });
	}

	getSelectedItem() {
		const dataset = this.props.dataset || [];
		return dataset.find(item => item.value === this.props.value) || dataset[0];
	}

	render() {
		const { dataset, value, className, width, style, placeholder, searchPlaceholder, disabled, readOnly } = this.props;
		const { open, query } = this.state;
		const items = dataset || [];

		const filtered = items.filter(item =>
			item.name.toLowerCase().includes(query.toLowerCase())
		);

		const selectedItem = this.getSelectedItem();
		const displayLabel = selectedItem ? selectedItem.name : placeholder;

		return (
			<div
				className={'combo-box' + (className ? ' ' + className : '') + (disabled ? ' disabled' : '') + (readOnly ? ' read-only' : '')}
				ref={this.boxRef}
				style={{ width: width, ...style }}
			>
				<button className="combo-trigger" onClick={this.toggleOpen}>
					{displayLabel}
					<img src={iconSelectDef} alt="" className={`arrow ${open ? 'open' : ''}`} />
				</button>

				{open && (
					<div className="combo-panel">
						<div className="combo-search">
							<input
								placeholder={searchPlaceholder}
								value={query}
								onChange={e => this.setState({ query: e.target.value })}
							/>
						</div>

						<ul className="combo-list">
							{filtered.map((item, idx) => (
								<li
									key={item.value + '_' + idx}
									className={`combo-item ${value === item.value ? 'selected' : ''}`}
									onClick={() => this.onChange(item)}
								>
									<div>
										<span>{item.name}</span>
										{item.sub && <p>{item.sub}</p>}
									</div>
									{value === item.value && <img src={iconCheck} alt="" className="check" />}
								</li>
							))}
						</ul>
					</div>
				)}
			</div>
		);
	}
}

export default ComboList;
