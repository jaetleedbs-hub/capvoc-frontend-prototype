/**
 * OMP1060 상세 팝업.
 * 목록의 이름을 누르면 연다. 관계 이름을 누르면 그 컨셉으로 바꾸고,
 * 이전은 방금 본 컨셉으로 돌아간다. 닫기는 목록이다.
 */

import React from 'react';
import { ComLib, DataLib, TransManager } from 'common';
import {
  BasicButton,
  ComponentPanel,
  FlexPanel,
  FullPanel,
  Grid,
  RelativeGroup,
  RFloatArea,
  SubFullPanel,
  Table,
} from 'components';
import { conceptText, dateText, displayName, validityText } from './labels';

const TEXT = {
  details: 'DETAILS',
  synonyms: 'SYNONYMS',
  connections: 'TERM CONNECTIONS',
  language: 'LANGUAGE',
  synonym: 'SYNONYM CONCEPT',
  relationship: 'RELATIONSHIP',
  relatesTo: 'RELATES TO',
  conceptId: 'CONCEPT ID',
  vocabulary: 'VOCABULARY',
  vocab: '용어집',
  noVocab: '용어집 정보가 없습니다.',
  noSynonym: '동의어 없음',
  noConnection: '관계 없음',
  missing: '없는 컨셉입니다.',
  loading: '조회 중입니다.',
  back: '이전',
  close: '닫기',
  domain: 'Domain ID',
  classId: 'Concept Class ID',
  vocabularyId: 'Vocabulary ID',
  id: 'Concept ID',
  code: 'Concept code',
  validity: 'Validity',
  concept: 'Concept',
  start: 'Valid start',
  end: 'Valid end',
  local: '임시컨셉',
  localYes: '예',
  localNo: '아니오',
};

function dataset(rows) {
  const list = DataLib.datalist.getInstance();
  list.setRecords(rows || []);
  return list;
}

function paramOf(props) {
  return (props.options && props.options.param) || {};
}

class DetailPopup extends React.Component {
  constructor(props) {
    super(props);
    const conceptId = paramOf(props).conceptId;
    this.state = {
      stack: conceptId == null ? [] : [conceptId],
      detail: null,
      error: '',
      loading: conceptId != null,
      primed: false,
      dsSynonym: dataset([]),
      dsConnection: dataset([]),
    };
    this.synonymHeader = [
      { headerName: TEXT.language, field: 'languageName', colId: 'languageName', width: 120 },
      { headerName: TEXT.synonym, field: 'conceptSynonymName', colId: 'conceptSynonymName', width: 280 },
    ];
    this.connectionHeader = [
      { headerName: TEXT.relationship, field: 'relationshipName', colId: 'relationshipName', width: 260 },
      {
        headerName: TEXT.relatesTo,
        field: 'targetConceptName',
        colId: 'targetConceptName',
        width: 240,
        cellStyle: { color: 'var(--cw-point)', cursor: 'pointer' },
      },
      { headerName: TEXT.conceptId, field: 'targetConceptId', colId: 'targetConceptId', width: 120, textAlign: 'right' },
      { headerName: TEXT.vocabulary, field: 'targetVocabularyId', colId: 'targetVocabularyId', width: 140 },
    ];
    this.synonymReady = false;
    this.connectionReady = false;
    this.pendingRows = null;
    this.onConnectionClick = this.onConnectionClick.bind(this);
    this.onSynonymReady = this.onSynonymReady.bind(this);
    this.onConnectionReady = this.onConnectionReady.bind(this);
  }

  componentDidMount() {
    if (this.currentId() == null) {
      this.setState({ loading: false, error: TEXT.missing });
      return;
    }
    this.load();
  }

  currentId() {
    const stack = this.state.stack;
    return stack.length ? stack[stack.length - 1] : null;
  }

  load = () => {
    const conceptId = this.currentId();
    const transManager = new TransManager();
    transManager.setTransId('OMP1060R02');
    transManager.setTransUrl('/api/term/search/concepts/r02');
    transManager.setCallBack(this.onDetail);
    transManager.setFormData({ conceptId });
    transManager.agent();
  }

  onDetail = (res) => {
    if (!res || res.result !== 'success' || !res.data) {
      const message = res && res.data && res.data.message ? res.data.message : TEXT.missing;
      this.setState({
        detail: null,
        error: message,
        loading: false,
        dsSynonym: dataset([]),
        dsConnection: dataset([]),
      });
      return;
    }
    const detail = res.data;
    this.pendingRows = {
      synonyms: detail.synonyms || [],
      connections: detail.connections || [],
    };
    // 그리드가 준비되기 전에 행을 넣으면 로딩 표시에서 멈추므로, 준비된 뒤에 넣는다.
    this.setState({
      detail,
      error: '',
      loading: false,
      primed: false,
      dsSynonym: dataset([]),
      dsConnection: dataset([]),
    }, () => this.pushRows());
  }

  onSynonymReady = () => {
    this.synonymReady = true;
    this.pushRows();
  }

  onConnectionReady = () => {
    this.connectionReady = true;
    this.pushRows();
  }

