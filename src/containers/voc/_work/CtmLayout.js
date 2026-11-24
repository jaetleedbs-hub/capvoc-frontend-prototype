import React from 'react';
import { ComLib, DataLib } from 'common';
import {
  BasicButton,
  BottomPanel,
  ComponentPanel,
  FullPanel,
  Grid,
  LFloatArea,
  RelativeGroup,
  RFloatArea,
} from 'components';
import { loadBundle, saveWork } from './client';
import { Note } from './ui';

const TARGETS = [
  'source_code',
  'source_name',
  'source_name_add',
  'code_attribute_코드분류',
  'code_attribute_코드값',
  'class_code_1_코드분류',
  'class_code_1_코드값',
  'class_code_2_코드분류',
  'class_code_2_코드값',
  'add_info_1_코드분류',
  'add_info_1_코드값',
];

const MAP_TYPES = ['컬럼명', '고정값', '빈값'];

function dataset(rows) {
  const list = DataLib.datalist.getInstance();
  list.setRecords(rows || []);
  return list;
}

function namedRows(names) {
  return (names || []).map((name) => ({ name }));
}

function rowsFor(layouts, termKind, refKind) {
  const saved = (layouts || []).filter((item) => item.termKind === termKind && item.refKind === refKind);
  if (saved.length > 0) {
    return saved.map((item) => ({
      termKind,
      refKind,
      targetColumnId: item.targetColumnId,
      mapType: item.mapType || '컬럼명',
      mapValue: item.mapType === '빈값' ? '' : (item.mapValue || ''),
    }));
  }
  return TARGETS.map((targetColumnId) => ({
    termKind,
    refKind,
    targetColumnId,
    mapType: '컬럼명',
    mapValue: '',
  }));
}

const selectedRow = { background: 'rgba(37, 99, 235, 0.18)' };

class CtmLayout extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      bundle: null,
      termKind: '',
      refKind: '',
      rows: [],
      dsTerm: dataset([]),
      dsRef: dataset([]),
      dsLayout: dataset([]),
    };
  }

  componentDidMount() {
    this.load('EDI-DRUG', '급여');
  }

  applySelection(bundle, termKind, refKind) {
    const kinds = (bundle && bundle.termKinds) || [];
    const kind = kinds.includes(termKind) ? termKind : (kinds[0] || '');
    const refs = (bundle && bundle.refKinds && bundle.refKinds[kind]) || [];
    const ref = refs.includes(refKind) ? refKind : (refs[0] || '');
    const rows = kind && ref ? rowsFor(bundle && bundle.layouts, kind, ref) : [];
    return {
      bundle,
      termKind: kind,
      refKind: ref,
      rows,
      dsTerm: dataset(namedRows(kinds)),
      dsRef: dataset(namedRows(refs)),
      dsLayout: dataset(rows),
    };
  }

  load = async (termKind, refKind) => {
    const bundle = await loadBundle('CTM1030', 'CTM');
    this.setState(this.applySelection(bundle, termKind, refKind));
  }

  chooseTerm = (termKind) => {
    this.setState(this.applySelection(this.state.bundle, termKind, ''));
  }

  chooseRef = (refKind) => {
    this.setState(this.applySelection(this.state.bundle, this.state.termKind, refKind));
  }

  onLayoutChanged = (event) => {
    const rows = (event.data || []).filter((row) => row.targetColumnId).map((row) => ({
      termKind: this.state.termKind,
      refKind: this.state.refKind,
      targetColumnId: row.targetColumnId,
      mapType: row.mapType || '컬럼명',
      mapValue: row.mapType === '빈값' ? '' : (row.mapValue || ''),
    }));
    this.setState({ rows, dsLayout: dataset(rows) });
  }

  onSave = async () => {
    const result = await saveWork('CTM1030', {
      domain: 'CTM',
      action: 'saveLayout',
      termKind: this.state.termKind,
      refKind: this.state.refKind,
      rows: this.state.rows,
    });
    if (!result || !result.ok) {
      ComLib.openAlertDialog((result && result.message) || '저장하지 못했습니다.');
      return;
    }
    ComLib.openAlertDialog(result.message);
    this.load(this.state.termKind, this.state.refKind);
  }

  render() {
    const { termKind, refKind } = this.state;
    return (
      <FullPanel>
        <Note>
          공통용어구분, 참조구분, 컬럼 레이아웃 순으로 고릅니다. 위 목록을 고르면 다음 목록이 그 하위로 바뀝니다.
        </Note>
        <Note>
          참조구분은 그 구분의 신규 버전에 올릴 파일 목록과 같고, 시스템 공통코드로 관리할 예정입니다.
        </Note>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'stretch' }}>
          <div style={{ width: '260px', minWidth: 0 }}>
            <ComponentPanel>
              <h3 style={{ margin: '0 0 8px' }}>공통용어구분</h3>
              <Grid
                id="CTM1030-terms"
                areaName="공통용어구분"
                header={[{ headerName: '공통용어구분', field: 'name', width: 180 }]}
                data={this.state.dsTerm}
                rowNum
                height="calc(100vh - 320px)"
                rowSelection="single"
                onRowClicked={(event) => this.chooseTerm(event.data.name)}
                getRowStyle={(params) => (params.data && params.data.name === termKind ? selectedRow : undefined)}
              />
            </ComponentPanel>
          </div>
          <div style={{ width: '220px', minWidth: 0 }}>
            <ComponentPanel>
              <h3 style={{ margin: '0 0 8px' }}>참조구분</h3>
              <Grid
                id="CTM1030-refs"
                areaName="참조구분"
                header={[{ headerName: '참조구분', field: 'name', width: 140 }]}
                data={this.state.dsRef}
                rowNum
                height="calc(100vh - 320px)"
                rowSelection="single"
                onRowClicked={(event) => this.chooseRef(event.data.name)}
                getRowStyle={(params) => (params.data && params.data.name === refKind ? selectedRow : undefined)}
              />
            </ComponentPanel>
          </div>
          <div style={{ flex: '1 1 auto', minWidth: 0 }}>
            <ComponentPanel>
              <RelativeGroup>
                <LFloatArea>
                  <h3>컬럼 레이아웃</h3>
                </LFloatArea>
              </RelativeGroup>
              <Grid
                id="CTM1030-layout"
                areaName="컬럼 레이아웃"
                header={[
                  { headerName: 'Target Column ID', field: 'targetColumnId', width: 240 },
                  {
                    headerName: '매핑',
                    field: 'mapType',
                    width: 120,
                    editable: true,
                    cellEditor: 'agSelectCellEditor',
                    cellEditorParams: { values: MAP_TYPES },
                  },
                  {
                    headerName: '값',
                    field: 'mapValue',
                    width: 220,
                    editable: (params) => !params.data || params.data.mapType !== '빈값',
                  },
                ]}
                data={this.state.dsLayout}
                rowNum
                height="calc(100vh - 380px)"
                onCellValueChanged={this.onLayoutChanged}
              />
              <BottomPanel>
                <RelativeGroup>
                  <RFloatArea>
                    <BasicButton value="저장" color="blue" filled disabled={!termKind || !refKind} onClick={this.onSave} />
                  </RFloatArea>
                </RelativeGroup>
              </BottomPanel>
            </ComponentPanel>
          </div>
        </div>
      </FullPanel>
    );
  }
}

export default CtmLayout;
