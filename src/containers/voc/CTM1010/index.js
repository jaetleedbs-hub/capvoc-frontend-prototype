import React from 'react';
import VersionList from '../_work/VersionList';

/** CTM1010 공통용어 코드 관리. */
export default class View extends React.Component {
  render() {
    return (
      <VersionList
        screenId="CTM1010"
        domain="CTM"
        formId="CTM1040"
        formTitle="공통용어 코드 신규 등록"
        fileId="CTM1050"
        detailId="CTM1060"
      />
    );
  }
}
