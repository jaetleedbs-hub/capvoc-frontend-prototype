import React from 'react';
import DetailPopup from '../_work/DetailPopup';

/** CTM1060 공통용어 코드 상세 보기. */
export default class View extends React.Component {
  render() {
    return <DetailPopup {...this.props} screenId="CTM1060" domain="CTM" />;
  }
}
