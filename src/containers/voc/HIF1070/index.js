import React from 'react';
import DetailPopup from '../_work/DetailPopup';

/** HIF1070 기관 코드 상세 보기. */
export default class View extends React.Component {
  render() {
    return <DetailPopup {...this.props} screenId="HIF1070" domain="HIF" />;
  }
}
