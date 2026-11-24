import React from 'react';
import FilePopup from '../_work/FilePopup';

/** CTM1050 공통용어 파일 등록. */
export default class View extends React.Component {
  render() {
    return <FilePopup {...this.props} screenId="CTM1050" domain="CTM" />;
  }
}
