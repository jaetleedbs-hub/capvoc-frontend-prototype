import React from 'react';
import VersionList from '../_work/VersionList';

/** HIF1030 기관 코드 관리. */
export default class View extends React.Component {
  render() {
    return (
      <VersionList
        screenId="HIF1030"
        domain="HIF"
        formId="HIF1050"
        formTitle="기관 코드 신규 등록"
        fileId="HIF1060"
        detailId="HIF1070"
      />
    );
  }
}
