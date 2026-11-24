import React from 'react';
import { DataLib } from 'common';
import {
  ComponentPanel,
  FlexPanel,
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
import { loadBundle, toCompactDate } from './client';
import { Note, SearchActions } from './ui';

const GUBUN = [
  { value: '', name: '전체' },
  { value: '급여', name: '급여' },
  { value: '비급여', name: '비급여' },
];

function pairText(value) {
  const text = String(value || '').trim();
  if (!text) return '';
  return text.charAt(0) === '[' ? text : `[${text}]`;
}

function dataset(rows) {
  const list = DataLib.datalist.getInstance();
  list.setRecords(rows || []);
  return list;
}

const INITIAL_DRAFT = {
  versionId: '',
  termKind: '',
  refKind: '',
  from: '20260801',
  to: '20260831',
  gubun: '',
  sourceCode: '',
  sourceName: '',
};

class CtmLookup extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      bundle: null,
      draft: { ...INITIAL_DRAFT },
      applied: { ...INITIAL_DRAFT },
      dsCode: dataset([]),
    };
  }

  componentDidMount() {
    this.load();
  }

  load = async () => {
    const bundle = await loadBundle('CTM1020', 'CTM');
    this.setState({
      bundle,
      dsCode: dataset(this.records(bundle, this.state.applied)),
    });
  }

  appliedFrom(draft) {
    return {
      ...draft,
      from: toCompactDate(draft.from),
      to: toCompactDate(draft.to),
      sourceCode: draft.sourceCode.trim(),
      sourceName: draft.sourceName.trim(),
    };
  }

  onSearch = () => {
    const applied = this.appliedFrom(this.state.draft);
    this.setState({
      applied,
      dsCode: dataset(this.records(this.state.bundle, applied)),
    });
  }

  onReset = () => {
    const draft = { ...INITIAL_DRAFT };
    const applied = this.appliedFrom(draft);
    this.setState({
      draft,
      applied,
      dsCode: dataset(this.records(this.state.bundle, applied)),
    });
  }

  records(bundle, applied) {
    const source = bundle || {};
    const versions = source.versions || [];
    return (source.codes || []).filter((row) => {
      const version = versions.find((item) => item.versionId === row.versionId);
      const created = version ? String(version.createdYmd).replace(/-/g, '') : '';
      if (applied.versionId && row.versionId !== applied.versionId) return false;
      if (applied.termKind && row.termKind !== applied.termKind) return false;
      if (applied.refKind && row.refKind !== applied.refKind) return false;
      if (applied.gubun && row.gubun !== applied.gubun) return false;
      if (applied.from && created < applied.from) return false;
      if (applied.to && created > applied.to) return false;
      if (applied.sourceCode && !String(row.sourceCode).toLowerCase().includes(applied.sourceCode.toLowerCase())) return false;
      if (applied.sourceName && !String(row.sourceName).toLowerCase().includes(applied.sourceName.toLowerCase())) return false;
      return true;
    }).map((row) => {
      const version = versions.find((item) => item.versionId === row.versionId);
      return {
        ...row,
        versionNm: version ? version.versionNm : row.versionId,
        attributeText: pairText(row.codeAttribute),
        classText: pairText(row.classCode1),
      };
    });
  }

  render() {
    const bundle = this.state.bundle || {};
    const { draft } = this.state;
    const termKinds = [{ value: '', name: '전체' }].concat((bundle.termKinds || []).map((kind) => ({ value: kind, name: kind })));
    const versionRows = (bundle.versions || []).filter((row) => row.termKind === draft.termKind);
    const versions = [{ value: '', name: '전체' }].concat(versionRows.map((row) => ({ value: row.versionId, name: row.versionNm })));
    const refs = draft.termKind ? (bundle.refKinds || {})[draft.termKind] || [] : [];
    const refOptions = [{ value: '', name: '전체' }].concat(refs.map((kind) => ({ value: kind, name: kind })));
    return (
      <FullPanel>
        <SearchPanel className="sys-search-panel">
          <RelativeGroup>
            <LFloatArea style={{ flexDirection: 'column', width: 'calc(100% - 120px)' }}>
              <FlexPanel>
                <Label value="공통용어구분" />
                <Selectbox
                  id="ctm1020-kind"
                  value={draft.termKind}
                  dataset={termKinds}
                  width="160px"
                  onChange={(event) => this.setState({ draft: { ...draft, termKind: event.target.value, versionId: '', refKind: '' } })}
                />
                <Label value="Version" />
                <Selectbox
                  id="ctm1020-version"
                  value={draft.versionId}
                  dataset={versions}
                  width="220px"
                  disabled={!draft.termKind}
                  onChange={(event) => this.setState({ draft: { ...draft, versionId: event.target.value } })}
                />
                <Label value="참조구분" />
                <Selectbox
                  id="ctm1020-ref"
                  value={draft.refKind}
                  dataset={refOptions}
                  width="140px"
                  disabled={!draft.termKind}
                  onChange={(event) => this.setState({ draft: { ...draft, refKind: event.target.value } })}
                />
              </FlexPanel>
              <FlexPanel>
                <Label value="생성일" />
                <InputCalendar
                  id="ctm1020-from"
                  value={draft.from}
                  onChange={(event) => this.setState({ draft: { ...draft, from: event.target.value || '' } })}
                />
                <span>~</span>
                <InputCalendar
                  id="ctm1020-to"
                  value={draft.to}
                  onChange={(event) => this.setState({ draft: { ...draft, to: event.target.value || '' } })}
                />
                <Label value="급여" />
                <Selectbox
                  id="ctm1020-gubun"
                  value={draft.gubun}
                  dataset={GUBUN}
                  width="120px"
                  onChange={(event) => this.setState({ draft: { ...draft, gubun: event.target.value } })}
                />
                <Label value="공통용어코드" />
                <Textfield
                  id="ctm1020-code"
                  value={draft.sourceCode}
                  width="140px"
                  onChange={(event) => this.setState({ draft: { ...draft, sourceCode: event.target.value } })}
                  onKeyDown={(event) => { if (event.key === 'Enter') this.onSearch(); }}
                />
              </FlexPanel>
            </LFloatArea>
            <RFloatArea>
              <SearchActions onSearch={this.onSearch} onReset={this.onReset} />
            </RFloatArea>
          </RelativeGroup>
        </SearchPanel>
        <SubFullPanel>
          <ComponentPanel>
            <RelativeGroup>
              <LFloatArea>
                <h3>공통용어 목록</h3>
              </LFloatArea>
            </RelativeGroup>
            <Note>공통용어구분을 고르면 그 구분의 Version과 참조구분만 고를 수 있습니다. 코드분류와 코드값 세트는 [코드분류 : 코드값]으로 보여 줍니다.</Note>
            <Note>버전 비교가 필요하면 화면을 더하거나 이 조회를 탭으로 나눠야 합니다. 기타 조건은 협의 전이라 두지 않았습니다.</Note>
            <Grid
              id="CTM1020-codes"
              areaName="공통용어 목록"
              header={[
                { headerName: '버전명', field: 'versionNm', width: 180 },
                { headerName: '공통용어구분', field: 'termKind', width: 140 },
                { headerName: '참조구분', field: 'refKind', width: 110 },
                { headerName: '공통용어코드', field: 'sourceCode', width: 140 },
                { headerName: '공통용어명', field: 'sourceName', width: 240 },
                { headerName: '추가명', field: 'sourceNameAdd', width: 160 },
                { headerName: '급여', field: 'gubun', width: 180 },
                { headerName: 'Code Attribute', field: 'attributeText', width: 230 },
                { headerName: 'Class Code 1', field: 'classText', width: 160 },
              ]}
              data={this.state.dsCode}
              rowNum
              height="calc(100vh - 430px)"
              rowSelection="single"
            />
          </ComponentPanel>
        </SubFullPanel>
      </FullPanel>
    );
  }
}

export default CtmLookup;
