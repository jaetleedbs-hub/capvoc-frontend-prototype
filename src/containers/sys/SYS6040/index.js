/**
 * SYS6040 프로그램접속이력
 *
 * 시스템에 접속한 사용자들의 프로그램 접속 이력을 조회하고 모니터링하는 시스템입니다.
 * - 프로그램 접속 이력 조회 (SYS6040R01)
 */

import React from "react";

// 레이아웃 컴포넌트
import {
  ComponentPanel,
  FlexPanel,
  FullPanel,
  SubFullPanel,
  BottomPanel,
  SearchPanel,
  LFloatArea,
  RFloatArea,
  RelativeGroup,
} from "components";

// UI 컴포넌트
import { Grid, Label, Textfield } from "components";

// 버튼 컴포넌트
import { BasicButton as Button } from "components";

// 특수 컴포넌트
import { RangeInputCalendar, UserSelect } from "components";

// 공통 라이브러리
import {
  ComLib,
  DataLib,
  StrLib,
  DateLib,
  TransManager,
  newScrmObj,
} from "common";

import {
  formatDateToStorage,
  formatDateToDisplay,
} from "../../../utils/dateUtils";

class View extends React.Component {
  constructor(props) {
    super(props);

    // 그리드 API 참조 (필수)
    this.gridApi = null;
    this.columnApi = null;
    this.currentRow = "";

    this.state = {
      // 데이터셋 (필수)
      dsConnHistList: DataLib.datalist.getInstance({ paging: { size: 100 } }),
      dsSearch: DataLib.datalist.getInstance(),

      // 검색기간 Props
      rangeCalendarProps: {
        id: "searchRangeCalendar",
        startDate: DateLib.getToday(),
        endDate: DateLib.getToday(),
        strtId: "searchRangeCalendarStart",
        endId: "searchRangeCalendarEnd",
        label: "검색기간",
      },

      // 텍스트필드 Props
      textFieldProps: {
        iptUrlAddr: {
          id: "iptUrlAddr",
          value: "",
          placeholder: "접속URL을 입력하세요",
          maxLength: 50,
          type: "text",
          readOnly: false,
          disabled: false,
        },
        iptIpAddr: {
          id: "iptIpAddr",
          value: "",
          placeholder: "접속IP주소를 입력하세요",
          maxLength: 15,
          type: "text",
          readOnly: false,
          disabled: false,
        },
      },

      // 버튼 Props
      btnProps: {
        btnSearch: {
          id: "btnSearch",
          disabled: false,
          value: "조회",
          hidden: false,
          color: "blue",
          size: "md",
          fiiled: true,
          className: "icon-srch",
        },
        btnReset: {
          id: "btnReset",
          disabled: false,
          value: "",
          hidden: false,
          color: "grey",
          className: "icon-reset",
          type: "icon",
        },
      },

      // 그리드 Props
      grdProps: {
        grdConnHistList: {
          id: "grdConnHistList",
          areaName: "프로그램 접속 이력 목록",
          infinite: true,
          suppressRowClickSelection: false,
          addRowBtn: false,
          delRowBtn: false,
          dnlExcelBtn: false,
          height: "calc(100vh - 367px)",
          rowSelection: "single",
          rowNum: true,
          header: [
            {
              headerName: "사용자ID",
              field: "userId",
              colId: "userId",
              editable: false,
              width: 80,
              type: "text",
              textAlign: "center",
            },
            {
              headerName: "사용자명",
              field: "userNm",
              colId: "userNm",
              editable: false,
              width: 80,
              type: "text",
              textAlign: "center",
            },
            {
              headerName: "IP주소",
              field: "ipAddr",
              colId: "ipAddr",
              editable: false,
              width: 80,
              type: "text",
              textAlign: "center",
            },
            {
              headerName: "http메소드",
              field: "httpMethod",
              colId: "httpMethod",
              editable: false,
              width: 60,
              type: "text",
              textAlign: "center",
            },
            {
              headerName: "접속URL",
              field: "urlAddr",
              colId: "urlAddr",
              editable: false,
              width: 200,
              type: "text",
              textAlign: "left",
            },
            {
              headerName: "접속일시",
              field: "logDt",
              colId: "logDt",
              editable: false,
              width: 100,
              type: "text",
              textAlign: "center",
            },
          ],
        },
      },
      userSelectProps: this.getInitialUserSelectProps(),
    };

    // 이벤트 바인딩 (필수)
    this.event.button.onClick = this.event.button.onClick.bind(this);
    this.event.input.onChange = this.event.input.onChange.bind(this);
    this.event.calendar.onChange = this.event.calendar.onChange.bind(this);
    // this.event.userSelect.onChange = this.event.userSelect.onChange.bind(this);
  }

  // 🔧 초기 사용자 선택 Props
  getInitialUserSelectProps = () => ({
    id: "iptUserIdSearch",
    userId: "",
    userNm: "",
    keyword: "",
  });

