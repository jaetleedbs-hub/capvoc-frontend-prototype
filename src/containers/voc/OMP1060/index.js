/**
 * OMP1060 OMOP 코드 조회2.
 * Athena 검색과 같은 목록이다. 이름 칸을 누르면 상세 팝업을 연다.
 * 화면은 키워드를 정규화하지 않는다.
 */

import React from 'react';
import { ComLib, DataLib, TransManager } from 'common';
import {
  BasicButton,
  Checkbox,
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
  Textfield,
} from 'components';
import { conceptText, displayName, validityText } from './labels';

const TEXT = {
  athenaVersion: '아테나 버전',
  keyword: '키워드',
  search: '검색',
  reset: '초기화',
  help: '?',
  download: '결과 내려받기',
  clear: '필터 지우기',
  sort: '정렬',
  sortDir: '방향',
  asc: '오름차순',
  desc: '내림차순',
  pageSize: '페이지',
  total: '총',
  count: '건',
  exportLimit: '5만 건을 넘습니다. 조건을 더 좁혀 주세요.',
  filter: '필터',
  domain: 'DOMAIN',
  concept: 'CONCEPT',
  classId: 'CLASS',
  vocab: 'VOCAB',
  validity: 'VALIDITY',
  standard: 'Standard',
  classification: 'Classification',
  nonStandard: 'Non-standard',
  valid: 'Valid',
  invalid: 'Invalid',
  remove: '제거',
  colId: 'ID',
  colCode: 'CODE',
  colName: 'NAME',
  colClass: 'CLASS',
  colConcept: 'CONCEPT',
  colValidity: 'VALIDITY',
  colDomain: 'DOMAIN',
  colVocab: 'VOCAB',
  list: '검색 결과',
  helpLines: [
    '빈 값: 패싯만 적용하고 이름 순으로 첫 페이지를 엽니다.',
    '따옴표: "aspirin" 처럼 전체를 감싸면 이름·동의어·코드의 완전 일치만 찾습니다.',
    '구분자: / \\ | ? ! , ; . 는 항상 띄어쓰기로 바꿉니다.',
    '단독 기호: + - ( ) : ^ [ ] ~ * & 가 한 토큰이면 버립니다. 단어 안에 붙어 있으면 남깁니다.',
    '여러 단어: 모든 토큰이 이름 또는 동의어에 있는 행을 위에 둡니다. 그게 없으면 일부 토큰·유사 철자를 아래에 둡니다.',
    '숫자만: concept_id 일치를 맨 위에 두고, 같은 숫자를 concept_code 로도 찾습니다.',
  ],
};

const PAGE_SIZES = [15, 30, 50, 100, 500];
const EXPORT_LIMIT = 50000;
const SORTS = [
  { value: 'rank', name: '검색 순위' },
  { value: 'concept_id', name: TEXT.colId },
  { value: 'concept_code', name: TEXT.colCode },
  { value: 'concept_name', name: TEXT.colName },
  { value: 'concept_class_id', name: TEXT.colClass },
  { value: 'standard_concept', name: TEXT.colConcept },
  { value: 'invalid_reason', name: TEXT.colValidity },
  { value: 'domain_id', name: TEXT.colDomain },
  { value: 'vocabulary_id', name: TEXT.colVocab },
];

const FACETS = [
  { key: 'domain', title: TEXT.domain, field: 'domainIds', filterId: 'iptSrchFacetDomain' },
  { key: 'standard', title: TEXT.concept, field: 'standardFlags', filterId: 'iptSrchFacetStandard' },
  { key: 'class', title: TEXT.classId, field: 'classIds', filterId: 'iptSrchFacetClass' },
  { key: 'vocabulary', title: TEXT.vocab, field: 'vocabularyIds', filterId: 'iptSrchFacetVocab' },
  { key: 'validity', title: TEXT.validity, field: 'validityFlags', filterId: 'iptSrchFacetValidity' },
];

function dataset(rows) {
  const list = DataLib.datalist.getInstance();
  list.setRecords(rows || []);
  return list;
}

