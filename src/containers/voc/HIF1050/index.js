import React from 'react';
import VersionPopup from '../_work/VersionPopup';

/** HIF1050 기관 코드 신규 등록. */
export default class View extends React.Component {
  render() {
    return <VersionPopup {...this.props} screenId="HIF1050" domain="HIF" />;
  }
}