  // 생명주기 메서드
  componentDidMount() {
    ComLib.updateStateObject(this, "dsSearch", {
      fromChgDttm: DateLib.getToday(),
      toChgDttm: DateLib.getToday(),
    });
  }

  // 유효성 검증
  validation = (...params) => {
    let transId = params[0];

    switch (transId) {
      case "SYS6040R01": // 프로그램 접속 이력 조회
        const startDate = this.state.dsSearch.fromChgDttm;
        const endDate = this.state.dsSearch.toChgDttm;
        const today = DateLib.getToday();

        if (StrLib.isNull(startDate) || StrLib.isNull(endDate)) {
          ComLib.openDialog("A", "SYSI0010", ["조회할 검색 기간을 선택하세요."]);
          return false;
        }

        if (startDate > endDate) {
            ComLib.openDialog("A", "SYSI0010", [
              "시작일이 종료일보다 늦을 수 없습니다.",
            ]);
            return false;
          }

        if (endDate > today) {
            ComLib.openDialog("A", "SYSI0010", [
              "종료일이 현재보다 빠를 수 없습니다.",
            ]);
            return false;
          }

          // 1개월 범위 제한 검증
          const oneMonthAgo = DateLib.getAddMonth(endDate, -1);

          if (startDate < oneMonthAgo) {
            ComLib.openDialog("A", "SYSI0010", [
              "조회 기간은 최대 1개월까지 가능합니다.",
            ]);
            return false;
          }

        this.state.dsConnHistList.resetPage();
        break;

      default:
        break;
    }
    return true;
  };

  // 서버 통신
  transaction = (...params) => {
    let transId = params[0];
    let transManager = new TransManager();

    try {
      switch (transId) {
        case "SYS6040R01": // 프로그램 접속 이력 조회
          transManager.setTransId(transId);
          transManager.setTransUrl("/api/log/access/r01");
          transManager.setCallBack(this.callback);
          // transManager.addConfig({
          //   datasetsend: 'dsSearch',
          //   datasetrecv: 'dsConnHistList'
          // });

          // 검색 조건 구성 (camelCase 필수)
          const searchData = {
            startDate: formatDateToDisplay(this.state.dsSearch.fromChgDttm),
            endDate: formatDateToDisplay(this.state.dsSearch.toChgDttm),
            userId: this.state.userSelectProps.userId,
            urlAddr: this.state.textFieldProps.iptUrlAddr.value,
            ipAddr: this.state.textFieldProps.iptIpAddr.value,
          };

          this.state.dsSearch.setRecords([searchData]);
          transManager.setPaging(this.state.dsConnHistList.getPaging());
          transManager.setFormData(searchData);
          transManager.agent();
          break;

        default:
          break;
      }
    } catch (err) {
      console.error("Transaction Error:", err);
      ComLib.openDialog("A", "SYSI0010", ["처리 중 오류가 발생했습니다."]);
    }
  };

  // 응답 처리
  callback = (res) => {
    if (res.result) {
      switch (res.id) {
        case "SYS6040R01": // 프로그램 접속 이력 조회 결과
          // this.state.dsConnHistList.setRecords(res.data.dsConnHistList);
          // this.setState({...this.state});

          // 그리드 포커스 복원
          // if (this.gridApi && res.data.dsConnHistList && res.data.dsConnHistList.length > 0) {
          //   let rowNum = this.rowFinder(res.data.dsConnHistList, 'accessDttm', this.currentRow);
          //   this.gridApi.setFocusedCell(rowNum, 'accessDttm');
          // }

          const formattedData = res.data.content.map((item, index) => ({
            ...item,
            rowNum: index + 1,
            logDt: item.logDt ? StrLib.setFormatData(item.logDt, "-") : "",
            userNm: item.userNm || "",
            ipAddr: item.ipAddr || "",
            httpMethod: item.httpMethod || "",
            urlAddr: item.urlAddr || "",
          }));

          const updatedResData = {
            ...res.data,
            content: formattedData,
          };

          ComLib.setStateRecords(this, "dsConnHistList", updatedResData);
          break;

        default:
          break;
      }
    } else {
      ComLib.openDialog("A", "SYSI0010", [
        res.message || "조회 중 오류가 발생했습니다.",
      ]);
    }
  };

