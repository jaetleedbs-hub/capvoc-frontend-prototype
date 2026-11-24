import React from 'react';
import { ComLib, DataLib } from 'common';
import {
  BasicButton,
  BottomPanel,
  ComponentPanel,
  FlexPanel,
  FullPanel,
  Grid,
  Label,
  LFloatArea,
  MulitSelectBox,
  RelativeGroup,
  RFloatArea,
  SearchPanel,
  Selectbox,
  SubFullPanel,
  Table,
  Textfield,
} from 'components';
import { loadBundle, saveWork } from '../_work/client';
import { Note, SearchActions } from '../_work/ui';

const YN = [{ value: 'Y', name: 'Y' }, { value: 'N', name: 'N' }];

const LOCALS = [1, 2, 3, 4];
const CONCEPTS = [1, 2, 3, 4, 5];

function blankForm() {
  const form = {
    siteName: '',
    domain: 'Order',
    commonMapYn: 'N',
    manualMapYn: 'N',
    deletedYn: 'N',
    deleteReason: '',
  };
  LOCALS.forEach((index) => {
    form[`localCd${index}`] = '';
    form[`localCd${index}Nm`] = '';
    form[`localCd${index}Type`] = '';
  });
  CONCEPTS.forEach((index) => {
    form[`concept${index}Id`] = '';
    form[`concept${index}Nm`] = '';
    form[`concept${index}Type`] = '';
  });
  return form;
}

const BLANK = blankForm();

function present(row) {
  const next = { ...BLANK, ...(row || {}) };
  CONCEPTS.forEach((index) => {
    if (!next[`concept${index}Id`] && row && row[`concept${index}`]) next[`concept${index}Id`] = row[`concept${index}`];
  });
  return next;
}

const CSV_HEADER = ['기관', '도메인']
  .concat(LOCALS.reduce((names, index) => names.concat([`local_cd${index}`, `local_cd${index}_nm`, `local_cd${index}_type`]), []))
  .concat(['공통코드매핑여부', '수동매핑여부', '삭제여부', '삭제사유'])
  .concat(CONCEPTS.reduce((names, index) => names.concat([`concept${index}_id`, `concept${index}_nm`, `concept${index}_type`]), []));

const LIST_HEADER = [
  { headerName: '기관', field: 'siteName', width: 140 },
  { headerName: '소스 도메인', field: 'domain', width: 120 },
].concat(LOCALS.reduce((columns, index) => columns.concat([
  { headerName: `local_cd${index}`, field: `localCd${index}`, width: 120 },
  { headerName: `local_cd${index}_nm`, field: `localCd${index}Nm`, width: 160 },
  { headerName: `local_cd${index}_type`, field: `localCd${index}Type`, width: 130 },
]), [])).concat([
  { headerName: '공통코드 매핑여부', field: 'commonMapYn', width: 140 },
  { headerName: '수동 매핑여부', field: 'manualMapYn', width: 120 },
  { headerName: '삭제여부', field: 'deletedYn', width: 90 },
  { headerName: '삭제 사유', field: 'deleteReason', width: 160 },
]).concat(CONCEPTS.reduce((columns, index) => columns.concat([
  { headerName: `concept${index}_id`, field: `concept${index}Id`, width: 130 },
  { headerName: `concept${index}_nm`, field: `concept${index}Nm`, width: 160 },
  { headerName: `concept${index}_type`, field: `concept${index}Type`, width: 140 },
]), []));

const INITIAL_APPLIED = { siteName: '', fields: [], keyword: '' };

function blankEtc() {
  return [
    { value: 'N', name: '기관코드', field: 'localCd1', key: 'localCd1' },
    { value: 'N', name: '기관코드명', field: 'localCd1Nm', key: 'localCd1Nm' },
  ];
}

function dataset(rows) {
  const list = DataLib.datalist.getInstance();
  list.setRecords(rows || []);
  return list;
}

function matches(row, applied) {
  if (applied.siteName && row.siteName !== applied.siteName) return false;
  const keyword = String(applied.keyword || '').trim().toLowerCase();
  if (keyword && applied.fields.length > 0) {
    const hit = applied.fields.some((field) => String(row[field] || '').toLowerCase().includes(keyword));
    if (!hit) return false;
  }
  return true;
}

