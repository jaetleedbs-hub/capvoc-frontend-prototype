import React from 'react';
import { ComLib, DataLib } from 'common';
import {
  BasicButton,
  ComponentPanel,
  FullPanel,
  Grid,
} from 'components';
import { domainTitle, fileSheet, loadBundle, notifySaved, paramOf, saveWork, versionPair } from './client';
import { Note } from './ui';

class FilePopup extends React.Component {
  constructor(props) {
    super(props);
    this.versionId = paramOf(props).versionId || '';
    this.splitRef = React.createRef();
    this.state = {
      bundle: null,
      version: null,
      fileKind: '',
      fileName: '',
      dsFiles: DataLib.datalist.getInstance(),
      dsHist: DataLib.datalist.getInstance(),
      leftRatio: 0.5,
    };
  }

  toDataset(rows) {
    const list = DataLib.datalist.getInstance();
    list.setRecords(rows || []);
    return list;
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
    const rows = version ? fileSheet(bundle, version, this.props.domain) : [];
    this.setState((prev) => {
      const fileKind = prev.fileKind || (rows[0] && rows[0].fileKind) || '';
      return {
        bundle,
        version,
        fileKind,
        dsFiles: this.toDataset(rows),
        dsHist: this.toDataset(this.historyRows(bundle, fileKind)),
      };
    });
  }

  rows = () => {
    if (!this.state.bundle || !this.state.version) return [];
    return fileSheet(this.state.bundle, this.state.version, this.props.domain);
  }

  historyRows(bundle, fileKind) {
    if (!bundle) return [];
    return (bundle.histories || []).filter((item) => (
      item.versionId === this.versionId && item.fileKind === fileKind
    ));
  }

  histories = () => this.historyRows(this.state.bundle, this.state.fileKind)

  chooseKind = (fileKind) => {
    this.setState({
      fileKind,
      dsHist: this.toDataset(this.historyRows(this.state.bundle, fileKind)),
    });
  }

  onFile = (event) => {
    const file = event.target.files && event.target.files[0];
    this.setState({ fileName: file ? file.name : '' });
  }

  renderVersionTable() {
    const { version } = this.state;
    return (
      <table className="scrm-table" style={{ width: '100%' }}>
        <tbody>
          <tr>
            <th className="scrm-table-th">버전명</th>
            <td className="scrm-table-td">{version.versionNm}</td>
            <th className="scrm-table-th">{versionPair(this.props.domain, version).label}</th>
            <td className="scrm-table-td">{versionPair(this.props.domain, version).value}</td>
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

  renderSplit() {
    const { version } = this.state;
    const locked = !version || version.stage >= 3;
    const title = domainTitle(this.props.domain);
    const gridId = { CTM: 'CTM1050', HIF: 'HIF1060', OMP: 'OMP1040' }[this.props.domain] || 'OMP1040';
    const left = `calc((100% - 8px) * ${this.state.leftRatio})`;
    return (
      <FullPanel>
        <div ref={this.splitRef} style={{ display: 'flex', alignItems: 'stretch', minHeight: '100%' }}>
          <div style={{ width: left, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <ComponentPanel>
              <h3 style={{ margin: '0 0 8px', textAlign: 'center' }}>{`${title} 버전 정보`}</h3>
              {version ? this.renderVersionTable() : <p>코드 관리에서 버전을 선택한 뒤 파일 등록을 열어 주세요.</p>}
            </ComponentPanel>
            <div style={{ flex: '1 1 auto' }}>
              <ComponentPanel height="100%">
                <h3 style={{ margin: '0 0 8px', textAlign: 'center' }}>{`${title} 파일 리스트`}</h3>
                <Grid
                  id={`${gridId}-files`}
                  areaName="파일 목록"
                  header={[
                    { headerName: '파일 종류', field: 'fileKind', width: 220 },
                    { headerName: '업로드 파일명', field: 'fileName', width: 260 },
                  ]}
                  data={this.state.dsFiles}
                  rowNum
                  height="360px"
                  rowSelection="single"
                  onRowClicked={(event) => this.chooseKind(event.data.fileKind)}
                />
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
            <ComponentPanel>
              <h3 style={{ margin: '0 0 8px', textAlign: 'center' }}>{`${title} 파일 정보`}</h3>
              <table className="scrm-table" style={{ width: '100%' }}>
                <tbody>
                  <tr>
                    <th className="scrm-table-th" style={{ width: '140px' }}>파일 종류</th>
                    <td className="scrm-table-td">{this.state.fileKind || '-'}</td>
                  </tr>
                </tbody>
              </table>
              <label
                htmlFor={`${gridId}-file`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minHeight: '140px',
                  marginTop: '12px',
                  border: '1px dashed var(--cw-border, #cbd5e1)',
                  borderRadius: '8px',
                  background: '#fff',
                  cursor: locked ? 'not-allowed' : 'pointer',
                  color: 'var(--cw-text-secondary)',
                }}
              >
                <input
                  id={`${gridId}-file`}
                  type="file"
                  disabled={locked}
                  onChange={this.onFile}
                  style={{ display: 'none' }}
                />
                <span>{this.state.fileName || '파일 업로드'}</span>
              </label>
              {locked ? <Note>정식 테이블 적재 단계에서는 파일을 수정할 수 없습니다.</Note> : (
                <Note>2단계에서 다시 올리면 1단계부터 다시 시작합니다.</Note>
              )}
            </ComponentPanel>
            <div style={{ flex: '1 1 auto' }}>
              <ComponentPanel height="100%">
                <h3 style={{ margin: '0 0 8px' }}>파일 등록 이력</h3>
                <Grid
                  id={`${gridId}-hist`}
                  areaName="파일 등록 이력"
                  header={[
                    { headerName: '업로드 파일명', field: 'fileName', width: 280 },
                    { headerName: '업로드 일시', field: 'uploadedAt', width: 180 },
                    { headerName: '등록자', field: 'uploader', width: 120 },
                  ]}
                  data={this.state.dsHist}
                  rowNum
                  height="220px"
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
                  <BasicButton value="저장" color="blue" filled disabled={locked} onClick={this.onSave} />
                </div>
              </ComponentPanel>
            </div>
          </div>
        </div>
      </FullPanel>
    );
  }

  onSave = async () => {
    const result = await saveWork(this.props.screenId, {
      domain: this.props.domain,
      action: 'uploadFile',
      versionId: this.versionId,
      fileKind: this.state.fileKind,
      fileName: this.state.fileName,
    });
    if (!result || !result.ok) {
      ComLib.openAlertDialog((result && result.message) || '파일을 등록하지 못했습니다.');
      return;
    }
    ComLib.openAlertDialog(result.message);
    notifySaved(this.props);
    this.setState({ fileName: '' }, () => this.load());
  }

  render() {
    return this.renderSplit();
  }
}

export default FilePopup;