  // 이벤트 처리
  event = {
    button: {
      onClick: (e) => {
        let btnId = e.target.id;

        switch (btnId) {
          case "btnSearch": // 조회
            this.handleSearchClick();
            break;

          case "btnReset": // 초기화
            this.resetSearchConditions();
            break;

          case "btnExcelDownload": // 엑셀 다운로드
            this.exportToExcel();
            break;

          default:
            break;
        }
      },
    },

    input: {
      onChange: (e) => {
        let fieldId = e.target.id;
        let value = e.target.value;

        this.setState({
          ...this.state,
          textFieldProps: {
            ...this.state.textFieldProps,
            [fieldId]: {
              ...this.state.textFieldProps[fieldId],
              value: value,
            },
          },
        });
      },
    },

    calendar: {
      onChange: (startDate, endDate) => {
        this.setState({
          ...this.state,
          rangeCalendarProps: {
            ...this.state.rangeCalendarProps,
            startDate: startDate,
            endDate: endDate,
          },
        });
      },
    },

    grid: {
      onReady: (params) => {
        this.gridApi = params.api;
        this.columnApi = params.columnApi;
      },

      onRowSelected: (params) => {
        if (params.node.selected) {
          const selectedData = params.data;
          this.currentRow = selectedData.accessDttm || "";
        }
      },

      onScrollEnd: (e) => {
        if (this.state.dsConnHistList.isLastPage()) {
          return;
        }

        this.state.dsConnHistList.nextPage();
        this.transaction("SYS6040R01");
      },
    },

    userSelect: {
      onChange: (userData) => {
        this.setState({
          ...this.state,
          userSelectProps: {
            ...this.state.userSelectProps,
            userId: userData.userId || "",
            userNm: userData.userNm || "",
            keyword: userData.userId || userData.userNm || "",
          },
        });
      },
    },
  };

  // 유틸리티 함수들

  // 그리드에서 특정 행 찾기 (포커스 복원용)
  rowFinder = (targetRecords, targetColumn, currentRow) => {
    let rowNum = 0;

    if (!targetRecords || StrLib.isNull(currentRow)) {
      return rowNum;
    }

    for (let i = 0; i < targetRecords.length; i++) {
      if (targetRecords[i][targetColumn] === currentRow) {
        rowNum = i;
        break;
      }
    }
    return rowNum;
  };

  // 검색 조건 초기화
  resetSearchConditions = () => {
    this.setState({
      ...this.state,
      rangeCalendarProps: {
        ...this.state.rangeCalendarProps,
        startDate: DateLib.getToday(),
        endDate: DateLib.getToday(),
      },
      textFieldProps: {
        iptUrlAddr: { ...this.state.textFieldProps.iptUrlAddr, value: "" },
        iptIpAddr: { ...this.state.textFieldProps.iptIpAddr, value: "" },
      },
      userSelectProps: {
        ...this.state.userSelectProps,
        userId: "",
        userNm: "",
        keyword: "",
      },
    });
  };

  handleSearchClick = () => {
    if (this.validation("SYS6040R01")) {
      this.transaction("SYS6040R01");
    }
  };

  // 렌더링
  render() {
    const {
      rangeCalendarProps,
      textFieldProps,
      userSelectProps,
      btnProps,
      grdProps,
      dsSearch,
      dsConnHistList,
    } = this.state;
    return (
      <FullPanel>
        {/* 검색 영역 */}
        <SearchPanel>
          <RelativeGroup>
            <LFloatArea style={{flexDirection: 'column'}}>
              <div style={{display: 'grid', gridTemplateColumns: '64px 268px 73px 1fr 84px 200px 71px 200px', alignItems: 'center'}}>
                <Label value="검색기간" />
                <RangeInputCalendar
                  {...rangeCalendarProps}
                  startDate={dsSearch.fromChgDttm}
                  endDate={dsSearch.toChgDttm}
                  onChange={ComLib.handleRangeCalendarChange(
                    this,
                    "dsSearch",
                    "fromChgDttm",
                    "toChgDttm"
                  )}
                />
                <Label value="사용자" />
                <UserSelect
                  id={userSelectProps.id}
                  userId={userSelectProps.userId}
                  userNm={userSelectProps.userNm}
                  keyword={userSelectProps.keyword}
                  disabled={false}
                  onChange={this.event.userSelect.onChange}
                />
                <Label value="접속URL" />
                <Textfield
                  {...textFieldProps.iptUrlAddr}
                  onChange={this.event.input.onChange}
                  onKeyPress={ComLib.handleEnterKey(this.handleSearchClick)}
                />
                <Label value="접속IP" />
                <Textfield
                  {...textFieldProps.iptIpAddr}
                  onChange={this.event.input.onChange}
                  onKeyPress={ComLib.handleEnterKey(this.handleSearchClick)}
                />
              </div>
            </LFloatArea>
            <RFloatArea>
              <Button {...btnProps.btnSearch} onClick={this.event.button.onClick} />
              <Button {...btnProps.btnReset} onClick={this.event.button.onClick} />
            </RFloatArea>
          </RelativeGroup>
        </SearchPanel>

        {/* 메인 컨텐츠 영역 */}
        <SubFullPanel>
          <ComponentPanel>
            <RelativeGroup>
              <LFloatArea>
                <h3>프로그램 접속 이력 목록</h3>
              </LFloatArea>
            </RelativeGroup>
            {/* 프로그램 접속 이력 목록 그리드 */}
            <Grid
              {...grdProps.grdConnHistList}
              data={dsConnHistList}
              onGridReady={this.event.grid.onReady}
              onScrollEnd={this.event.grid.onScrollEnd}
              totalRowCnt={dsConnHistList.getTotalRowCnt()}
            />
          </ComponentPanel>
        </SubFullPanel>
      </FullPanel>
    );
  }
}

export default View;
