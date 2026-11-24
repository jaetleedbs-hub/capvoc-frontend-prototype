import React from 'react';
import { ComLib, DataLib } from 'common';
import {
  BasicButton,
  ComponentPanel,
  FullPanel,
  Grid,
} from 'components';
import { domainTitle, fileSheet, loadBundle, loadSummary, notifySaved, paramOf, saveWork, versionPair } from './client';
import { Note } from './ui';

const STEPS = ['파일 업로드', '스테이지 테이블', '테이블 적재'];

const dataset = (rows) => {
  const list = DataLib.datalist.getInstance();
  list.setRecords(rows || []);
  return list;
};

const sectionHead = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: '12px',
  background: 'var(--cw-primary, #1e3a5f)',
  color: '#fff',
  borderRadius: '6px',
  padding: '8px 12px',
  marginBottom: '8px',
};

class DetailPopup extends React.Component {
  constructor(props) {
    super(props);
    this.versionId = paramOf(props).versionId || '';
    this.splitRef = React.createRef();
    this.state = {
      bundle: null,
      version: null,
      dsFiles: dataset([]),
      dsStage: dataset([]),
      dsOfficial: dataset([]),
      leftRatio: 0.42,
    };
  }

  componentDidMount() {
    this.load();
  }

  componentWillUnmount() {
    this.stopDrag();
  }

  startDrag = (event) => {
    event.preventDefault();
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    this.dragMove = (moveEvent) => {
      const bounds = this.splitRef.current && this.splitRef.current.getBoundingClientRect();
      if (!bounds || bounds.width <= 0) return;
      const ratio = (moveEvent.clientX - bounds.left) / bounds.width;
      this.setState({ leftRatio: Math.min(0.8, Math.max(0.2, ratio)) });
    };
    this.dragUp = () => this.stopDrag();
    window.addEventListener('mousemove', this.dragMove);
    window.addEventListener('mouseup', this.dragUp);
  }

  stopDrag = () => {
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
    if (this.dragMove) window.removeEventListener('mousemove', this.dragMove);
    if (this.dragUp) window.removeEventListener('mouseup', this.dragUp);
    this.dragMove = null;
    this.dragUp = null;
  }

  load = async () => {
    const bundle = await loadBundle(this.props.screenId, this.props.domain);
    const version = ((bundle && bundle.versions) || []).find((item) => item.versionId === this.versionId) || null;
    const files = version ? fileSheet(bundle, version, this.props.domain) : [];
    this.setState({
      bundle,
      version,
      dsFiles: dataset(files),
      dsStage: dataset(this.countRows(bundle, 'stage')),
      dsOfficial: dataset(this.countRows(bundle, 'official')),
    });
  }

  countRows(bundle, phase) {
    return ((bundle && bundle.stages) || []).filter((item) => (
      item.versionId === this.versionId && item.phase === phase
    ));
  }

  onApprove = async () => {
    const result = await saveWork(this.props.screenId, {
      domain: this.props.domain,
      action: 'approve',
      versionId: this.versionId,
    });
    if (!result || !result.ok) {
      ComLib.openAlertDialog((result && result.message) || '승인하지 못했습니다.');
      return;
    }
    ComLib.openAlertDialog(result.message);
    notifySaved(this.props);
    this.load();
  }

  renderVersionTable() {
    const { version } = this.state;
    const pair = versionPair(this.props.domain, version);
    return (
      <table className="scrm-table" style={{ width: '100%' }}>
        <tbody>
          <tr>
            <th className="scrm-table-th">버전명</th>
            <td className="scrm-table-td">{version.versionNm}</td>
            <th className="scrm-table-th">{pair.label}</th>
            <td className="scrm-table-td">{pair.value}</td>
          </tr>
          <tr>
            <th className="scrm-table-th">생성일</th>
            <td className="scrm-table-td">{version.createdYmd}</td>
            <th className="scrm-table-th">비고</th>
            <td className="scrm-table-td">{version.remark || '-'}</td>
          </tr>
        </tbody>
      </table>
    );
  }

