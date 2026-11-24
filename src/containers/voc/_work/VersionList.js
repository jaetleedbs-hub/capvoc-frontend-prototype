import React from 'react';
import { ComLib, DataLib } from 'common';
import {
  BasicButton,
  ComponentPanel,
  FlexPanel,
  BottomPanel,
  FullPanel,
  Grid,
  InputCalendar,
  Label,
  LFloatArea,
  RelativeGroup,
  RFloatArea,
  SearchPanel,
  Selectbox,
  SubFullPanel,
  Textfield,
} from 'components';
import { domainTitle, loadBundle, toCompactDate } from './client';
import { Note, SearchActions, StatCards } from './ui';

/**
 * 버전 목록. 설계서의 코드 관리 화면이다.
 * 통계는 구분별 건수만 카드로 보여 준다. 어떤 지표를 넣을지는 아직 협의 전이다.
 */
class VersionList extends React.Component {
  constructor(props) {
    super(props);
    this.splitRef = React.createRef();
    this.state = {
      bundle: null,
      dsVersion: DataLib.datalist.getInstance(),
      draft: { keyword: '', termKind: '', siteName: '', from: '20260801', to: '20260831' },
      applied: { keyword: '', termKind: '', siteName: '', from: '20260801', to: '20260831' },
      selected: null,
      leftRatio: 0.5,
    };
  }

  componentWillUnmount() {
    this.stopDrag();
  }

  componentDidMount() {
    this.load();
  }

  load = async () => {
    const bundle = await loadBundle(this.props.screenId, this.props.domain);
    const versions = (bundle && bundle.versions) || [];
    this.setState({
      bundle,
      dsVersion: this.dataset(versions, this.state.applied),
      selected: null,
    });
  }

  rows = (applied = this.state.applied, versions) => {
    const source = versions || ((this.state.bundle && this.state.bundle.versions) || []);
    return source.filter((row) => {
      if (this.props.domain === 'OMP') {
        if (!applied.keyword) return true;
        return String(row.athenaVersion || '').toLowerCase().includes(applied.keyword.toLowerCase());
      }
      if (this.props.domain === 'HIF') {
        if (applied.siteName && row.siteName !== applied.siteName) return false;
        if (applied.from && String(row.createdYmd).replace(/-/g, '') < applied.from) return false;
        if (applied.to && String(row.createdYmd).replace(/-/g, '') > applied.to) return false;
        return true;
      }
      if (applied.termKind && row.termKind !== applied.termKind) return false;
      if (applied.from && String(row.createdYmd).replace(/-/g, '') < applied.from) return false;
      if (applied.to && String(row.createdYmd).replace(/-/g, '') > applied.to) return false;
      return true;
    }).map((row) => ({
      ...row,
      archiveText: row.archiveYn === 'Y' ? '있음' : '없음',
    }));
  }

