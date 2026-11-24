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
} from 'components';
import { loadBundle, toCompactDate } from '../_work/client';
import { Note, SearchActions } from '../_work/ui';

const INITIAL = { siteName: '', from: '20260801', to: '20260831' };

const CARE_SITE = {
  아주대학교: '8200001',
  분당차병원: '8200002',
  전북대학교병원: '8200007',
};

const CODE_HEADER = [
  { headerName: '기관', field: 'siteName', width: 140 },
  { headerName: 'care_site_id', field: 'careSiteId', width: 130 },
  { headerName: 'source_domain_id', field: 'sourceDomainId', width: 150 },
  { headerName: 'common_cd', field: 'commonCd', width: 120 },
  { headerName: 'common_cd_nm', field: 'commonCdNm', width: 280 },
  { headerName: 'common_cd_type', field: 'commonCdType', width: 140 },
  { headerName: 'local_cd1', field: 'localCd1', width: 130 },
  { headerName: 'local_cd1_nm', field: 'localCd1Nm', width: 240 },
  { headerName: 'local_cd1_type', field: 'localCd1Type', width: 140 },
  { headerName: 'local_cd2', field: 'localCd2', width: 120 },
  { headerName: 'local_cd2_nm', field: 'localCd2Nm', width: 160 },
  { headerName: 'local_cd2_type', field: 'localCd2Type', width: 140 },
  { headerName: 'local_cd3', field: 'localCd3', width: 120 },
  { headerName: 'local_cd3_nm', field: 'localCd3Nm', width: 160 },
  { headerName: 'local_cd3_type', field: 'localCd3Type', width: 140 },
  { headerName: 'local_cd4', field: 'localCd4', width: 120 },
  { headerName: 'local_cd4_nm', field: 'localCd4Nm', width: 160 },
  { headerName: 'local_cd4_type', field: 'localCd4Type', width: 140 },
  { headerName: 'frequency', field: 'frequency', width: 110 },
  { headerName: 'additional_info_1', field: 'additionalInfo1', width: 180 },
  { headerName: 'additional_info_type_1', field: 'additionalInfoType1', width: 180 },
  { headerName: 'additional_info_2', field: 'additionalInfo2', width: 180 },
  { headerName: 'additional_info_type_2', field: 'additionalInfoType2', width: 180 },
  { headerName: 'additional_info_3', field: 'additionalInfo3', width: 180 },
  { headerName: 'additional_info_type_3', field: 'additionalInfoType3', width: 180 },
  { headerName: 'extracted_dt', field: 'extractedDt', width: 130 },
];

function present(row) {
  const source = row || {};
  return {
    ...source,
    careSiteId: source.careSiteId || CARE_SITE[source.siteName] || '',
    sourceDomainId: source.sourceDomainId || source.sourceDomain || '',
    extractedDt: source.extractedDt || source.createdYmd || '',
  };
}

function dataset(rows) {
  const list = DataLib.datalist.getInstance();
  list.setRecords(rows || []);
  return list;
}

function records(bundle, applied) {
  return ((bundle && bundle.codes) || []).map(present).filter((row) => {
    const created = String(row.createdYmd || '').replace(/-/g, '');
    if (applied.siteName && row.siteName !== applied.siteName) return false;
    if (applied.from && created < applied.from) return false;
    if (applied.to && created > applied.to) return false;
    return true;
  });
}

class CodeLookup extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      bundle: null,
      draft: { ...INITIAL },
      applied: { ...INITIAL },
      dsCode: dataset([]),
    };
  }

  componentDidMount() {
    this.load();
  }

  load = async () => {
    const bundle = await loadBundle('HIF1040', 'HIF');
    this.setState({
      bundle,
      dsCode: dataset(records(bundle, this.state.applied)),
    });
  }

  onSearch = () => {
    const applied = {
      siteName: this.state.draft.siteName,
      from: toCompactDate(this.state.draft.from),
      to: toCompactDate(this.state.draft.to),
    };
    this.setState({
      applied,
      dsCode: dataset(records(this.state.bundle, applied)),
    });
  }

  onReset = () => {
    const applied = { ...INITIAL };
    this.setState({
      draft: { ...INITIAL },
      applied,
      dsCode: dataset(records(this.state.bundle, applied)),
    });
  }

  render() {
    const bundle = this.state.bundle || {};
    const { draft } = this.state;
    const sites = [{ value: '', name: '전체' }].concat((bundle.sites || []).map((site) => ({ value: site, name: site })));
    return (
      <FullPanel>
        <SearchPanel>
          <RelativeGroup>
            <LFloatArea>
              <FlexPanel>
                <Label value="생성일" />
                <InputCalendar
                  id="hif1040-from"
                  value={draft.from}
                  onChange={(event) => this.setState({ draft: { ...draft, from: event.target.value || '' } })}
                />
                <span>~</span>
                <InputCalendar
                  id="hif1040-to"
                  value={draft.to}
                  onChange={(event) => this.setState({ draft: { ...draft, to: event.target.value || '' } })}
                />
                <Label value="기관" />
                <Selectbox
                  id="hif1040-site"
                  value={draft.siteName}
                  dataset={sites}
                  width="180px"
                  onChange={(event) => this.setState({ draft: { ...draft, siteName: event.target.value } })}
                />
                <Label value="기타조건" />
                <Selectbox id="hif1040-etc" value="" dataset={[{ value: '', name: '선택' }]} width="140px" disabled />
              </FlexPanel>
            </LFloatArea>
            <RFloatArea>
              <SearchActions onSearch={this.onSearch} onReset={this.onReset} />
            </RFloatArea>
          </RelativeGroup>
        </SearchPanel>
        <SubFullPanel>
          <ComponentPanel>
            <h3 style={{ margin: '0 0 8px' }}>기관 코드 목록</h3>
            <Note>등록된 기관 코드를 조회합니다. 선택 가능한 기타조건은 이후 협의가 필요합니다.</Note>
            <Note>버전 비교가 필요하면 화면을 더하거나 이 조회를 탭으로 나눠야 합니다.</Note>
            <Grid
              id="HIF1040-codes"
              areaName="기관 코드 목록"
              header={CODE_HEADER}
              data={this.state.dsCode}
              rowNum
              autoFitMode={false}
              height="calc(100vh - 340px)"
              rowSelection="single"
            />
          </ComponentPanel>
        </SubFullPanel>
      </FullPanel>
    );
  }
}

export default CodeLookup;
