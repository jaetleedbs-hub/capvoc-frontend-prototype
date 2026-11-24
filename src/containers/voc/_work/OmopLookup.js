import React from 'react';
import { DataLib } from 'common';
import {
  BasicButton,
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
  TabPanel,
  Tabs,
  Textfield,
} from 'components';
import { loadBundle } from './client';
import { Note, SearchActions } from './ui';

const TABS = [
  {
    id: 'concept',
    label: 'Concept',
    filters: [
      { key: 'domainId', label: 'Domain ID' },
      { key: 'conceptName', label: 'Concept Name' },
    ],
    columns: [
      ['conceptId', 'Concept ID'],
      ['conceptName', 'Concept Name'],
      ['domainId', 'Domain ID'],
      ['vocabularyId', 'Vocabulary ID'],
      ['conceptClassId', 'Concept Class ID'],
      ['standardConcept', 'Standard Concept'],
      ['conceptCode', 'Concept Code'],
      ['validStart', 'Valid Start Date'],
      ['validEnd', 'Valid End Date'],
      ['invalidReason', 'Invalid Reason'],
    ],
  },
  {
    id: 'synonym',
    label: 'Concept Synonym',
    filters: [{ key: 'synonymName', label: 'Concept Synonym Name' }],
    columns: [
      ['conceptId', 'Concept ID'],
      ['synonymName', 'Concept Synonym Name'],
      ['languageConceptId', 'Language Concept ID'],
    ],
  },
  {
    id: 'domain',
    label: 'Domain',
    filters: [{ key: 'domainName', label: 'Domain Name' }],
    columns: [
      ['domainId', 'Domain ID'],
      ['domainName', 'Domain Name'],
      ['domainConceptId', 'Domain Concept ID'],
    ],
  },
  {
    id: 'conceptClass',
    label: 'Concept Class',
    filters: [{ key: 'className', label: 'Concept Class Name' }],
    columns: [
      ['classId', 'Concept Class ID'],
      ['className', 'Concept Class Name'],
      ['classConceptId', 'Concept Class Concept ID'],
    ],
  },
  {
    id: 'relationship',
    label: 'Relationship',
    agreed: true,
    filters: [{ key: 'relationshipName', label: '조회조건' }],
    columns: [
      ['relationshipId', 'Relationship ID'],
      ['relationshipName', 'Relationship Name'],
      ['isHierarchical', 'Is Hierarchical'],
      ['definesAncestry', 'Defines Ancestry'],
      ['reverseRelationshipId', 'Reverse Relationship Id'],
      ['relationshipConceptId', 'Relationship Concept Id'],
    ],
  },
  {
    id: 'vocabulary',
    label: 'Vocabulary',
    agreed: true,
    filters: [{ key: 'vocabularyName', label: '조회조건' }],
    columns: [
      ['vocabularyId', 'Vocabulary Id'],
      ['vocabularyName', 'Vocabulary Name'],
      ['vocabularyReference', 'Vocabulary Reference'],
      ['vocabularyVersion', 'Vocabulary Version'],
      ['vocabularyConceptId', 'Vocabulary Concept Id'],
    ],
  },
  {
    id: 'ancestor',
    label: 'Concept Ancestor',
    agreed: true,
    filters: [{ key: 'ancestorConceptId', label: '조회조건' }],
    columns: [
      ['ancestorConceptId', 'Ancestor Concept Id'],
      ['descendantConceptId', 'Descendant Concept Id'],
      ['minLevel', 'Min Levels Of Separation'],
      ['maxLevel', 'Max Levels Of Separation'],
    ],
  },
  {
    id: 'conceptRelationship',
    label: 'Concept Relationship',
    agreed: true,
    filters: [{ key: 'relationshipId', label: '조회조건' }],
    columns: [
      ['conceptId1', 'Concept ID 1'],
      ['conceptId2', 'Concept ID 2'],
      ['relationshipId', 'Relationship ID'],
      ['validStart', 'Valid Start Date'],
      ['validEnd', 'Valid End Date'],
      ['invalidReason', 'Invalid Reason'],
    ],
  },
  {
    id: 'drugStrength',
    label: 'Drug Strength',
    agreed: true,
    filters: [{ key: 'drugConceptId', label: '조회조건' }],
    columns: [
      ['drugConceptId', 'Drug Concept Id'],
      ['ingredientConceptId', 'Ingredient Concept Id'],
      ['amountValue', 'Amount Value'],
      ['amountUnitConceptId', 'Amount Unit Concept Id'],
      ['numeratorValue', 'Numerator Value'],
      ['numeratorUnitConceptId', 'Numerator Unit Concept Id'],
      ['denominatorValue', 'Denominator Value'],
      ['denominatorUnitConceptId', 'Denominator Unit Concept Id'],
      ['boxSize', 'Box Size'],
      ['validStart', 'Valid Start Date'],
      ['validEnd', 'Valid End Date'],
      ['invalidReason', 'Invalid Reason'],
    ],
  },
];