class ExceptionMaster extends React.Component {
  constructor(props) {
    super(props);
    this.fileRef = React.createRef();
    this.state = {
      exceptions: [],
      siteName: '',
      etcKeyword: '',
      etcDataset: blankEtc(),
      etcKey: 0,
      applied: { ...INITIAL_APPLIED },
      mode: 'new',
      originalId: '',
      form: { ...BLANK },
      dsRow: dataset([]),
    };
  }

  componentDidMount() {
    this.load();
  }

  applyList(exceptions, applied, selectId, formSite) {
    const rows = exceptions.filter((row) => matches(row, applied));
    const current = selectId ? exceptions.find((item) => item.id === selectId) : null;
    const siteName = formSite || applied.siteName || (exceptions[0] && exceptions[0].siteName) || '';
    return {
      exceptions,
      applied,
      dsRow: dataset(rows.map(present)),
      mode: current ? 'edit' : 'new',
      originalId: current ? current.id : '',
      form: current ? present(current) : { ...BLANK, siteName },
    };
  }

  load = async (selectId) => {
    const bundle = await loadBundle('HIF1020', 'HIF');
    const exceptions = (bundle && bundle.exceptions) || [];
    const sites = (bundle && bundle.sites) || [];
    this.setState({
      sites,
      ...this.applyList(exceptions, this.state.applied, selectId),
    });
  }

  onSearch = () => {
    const applied = {
      siteName: this.state.siteName,
      fields: this.state.etcDataset.filter((item) => item.value === 'Y').map((item) => item.field),
      keyword: this.state.etcKeyword.trim(),
    };
    this.setState(this.applyList(this.state.exceptions, applied, ''));
  }

  onReset = () => {
    this.setState({
      siteName: '',
      etcKeyword: '',
      etcDataset: blankEtc(),
      etcKey: this.state.etcKey + 1,
      ...this.applyList(this.state.exceptions, { ...INITIAL_APPLIED }, ''),
    });
  }

  onNew = () => {
    const siteName = this.state.applied.siteName || (this.state.sites && this.state.sites[0]) || '';
    this.setState({ mode: 'new', originalId: '', form: { ...BLANK, siteName } });
  }

  setField = (field, value) => {
    this.setState({ form: { ...this.state.form, [field]: value } });
  }

  onSave = async () => {
    const result = await saveWork('HIF1020', {
      domain: 'HIF',
      action: 'saveException',
      mode: this.state.mode,
      originalId: this.state.originalId,
      row: this.state.form,
    });
    if (!result || !result.ok) {
      ComLib.openAlertDialog((result && result.message) || '저장하지 못했습니다.');
      return;
    }
    ComLib.openAlertDialog(result.message);
    this.load(this.state.mode === 'edit' ? this.state.originalId : '');
  }

