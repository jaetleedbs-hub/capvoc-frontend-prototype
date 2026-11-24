import React from 'react';
import FilePopup from '../_work/FilePopup';

/** OMP1040 OMOP 파일 등록. */
export default class View extends React.Component {
  render() {
    return <FilePopup {...this.props} screenId="OMP1040" domain="OMP" />;
  }
}
