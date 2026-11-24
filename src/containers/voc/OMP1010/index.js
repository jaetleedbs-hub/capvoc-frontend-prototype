import React from 'react';
import VersionList from '../_work/VersionList';

/** OMP1010 OMOP 코드 관리. */
export default class View extends React.Component {
  render() {
    return (
      <VersionList
        screenId="OMP1010"
        domain="OMP"
        formId="OMP1030"
        formTitle="OMOP 코드 신규 등록"
        fileId="OMP1040"
        detailId="OMP1050"
      />
    );
  }
}
