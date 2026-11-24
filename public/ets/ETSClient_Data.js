function CallData() {
	this.variables = {};
	this.variableIndex = []; // 변수 이름들의 순서를 저장하는 배열
}
CallData.prototype = {
	// variable
	setVariable : function (name, value, index) {
		if(name !== "" && name !== "undefined" && name !== null && name !== 'user.AgtID' && name !== 'user.AGTID' && name !== 'user.DlgID') {
			// 기존에 있는 변수인지 확인
			const existingIndex = this.variableIndex.indexOf(name);

			if (existingIndex > -1) {
				// 기존 변수가 있다면 인덱스에서 제거
				this.variableIndex.splice(existingIndex, 1);
			}

			this.variables[name] = value;

			// 인덱스가 지정되지 않았거나 유효하지 않으면 맨 뒤에 추가
			if (index === undefined || index === null || index < 0 || index > this.variableIndex.length) {
				this.variableIndex.push(name);
			} else {
				// 지정된 인덱스에 삽입
				this.variableIndex.splice(index, 0, name);
			}
		}

		return this;
	},
	getVariable : function (name) {
		return this.variables[name];
	},
	getVariables : function () {
		return this.variables;
	},

	removeVariable : function (name) {
		delete this.variables[name];
		// 인덱스에서도 제거
		const index = this.variableIndex.indexOf(name);
		if (index > -1) {
			this.variableIndex.splice(index, 1);
		}
	},
	removeVariables : function () {
		this.variables = {};
		this.variableIndex = []; // 인덱스도 초기화
	},
};