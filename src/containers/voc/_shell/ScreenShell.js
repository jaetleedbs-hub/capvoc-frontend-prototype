import React from 'react';
import { ComponentPanel, FullPanel, Table } from 'components';
import { getVocScreen } from 'service/local/vocCatalog';

/**
 * 업무 화면이 붙기 전의 자리.
 * 메뉴를 열면 PDF에 적힌 화면 이름과 업무 설명을 보여 준다.
 * 설명은 텍스트로만 그린다. HTML로 해석하지 않는다.
 */
class ScreenShell extends React.Component {
  render() {
    const screen = getVocScreen(this.props.screenId);
    if (!screen) {
      return (
        <FullPanel>
          <ComponentPanel>
            <p>등록되지 않은 화면입니다. ({this.props.screenId})</p>
          </ComponentPanel>
        </FullPanel>
      );
    }

    const kindName = screen.kind === 'MODAL' ? 'MODAL' : 'MDI';
    const body = [
      [
        { type: 'T', value: '화면 ID' },
        { type: 'D', value: screen.screenId },
        { type: 'T', value: '유형' },
        { type: 'D', value: kindName },
      ],
      [
        { type: 'T', value: '화면명' },
        { type: 'D', value: screen.menuNm, colSpan: 3 },
      ],
      [
        { type: 'T', value: '호출 화면' },
        { type: 'D', value: screen.caller || '-', colSpan: 3 },
      ],
      [
        { type: 'T', value: '업무 설명' },
        { type: 'D', value: screen.description, colSpan: 3 },
      ],
    ];

    return (
      <FullPanel>
        <ComponentPanel>
          <Table
            id={`shell-${screen.screenId}`}
            width="100%"
            colGrp={[{ width: '140px' }, { width: '35%' }, { width: '140px' }, { width: '35%' }]}
            tbData={body}
          />
        </ComponentPanel>
      </FullPanel>
    );
  }
}

export default ScreenShell;
