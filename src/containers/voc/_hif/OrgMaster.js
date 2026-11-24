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
const SEARCH_YN = [{ value: '', name: '전체' }].concat(YN);

const BLANK = {
  codeOwnerId: '',
  careSiteId: '',
  name: '',
  fullName: '',
  description: '',
  commonYn: 'Y',
};

const INITIAL_SEARCH = { careSiteId: '', keyword: '', commonYn: '' };

function dataset(rows) {
  const list = DataLib.datalist.getInstance();
  list.setRecords(rows || []);
  return list;
}

function matches(row, applied) {
  const site = applied.careSiteId.trim().toLowerCase();
  if (site && !String(row.careSiteId || '').toLowerCase().includes(site)) return false;
  const keyword = applied.keyword.trim().toLowerCase();
  if (keyword) {
    const blob = `${row.name || ''} ${row.fullName || ''} ${row.description || ''}`.toLowerCase();
    if (!blob.includes(keyword)) return false;
  }
  if (applied.commonYn && row.commonYn !== applied.commonYn) return false;
  return true;
}

class OrgMaster extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      orgs: [],
      mode: 'new',
      originalId: '',
      form: { ...BLANK },
      draft: { ...INITIAL_SEARCH },
      applied: { ...INITIAL_SEARCH },
      dsOrg: dataset([]),
    };
  }

  componentDidMount() {
    this.load();
  }

  applyList(orgs, applied, selectId) {
    const rows = orgs.filter((row) => matches(row, applied));
    const current = selectId ? orgs.find((item) => item.careSiteId === selectId) : null;
    return {
      orgs,
      applied,
      dsOrg: dataset(rows),
      mode: current ? 'edit' : 'new',
      originalId: current ? current.careSiteId : '',
      form: current ? { ...BLANK, ...current } : { ...BLANK },
    };
  }

  load = async (selectId) => {
    const bundle = await loadBundle('HIF1010', 'HIF');
    const orgs = (bundle && bundle.orgs) || [];
    this.setState(this.applyList(orgs, this.state.applied, selectId));
  }

  onSearch = () => {
    const applied = {
      careSiteId: this.state.draft.careSiteId.trim(),
      keyword: this.state.draft.keyword.trim(),
      commonYn: this.state.draft.commonYn,
    };
    this.setState(this.applyList(this.state.orgs, applied, ''));
  }

  onReset = () => {
    const applied = { ...INITIAL_SEARCH };
    this.setState({
      draft: { ...INITIAL_SEARCH },
      ...this.applyList(this.state.orgs, applied, ''),
    });
  }

  onNew = () => {
    this.setState({ mode: 'new', originalId: '', form: { ...BLANK } });
  }

  setField = (field, value) => {
    this.setState({ form: { ...this.state.form, [field]: value } });
  }

  setDraft = (field, value) => {
    this.setState({ draft: { ...this.state.draft, [field]: value } });
  }

  onSave = async () => {
    const result = await saveWork('HIF1010', {
      domain: 'HIF',
      action: 'saveOrg',
      mode: this.state.mode,
      originalId: this.state.originalId,
      row: this.state.form,
    });
    if (!result || !result.ok) {
      ComLib.openAlertDialog((result && result.message) || '저장하지 못했습니다.');
      return;
    }
    ComLib.openAlertDialog(result.message);
    this.load(this.state.form.careSiteId.trim());
  }

  render() {
    const { form, draft } = this.state;
    return (
      <FullPanel>
        <SearchPanel className="sys-search-panel">
          <RelativeGroup>
            <LFloatArea>
              <FlexPanel>
                <Label value="Care Site ID" />
                <Textfield
                  id="hif1010-site"
                  value={draft.careSiteId}
                  width="160px"
                  onChange={(event) => this.setDraft('careSiteId', event.target.value)}
                  onKeyDown={(event) => { if (event.key === 'Enter') this.onSearch(); }}
                />
                <Label value="Name/Full Name/Desc" />
                <Textfield
                  id="hif1010-keyword"
                  value={draft.keyword}
                  width="240px"
                  onChange={(event) => this.setDraft('keyword', event.target.value)}
                  onKeyDown={(event) => { if (event.key === 'Enter') this.onSearch(); }}
                />
                <Label value="공통용어 기관 여부" />
                <Selectbox
                  id="hif1010-common"
                  value={draft.commonYn}
                  dataset={SEARCH_YN}
                  width="100px"
                  onChange={(event) => this.setDraft('commonYn', event.target.value)}
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
            <Grid
              id="HIF1010-orgs"
              areaName="기관코드 목록"
              header={[
                { headerName: 'Code Owner ID', field: 'codeOwnerId', width: 140 },
                { headerName: 'Care Site ID', field: 'careSiteId', width: 140 },
                { headerName: 'Name', field: 'name', width: 260 },
                { headerName: 'Full Name', field: 'fullName', width: 320 },
                { headerName: 'Description', field: 'description', width: 280 },
                { headerName: '공통용어 기관 여부', field: 'commonYn', width: 160 },
              ]}
              data={this.state.dsOrg}
              rowNum
              height="calc(100vh - 626px)"
              rowSelection="single"
              onRowClicked={(event) => this.setState({
                mode: 'edit',
                originalId: event.data.careSiteId,
                form: { ...BLANK, ...event.data },
              })}
            />
            <Note>Code Owner ID는 불필요할 가능성이 있습니다. 공통용어 기관 여부로 병원 코드와 공통용어를 가져오는 코드를 구분합니다.</Note>
          </ComponentPanel>
          <ComponentPanel>
            <RelativeGroup>
              <LFloatArea>
                <div className="scrm-component-panel-namearea">
                  <span>기관코드 상세 정보</span>
                </div>
              </LFloatArea>
            </RelativeGroup>
            <div className="tb_no-border">
              <Table
                id="tblOrgDetail"
                className="sys-table-detail scrm-modern-detail-table ghost"
                colGrp={[
                  { width: '12%' }, { width: '21%' },
                  { width: '12%' }, { width: '21%' },
                  { width: '14%' }, { width: '20%' },
                ]}
                tbData={[
                  [
                    { type: 'T', value: 'Code Owner ID' },
                    { type: 'D', value: (
                      <Textfield id="hif-owner" value={form.codeOwnerId} width="100%" onChange={(event) => this.setField('codeOwnerId', event.target.value)} />
                    ) },
                    { type: 'T', value: 'Care Site ID', className: 'req', required: true },
                    { type: 'D', value: (
                      <Textfield id="hif-site-id" value={form.careSiteId} width="100%" onChange={(event) => this.setField('careSiteId', event.target.value)} />
                    ) },
                    { type: 'T', value: 'Name', className: 'req', required: true },
                    { type: 'D', value: (
                      <Textfield id="hif-name" value={form.name} width="100%" onChange={(event) => this.setField('name', event.target.value)} />
                    ) },
                  ],
                  [
                    { type: 'T', value: 'Full Name' },
                    { type: 'D', value: (
                      <Textfield id="hif-full" value={form.fullName} width="100%" onChange={(event) => this.setField('fullName', event.target.value)} />
                    ), colSpan: 3 },
                    { type: 'T', value: '공통용어 기관 여부' },
                    { type: 'D', value: (
                      <Selectbox id="hif-common" value={form.commonYn} dataset={YN} width="100%" onChange={(event) => this.setField('commonYn', event.target.value)} />
                    ) },
                  ],
                  [
                    { type: 'T', value: 'Description' },
                    { type: 'D', value: (
                      <Textfield id="hif-desc" value={form.description} width="100%" onChange={(event) => this.setField('description', event.target.value)} />
                    ), colSpan: 5 },
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

export default OrgMaster;
