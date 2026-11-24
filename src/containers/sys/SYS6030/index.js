/**
 * SYS6030 사용자변경이력
 *
 * 시스템 사용자의 정보 변경 이력을 조회하고 관리하는 화면
 * - 검색 조건에 따른 사용자 변경 이력 조회
 * - 엑셀 다운로드 기능
 * - 민감정보 보호 및 마스킹 처리
 * - 조회기간 제한 (최대 1년)
 */

import React from "react";
import {
  FullPanel,
  SubFullPanel,
  SearchPanel,
  ComponentPanel,
  FlexPanel,
  LFloatArea,
  RFloatArea,
  RelativeGroup,
  Grid,
  BasicButton as Button,
  Selectbox,
  Label,
  InputCalendar,
  OgnzSelect,
  UserSelect,
  RangeInputCalendar,
} from "components";
import { ComLib, DataLib, TransManager, StrLib, DateLib } from "common";
import {
  formatDateToDisplay,
  formatDateToStorage,
} from "../../../utils/dateUtils";

/**
 * @class View
 * @description SYS6030 사용자변경이력
 * @version 1.0
 * @author 개발팀
 */
class View extends React.Component {
  constructor(props) {
    super(props);

    // Grid API 참조 변수 (필수)
    this.gridApi = null;
    this.columnApi = null;
    this.currentRow = "";

    this.state = {
      // 데이터셋 (표준 패턴)
      dsUserChgHistList: DataLib.datalist.getInstance({ paging: { size: 100 } }),
      dsSearch: DataLib.datalist.getInstance(),

      // 버튼 Props (색상 가이드라인 준수)
      btnProps: this.getInitialButtonProps(),

      // 그리드 Props (화면정의서 기준)
      grdProps: {
        grdUserChgHistList: {
          id: "grdUserChgHistList",
          areaName: "사용자변경이력목록",
          infinite: true,
          height: "calc(100vh - 367px)",
          rowSelection: "single",
          suppressRowClickSelection: false,
          addRowBtn: false,
          delRowBtn: false,
          dnlExcelBtn: false,
          rowNum: true,
          header: [
            {
              headerName: "변경일시",
              field: "chgDt",
              colId: "chgDt",
              width: 150,
              cellStyle: () => ({ textAlign: "center" }),
            },
            {
              headerName: "사용자ID",
              field: "userId",
              colId: "userId",
              width: 150,
              cellStyle: () => ({ textAlign: "center" }),
            },
            {
              headerName: "사용자명",
              field: "userNm",
              colId: "userNm",
              width: 100,
              cellStyle: () => ({ textAlign: "center" }),
            },
            {
              headerName: "변경항목",
              field: "chgTypeNm",
              colId: "chgTypeNm",
              width: 80,
              cellStyle: () => ({ textAlign: "center" }),
            },
            {
              headerName: "변경전",
              field: "chgBfrInfoNm",
              colId: "chgBfrInfoNm",
              width: 150,
              cellStyle: () => ({ textAlign: "center" }),
            },
            {
              headerName: "변경후",
              field: "chgAftrInfoNm",
              colId: "chgAftrInfoNm",
              width: 150,
              cellStyle: () => ({ textAlign: "center" }),
            },
            {
              headerName: "변경자명",
              field: "prcrNm",
              colId: "prcrNm",
              width: 100,
              cellStyle: () => ({ textAlign: "center" }),
            },
          ],
        },
      },

      // 검색 조건 Props
      userSelectProps: this.getInitialUserSelectProps(),
      ognzSelectProps: this.getInitialOgnzSelectProps(),
      selectboxProps: this.getInitialSelectboxProps(),
      calendarProps: this.getInitialCalendarProps(),
    };

    // 이벤트 바인딩 (필수)
    this.bindEvents();
  }

  // 🔧 초기 버튼 Props 생성
  getInitialButtonProps = () => ({
    btnSearch: {
      id: "btnSearch",
      value: "조회",
      color: "blue",
      size: "md",
      fiiled: true,
      disabled: false,
      hidden: false,
      className: "icon-srch",
    },
    btnReset: {
      id: "btnReset",
      value: "",
      color: "grey",
      className: "icon-reset",
      type: "icon",
      disabled: false,
      hidden: false,
    },
    btnExcel: {
      id: "btnExcel",
      value: "엑셀",
      color: "grey",
      size: "md",
      fiiled: true,
      disabled: false,
      hidden: false,
      className: "icon-excel",
    },
  });

