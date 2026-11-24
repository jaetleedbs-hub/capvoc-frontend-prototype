import React from 'react';
import Login from 'containers/base/common/login.js'
import AppMain from 'containers/base';
import PopupBase from 'containers/popupbase';

import { Route, Routes } from 'react-router-dom';
import { Provider } from 'react-redux';
import store from '../store';

import { GlobalProvider } from '../common/GlobalContext';
import { ComLib } from '../common';
// const NotFound = () => <h1>404.. This page is not found!</h1>

class App extends React.Component{
	handleAuthSessionChange = () => {
		this.forceUpdate();
	};
	componentDidMount(){
		// 로그인/로그아웃 시 세션(sessionStorage) 변경만으로는 App이 리렌더되지 않으므로 이벤트로 강제 갱신
		window.addEventListener('chatcall-auth-changed', this.handleAuthSessionChange);
	}
	componentWillUnmount() {
		window.removeEventListener('chatcall-auth-changed', this.handleAuthSessionChange);
	}
	render () {
		return (
			<React.Fragment>
				{ ComLib.isAuthenticated()?
					(
						<Provider store={store}>
							<GlobalProvider>
								<Routes>
									{/* 팝업 경로는 PopupBase로 라우팅 */}
									<Route path="/popup/*" element={<PopupBase />} />
									{/* 나머지 모든 경로는 AppMain으로 라우팅 */}
									<Route path="/*" element={<AppMain />} />
								</Routes>
							</GlobalProvider>
						</Provider>
					)
					:
					(
						<Login />
					)
				}
			</React.Fragment>
		);
	}
}
export default App;
