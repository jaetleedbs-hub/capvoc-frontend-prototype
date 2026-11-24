import React from 'react';
import { ComLib } from 'common';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        // 다음 렌더링에서 폴백 UI가 보이도록 상태를 업데이트 합니다.
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        // 에러 로깅
        console.error('ErrorBoundary caught an error:', error, errorInfo);
        
        this.setState({
            error: error,
            errorInfo: errorInfo
        });

        // 사용자에게 알림 (선택적)
        if (this.props.showUserMessage !== false) {
            ComLib.showStatusMessage('화면을 불러오는 중 오류가 발생했습니다.');
        }
    }

    handleRetry = () => {
        this.setState({ hasError: false, error: null, errorInfo: null });
    };

    render() {
        if (this.state.hasError) {
            // 커스텀 폴백 UI가 제공된 경우 사용
            if (this.props.fallback) {
                return this.props.fallback;
            }

            // 기본 폴백 UI
            return (
                <div className="scrm-error-boundary">
                    <div className="scrm-error-content">
                        <div className="scrm-error-icon">⚠️</div>
                        <h3>화면을 불러올 수 없습니다</h3>
                        <p>일시적인 오류가 발생했습니다.</p>
                        
                        {this.props.showRetry !== false && (
                            <button 
                                className="scrm-btn scrm-btn-primary"
                                onClick={this.handleRetry}
                                style={{
                                    marginTop: '16px',
                                    padding: '8px 16px',
                                    backgroundColor: '#007bff',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer'
                                }}
                            >
                                다시 시도
                            </button>
                        )}
                        
                        {this.props.showDetails && this.state.error && (
                            <details style={{ marginTop: '16px', fontSize: '12px', color: '#666' }}>
                                <summary>오류 세부사항</summary>
                                <pre style={{ marginTop: '8px', padding: '8px', backgroundColor: '#f5f5f5', borderRadius: '4px', overflow: 'auto' }}>
                                    {this.state.error.toString()}
                                    {this.state.errorInfo.componentStack}
                                </pre>
                            </details>
                        )}
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