  // 🔧 초기 사용자 선택 Props
  getInitialUserSelectProps = () => ({
    id: "iptUserIdSearch",
    userId: "",
    userNm: "",
    keyword: "",
  });

  // 🔧 초기 조직 선택 Props
  getInitialOgnzSelectProps = () => ({
    id: "iptOgnzNmSearch",
    ognzCd: "",
    ognzNm: "",
    keyword: "",
  });

  // 🔧 초기 Selectbox Props
  getInitialSelectboxProps = () => ({
    selChangeTypeCd: {
      id: "selChangeTypeCd",
      value: "",
      dataset: [{ value: "", name: "전체" }],
      disabled: false,
    },
  });

  // 🔧 초기 Calendar Props
  getInitialCalendarProps = () => ({
    rangeCalFromToChgDttm: {
      id: "rngFromToChgDttm",
      strtId: "fromChgDttm",
      endId: "toChgDttm",
    },
  });

  // 🔧 이벤트 바인딩
  bindEvents = () => {
    this.event.button.onClick = this.event.button.onClick.bind(this);
    this.event.grid.onGridReady = this.event.grid.onGridReady.bind(this);
    this.event.grid.onRowClicked = this.event.grid.onRowClicked.bind(this);
    this.event.grid.onScrollEnd = this.event.grid.onScrollEnd.bind(this);
    this.event.input.onChange = this.event.input.onChange.bind(this);
    this.event.selectbox.onChange = this.event.selectbox.onChange.bind(this);
    this.event.userSelect.onChange = this.event.userSelect.onChange.bind(this);
    this.event.ognzSelect.onChange = this.event.ognzSelect.onChange.bind(this);
  };

  // 🔧 컴포넌트 마운트
  componentDidMount() {
    // 기본 최근 1개월 날짜 설정
    this.setUpDateRange();

    // 변경항목 설정
    this.setUpCommonCodes();
  }

  setUpDateRange = () => {
    const today = DateLib.getToday();
    const startDate = DateLib.getAddMonth(today, -1);

    this.setState({
      calendarProps: {
        ...this.state.calendarProps,
        rangeCalFromToChgDttm: {
          ...this.state.calendarProps.rangeCalFromToChgDttm,
          strtId: startDate,
          endId: today,
        },
      },
    });

    ComLib.updateStateObject(this, "dsSearch", {
      fromChgDttm: startDate,
      toChgDttm: today,
    });
  };

  setUpCommonCodes = () => {
    const codeList = ComLib.getCommCodeList("CHG_TYPE_CD");
    const searchDataset = [{ value: "", name: "전체" }, ...codeList];

    if (!codeList) {
      console.error("codeList is not defined");
      return;
    }

    this.setState({
      selectboxProps: {
        ...this.state.selectboxProps,
        selChangeTypeCd: {
          ...this.state.selectboxProps.selChangeTypeCd,
          dataset: searchDataset,
        },
      },
    });
  };