  renderStepper() {
    const current = Number(this.state.version && this.state.version.stage) || 1;
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {STEPS.map((label, index) => {
          const active = index + 1 === current;
          return (
            <React.Fragment key={label}>
              <div style={{
                minWidth: '132px',
                padding: '10px 16px',
                borderRadius: '999px',
                border: '1px solid var(--cw-border, #cbd5e1)',
                textAlign: 'center',
                background: active ? 'var(--cw-primary, #1e3a5f)' : '#fff',
                color: active ? '#fff' : 'inherit',
                fontWeight: active ? 700 : 400,
              }}
              >
                {label}
              </div>
              {index < STEPS.length - 1 ? (
                <div style={{ height: '22px', lineHeight: '22px', color: 'var(--cw-text-secondary)' }}>↓</div>
              ) : null}
            </React.Fragment>
          );
        })}
      </div>
    );
  }

  renderFileSection(gridId) {
    const files = this.state.version
      ? fileSheet(this.state.bundle, this.state.version, this.props.domain)
      : [];
    const summary = loadSummary(files);
    const warn = { color: '#fecaca', fontWeight: 700 };
    return (
      <ComponentPanel>
        <div style={sectionHead}>
          <strong>파일 업로드</strong>
          <span style={{ fontSize: '12px' }}>
            {`파일 적재 상태 : ${summary.fraction}, 상태 : `}
            <span style={summary.state === '미적재' ? warn : undefined}>{summary.state}</span>
          </span>
        </div>
        <Grid
          id={`${gridId}-files`}
          areaName="파일 업로드"
          header={[
            { headerName: '파일 종류', field: 'fileKind', width: 200 },
            { headerName: '업로드 파일명', field: 'fileName', width: 280 },
            {
              headerName: '적재 여부',
              field: 'loadedText',
              width: 110,
              cellStyle: (params) => (params.value === '미적재' ? { color: '#dc2626', fontWeight: 700 } : {}),
            },
          ]}
          data={this.state.dsFiles}
          rowNum
          height="168px"
        />
      </ComponentPanel>
    );
  }

  renderCountSection(title, gridId, rows, columns, data) {
    const stateText = rows.length > 0 && rows.every((item) => item.status === '정상')
      ? '정상'
      : (rows.length ? '확인' : '없음');
    return (
      <ComponentPanel>
        <div style={sectionHead}>
          <strong>{title}</strong>
          <span style={{ fontSize: '12px' }}>{`상태 : ${stateText}`}</span>
        </div>
        <Grid
          id={gridId}
          areaName={title}
          header={columns}
          data={data}
          rowNum
          height="150px"
        />
      </ComponentPanel>
    );
  }

  renderPending(title, message) {
    return (
      <ComponentPanel>
        <div style={sectionHead}>
          <strong>{title}</strong>
          <span style={{ fontSize: '12px' }}>상태 : 정상</span>
        </div>
        <div style={{ minHeight: '120px' }}>
          <Note>{message}</Note>
        </div>
      </ComponentPanel>
    );
  }

  renderRight() {
    if (this.props.domain === 'CTM' || this.props.domain === 'HIF') {
      return (
        <React.Fragment>
          {this.renderFileSection(this.props.domain === 'HIF' ? 'HIF1070' : 'CTM1060')}
          {this.renderPending(
            '스테이지 테이블',
            '해당 화면은 확인이 필요합니다. 각 스테이지별로 어떤 데이터가 필요한지 협의가 필요합니다.',
          )}
          {this.renderPending(
            '테이블 적재',
            '해당 화면은 확인이 필요합니다. 최종 적재 시 어떤 데이터 목록 또는 통계 건수를 보여줄지 확인이 필요합니다.',
          )}
        </React.Fragment>
      );
    }
    const stageRows = this.countRows(this.state.bundle, 'stage');
    const officialRows = this.countRows(this.state.bundle, 'official');
    return (
      <React.Fragment>
        {this.renderFileSection('OMP1050')}
        {this.renderCountSection(
          '스테이지 테이블',
          'OMP1050-stage',
          stageRows,
          [
            { headerName: '테이블', field: 'tableName', width: 200 },
            { headerName: '이전 버전', field: 'leftCount', width: 130, textAlign: 'right' },
            { headerName: '현재 버전', field: 'rightCount', width: 130, textAlign: 'right' },
            { headerName: '상태', field: 'status', width: 90 },
            { headerName: '비고', field: 'remark', width: 100 },
          ],
          this.state.dsStage,
        )}
        {this.renderCountSection(
          '테이블 적재',
          'OMP1050-official',
          officialRows,
          [
            { headerName: '테이블', field: 'tableName', width: 200 },
            { headerName: '스테이지 테이블', field: 'leftCount', width: 140, textAlign: 'right' },
            { headerName: '현재 버전', field: 'rightCount', width: 130, textAlign: 'right' },
            { headerName: '상태', field: 'status', width: 90 },
            { headerName: '비고', field: 'remark', width: 100 },
          ],
          this.state.dsOfficial,
        )}
      </React.Fragment>
    );
  }

  render() {
    const { version } = this.state;
    const title = domainTitle(this.props.domain);
    const left = `calc((100% - 8px) * ${this.state.leftRatio})`;
    return (
      <FullPanel>
        <div ref={this.splitRef} style={{ display: 'flex', alignItems: 'stretch', minHeight: '100%' }}>
          <div style={{ width: left, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <ComponentPanel>
              <h3 style={{ margin: '0 0 8px' }}>{`${title} 버전 정보`}</h3>
              {version ? this.renderVersionTable() : <p>코드 관리에서 버전을 선택한 뒤 상세 보기를 열어 주세요.</p>}
            </ComponentPanel>
            <div style={{ flex: '1 1 auto' }}>
              <ComponentPanel height="100%">
                <h3 style={{ margin: '0 0 12px' }}>{`${title} 적재 단계`}</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', minHeight: '220px' }}>
                  {this.renderStepper()}
                  <p style={{ flex: 1, margin: 0, textAlign: 'center', color: 'var(--cw-text-secondary)' }}>
                    각 단계별 검수 그리드는 오른쪽에 표시됩니다.
                  </p>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
                  <BasicButton
                    value="승인"
                    color="blue"
                    filled
                    disabled={!version || Number(version.stage) >= 3}
                    onClick={this.onApprove}
                  />
                </div>
              </ComponentPanel>
            </div>
          </div>
          <div
            role="separator"
            aria-orientation="vertical"
            title="좌우로 끌어 영역 너비를 바꿉니다"
            onMouseDown={this.startDrag}
            style={{
              flex: '0 0 8px',
              cursor: 'col-resize',
              display: 'flex',
              justifyContent: 'center',
            }}
          >
            <div style={{ width: '2px', height: '100%', background: 'var(--cw-border, #9ca3af)' }} />
          </div>
          <div style={{ flex: '1 1 auto', minWidth: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {this.renderRight()}
          </div>
        </div>
      </FullPanel>
    );
  }
}

export default DetailPopup;
