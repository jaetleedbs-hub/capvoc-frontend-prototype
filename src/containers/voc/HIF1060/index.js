import React from 'react';
import FilePopup from '../_work/FilePopup';

/** HIF1060 기관 코드 파일 등록. */
export default class View extends React.Component {
  render() {
    return <FilePopup {...this.props} screenId="HIF1060" domain="HIF" />;
  }
}