  // 🔧 통합 유효성 검증
  validation = (transId) => {
    switch (transId) {
      case "SYS6030R01":
      case "rngFromToChgDttm":
        // 날짜 범위 검증
        const startDate = this.state.dsSearch.fromChgDttm;
        const endDate = this.state.dsSearch.toChgDttm;
        const today = DateLib.getToday();

        // 조회기간 필수 체크
        if (StrLib.isNull(startDate) || StrLib.isNull(endDate)) {
          ComLib.openDialog("A", "SYSI0010", [
            "조회할 실행 기간을 선택하세요.",
          ]);
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
        const diffDays = DateLib.getDiffDate(startDate, endDate);
        if (diffDays > 31) {
          ComLib.openAlertDialog("조회 기간은 최대 1개월까지 가능합니다.");
          return false;
        }

        this.state.dsUserChgHistList.resetPage();
        break;

      case "SYS6030E01":
        // 엑셀 다운로드 검증 - 조회된 데이터가 있어야 함
        if (this.state.dsUserChgHistList.getRecords().length === 0) {
          ComLib.openDialog("A", "SYSI0010", [
            "다운로드할 데이터가 없습니다. 먼저 조회를 실행해주세요.",
          ]);
          return false;
        }
        break;

      default:
        break;
    }
    return true;
  };

  // 🔧 통합 서버 통신
  transaction = (transId) => {
    let transManager = new TransManager();
    transManager.setTransId(transId);

    switch (transId) {
      case "SYS6030R01":
      case "rngFromToChgDttm":
        this.executeSearch(transManager);
        break;

      case "SYS6030E01":
        this.executeExcelDownload(transManager);
        break;

      default:
        break;
    }
  };

  // 🔧 검색 실행
  executeSearch = (transManager) => {
    transManager.setTransUrl("/api/log/user-change/r01");
    transManager.setCallBack(this.callback);
    // transManager.addConfig({
    // 	datasetsend: 'dsSearch',
    // 	datasetrecv: 'dsUserChgHistList'
    // });

    const searchData = {
      userId: this.state.userSelectProps.userId,
      startDate: formatDateToStorage(this.state.dsSearch.fromChgDttm),
      endDate: formatDateToStorage(this.state.dsSearch.toChgDttm),
      ognzCd: this.state.ognzSelectProps.ognzCd,
      chgTypeCd: this.state.selectboxProps.selChangeTypeCd.value,
    };

    transManager.setPaging(this.state.dsUserChgHistList.getPaging());
    transManager.setFormData(searchData);
    transManager.agent();
  };

  // 🔧 엑셀 다운로드 실행
  executeExcelDownload = (transManager) => {
    // 화면에 표시된 데이터를 CSV로 다운로드
    this.downloadCSV();
  };

  // 🔧 CSV 다운로드
  downloadCSV = async () => {
    try {
      const records = await this.state.dsUserChgHistList.getRecords();

      if (!records || records.length === 0) {
        ComLib.openDialog("A", "SYSI0010", ["다운로드할 데이터가 없습니다."]);
        return;
      }

      // CSV 헤더
      const headers = this.state.grdProps.grdUserChgHistList.header.map(
        (header) => header.headerName
      );
      headers.unshift("No");

      // CSV 데이터 생성
      const csvData = records.map((item, index) => [
        index + 1, // No
        item.chgDt || "", // 변경일시
        item.userId || "", // 사용자ID
        item.userNm || "", // 사용자명
        item.chgTypeNm || "", // 변경항목
        item.chgBfrInfoNm || "", // 변경 전
        item.chgAftrInfoNm || "", // 변경 후
        item.prcrNm || "", // 변경자명
      ]);

      // CSV 문자열 생성
      const csvContent = [
        headers.join(","),
        ...csvData.map((row) => row.map((cell) => `"${cell}"`).join(",")),
      ].join("\n");

      // BOM 추가 (한글 깨짐 방지)
      const BOM = "\uFEFF";
      const csvWithBOM = BOM + csvContent;

      // 파일 다운로드
      const blob = new Blob([csvWithBOM], { type: "text/csv;charset=utf-8;" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `사용자변경이력_${new Date()
        .toISOString()
        .slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      ComLib.openDialog("A", "SYSI0010", ["CSV 파일이 다운로드되었습니다."]);
    } catch (error) {
      ComLib.openDialog("A", "SYSI0010", [
        "엑셀 다운로드 중 오류가 발생했습니다.",
      ]);
    }
  };

  // 🔧 응답 처리 (기능정의서 기준)
  callback = (res) => {
    let errorMessage = "처리 중 오류가 발생했습니다.";

    if (!res.result || res.data.error) {
      if (res.data.message || res.message) {
        errorMessage = res.data.message || res.message;
      }
      ComLib.openDialog("A", "SYSI0010", [errorMessage]);
      return;
    }

    switch (res.id) {
      case "SYS6030R01":
        this.handleSearchResult(res);
        break;

      default:
        break;
    }
  };

  // 🔧 검색 결과 처리
  handleSearchResult = (res) => {
    if (res.result) {
      // 행 번호 추가
      const formattedData = res.data.content.map((item, index) => ({
        ...item,
        rowNum: index + 1,
        chgDt: item.chgDt ? StrLib.setFormatData(item.chgDt, "-") : "",
        chgTypeNm: item.chgTypeNm || "",
        chgBfrInfoNm: item.chgBfrInfoNm || "",
        chgAftrInfoNm: item.chgAftrInfoNm || "",
        prcrNm: item.prcrNm || "",
      }));

      // formattedData를 res.data.content에 적용
      const updatedResData = {
        ...res.data,
        content: formattedData,
      };

      ComLib.setStateRecords(this, "dsUserChgHistList", updatedResData);
    }
  };

  // 🔧 이벤트 핸들러
  event = {
    button: {
      onClick: (e) => {
        switch (e.target.id) {
          case "btnSearch":
            if (this.validation("SYS6030R01")) {
              this.transaction("SYS6030R01");
            }
            break;

          case "btnExcel":
            if (this.validation("SYS6030E01")) {
              this.transaction("SYS6030E01");
            }
            break;

          case "rngFromToChgDttm":
            if (this.validation("rngFromToChgDttm")) {
              this.transaction("rngFromToChgDttm");
            }

            break;

          default:
            break;
        }
      },
    },

    grid: {
      onGridReady: (params) => {
        this.gridApi = params.api;
        this.columnApi = params.columnApi;
      },

      onRowClicked: (e) => {
        this.currentRow = e.data.userId || "";
        // 변경이력은 단순 조회용이므로 별도 액션 없음
      },

      onScrollEnd: (e) => {
        if (this.state.dsUserChgHistList.isLastPage()) {
          return;
        }

        this.state.dsUserChgHistList.nextPage();
        this.transaction("SYS6030R01");
      },
    },

    input: {
      onChange: (e) => {
        if (!e || !e.target) {
          console.warn("⚠️ onChange 이벤트에 target이 없습니다:", e);
          return;
        }

        const { id, value } = e.target;

        this.setState({
          ...this.state,
          calendarProps: {
            ...this.state.calendarProps,
            [id]: { ...this.state.calendarProps[id], value: value },
          },
        });
      },
    },

    selectbox: {
      onChange: (e) => {
        const { id, value } = e.target;

        this.setState({
          ...this.state,
          selectboxProps: {
            ...this.state.selectboxProps,
            [id]: { ...this.state.selectboxProps[id], value: value },
          },
        });
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

    ognzSelect: {
      onChange: (ognzData) => {
        this.setState({
          ...this.state,
          ognzSelectProps: {
            ...this.state.ognzSelectProps,
            ognzCd: ognzData.ognzCd || "",
            ognzNm: ognzData.ognzNm || "",
            keyword: ognzData.ognzCd || ognzData.ognzNm || "",
          },
        });
      },
    },
  };

  render() {
    const {
      calendarProps,
      selectboxProps,
      ognzSelectProps,
      userSelectProps,
      btnProps,
      grdProps,
      dsSearch,
      dsUserChgHistList,
    } = this.state;
    return (
      <FullPanel>
        {/* 검색 조건 영역 */}
        <SearchPanel>
          <RelativeGroup>
            <LFloatArea style={{flexDirection: 'column'}}>
              <div style={{display: 'grid', gridTemplateColumns: '64px 268px 84px 120px 62px 1fr 73px 1fr', alignItems: 'center'}}>
                <Label value="변경일자" />
                <RangeInputCalendar
                  {...calendarProps.rangeCalFromToChgDttm}
                  startDate={dsSearch.fromChgDttm}
                  endDate={dsSearch.toChgDttm}
                  onChange={ComLib.handleRangeCalendarChange(
                    this,
                    "dsSearch",
                    "fromChgDttm",
                    "toChgDttm"
                  )}
                  onKeyPress={ComLib.handleEnterKey(this.event.button.onClick)}
                />
                <Label value="변경항목" />
                <Selectbox
                  {...selectboxProps.selChangeTypeCd}
                  onChange={this.event.selectbox.onChange}
                />
                <Label value="조직" />
                <OgnzSelect
                  id={ognzSelectProps.id}
                  ognzCd={ognzSelectProps.ognzCd}
                  ognzNm={ognzSelectProps.ognzNm}
                  keyword={ognzSelectProps.keyword}
                  disabled={false}
                  onChange={this.event.ognzSelect.onChange}
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
                <h3>사용자변경이력목록</h3>
              </LFloatArea>
              <RFloatArea>
                <Button {...btnProps.btnExcel} onClick={this.event.button.onClick} />
              </RFloatArea>
            </RelativeGroup>
            <Grid
              {...grdProps.grdUserChgHistList}
              data={dsUserChgHistList}
              onGridReady={this.event.grid.onGridReady}
              onRowClicked={this.event.grid.onRowClicked}
              onScrollEnd={this.event.grid.onScrollEnd}
              totalRowCnt={dsUserChgHistList.getTotalRowCnt()}
            />
          </ComponentPanel>
        </SubFullPanel>
      </FullPanel>
    );
  }
}

export default View;