  downloadTemplate = () => {
    const blob = new Blob([`\uFEFF${CSV_HEADER.join(',')}\n`], { type: 'text/csv;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = '기관별_예외코드_업로드양식.csv';
    link.click();
    URL.revokeObjectURL(link.href);
  }

  onUpload = async (event) => {
    const file = event.target.files && event.target.files[0];
    event.target.value = '';
    if (!file) return;
    const text = await file.text();
    const lines = text.replace(/^\uFEFF/, '').split(/\r?\n/).filter((line) => line.trim());
    const body = lines.slice(1).map((line) => {
      const cell = line.split(',');
      const row = { siteName: cell[0], domain: cell[1] };
      LOCALS.forEach((index, offset) => {
        const start = 2 + (offset * 3);
        row[`localCd${index}`] = cell[start];
        row[`localCd${index}Nm`] = cell[start + 1];
        row[`localCd${index}Type`] = cell[start + 2];
      });
      const flag = 2 + (LOCALS.length * 3);
      row.commonMapYn = cell[flag];
      row.manualMapYn = cell[flag + 1];
      row.deletedYn = cell[flag + 2];
      row.deleteReason = cell[flag + 3];
      CONCEPTS.forEach((index, offset) => {
        const start = flag + 4 + (offset * 3);
        row[`concept${index}Id`] = cell[start];
        row[`concept${index}Nm`] = cell[start + 1];
        row[`concept${index}Type`] = cell[start + 2];
      });
      return row;
    });
    const result = await saveWork('HIF1020', { domain: 'HIF', action: 'uploadExceptions', rows: body });
    if (!result || !result.ok) {
      ComLib.openAlertDialog((result && result.message) || '업로드하지 못했습니다. CSV 양식을 사용해 주세요.');
      return;
    }
    ComLib.openAlertDialog(result.message);
    this.load('');
  }

  renderCode = (id, field, placeholder) => (
    <Textfield
      id={id}
      value={this.state.form[field] || ''}
      width="100%"
      placeholder={placeholder}
      onChange={(event) => this.setField(field, event.target.value)}
    />
  )

  tripleCells = (label, prefix, parts, required) => ([
    { type: 'T', value: label, className: required ? 'req' : undefined, required: !!required },
    ...parts.map(([suffix, placeholder]) => ({
      type: 'D',
      value: this.renderCode(`${prefix}-${suffix}`, `${prefix}${suffix}`, placeholder),
    })),
  ])

  render() {
    const sites = [{ value: '', name: '전체' }].concat((this.state.sites || []).map((site) => ({ value: site, name: site })));
    const siteOptions = (this.state.sites || []).map((site) => ({ value: site, name: site }));
    const domains = Array.from(new Set(['Order'].concat(this.state.exceptions.map((row) => row.domain).filter(Boolean))));
    const { form } = this.state;
    return (
      <FullPanel>
        <SearchPanel className="sys-search-panel">
          <RelativeGroup>
            <LFloatArea>
              <FlexPanel>
                <Label value="기관" />
                <Selectbox
                  id="hif1020-site"
                  value={this.state.siteName}
                  dataset={sites}
                  width="180px"
                  onChange={(event) => this.setState({ siteName: event.target.value })}
                />
                <Label value="기타조건" />
                <MulitSelectBox
                  key={this.state.etcKey}
                  id="hif1020-etc"
                  dataset={this.state.etcDataset}
                  keyProp="key"
                  value="name"
                  width="180px"
                  displayCount={6}
                  onChange={(event) => this.setState({ etcDataset: event.dataset })}
                />
                <Textfield
                  id="hif1020-etc-keyword"
                  value={this.state.etcKeyword}
                  width="180px"
                  placeholder="검색값"
                  onChange={(event) => this.setState({ etcKeyword: event.target.value })}
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
                <div className="scrm-component-panel-namearea">
                  <span>기관별 예외코드 목록</span>
                </div>
              </LFloatArea>
              <RFloatArea>
                <BasicButton value="양식 다운로드" color="grey" onClick={this.downloadTemplate} />
                <BasicButton value="엑셀 업로드" color="blue" onClick={() => this.fileRef.current && this.fileRef.current.click()} />
                <input ref={this.fileRef} type="file" accept=".csv,text/csv" style={{ display: 'none' }} onChange={this.onUpload} />
              </RFloatArea>
            </RelativeGroup>
            <Grid
              id="HIF1020-exceptions"
              areaName="기관별 예외코드 목록"
              header={LIST_HEADER}
              data={this.state.dsRow}
              rowNum
              height="calc(100vh - 760px)"
              autoFitMode={false}
              rowSelection="single"
              onRowClicked={(event) => this.setState({
                mode: 'edit',
                originalId: event.data.id,
                form: present(event.data),
              })}
            />
            <Note>등록된 예외코드는 지우지 않고 삭제여부와 삭제 사유로 남깁니다. 다시 쓰려면 삭제 사유를 비웁니다.</Note>
            <Note>기타조건에서 고른 항목의 값으로 찾습니다. 선택 가능한 기타조건은 이후 협의가 필요합니다. Local Code는 code, name, type이고 Concept는 id, name, type입니다.</Note>
          </ComponentPanel>
          <ComponentPanel>
            <RelativeGroup>
              <LFloatArea>
                <div className="scrm-component-panel-namearea">
                  <span>예외코드 상세 정보</span>
                </div>
              </LFloatArea>
            </RelativeGroup>
            <div className="tb_no-border">
              <Table
                id="tblExceptionDetail"
                className="sys-table-detail scrm-modern-detail-table ghost"
                width="100%"
                style={{ tableLayout: 'fixed' }}
                colGrp={[
                  { width: '11%' }, { width: '14%' }, { width: '16%' }, { width: '9%' },
                  { width: '11%' }, { width: '14%' }, { width: '16%' }, { width: '9%' },
                ]}
                tbData={[
                  [
                    { type: 'T', value: '기관', className: 'req', required: true },
                    { type: 'D', colSpan: 3, value: (
                      <Selectbox id="hif1020-form-site" value={form.siteName} dataset={siteOptions} width="100%" onChange={(event) => this.setField('siteName', event.target.value)} />
                    ) },
                    { type: 'T', value: '도메인' },
                    { type: 'D', colSpan: 3, value: (
                      <Selectbox id="hif1020-domain" value={form.domain} dataset={domains.map((item) => ({ value: item, name: item }))} width="100%" onChange={(event) => this.setField('domain', event.target.value)} />
                    ) },
                  ],
                  [
                    { type: 'T', value: '공통코드 매핑여부' },
                    { type: 'D', value: (
                      <Selectbox id="hif1020-common" value={form.commonMapYn} dataset={YN} width="100%" onChange={(event) => this.setField('commonMapYn', event.target.value)} />
                    ) },
                    { type: 'T', value: '수동 매핑여부' },
                    { type: 'D', value: (
                      <Selectbox id="hif1020-manual" value={form.manualMapYn} dataset={YN} width="100%" onChange={(event) => this.setField('manualMapYn', event.target.value)} />
                    ) },
                    { type: 'T', value: '삭제여부' },
                    { type: 'D', value: (
                      <Selectbox id="hif1020-deleted" value={form.deletedYn} dataset={YN} width="100%" onChange={(event) => this.setField('deletedYn', event.target.value)} />
                    ) },
                    { type: 'T', value: '삭제 사유' },
                    { type: 'D', value: this.renderCode('hif1020-reason', 'deleteReason', '') },
                  ],
                  [
                    ...this.tripleCells('Local Code1', 'localCd1', [['', 'code'], ['Nm', 'name'], ['Type', 'type']], true),
                    ...this.tripleCells('Local Code2', 'localCd2', [['', 'code'], ['Nm', 'name'], ['Type', 'type']]),
                  ],
                  [
                    ...this.tripleCells('Local Code3', 'localCd3', [['', 'code'], ['Nm', 'name'], ['Type', 'type']]),
                    ...this.tripleCells('Local Code4', 'localCd4', [['', 'code'], ['Nm', 'name'], ['Type', 'type']]),
                  ],
                  [
                    ...this.tripleCells('Concept1', 'concept1', [['Id', 'id'], ['Nm', 'name'], ['Type', 'type']]),
                    ...this.tripleCells('Concept2', 'concept2', [['Id', 'id'], ['Nm', 'name'], ['Type', 'type']]),
                  ],
                  [
                    ...this.tripleCells('Concept3', 'concept3', [['Id', 'id'], ['Nm', 'name'], ['Type', 'type']]),
                    ...this.tripleCells('Concept4', 'concept4', [['Id', 'id'], ['Nm', 'name'], ['Type', 'type']]),
                  ],
                  [
                    ...this.tripleCells('Concept5', 'concept5', [['Id', 'id'], ['Nm', 'name'], ['Type', 'type']]),
                  ],
                ]}
              />
            </div>
          </ComponentPanel>
          <BottomPanel>
            <RelativeGroup>
              <RFloatArea>
                <BasicButton value="신규" color="grey" filled className="icon-add" onClick={this.onNew} />
                <BasicButton value="저장" color="blue" filled className="icon-act" onClick={this.onSave} />
              </RFloatArea>
            </RelativeGroup>
          </BottomPanel>
        </SubFullPanel>
      </FullPanel>
    );
  }
}

export default ExceptionMaster;
