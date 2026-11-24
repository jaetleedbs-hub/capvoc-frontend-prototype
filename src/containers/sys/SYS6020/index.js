/**
 * SYS6020 오류로그
 *
 * 네 서비스(desk·connect·search·chat)와 admin·batch 의 «장애»를 한자리에서 본다.
 * - 오류로그 목록 조회 (SYS6020R01)
 * - 오류로그 상세 조회 (SYS6020R02) — 사유 전문은 여기서만 연다
 *
 * 형제 화면(SYS6040 프로그램접속이력)과 «같은 관용구»를 쓴다. 새로 정하지 않는다.
 */

import React from "react";

// 레이아웃 컴포넌트
import {
  ComponentPanel,
  FullPanel,
  SubFullPanel,
  SearchPanel,
  LFloatArea,
  RFloatArea,
  RelativeGroup,
} from "components";

// UI 컴포넌트
import { Grid, Label, Textfield, Selectbox } from "components";

// 버튼 컴포넌트
import { BasicButton as Button } from "components";

// 특수 컴포넌트
import { RangeInputCalendar } from "components";

// 공통 라이브러리
import { ComLib, DataLib, StrLib, DateLib, TransManager } from "common";

import { formatDateToDisplay } from "../../../utils/dateUtils";

/**
 * ★ 코드값 → 표시 문구. «이 한 곳»에만 둔다.
 *
 * 서버는 ASCII 코드값만 내려보낸다(규약 §5-1). 판정·비교·정렬은 «코드값»으로 하고
 * 한글은 그 코드의 «표시»일 뿐이다(§5-2) — 한글로 분기하지 않는다.
 *
 * ⚠ admin 에는 지금 i18n 이 «없다»(의존성 0 · 리소스 파일 0 · 형제 50여 화면이 전부 한글 리터럴).
 *   그래서 §5-3(문구를 리소스로)을 지금은 못 지킨다. 대신 «지킬 자리»를 여기 한 곳에 모아 둔다 —
 *   admin 에 i18n 이 들어오면 이 맵이 그대로 리소스로 간다. 문구를 화면 곳곳에 흩지 않는 이유다.
 *   ⛔ 이 맵을 다른 화면으로 «복사해 가지 말 것». 옮길 때는 리소스로 옮긴다.
 */
const LABELS = {
  svcCd: {
    DESK: "데스크",
    CONNECT: "고객채팅",
    SEARCH: "검색",
    CHAT: "채팅서버",
    ADMIN: "관리자",
    BATCH: "배치",
    GATEWAY: "게이트웨이",
  },
  sevCd: {
    ERROR: "오류",
    WARN: "경고",
  },
  failKindCd: {
    EXCEPTION: "예외",
    DEPENDENCY: "외부 호출 실패",
    CONFIG: "설정으로 멈춤",
    DEGRADED: "일부 실패",
    REJECTED: "거절",
  },
};

/**
 * 코드값을 표시 문구로. <b>모르는 코드는 코드값을 그대로 보인다.</b>
 *
 * ⛔ 빈 칸이나 「알 수 없음」으로 뭉개지 않는다 — 그러면 새 코드값이 들어와도 화면이 조용하고,
 *   「모르는 코드가 오고 있다」를 아무도 모른다. 보여야 잡힌다.
 */
const labelOf = (group, code) => {
  if (StrLib.isNull(code)) return "";
  const map = LABELS[group] || {};
  return map[code] || code;
};

/**
 * 오류코드를 목록에서 «읽히게» 줄인다 — 패키지를 떼고 클래스명만 남긴다.
 *
 * ⛔ 화면을 띄워 보고 고친 자리다. FQCN 을 그대로 두면 폭 200 에
 * {@code org.springframework.web.servlet.resource.NoR…} 로 잘려 <b>무엇인지 구별이 안 된다</b> —
 * 같은 접두를 가진 예외가 여럿이라 잘린 채로는 서로 같아 보인다.
 * 전문은 «상세»에 그대로 있으니 목록에서 잃는 것이 없다.
 *
 * ⚠ 점이 없는 값(예: 코드값을 그대로 넣은 경우)은 «그대로» 둔다.
 */
