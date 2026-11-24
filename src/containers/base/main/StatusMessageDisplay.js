import React from 'react';
import { ComLib } from 'common';

class StatusMessageDisplay extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            message: ''
        };
        this.timeoutId = null;
    }

    componentDidMount() {
        ComLib.registerMessageHandler(this.props.menuId, this.handleMessage);
    }

    componentWillUnmount() {
        if (this.timeoutId) {
            clearTimeout(this.timeoutId);
        }
        // 등록만 하고 해제하지 않으면 ComLib._messageHandlers 가 죽은 인스턴스를 붙든다.
        // (menuId 키라 상한은 있지만, 닫은 화면이 계속 참조되는 것은 마찬가지다)
        ComLib.unregisterMessageHandler(this.props.menuId);
    }

    handleMessage = (message, type) => {
        if (this.timeoutId) {
            clearTimeout(this.timeoutId);
        }

        if (type === 'status') {
            this.setState({ message });
            
            this.timeoutId = setTimeout(() => {
                this.setState({ message: '' });
                this.timeoutId = null;
            }, 5000);
        }
    }

    render() {
        return (
            <span className={'header-message-layer'}>
                {this.state.message}
            </span>
        );
    }
}

export default StatusMessageDisplay; 