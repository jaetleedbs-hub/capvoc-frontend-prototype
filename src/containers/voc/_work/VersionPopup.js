import React from 'react';
import { ComLib } from 'common';
import {
  BasicButton,
  ComponentPanel,
  FlexPanel,
  FullPanel,
  InputCalendar,
  Label,
  Selectbox,
  Textarea,
  Textfield,
} from 'components';
import { loadBundle, notifySaved, paramOf, saveWork, toCompactDate, toDateText } from './client';

class VersionPopup extends React.Component {
  constructor(props) {
    super(props);
    const param = paramOf(props);
    this.mode = param.mode === 'edit' ? 'edit' : 'new';
    this.versionId = param.versionId || '';
    this.state = {
      ready: false,
      termKinds: [],
      sites: [],
      versionNm: '',
      athenaVersion: '',
      termKind: '',
      siteName: '',
      createdYmd: '',
      remark: '',
    };
  }

  componentDidMount() {
    this.load();
  }

  load = async () => {
    const bundle = await loadBundle(this.props.screenId, this.props.domain);
    const versions = (bundle && bundle.versions) || [];
    const current = versions.find((item) => item.versionId === this.versionId);
    const termKinds = (bundle && bundle.termKinds) || [];
    const sites = (bundle && bundle.sites) || [];
    this.setState({
      ready: true,
      termKinds,
      sites,
      versionNm: current ? current.versionNm : '',
      athenaVersion: current ? current.athenaVersion : '',
      termKind: current ? current.termKind : (termKinds[0] || ''),
      siteName: current ? current.siteName : (sites[0] || ''),
      createdYmd: current ? toCompactDate(current.createdYmd) : '',
      remark: current ? current.remark : '',
    });
  }

  onSave = async () => {
    const result = await saveWork(this.props.screenId, {
      domain: this.props.domain,
      action: 'saveVersion',
      mode: this.mode,
      row: {
        versionId: this.versionId,
        versionNm: this.state.versionNm,
        athenaVersion: this.state.athenaVersion,
        termKind: this.state.termKind,
        siteName: this.state.siteName,
        createdYmd: toDateText(this.state.createdYmd),
        remark: this.state.remark,
      },
    });
    if (!result || !result.ok) {
      ComLib.openAlertDialog((result && result.message) || '저장하지 못했습니다.');
      return;
    }
    notifySaved(this.props);
    if (this.props.onClose) this.props.onClose();
  }

  render() {
    const omop = this.props.domain === 'OMP';
    const hif = this.props.domain === 'HIF';
    return (
      <FullPanel>
        <ComponentPanel>
          <p style={{ marginTop: 0 }}>
            {this.mode === 'edit'
              ? '코드 관리에서 고른 버전의 정보를 수정합니다.'
              : '새 버전의 정보를 입력합니다.'}
          </p>
          <FlexPanel>
            <Label value="버전명" req />
            <Textfield
              id="ver-name"
              value={this.state.versionNm}
              width="280px"
              onChange={(event) => this.setState({ versionNm: event.target.value })}
            />
          </FlexPanel>
          {omop ? (
            <FlexPanel>
              <Label value="아테나 버전" req />
              <Textfield
                id="ver-athena"
                value={this.state.athenaVersion}
                width="280px"
                onChange={(event) => this.setState({ athenaVersion: event.target.value })}
              />
            </FlexPanel>
          ) : null}
          {hif ? (
            <FlexPanel>
              <Label value="기관" req />
              <Selectbox
                id="ver-site"
                value={this.state.siteName}
                width="280px"
                dataset={this.state.sites.map((site) => ({ value: site, name: site }))}
                onChange={(event) => this.setState({ siteName: event.target.value })}
              />
            </FlexPanel>
          ) : null}
          {!omop && !hif ? (
            <FlexPanel>
              <Label value="공통용어구분" req />
              <Selectbox
                id="ver-kind"
                value={this.state.termKind}
                width="280px"
                dataset={this.state.termKinds.map((kind) => ({ value: kind, name: kind }))}
                onChange={(event) => this.setState({ termKind: event.target.value })}
              />
            </FlexPanel>
          ) : null}
          <FlexPanel>
            <Label value="생성일" req />
            <InputCalendar
              id="ver-date"
              value={this.state.createdYmd}
              onChange={(event) => this.setState({ createdYmd: event.target.value || '' })}
            />
          </FlexPanel>
          <FlexPanel>
            <Label value="비고" />
            <Textarea
              id="ver-remark"
              value={this.state.remark}
              rows={4}
              onChange={(event) => this.setState({ remark: event.target.value })}
            />
          </FlexPanel>
          <div style={{ marginTop: '12px', display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <BasicButton value="저장" color="blue" filled onClick={this.onSave} disabled={!this.state.ready} />
            <BasicButton value="닫기" onClick={() => this.props.onClose && this.props.onClose()} />
          </div>
        </ComponentPanel>
      </FullPanel>
    );
  }
}

export default VersionPopup;