const shortErrCd = (errCd) => {
  if (StrLib.isNull(errCd)) return "";
  const i = errCd.lastIndexOf(".");
  return i >= 0 && i < errCd.length - 1 ? errCd.substring(i + 1) : errCd;
};

/** 선택상자 dataset — 코드값이 value 이고 한글은 name 이다(§5-2). */
const selectDataset = (group) =>
  [{ value: "ALL", name: "전체" }].concat(
    Object.keys(LABELS[group]).map((code) => ({ value: code, name: LABELS[group][code] }))
  );

class View extends React.Component {
  constructor(props) {
    super(props);

    // 그리드 API 참조 (필수)
    this.gridApi = null;
    this.columnApi = null;
    this.currentRow = "";

    this.state = {
      // 데이터셋 (필수)
      dsErrorLogList: DataLib.datalist.getInstance({ paging: { size: 100 } }),
      dsSearch: DataLib.datalist.getInstance(),

      // 상세 (그리드에서 행을 고르면 채워진다)
      detail: null,

      // 검색기간 Props
      rangeCalendarProps: {
        id: "searchRangeCalendar",
        startDate: DateLib.getToday(),
        endDate: DateLib.getToday(),
        strtId: "searchRangeCalendarStart",
        endId: "searchRangeCalendarEnd",
        label: "검색기간",
      },

      // 선택상자 Props
      selectboxProps: {
        selSvcCdSearch: {
          id: "selSvcCdSearch",
          value: "ALL",
          dataset: selectDataset("svcCd"),
          width: "100%",
          disabled: false,
        },
        selSevCdSearch: {
          id: "selSevCdSearch",
          value: "ALL",
          dataset: selectDataset("sevCd"),
          width: "100%",
          disabled: false,
        },
        selFailKindCdSearch: {
          id: "selFailKindCdSearch",
          value: "ALL",
          dataset: selectDataset("failKindCd"),
          width: "100%",
          disabled: false,
        },
      },

      // 텍스트필드 Props
      textFieldProps: {
        iptSubject: {
          id: "iptSubject",
          value: "",
          placeholder: "대상을 입력하세요 (예: search:unified)",
          maxLength: 200,
          type: "text",
          readOnly: false,
          disabled: false,
        },
        iptCmpyId: {
          id: "iptCmpyId",
          value: "",
          placeholder: "회원사ID를 입력하세요",
          maxLength: 50,
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
        grdErrorLogList: {
          id: "grdErrorLogList",
          areaName: "오류로그 목록",
          infinite: true,
          suppressRowClickSelection: false,
          addRowBtn: false,
          delRowBtn: false,
          dnlExcelBtn: false,
          height: "calc(100vh - 520px)",
          rowSelection: "single",
          rowNum: true,
          header: [
            {
              headerName: "발생일시",
              field: "logDt",
              colId: "logDt",
              editable: false,
              width: 110,
              type: "text",
              textAlign: "center",
            },
            {
              headerName: "서비스",
              field: "svcCdNm",
              colId: "svcCdNm",
              editable: false,
              width: 70,
              type: "text",
              textAlign: "center",
            },
            {
              headerName: "등급",
              field: "sevCdNm",
              colId: "sevCdNm",
              editable: false,
              width: 50,
              type: "text",
              textAlign: "center",
            },
            {
              headerName: "종류",
              field: "failKindCdNm",
              colId: "failKindCdNm",
              editable: false,
              width: 90,
              type: "text",
              textAlign: "center",
            },
            {
              headerName: "회원사",
              field: "cmpyId",
              colId: "cmpyId",
              editable: false,
              width: 70,
              type: "text",
              textAlign: "center",
            },
            {
              headerName: "서버",
              field: "svrId",
              colId: "svrId",
              editable: false,
              width: 90,
              type: "text",
              textAlign: "center",
            },
            {
              /*
               * ⚠ 폭 200 → 340. «화면을 띄워 보고» 고친 자리다(2026-09-10, dev).
               *
               * 배치가 옛 행을 끌어오면서 subject 가 `desk:` + 경로 꼴이 됐다. 실측 최대 47자인데
               * 200 에서는 `desk:/api/aicc/ap501/knwlQna/chatbot/ask/str…` 로 «꼬리가 잘린다» —
               * 하필 잘리는 쪽이 «무엇을 하다 났는지»를 가리는 부분이라, 같은 접두를 가진 경로가
               * 서로 같아 보인다.
               *
               * ★ 바로 아래 errCd 에서 오늘 아침에 고친 것과 «같은 병»이다. 그때는 FQCN 을
               *   클래스명만 남겨 줄였고, 여기서는 줄일 수가 없다(경로가 곧 내용이다) — 그래서 넓힌다.
               *   errCd 는 이제 클래스명뿐이라 170 이면 남는다. 그 몫을 여기로 옮긴 것이다.
               */
              headerName: "대상",
              field: "subject",
              colId: "subject",
              editable: false,
              width: 340,
              type: "text",
              textAlign: "left",
            },
            {
              headerName: "오류코드",
              field: "errCd",
              colId: "errCd",
              editable: false,
              width: 170,
              type: "text",
              textAlign: "left",
            },
          ],
        },
      },
    };

    // 이벤트 바인딩 (필수)
    this.event.button.onClick = this.event.button.onClick.bind(this);
    this.event.input.onChange = this.event.input.onChange.bind(this);
    this.event.selectbox.onChange = this.event.selectbox.onChange.bind(this);
  }

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
      case "SYS6020R01": // 오류로그 조회
        const startDate = this.state.dsSearch.fromChgDttm;
        const endDate = this.state.dsSearch.toChgDttm;
        const today = DateLib.getToday();

        if (StrLib.isNull(startDate) || StrLib.isNull(endDate)) {
          ComLib.openDialog("A", "SYSI0010", ["조회할 검색 기간을 선택하세요."]);
          return false;
        }

        if (startDate > endDate) {
          ComLib.openDialog("A", "SYSI0010", ["시작일이 종료일보다 늦을 수 없습니다."]);
          return false;
        }

        if (endDate > today) {
          ComLib.openDialog("A", "SYSI0010", ["종료일이 현재보다 빠를 수 없습니다."]);
          return false;
        }

        // 1개월 범위 제한 — 형제 화면과 같은 기준이다.
        const oneMonthAgo = DateLib.getAddMonth(endDate, -1);
        if (startDate < oneMonthAgo) {
          ComLib.openDialog("A", "SYSI0010", ["조회 기간은 최대 1개월까지 가능합니다."]);
          return false;
        }

        this.state.dsErrorLogList.resetPage();
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
        case "SYS6020R01": { // 오류로그 목록 조회
          transManager.setTransId(transId);
          transManager.setTransUrl("/api/log/error/r01");
          transManager.setCallBack(this.callback);

          // 'ALL' 은 «조건 없음»이다 — 서버에 보내지 않는다.
          const sel = this.state.selectboxProps;
          const searchData = {
            startDate: formatDateToDisplay(this.state.dsSearch.fromChgDttm),
            endDate: formatDateToDisplay(this.state.dsSearch.toChgDttm),
            svcCd: sel.selSvcCdSearch.value === "ALL" ? "" : sel.selSvcCdSearch.value,
            sevCd: sel.selSevCdSearch.value === "ALL" ? "" : sel.selSevCdSearch.value,
            failKindCd:
              sel.selFailKindCdSearch.value === "ALL" ? "" : sel.selFailKindCdSearch.value,
            cmpyId: this.state.textFieldProps.iptCmpyId.value,
            subject: this.state.textFieldProps.iptSubject.value,
          };

          this.state.dsSearch.setRecords([searchData]);
          transManager.setPaging(this.state.dsErrorLogList.getPaging());
          transManager.setFormData(searchData);
          transManager.agent();
          break;
        }

        case "SYS6020R02": { // 오류로그 상세 조회
          const logSid = params[1];
          transManager.setTransId(transId);
          transManager.setTransUrl("/api/log/error/r02/" + logSid);
          transManager.setCallBack(this.callback);
          transManager.setFormData({});
          transManager.agent();
          break;
        }

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
        case "SYS6020R01": { // 목록
          // 코드값 → 표시 문구는 «여기서» 붙인다. 원래 코드값도 함께 남긴다 —
          //  나중에 정렬·필터를 코드값으로 해야 할 때 화면 문구로 되돌아가지 않도록.
          const formattedData = res.data.content.map((item, index) => ({
            ...item,
            rowNum: index + 1,
            logDt: item.logDt ? StrLib.setFormatData(item.logDt, "-") : "",
            svcCdNm: labelOf("svcCd", item.svcCd),
            sevCdNm: labelOf("sevCd", item.sevCd),
            failKindCdNm: labelOf("failKindCd", item.failKindCd),
            cmpyId: item.cmpyId || "",
            svrId: item.svrId || "",
            subject: item.subject || "",
            errCd: shortErrCd(item.errCd),
            errCdFull: item.errCd || "",   // 원본은 남긴다 — 목록에서 줄인 것은 «표시»뿐이다
          }));

          ComLib.setStateRecords(this, "dsErrorLogList", {
            ...res.data,
            content: formattedData,
          });
          break;
        }

        case "SYS6020R02": // 상세
          this.setState({ ...this.state, detail: res.data });
          break;

        default:
          break;
      }
    } else {
      ComLib.openDialog("A", "SYSI0010", [res.message || "조회 중 오류가 발생했습니다."]);
    }
  };

  // 이벤트 처리
  event = {
    button: {
      onClick: (e) => {
        let btnId = e.target.id;

        switch (btnId) {
          case "btnSearch":
            this.handleSearchClick();
            break;

          case "btnReset":
            this.resetSearchConditions();
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
            [fieldId]: { ...this.state.textFieldProps[fieldId], value: value },
          },
        });
      },
    },

    selectbox: {
      onChange: (e) => {
        let fieldId = e.target.id;
        let value = e.target.value;

        this.setState({
          ...this.state,
          selectboxProps: {
            ...this.state.selectboxProps,
            [fieldId]: { ...this.state.selectboxProps[fieldId], value: value },
          },
        });
      },
    },

    grid: {
      onReady: (params) => {
        this.gridApi = params.api;
        this.columnApi = params.columnApi;
      },

      /**
       * ⚠ Grid 래퍼가 넘기는 것은 ag-grid 의 {@code params} 가 «아니다» —
       *   {@code { id, data, index, event }} 평면 객체다(components/Grid/index.js:491).
       *
       * ⛔ 처음에 형제 화면(SYS6040)의 핸들러를 그대로 베껴 {@code params.node.selected} 를 읽었다.
       *   {@code node} 가 없어 TypeError 로 «조용히» 죽었고, 화면에서는 「눌러도 아무 일이 없다」로 보였다.
       *   ★ 그 형제 핸들러는 «한 번도 돌아본 적이 없다» — SYS6040 은 onRowSelected 를 Grid 에
       *     넘기지 않는다. 돌아본 적 없는 코드를 본보기로 삼으면 이렇게 된다.
       */
      onRowSelected: (e) => {
        const row = e && e.data;
        if (!row || StrLib.isNull(row.logSid)) return;
        this.currentRow = row.logSid;
        // 사유 전문은 목록에 없다 — 고른 행만 «따로» 읽는다.
        this.transaction("SYS6020R02", row.logSid);
      },

      onScrollEnd: () => {
        if (this.state.dsErrorLogList.isLastPage()) {
          return;
        }
        this.state.dsErrorLogList.nextPage();
        this.transaction("SYS6020R01");
      },
    },
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
      selectboxProps: {
        selSvcCdSearch: { ...this.state.selectboxProps.selSvcCdSearch, value: "ALL" },
        selSevCdSearch: { ...this.state.selectboxProps.selSevCdSearch, value: "ALL" },
        selFailKindCdSearch: {
          ...this.state.selectboxProps.selFailKindCdSearch,
          value: "ALL",
        },
      },
      textFieldProps: {
        iptSubject: { ...this.state.textFieldProps.iptSubject, value: "" },
        iptCmpyId: { ...this.state.textFieldProps.iptCmpyId, value: "" },
      },
      detail: null,
    });
  };

  handleSearchClick = () => {
    if (this.validation("SYS6020R01")) {
      this.setState({ ...this.state, detail: null });
      this.transaction("SYS6020R01");
    }
  };

  // 렌더링
  render() {
    const {
      rangeCalendarProps,
      selectboxProps,
      textFieldProps,
      btnProps,
      grdProps,
      dsSearch,
      dsErrorLogList,
      detail,
    } = this.state;

    return (
      <FullPanel>
        {/* 검색 영역 */}
        <SearchPanel>
          <RelativeGroup>
            <LFloatArea style={{ flexDirection: "column" }}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "64px 268px 60px 120px 50px 100px 80px 140px",
                  alignItems: "center",
                }}
              >
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
                <Label value="서비스" />
                <Selectbox
                  {...selectboxProps.selSvcCdSearch}
                  onChange={this.event.selectbox.onChange}
                />
                <Label value="등급" />
                <Selectbox
                  {...selectboxProps.selSevCdSearch}
                  onChange={this.event.selectbox.onChange}
                />
                <Label value="실패종류" />
                <Selectbox
                  {...selectboxProps.selFailKindCdSearch}
                  onChange={this.event.selectbox.onChange}
                />
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "64px 268px 60px 268px",
                  alignItems: "center",
                }}
              >
                <Label value="회원사" />
                <Textfield
                  {...textFieldProps.iptCmpyId}
                  onChange={this.event.input.onChange}
                  onKeyPress={ComLib.handleEnterKey(this.handleSearchClick)}
                />
                <Label value="대상" />
                <Textfield
                  {...textFieldProps.iptSubject}
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
                <h3>오류로그 목록</h3>
              </LFloatArea>
            </RelativeGroup>
            <Grid
              {...grdProps.grdErrorLogList}
              data={dsErrorLogList}
              onGridReady={this.event.grid.onReady}
              onRowSelected={this.event.grid.onRowSelected}
              onScrollEnd={this.event.grid.onScrollEnd}
              totalRowCnt={dsErrorLogList.getTotalRowCnt()}
            />
          </ComponentPanel>

          {/* 상세 — 목록에 없는 «사유 전문»을 고른 행에 대해서만 연다 */}
          <ComponentPanel>
            <RelativeGroup>
              <LFloatArea>
                <h3>사유</h3>
              </LFloatArea>
            </RelativeGroup>
            {detail ? (
              <div style={{ padding: "8px 12px" }}>
                <div style={{ marginBottom: 6 }}>
                  <b>{detail.subject}</b>
                  {detail.srcSchema ? (
                    <span style={{ marginLeft: 8, color: "#888" }}>
                      (원본 {detail.srcSchema} / {detail.srcLogId})
                    </span>
                  ) : null}
                </div>
                <pre
                  style={{
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-all",
                    maxHeight: 220,
                    overflow: "auto",
                    margin: 0,
                    fontSize: 12,
                    background: "#f7f7f7",
                    padding: 8,
                  }}
                >
                  {detail.errCn}
                </pre>
              </div>
            ) : (
              <div style={{ padding: "12px", color: "#888" }}>
                목록에서 행을 선택하면 사유가 표시됩니다.
              </div>
            )}
          </ComponentPanel>
        </SubFullPanel>
      </FullPanel>
    );
  }
}

export default View;
