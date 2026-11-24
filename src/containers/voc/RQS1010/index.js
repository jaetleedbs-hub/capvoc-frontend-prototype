import React from 'react';
import ScreenShell from '../_shell/ScreenShell';

/**
 * RQS1010 화면.
 * 메뉴에 연결된 자리이며, 업무 설명은 service/local/vocCatalog.js 에 있다.
 */
export default class View extends React.Component {
  render() {
    return <ScreenShell screenId="RQS1010" />;
  }
}