  pushRows = () => {
    if (!this.pendingRows || !this.synonymReady || !this.connectionReady) return;
    const rows = this.pendingRows;
    this.pendingRows = null;
    this.setState({
      primed: true,
      dsSynonym: dataset(rows.synonyms),
      dsConnection: dataset(rows.connections),
    });
  }

  onConnectionClick = (event) => {
    if (!event || event.col !== 'targetConceptName' || !event.data) return;
    const nextId = event.data.targetConceptId;
    if (nextId == null || nextId === this.currentId()) return;
    this.resetGrids();
    this.setState({ stack: this.state.stack.concat(nextId), loading: true, error: '' }, () => this.load());
  }

  onBack = () => {
    if (this.state.stack.length < 2) return;
    this.resetGrids();
    this.setState({ stack: this.state.stack.slice(0, -1), loading: true, error: '' }, () => this.load());
  }

  resetGrids = () => {
    this.synonymReady = false;
    this.connectionReady = false;
    this.pendingRows = null;
  }

  onVocab = () => {
    const vocab = (this.state.detail && this.state.detail.vocabulary) || {};
    const lines = [vocab.vocabularyName, vocab.vocabularyReference, vocab.vocabularyVersion].filter((line) => line);
    ComLib.openAlertDialog(lines.length ? lines.join('\n') : TEXT.noVocab);
  }

  detailRows() {
    const detail = this.state.detail;
    const vocabValue = (
      <span>
        {detail.vocabularyId}
        {' '}
        <BasicButton id="btnVocabInfo" value={TEXT.vocab} color="grey" className="icon-view" size="xs" onClick={this.onVocab} />
      </span>
    );
    return [
      [{ type: 'T', value: TEXT.domain }, { type: 'D', value: detail.domainId }],
      [{ type: 'T', value: TEXT.classId }, { type: 'D', value: detail.conceptClassId }],
      [{ type: 'T', value: TEXT.vocabularyId }, { type: 'D', value: vocabValue }],
      [{ type: 'T', value: TEXT.id }, { type: 'D', value: detail.conceptId }],
      [{ type: 'T', value: TEXT.code }, { type: 'D', value: detail.conceptCode }],
      [{ type: 'T', value: TEXT.validity }, { type: 'D', value: validityText(detail.invalidReason) }],
      [{ type: 'T', value: TEXT.concept }, { type: 'D', value: conceptText(detail.standardConcept) }],
      [{ type: 'T', value: TEXT.start }, { type: 'D', value: dateText(detail.validStartDate) }],
      [{ type: 'T', value: TEXT.end }, { type: 'D', value: dateText(detail.validEndDate) }],
      [{ type: 'T', value: TEXT.local }, { type: 'D', value: detail.isLocal ? TEXT.localYes : TEXT.localNo }],
    ];
  }

  renderBody() {
    if (this.state.loading) return <p>{TEXT.loading}</p>;
    if (this.state.error) return <p style={{ color: 'var(--cw-danger)' }}>{this.state.error}</p>;
    const detail = this.state.detail;
    if (!detail) return null;
    const synonyms = detail.synonyms || [];
    const connections = detail.connections || [];
    return (
      <FlexPanel style={{ gap: '16px', width: '100%', alignItems: 'flex-start' }}>
        <div style={{ flex: 4, minWidth: 0 }}>
          <ComponentPanel>
            <h3>{displayName(detail)}</h3>
            <h3>{TEXT.details}</h3>
            <Table id="tblConceptDetail" colGrp={[{ width: '38%' }, { width: '62%' }]} tbData={this.detailRows()} />
            <h3>{TEXT.synonyms}</h3>
            {this.state.primed && synonyms.length === 0 ? <p>{TEXT.noSynonym}</p> : null}
            <Grid
              id="grdSynonym"
              areaName={TEXT.synonyms}
              header={this.synonymHeader}
              data={this.state.dsSynonym}
              height="180px"
              sort={false}
              onGridReady={this.onSynonymReady}
            />
          </ComponentPanel>
        </div>
        <div style={{ flex: 6, minWidth: 0 }}>
          <ComponentPanel>
            <h3>{`${TEXT.connections} (${connections.length})`}</h3>
            {this.state.primed && connections.length === 0 ? <p>{TEXT.noConnection}</p> : null}
            <Grid
              id="grdConnection"
              areaName={TEXT.connections}
              header={this.connectionHeader}
              data={this.state.dsConnection}
              height="280px"
              sort={false}
              onCellClicked={this.onConnectionClick}
              onGridReady={this.onConnectionReady}
            />
          </ComponentPanel>
        </div>
      </FlexPanel>
    );
  }

  render() {
    return (
      <FullPanel>
        <SubFullPanel>
          {this.renderBody()}
        </SubFullPanel>
        <RelativeGroup>
          <RFloatArea>
            {this.state.stack.length > 1 ? (
              <BasicButton id="btnBack" value={TEXT.back} color="grey" className="icon-cancel" onClick={this.onBack} />
            ) : null}
            <BasicButton id="btnClose" value={TEXT.close} color="grey" className="icon-cancel" onClick={this.props.onClose} />
          </RFloatArea>
        </RelativeGroup>
      </FullPanel>
    );
  }
}

export default DetailPopup;
