import React from 'react';
import VersionPopup from '../_work/VersionPopup';

/** CTM1040 공통용어 코드 신규 등록. */
export default class View extends React.Component {
  render() {
    return <VersionPopup {...this.props} screenId="CTM1040" domain="CTM" />;
  }
}
