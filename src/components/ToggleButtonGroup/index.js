import React from 'react';

class ToggleButtonGroup extends React.Component {
	static defaultProps = {
		dataset: [],
		value: '',
		disabled: false,
		readOnly: false,
		className: '',
		onChange: () => { return; }
	};

	onChange = (selectedValue) => {
		if (this.props.readOnly || this.props.disabled) {
			return;
		}
		this.props.onChange({
			target: {
				id: this.props.id,
				name: this.props.name || this.props.id,
				value: selectedValue
			},
			id: this.props.id
		});
	}

	render() {
		const { id, dataset, value, disabled, readOnly, className, width, style } = this.props;

		return (
			<div
				id={id}
				className={`toggle-btn-group ${className} ${disabled ? 'disabled' : ''} ${readOnly ? 'read-only' : ''}`.trim()}
				style={{ width: width, ...style }}
			>
				{(dataset || []).filter(item => item.value !== null && item.value !== undefined).map((opt, idx) => (
					<button
						key={opt.value + '_' + idx}
						type="button"
						className={`toggle-btn-group__btn ${value === opt.value ? 'selected' : ''}`}
						disabled={disabled}
						onClick={() => this.onChange(opt.value)}
					>
						{opt.name}
					</button>
				))}
			</div>
		);
	}
}

export default ToggleButtonGroup;
