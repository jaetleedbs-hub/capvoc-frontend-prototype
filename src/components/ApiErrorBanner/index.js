import React from 'react';

/**
 * 회원사 상세 탭 공통 — API 호출 오류 인라인 배너(원인 + 조치 + 다시 시도).
 *
 * 차단 모달(openAlertDialog) 대신 사용한다. 조직정보(BO202_T4) 배너와 동일 스타일이며,
 * 사업자정보/계약/결제/환경설정 등 다른 탭에서도 동일 UX로 재사용한다.
 *
 * props:
 *   - error: { cause, action, raw } | null  (ComLib.getApiErrorInfo(res) 결과)
 *   - onRetry?: () => void                   (있으면 [다시 시도] 버튼 노출)
 */
const ApiErrorBanner = ({ error, onRetry }) => {
  if (!error) return null;
  return (
    <div style={{
      margin: '2px 0 8px', padding: '12px 14px', borderRadius: 8,
      border: '1px solid #f0c36d', background: '#fff8e6', color: '#7a5b00',
      fontSize: 13, lineHeight: 1.6,
    }}>
      <div style={{ fontWeight: 600, marginBottom: 4 }}>⚠ {error.cause}</div>
      <div><b>조치</b> : {error.action}</div>
      <div style={{ marginTop: 8, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        {onRetry &&
          <button type="button" onClick={onRetry}
            style={{ padding: '4px 12px', borderRadius: 6, border: '1px solid #d0a040',
                     background: '#fff', color: '#7a5b00', cursor: 'pointer', fontSize: 12 }}>
            다시 시도
          </button>}
        {error.raw && <span style={{ color: '#a08040', fontSize: 11 }}>상세: {error.raw}</span>}
      </div>
    </div>
  );
};

export default ApiErrorBanner;