function includes(row, filters) {
  return Object.entries(filters).every(([key, value]) => {
    if (!value) return true;
    return String(row[key] || '').toLowerCase().includes(String(value).toLowerCase());
  });
}

function dataset(rows) {
  const list = DataLib.datalist.getInstance();
  list.setRecords(rows || []);
  return list;
}

function headers(columns) {
  return columns.map(([field, headerName]) => ({
    headerName,
    field,
    width: Math.max(140, headerName.length * 8),
  }));
}

function emptySets() {
  const sets = {};
  TABS.forEach((tab) => {
    sets[tab.id] = dataset([]);
  });
  sets.etc = dataset([]);
  return sets;
}

class OmopLookup extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      bundle: null,
      versionId: '',
      leftId: '',
      rightId: '',
      draft: {},
      applied: {},
      sets: emptySets(),
    };
  }

  rowsOf(state, tab) {
    return ((((state.bundle || {}).tables || {})[tab.id] || [])
      .filter((row) => row.versionId === state.versionId)
      .filter((row) => includes(row, state.applied)));
  }

  compareRows(state) {
    const tables = (state.bundle && state.bundle.tables) || {};
    const rows = tables.concept || [];
    const left = rows.filter((row) => row.versionId === state.leftId);
    const right = rows.filter((row) => row.versionId === state.rightId);
    const ids = Array.from(new Set(left.map((row) => row.conceptId).concat(right.map((row) => row.conceptId))));
    const fields = ['conceptName', 'domainId', 'vocabularyId', 'conceptCode'];
    return ids.map((conceptId) => {
      const a = left.find((row) => row.conceptId === conceptId) || {};
      const b = right.find((row) => row.conceptId === conceptId) || {};
      return {
        conceptId,
        leftName: a.conceptName || '-',
        rightName: b.conceptName || '-',
        leftDomain: a.domainId || '-',
        rightDomain: b.domainId || '-',
        code: a.conceptCode || b.conceptCode || '-',
        changed: fields.some((field) => (a[field] || '') !== (b[field] || '')),
      };
    });
  }

  setsFor(state) {
    const sets = {};
    TABS.forEach((tab) => {
      sets[tab.id] = dataset(this.rowsOf(state, tab));
    });
    sets.etc = dataset(this.compareRows(state));
    return sets;
  }

  commit(patch) {
    const next = { ...this.state, ...patch };
    this.setState({ ...patch, sets: this.setsFor(next) });
  }

  componentDidMount() {
    this.load();
  }

  load = async () => {
    const bundle = await loadBundle('OMP1020', 'OMP');
    const versions = (bundle && bundle.versions) || [];
    const concepts = ((bundle && bundle.tables) || {}).concept || [];
    const withData = versions.filter((item) => concepts.some((row) => row.versionId === item.versionId));
    const picked = withData.length > 0 ? withData : versions;
    const first = picked[0] ? picked[0].versionId : '';
    const second = picked[1] ? picked[1].versionId : first;
    this.defaults = { versionId: first, leftId: first, rightId: second };
    this.commit({
      bundle,
      versionId: first,
      leftId: first,
      rightId: second,
      draft: {},
      applied: {},
    });
  }

  resetVersion = () => {
    const defaults = this.defaults || { versionId: '', leftId: '', rightId: '' };
    this.commit({ versionId: defaults.versionId, draft: {}, applied: {} });
  }

  resetCompare = () => {
    const defaults = this.defaults || { versionId: '', leftId: '', rightId: '' };
    this.commit({ leftId: defaults.leftId, rightId: defaults.rightId });
  }

  versionOptions() {
    return ((this.state.bundle && this.state.bundle.versions) || []).map((row) => ({
      value: row.versionId,
      name: row.versionNm,
    }));
  }

  renderTab(tab) {
    return (
      <div>
        {tab.agreed ? <Note>조회 조건 항목은 협의 전입니다. 아래 값으로 목록을 거릅니다.</Note> : null}
        {tab.id === 'conceptRelationship' ? <Note>설계서의 이 탭 열이 동의어 탭과 같게 적혀 있어, 관계 테이블의 열로 두었습니다.</Note> : null}
        <SearchPanel>
          <RelativeGroup>
            <LFloatArea>
              <FlexPanel>
                {tab.filters.map((filter) => (
                  <React.Fragment key={filter.key}>
                    <Label value={filter.label} />
                    <Textfield
                      id={`omp1020-${tab.id}-${filter.key}`}
                      value={this.state.draft[filter.key] || ''}
                      width="180px"
                      onChange={(event) => this.setState({ draft: { ...this.state.draft, [filter.key]: event.target.value } })}
                    />
                  </React.Fragment>
                ))}
              </FlexPanel>
            </LFloatArea>
            <RFloatArea>
              <SearchActions
                onSearch={() => this.commit({ applied: { ...this.state.draft } })}
                onReset={() => this.commit({ draft: {}, applied: {} })}
              />
            </RFloatArea>
          </RelativeGroup>
        </SearchPanel>
        <Grid
          id={`OMP1020-${tab.id}`}
          areaName={tab.label}
          header={headers(tab.columns)}
          data={this.state.sets[tab.id]}
          rowNum
          height="calc(100vh - 390px)"
        />
      </div>
    );
  }

  renderCompare() {
    return (
      <div>
        <Note>버전끼리 비교하는 화면이 필요한지, 차이를 어떻게 보일지는 협의 전입니다. 아래는 서로 다른 값을 색으로 표시한 구상입니다.</Note>
        <SearchPanel>
          <RelativeGroup>
            <LFloatArea>
              <FlexPanel>
                <Label value="왼쪽 버전" />
                <Selectbox
                  id="omp-left"
                  value={this.state.leftId}
                  dataset={this.versionOptions()}
                  width="200px"
                  onChange={(event) => this.commit({ leftId: event.target.value })}
                />
                <Label value="오른쪽 버전" />
                <Selectbox
                  id="omp-right"
                  value={this.state.rightId}
                  dataset={this.versionOptions()}
                  width="200px"
                  onChange={(event) => this.commit({ rightId: event.target.value })}
                />
              </FlexPanel>
            </LFloatArea>
            <RFloatArea>
              <BasicButton value="" color="grey" type="icon" className="icon-reset" tooltip="초기화" onClick={this.resetCompare} />
            </RFloatArea>
          </RelativeGroup>
        </SearchPanel>
        <Grid
          id="OMP1020-etc"
          areaName="버전 비교"
          header={[
            { headerName: 'Concept ID', field: 'conceptId', width: 140 },
            { headerName: '왼쪽 Concept Name', field: 'leftName', width: 220 },
            { headerName: '오른쪽 Concept Name', field: 'rightName', width: 220 },
            { headerName: '왼쪽 Domain', field: 'leftDomain', width: 140 },
            { headerName: '오른쪽 Domain', field: 'rightDomain', width: 140 },
            { headerName: 'Code', field: 'code', width: 160 },
          ]}
          data={this.state.sets.etc}
          rowNum
          height="calc(100vh - 420px)"
          getRowStyle={(params) => (params.data && params.data.changed ? { background: 'rgba(234, 179, 8, 0.25)' } : undefined)}
        />
      </div>
    );
  }

  render() {
    return (
      <FullPanel>
        <SearchPanel>
          <RelativeGroup>
            <LFloatArea>
              <FlexPanel>
                <Label value="Version" />
                <Selectbox
                  id="omp1020-version"
                  value={this.state.versionId}
                  dataset={this.versionOptions()}
                  width="220px"
                  onChange={(event) => this.commit({ versionId: event.target.value, draft: {}, applied: {} })}
                />
              </FlexPanel>
            </LFloatArea>
            <RFloatArea>
              <BasicButton value="" color="grey" type="icon" className="icon-reset" tooltip="초기화" onClick={this.resetVersion} />
            </RFloatArea>
          </RelativeGroup>
        </SearchPanel>
        <SubFullPanel>
          <ComponentPanel>
            <Note>한 화면의 탭이 테이블마다 하나의 조회 화면입니다. 조회 조건은 테이블마다 다릅니다.</Note>
            <Tabs id="omp1020-tabs" onClick={() => this.commit({ draft: {}, applied: {} })}>
              {TABS.map((tab, index) => (
                <TabPanel key={tab.id} index={index} label={tab.label}>
                  {this.renderTab(tab)}
                </TabPanel>
              ))}
              <TabPanel index={TABS.length} label="Etc">
                {this.renderCompare()}
              </TabPanel>
            </Tabs>
          </ComponentPanel>
        </SubFullPanel>
      </FullPanel>
    );
  }
}

export default OmopLookup;