function initialState() {
  return {
    keywordDraft: '',
    keyword: '',
    domainIds: [],
    standardFlags: [],
    classIds: [],
    vocabularyIds: [],
    validityFlags: [],
    facetQuery: { domain: '', standard: '', class: '', vocabulary: '', validity: '' },
    facetOpen: { domain: true, standard: false, class: false, vocabulary: false, validity: false },
    page: 1,
    size: 15,
    sort: 'rank',
    sortDir: 'desc',
    athenaVersion: '',
    versionOptions: [],
    total: 0,
    facets: { domain: [], standard: [], class: [], vocabulary: [], validity: [] },
    dsConceptList: dataset([]),
  };
}

function pageWindow(page, pages) {
  const end = Math.min(pages, Math.max(page, 4) + 3);
  const start = Math.max(1, end - 6);
  const numbers = [];
  for (let number = start; number <= Math.min(pages, start + 6); number += 1) numbers.push(number);
  return numbers;
}

function csvCell(value) {
  let text = value == null ? '' : String(value);
  if (/^[=+\-@]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

function withSelected(items, selected) {
  const rows = Array.isArray(items) ? items.slice() : [];
  const known = new Set(rows.map((row) => row.id));
  (selected || []).forEach((id) => {
    if (!known.has(id)) rows.push({ id, cnt: 0, name: id });
  });
  return rows;
}

function listHeader() {
  return [
    { headerName: TEXT.colId, field: 'conceptId', colId: 'conceptId', width: 110, textAlign: 'right' },
    { headerName: TEXT.colCode, field: 'conceptCode', colId: 'conceptCode', width: 150 },
    {
      headerName: TEXT.colName,
      field: 'conceptName',
      colId: 'conceptName',
      width: 280,
      cellStyle: { color: 'var(--cw-point)', cursor: 'pointer' },
      valueFormatter: (params) => displayName(params.data),
    },
    { headerName: TEXT.colClass, field: 'conceptClassId', colId: 'conceptClassId', width: 140 },
    {
      headerName: TEXT.colConcept,
      field: 'standardConcept',
      colId: 'standardConcept',
      width: 140,
      textAlign: 'center',
      valueFormatter: (params) => conceptText(params.value),
    },
    {
      headerName: TEXT.colValidity,
      field: 'invalidReason',
      colId: 'invalidReason',
      width: 110,
      textAlign: 'center',
      valueFormatter: (params) => validityText(params.value),
    },
    { headerName: TEXT.colDomain, field: 'domainId', colId: 'domainId', width: 120 },
    { headerName: TEXT.colVocab, field: 'vocabularyId', colId: 'vocabularyId', width: 140 },
  ];
}

class View extends React.Component {
  constructor(props) {
    super(props);
    this.state = initialState();
    this.header = listHeader();
    this.requestSeq = 0;
    this.onCellClicked = this.onCellClicked.bind(this);
  }

  componentDidMount() {
    this.loadList();
  }

  /** GNB 초기화. 키워드, 패싯, 정렬을 비우고 첫 페이지로 돌아간다. */
  initialize = () => {
    this.requestSeq += 1;
    this.setState(initialState(), () => this.loadList());
  }

  requestBody = (download) => ({
    keyword: this.state.keyword,
    domainIds: this.state.domainIds,
    standardFlags: this.state.standardFlags,
    classIds: this.state.classIds,
    vocabularyIds: this.state.vocabularyIds,
    validityFlags: this.state.validityFlags,
    page: download ? 1 : this.state.page,
    size: this.state.size,
    sort: this.state.sort,
    sortDir: this.state.sort === 'rank' ? 'desc' : this.state.sortDir,
    versionLabel: this.state.athenaVersion,
    download: download === true,
  })

  loadList = () => {
    const seq = this.requestSeq;
    const transManager = new TransManager();
    transManager.setTransId('OMP1060R01');
    transManager.setTransUrl('/api/term/search/concepts/r01');
    transManager.setCallBack((res) => this.onList(res, seq));
    transManager.setFormData(this.requestBody(false));
    transManager.agent();
  }

  apply = (patch) => {
    this.requestSeq += 1;
    this.setState(patch, () => this.loadList());
  }

  onAthenaVersion = (event) => {
    this.apply({ athenaVersion: event.target.value, page: 1 });
  }

  onKeyword = (event) => {
    this.setState({ keywordDraft: event.target.value });
  }

  onKeywordKey = (event) => {
    if (event.key === 'Enter') this.onSearch();
  }

  onSearch = () => {
    this.apply({ keyword: this.state.keywordDraft, page: 1 });
  }

  onResetSearch = () => {
    this.apply({ keyword: '', keywordDraft: '', page: 1 });
  }

  onHelp = () => {
    ComLib.openAlertDialog(TEXT.helpLines.join('\n'));
  }

  onClear = () => {
    this.apply({
      domainIds: [],
      standardFlags: [],
      classIds: [],
      vocabularyIds: [],
      validityFlags: [],
      page: 1,
    });
  }

  onPageSize = (event) => {
    const size = Number(event.target.value);
    this.apply({ size: PAGE_SIZES.includes(size) ? size : 15, page: 1 });
  }

  onSort = (event) => {
    this.apply({ sort: event.target.value, page: 1 });
  }

  onSortDir = (event) => {
    this.apply({ sortDir: event.target.value === 'asc' ? 'asc' : 'desc', page: 1 });
  }

  onPage = (page) => {
    this.apply({ page });
  }

  toggleFacet = (field, id, checked) => {
    const current = this.state[field];
    const next = checked ? current.concat(id) : current.filter((item) => item !== id);
    this.apply({ [field]: next, page: 1 });
  }

  onFacetQuery = (key, value) => {
    this.setState({ facetQuery: { ...this.state.facetQuery, [key]: value } });
  }

  toggleOpen = (key) => {
    this.setState({ facetOpen: { ...this.state.facetOpen, [key]: !this.state.facetOpen[key] } });
  }

  onList = (res, seq) => {
    if (seq !== this.requestSeq) return;
    if (!res || res.result !== 'success' || !res.data) {
      this.setState({ total: 0, facets: initialState().facets, dsConceptList: dataset([]) });
      return;
    }
    const data = res.data;
    const versionOptions = (Array.isArray(data.versions) ? data.versions : [])
      .filter((row) => row && row.versionLabel)
      .map((row) => ({ value: row.versionLabel, name: row.versionLabel }));
    const selected = versionOptions.some((row) => row.value === this.state.athenaVersion)
      ? this.state.athenaVersion
      : (data.versionLabel || (versionOptions[0] ? versionOptions[0].value : ''));
    this.setState({
      athenaVersion: selected,
      versionOptions,
      total: data.total || 0,
      facets: data.facets || initialState().facets,
      dsConceptList: dataset(data.items || []),
    });
  }

  onCellClicked = (event) => {
    if (!event || event.col !== 'conceptName' || !event.data) return;
    const row = event.data;
    ComLib.openPop('OMP1060_detailPopup', displayName(row), {
      modaless: false,
      width: '1100px',
      height: '720px',
      param: { conceptId: row.conceptId },
    });
  }

  onDownload = () => {
    if (this.state.total > EXPORT_LIMIT) {
      ComLib.openAlertDialog(TEXT.exportLimit);
      return;
    }
    const transManager = new TransManager();
    transManager.setTransId('OMP1060E01');
    transManager.setTransUrl('/api/term/search/concepts/r01');
    transManager.setCallBack(this.onDownloadResult);
    transManager.setFormData(this.requestBody(true));
    transManager.agent();
  }

  onDownloadResult = (res) => {
    if (!res || res.result !== 'success' || !res.data) return;
    if (res.data.exportRefused) {
      ComLib.openAlertDialog(res.data.message || TEXT.exportLimit);
      return;
    }
    this.saveCsv(res.data.items || []);
  }

  saveCsv = (items) => {
    const header = [TEXT.colId, TEXT.colCode, TEXT.colName, TEXT.colClass, TEXT.colConcept, TEXT.colValidity, TEXT.colDomain, TEXT.colVocab].join(',');
    const lines = items.map((item) => [
      item.conceptId,
      item.conceptCode,
      displayName(item),
      item.conceptClassId,
      conceptText(item.standardConcept),
      validityText(item.invalidReason),
      item.domainId,
      item.vocabularyId,
    ].map(csvCell).join(','));
    const blob = new Blob([`\uFEFF${header}\n${lines.join('\n')}`], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = '표준용어검색.csv';
    anchor.click();
    URL.revokeObjectURL(url);
  }

  facetLabel = (key, item) => {
    if (key === 'domain') return `${item.name || item.id} (${item.cnt})`;
    if (key === 'standard') return `${conceptText(item.id)} (${item.cnt})`;
    if (key === 'validity') return `${item.id === 'INVALID' ? TEXT.invalid : TEXT.valid} (${item.cnt})`;
    return `${item.id} (${item.cnt})`;
  }

  chipLabel = (key, id) => {
    const rows = (this.state.facets && this.state.facets[key]) || [];
    const found = rows.find((row) => row.id === id);
    if (key === 'domain') return (found && (found.name || found.id)) || id;
    if (key === 'standard') return conceptText(id);
    if (key === 'validity') return id === 'INVALID' ? TEXT.invalid : TEXT.valid;
    return id;
  }

  renderFacet = (facet) => {
    const selected = this.state[facet.field];
    const open = this.state.facetOpen[facet.key];
    const query = (this.state.facetQuery[facet.key] || '').trim().toLowerCase();
    const rows = withSelected(this.state.facets[facet.key], selected).filter((item) => {
      if (!query) return true;
      if (selected.includes(item.id)) return true;
      return this.facetLabel(facet.key, item).toLowerCase().includes(query);
    });
    return (
      <div key={facet.key}>
        <BasicButton
          id={`btnFacet${facet.key}`}
          value={`${facet.title}${selected.length ? ` (${selected.length})` : ''} ${open ? '▾' : '▸'}`}
          color="grey"
          onClick={() => this.toggleOpen(facet.key)}
        />
        {open ? (
          <div>
            <Textfield
              id={facet.filterId}
              value={this.state.facetQuery[facet.key]}
              width="200px"
              placeholder={TEXT.filter}
              onChange={(event) => this.onFacetQuery(facet.key, event.target.value)}
            />
            {rows.map((item, index) => (
              <Checkbox
                key={`${facet.field}-${item.id}-${index}`}
                id={`chkSrch${facet.key}`}
                keyProp={`${facet.key}-${item.id}`}
                index={index}
                checked={selected.includes(item.id) ? 'Y' : 'N'}
                value={this.facetLabel(facet.key, item)}
                style={{ display: 'block' }}
                onChange={(event) => this.toggleFacet(facet.field, item.id, event.checked)}
              />
            ))}
          </div>
        ) : null}
      </div>
    );
  }

  renderChips() {
    const chips = [];
    if (this.state.keyword) {
      chips.push({ key: 'keyword', label: this.state.keyword, onRemove: () => this.apply({ keyword: '', keywordDraft: '', page: 1 }) });
    }
    FACETS.forEach((facet) => {
      this.state[facet.field].forEach((id) => {
        chips.push({
          key: `${facet.field}-${id}`,
          label: this.chipLabel(facet.key, id),
          onRemove: () => this.toggleFacet(facet.field, id, false),
        });
      });
    });
    if (chips.length === 0) return null;
    return (
      <FlexPanel style={{ flexWrap: 'wrap', gap: '4px' }}>
        {chips.map((chip) => (
          <BasicButton
            key={chip.key}
            id={`btnChip-${chip.key}`}
            value={`${chip.label} ×`}
            color="grey"
            onClick={chip.onRemove}
          />
        ))}
      </FlexPanel>
    );
  }

  render() {
    const pages = Math.max(1, Math.ceil(this.state.total / this.state.size));
    return (
      <FullPanel>
        <SearchPanel>
          <RelativeGroup>
            <LFloatArea>
              <FlexPanel>
                <Label value={TEXT.athenaVersion} />
                <Selectbox
                  id="selSrchAthenaVersion"
                  value={this.state.athenaVersion}
                  width="160px"
                  dataset={this.state.versionOptions}
                  onChange={this.onAthenaVersion}
                />
                <Label value={TEXT.keyword} />
                <Textfield
                  id="iptSrchKeyword"
                  value={this.state.keywordDraft}
                  width="360px"
                  onChange={this.onKeyword}
                  onKeyDown={this.onKeywordKey}
                />
              </FlexPanel>
            </LFloatArea>
            <RFloatArea>
              <BasicButton id="btnSearch" value={TEXT.search} color="blue" filled className="icon-srch" onClick={this.onSearch} />
              <BasicButton id="btnReset" value="" color="grey" type="icon" className="icon-reset" tooltip={TEXT.reset} onClick={this.onResetSearch} />
              <BasicButton id="btnHelp" value={TEXT.help} color="grey" onClick={this.onHelp} />
            </RFloatArea>
          </RelativeGroup>
        </SearchPanel>
        {this.renderChips()}
        <SubFullPanel>
          <FlexPanel style={{ gap: '16px', width: '100%', alignItems: 'flex-start' }}>
            <div style={{ flex: 2, minWidth: 0, maxHeight: 'calc(100vh - 250px)', overflow: 'auto' }}>
              <ComponentPanel>
                {FACETS.map((facet) => this.renderFacet(facet))}
                <BasicButton id="btnClearFacet" value={TEXT.clear} color="grey" onClick={this.onClear} />
              </ComponentPanel>
            </div>
            <div style={{ flex: 8, minWidth: 0 }}>
              <ComponentPanel>
                <RelativeGroup>
                  <LFloatArea>
                    <FlexPanel>
                      <BasicButton
                        id="btnDownload"
                        value={TEXT.download}
                        color="grey"
                        className="icon-download"
                        onClick={this.onDownload}
                        disabled={this.state.total === 0}
                      />
                      <Label value={TEXT.pageSize} />
                      <Selectbox
                        id="selSrchPageSize"
                        value={String(this.state.size)}
                        width="90px"
                        dataset={PAGE_SIZES.map((size) => ({ value: String(size), name: `${size}${TEXT.count}` }))}
                        onChange={this.onPageSize}
                      />
                      <Label value={TEXT.sort} />
                      <Selectbox
                        id="selSrchSort"
                        value={this.state.sort}
                        width="130px"
                        dataset={SORTS}
                        onChange={this.onSort}
                      />
                      <Label value={TEXT.sortDir} />
                      <Selectbox
                        id="selSrchSortDir"
                        value={this.state.sortDir}
                        width="110px"
                        disabled={this.state.sort === 'rank'}
                        dataset={[{ value: 'asc', name: TEXT.asc }, { value: 'desc', name: TEXT.desc }]}
                        onChange={this.onSortDir}
                      />
                    </FlexPanel>
                  </LFloatArea>
                  <RFloatArea>
                    <span className="text-caption">{`${TEXT.total} ${this.state.total.toLocaleString('ko-KR')}${TEXT.count}`}</span>
                    {pageWindow(this.state.page, pages).map((number) => (
                      <BasicButton
                        key={number}
                        id={`btnPage${number}`}
                        value={String(number)}
                        color={number === this.state.page ? 'blue' : 'grey'}
                        filled={number === this.state.page}
                        onClick={() => this.onPage(number)}
                      />
                    ))}
                  </RFloatArea>
                </RelativeGroup>
                <Grid
                  id="grdConceptList"
                  areaName={TEXT.list}
                  header={this.header}
                  data={this.state.dsConceptList}
                  height="calc(100vh - 340px)"
                  sort={false}
                  onCellClicked={this.onCellClicked}
                />
              </ComponentPanel>
            </div>
          </FlexPanel>
        </SubFullPanel>
      </FullPanel>
    );
  }
}

export default View;
