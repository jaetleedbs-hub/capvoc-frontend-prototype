import React from 'react';
import VersionPopup from '../_work/VersionPopup';

/** OMP1030 OMOP 코드 신규 등록. 수정으로 열리면 고른 버전을 고친다. */
export default class View extends React.Component {
  render() {
    return <VersionPopup {...this.props} screenId="OMP1030" domain="OMP" />;
  }
}