  dataset(versions, applied) {
    const list = DataLib.datalist.getInstance();
    list.setRecords(this.rows(applied, versions));
    return list;
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

  stats = () => {
    const versions = (this.state.bundle && this.state.bundle.versions) || [];
    const count = (stage) => versions.filter((row) => row.stage === stage).length;
    return [
      { label: '버전', value: versions.length },
      { label: '파일 업로드', value: count(1) },
      { label: '스테이지 적재', value: count(2) },
      { label: '정식 적재', value: count(3) },
    ];
  }

  requireSelection = () => {
    if (this.state.selected) return true;
    ComLib.openAlertDialog('버전을 선택해 주세요.');
    return false;
  }

  openForm = (mode) => {
    if (mode === 'edit' && !this.requireSelection()) return;
    const version = mode === 'edit' ? this.state.selected : null;
    ComLib.openPop(this.props.formId, mode === 'edit' ? '버전 수정' : this.props.formTitle, {
      modaless: false,
      width: '720',
      height: '520',
      param: { mode, versionId: version && version.versionId },
      callback: () => this.load(),
    });
  }

  openChild = (screenId, title, width, height) => {
    if (!this.requireSelection()) return;
    ComLib.openPop(screenId, title, {
      modaless: false,
      width: width || '1100',
      height: height || '760',
      param: { versionId: this.state.selected.versionId },
      callback: () => this.load(),
    });
  }

  renderSearchFields() {
    const { draft, bundle } = this.state;
    if (this.props.domain === 'HIF') {
      const sites = [{ value: '', name: '전체' }].concat(((bundle && bundle.sites) || []).map((site) => ({
        value: site,
        name: site,
      })));
      return (
        <FlexPanel>
          <Label value="생성일" />
          <InputCalendar
            id="hif-from"
            value={draft.from}
            onChange={(event) => this.setState({ draft: { ...draft, from: event.target.value || '' } })}
          />
          <span>~</span>
          <InputCalendar
            id="hif-to"
            value={draft.to}
            onChange={(event) => this.setState({ draft: { ...draft, to: event.target.value || '' } })}
          />
          <Label value="기관" />
          <Selectbox
            id="hif-site"
            value={draft.siteName}
            dataset={sites}
            width="180px"
            onChange={(event) => this.setState({ draft: { ...draft, siteName: event.target.value } })}
          />
        </FlexPanel>
      );
    }
    if (this.props.domain === 'CTM') {
      const kinds = [{ value: '', name: '전체' }].concat(((bundle && bundle.termKinds) || []).map((kind) => ({
        value: kind,
        name: kind,
      })));
      return (
        <FlexPanel>
          <Label value="공통용어구분" />
          <Selectbox
            id="ctm-kind"
            value={draft.termKind}
            dataset={kinds}
            width="160px"
            onChange={(event) => this.setState({ draft: { ...draft, termKind: event.target.value } })}
          />
          <Label value="생성일" />
          <InputCalendar
            id="ctm-from"
            value={draft.from}
            onChange={(event) => this.setState({ draft: { ...draft, from: event.target.value || '' } })}
          />
          <span>~</span>
          <InputCalendar
            id="ctm-to"
            value={draft.to}
            onChange={(event) => this.setState({ draft: { ...draft, to: event.target.value || '' } })}
          />
        </FlexPanel>
      );
    }
    return (
      <FlexPanel>
        <Label value="아테나 버전" />
        <Textfield
          id="omp-athena"
          value={draft.keyword}
          width="220px"
          onChange={(event) => this.setState({ draft: { ...draft, keyword: event.target.value } })}
          onKeyDown={(event) => { if (event.key === 'Enter') this.onSearch(); }}
        />
      </FlexPanel>
    );
  }

  renderSearch() {
    return (
      <SearchPanel>
        <RelativeGroup>
          <LFloatArea>
            {this.renderSearchFields()}
          </LFloatArea>
          <RFloatArea>
            <SearchActions onSearch={this.onSearch} onReset={this.onReset} />
          </RFloatArea>
        </RelativeGroup>
      </SearchPanel>
    );
  }

  onReset = () => {
    const applied = { keyword: '', termKind: '', siteName: '', from: '20260801', to: '20260831' };
    this.setState({
      draft: { ...applied },
      applied,
      selected: null,
      dsVersion: this.dataset((this.state.bundle && this.state.bundle.versions) || [], applied),
    });
  }

  onSearch = () => {
    const { draft } = this.state;
    const applied = {
      keyword: draft.keyword.trim(),
      termKind: draft.termKind,
      siteName: draft.siteName,
      from: toCompactDate(draft.from),
      to: toCompactDate(draft.to),
    };
    this.setState({
      applied,
      selected: null,
      dsVersion: this.dataset((this.state.bundle && this.state.bundle.versions) || [], applied),
    });
  }

  renderActions() {
    return (
      <React.Fragment>
        <BasicButton value="신규" color="blue" filled onClick={() => this.openForm('new')} />
        <BasicButton value="수정" onClick={() => this.openForm('edit')} />
        <BasicButton
          value="파일등록"
          onClick={() => this.openChild(
            this.props.fileId,
            '파일 등록',
            '1280',
            '820',
          )}
        />
        <BasicButton
          value="상세보기"
          onClick={() => this.openChild(
            this.props.detailId,
            '상세 보기',
            '1280',
            '860',
          )}
        />
      </React.Fragment>
    );
  }

  renderSplit(columns) {
    const left = `calc((100% - 8px) * ${this.state.leftRatio})`;
    const ctm = this.props.domain === 'CTM';
    const hif = this.props.domain === 'HIF';
    const gridId = hif ? 'HIF1030-versions' : (ctm ? 'CTM1010-versions' : 'OMP1010-versions');
    return (
      <FullPanel>
        <div ref={this.splitRef} style={{ display: 'flex', alignItems: 'stretch', minHeight: 'calc(100vh - 210px)' }}>
          <div style={{ width: left, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
            {this.renderSearch()}
            <SubFullPanel>
              <ComponentPanel>
                <RelativeGroup>
                  <LFloatArea>
                    <h3>버전 목록</h3>
                  </LFloatArea>
                </RelativeGroup>
                <Grid
                  id={gridId}
                  areaName="버전 목록"
                  header={columns}
                  data={this.state.dsVersion}
                  rowNum
                  height={ctm || hif ? 'calc(100vh - 470px)' : 'calc(100vh - 430px)'}
                  rowSelection="single"
                  onRowClicked={(event) => this.setState({ selected: event.data })}
                />
              </ComponentPanel>
              <BottomPanel>
                <RelativeGroup>
                  <RFloatArea>
                    {this.renderActions()}
                  </RFloatArea>
                </RelativeGroup>
              </BottomPanel>
            </SubFullPanel>
            <Note>
              분리보관은 이력 테이블에 그 버전이 있는지를 나타냅니다. 이력은 일정 기간이 지나면 삭제될 예정입니다.
            </Note>
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
          <div style={{ flex: '1 1 auto', minWidth: 0 }}>
            <ComponentPanel height="100%">
              <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                <h3 style={{ margin: '0 0 8px' }}>{`${domainTitle(this.props.domain)} 버전 통계`}</h3>
                <Note>
                  통계 항목과 표기 방법은 협의 전입니다. 각 통계를 별도의 영역으로 보여 줍니다.
                </Note>
                <div style={{ flex: '1 1 auto', minHeight: '280px' }}>
                  <StatCards items={this.stats()} direction="column" fill />
                </div>
              </div>
            </ComponentPanel>
          </div>
        </div>
      </FullPanel>
    );
  }

  render() {
    const columns = this.props.domain === 'HIF'
      ? [
        { headerName: '버전명', field: 'versionNm', width: 220 },
        { headerName: '기관', field: 'siteName', width: 160 },
        { headerName: '생성일', field: 'createdYmd', width: 120 },
        { headerName: '비고', field: 'remark', width: 160 },
        { headerName: '분리보관', field: 'archiveText', width: 100 },
      ]
      : this.props.domain === 'OMP'
      ? [
        { headerName: '아테나 버전', field: 'athenaVersion', width: 180 },
        { headerName: '생성일', field: 'createdYmd', width: 120 },
        { headerName: '비고', field: 'remark', width: 160 },
        { headerName: '분리보관', field: 'archiveText', width: 100 },
      ]
      : [
        { headerName: '버전명', field: 'versionNm', width: 220 },
        { headerName: '공통용어구분', field: 'termKind', width: 160 },
        { headerName: '생성일', field: 'createdYmd', width: 120 },
        { headerName: '비고', field: 'remark', width: 160 },
        { headerName: '분리보관', field: 'archiveText', width: 100 },
      ];
    return this.renderSplit(columns);
  }
}

export default VersionList;
