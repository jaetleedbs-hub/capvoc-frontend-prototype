import React from 'react';
import DetailPopup from '../_work/DetailPopup';

/** OMP1050 OMOP 코드 상세 보기. */
export default class View extends React.Component {
  render() {
    return <DetailPopup {...this.props} screenId="OMP1050" domain="OMP" />;
  }
}
