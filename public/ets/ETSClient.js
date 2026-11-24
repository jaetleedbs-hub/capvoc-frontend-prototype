/******************************************************************** 
 * Common Action
 ********************************************************************/
var CMD_LOGIN 					= "LOGIN";
var CMD_LOGOUT 					= "LOGOUT";
var CMD_READY 					= "READY";
var CMD_NOT_READY 				= "NOT_READY";
var CMD_MAKE_CALL 				= "MAKE_CALL";
var CMD_DROP 					= "DROP";
var CMD_HOLD 					= "HOLD";
var CMD_UNHOLD 					= "RETRIEVE";
var CMD_CONSULT 				= "CONSULT";
var CMD_TRANSFER 				= "TRANSFER";
var CMD_TRANSFER_COMPLETE		= "TRANSFER_COMPLETE";
var CMD_TRANSFER_CANCEL			= "TRANSFER_CANCEL";
var CMD_CONFERENCE 				= "CONFERENCE";
var CMD_BLIND_TRANSFER 			= "BLIND_TRANSFER";
var CMD_BLIND_CONFERENCE     	= "BLIND_CONFERENCE";
var CMD_CANCEL_CONSULT     	    = "CANCEL_CONSULT";
var CMD_REMOVE_PARTY 			= "REMOVE_PARTY";
var CMD_ANSWER 					= "ANSWER";
var CMD_REJECT 					= "REJECT";
var CMD_SEND_DTMF				= "SEND_DTMF";
var CMD_GET_CALL_DATA 			= "GET_CALL_DATA";
var CMD_SET_CALL_DATA 			= "SET_CALL_DATA";
var CMD_SILENT_MONITOR_START 	= "SILENT_MONITOR_START";
var CMD_SILENT_MONITOR_END 		= "SILENT_MONITOR_END";
var CMD_BARGE_IN_CALL_START 	= "BARGE_IN_CALL_START";
var CMD_BARGE_IN_CALL_END 		= "BARGE_IN_CALL_END";
var CMD_COACHING_START 	        = "COACHING_START";
var CMD_COACHING_END 	        = "COACHING_END";
var CMD_SUPERVISOR_READY 		= "SUPERVISOR_READY";
var CMD_SUPERVISOR_NOT_READY 	= "SUPERVISOR_NOT_READY";
var CMD_SUPERVISOR_LOGOUT 		= "SUPERVISOR_LOGOUT";
var CMD_UNKNOWN 				= "UNKNOWN";

/******************************************************************** 
 * Cisco Finesse Action
 ********************************************************************/
var CMD_GET_QUEUE 				= "GET_QUEUE";
var CMD_GET_ALL_USERS 			= "GET_ALL_USERS";
var CMD_GET_USER_INFO 			= "GET_USER_INFO";
var CMD_GET_TEAM_MEMEBER 		= "GET_TEAM_MEMEBER";
var CMD_GET_REASON_CODES 		= "GET_REASON_CODES";
var CMD_GET_USER_QUEUE 			= "GET_USER_QUEUE";

/********************************************************************
 * Aspect UIP Action
 ********************************************************************/
var CMD_TAKE_CALLS 				= "TAKE_CALLS";
var CMD_NEXT_CALL 				= "NEXT_CALL";
var CMD_GET_INFOS 				= "GET_INFOS";
var CMD_RECORD 					= "RECORD";
var CMD_EXCLUDE 				= "EXCLUDE";
var CMD_CALLBACK 				= "CALLBACK";
var CMD_GENERATE_DTMF           = "GENERATE_DTMF";
var CMD_GET_DB_INFO             = "GET_DB_INFO";
var CMD_GET_USER_DEFINED_ITEMS  = "GET_USER_DEFINED_ITEMS";
var CMD_SET_USER_DEFINED_ITEM   = "SET_USER_DEFINED_ITEM";

/********************************************************************
 * EMC ECC Action
 ********************************************************************/
var CMD_JOIN	 				    = "JOIN";
var CMD_EXIT	 				    = "EXIT";
var CMD_HOLD	 				    = "HOLD";
var CMD_ACTIVE	 			        = "ACTIVE";
var CMD_MESSAGE	 			        = "MESSAGE";
var CMD_MESSAGE_LIST			    = "GET_MESSAGE_LIST";
var CMD_CONTACT_INFO			    = "GET_CONTACT_INFO";
var CMD_CONTACT_LIST			    = "GET_CONTACT_LIST";

/********************************************************************
 * ETS_CLIENT
 ********************************************************************/
function ETS_CLIENT() {
    this.MSG_LIB_VERSION = "1.0.0";
    this.MSG_BUILD_DATE = "2022-01-06 15:04";
    this._id = "";
    this._dn = "";
    this._type = "none";

    this.OnAgentEvent = undefined;   // 상담원 이벤트 콜백
    this.OnContactEvent = undefined;    // Call 이벤트 콜백
    this.OnContactLoggerEvent = undefined;    // Call Logger 이벤트 콜백
    this.OnErrorEvent = undefined;   // Error 이벤트 콜백 (상담원/콜 관련)
    this.OnResultEvent = undefined;  // Result 결과 값 이벤트 콜백
    this.OnLogEvent = undefined;     // LogEvent
}

ETS_CLIENT.prototype = {
    ETS_SetOnAgentEvent : function (OnEvt) {
        this.OnAgentEvent = OnEvt;
    },
    ETS_SetOnContactEvent : function (OnEvt) {
        this.OnContactEvent = OnEvt;
    },
    ETS_SetOnContactLoggerEvent : function (OnEvt) {
        this.OnContactLoggerEvent = OnEvt;
    },
    ETS_SetOnErrorEvent : function (OnEvt) {
        this.OnErrorEvent = OnEvt;
    },
    ETS_SetOnResultEvent : function (OnEvt) {
        this.OnResultEvent = OnEvt;
    },
    ETS_SetOnLogEvent : function (OnEvt) {
        this.OnLogEvent = OnEvt;
    },
    OnMsgEvent : function(message) {
        var dataObj = JSON.parse(message);
        var cmd = dataObj.cmd;

        switch (cmd.toUpperCase()) {
            case "AGENT_STATE": // AgentEvent
                this.OnAgentEvent(JSON.stringify(dataObj, null, '\t'));
                break;
            case "CONTACT_STATE": // CallEvent
                this.OnContactEvent(JSON.stringify(dataObj, null, '\t'));
                break;
            case "CONTACT_LOGGER_STATE": // CallEvent
                this.OnContactLoggerEvent(JSON.stringify(dataObj, null, '\t'));
                break;
            case "ERROR": // ErrorEvent
                this.OnErrorEvent(JSON.stringify(dataObj, null, '\t'));
                break;
            case "record": // ErrorEvent
                this.OnErrorEvent(JSON.stringify(dataObj, null, '\t'));
                break;
            default: // 그외 OnResultEvent
                this.OnResultEvent(JSON.stringify(dataObj, null, '\t'));

                if(dataObj.cmd === "MEDIA_CONTENT" && dataObj.msg.method_key !== "" && dataObj.msg.member_type !== "AGENT" && dataObj.msg.member_type !== "SYSTEM"){
                    AddLogRecvEvent(dataObj.msg.message);
                }

                break;
        }
    },


	/** Common Action **/
    Login : function(id, pw, dn, type) {
        this._id = id;
        this._dn = dn;
		
        var msg = {};
        msg.id = id;
        msg.dn = dn;
        msg.pw = pw;
        return this.ETS_SendMessage(CMD_LOGIN, msg, type);
    },
    Logout : function(type) {
        return this.ETS_SendMessage(CMD_LOGOUT, null, type);
    },
    Ready : function(type, contact_type, max_contact_cnt) {
        console.log("type : " + type);
        var msg = {};
        msg.contact_type = contact_type;
        msg.max_contact_cnt = max_contact_cnt;
        return this.ETS_SendMessage(CMD_READY, msg, type);
    },
    NotReady : function(type, contact_type, reasonCode, parked) {
        var msg = {};
        if (reasonCode) {
            msg.reason_code = reasonCode;
		}

        msg.parked = parked;
        msg.contact_type = contact_type;
        return this.ETS_SendMessage(CMD_NOT_READY, msg, type);
    },
    MakeCall : function(type, contact_type, dial_type, service_id, number, call_data) {
        var msg = {};
        msg.number = number;
        msg.dial_type = dial_type;
        msg.service_id = service_id;
        msg.contact_type = contact_type;
        if(call_data){
            msg.call_variables = call_data.variables;
        }
        return this.ETS_SendMessage(CMD_MAKE_CALL, msg, type);
    },
    ReleaseCall : function(type, contact_type, call_type, call_id) {
        var msg = {};
        msg.call_type = call_type;
		msg.cti_contact_id = call_id;
        msg.contact_type = contact_type;
        return this.ETS_SendMessage(CMD_DROP, msg, type);
    },
    AnswerCall : function(type, contact_type, call_id) {
        var msg = {};
		msg.cti_contact_id = call_id;
        msg.contact_type = contact_type;		
        return this.ETS_SendMessage(CMD_ANSWER, msg, type);
    },
    Hold : function(type, contact_type, call_type, call_id) {
        var msg = {};
        msg.call_type = call_type;
		msg.cti_contact_id = call_id;
        msg.contact_type = contact_type;
        return this.ETS_SendMessage(CMD_HOLD, msg, type);
    },
    UnHold : function(type, contact_type, call_type, call_id) {
        var msg = {};
        msg.call_type = call_type;
		msg.cti_contact_id = call_id;
        msg.contact_type = contact_type;
        return this.ETS_SendMessage(CMD_UNHOLD, msg, type);
    },
    SendDTMF : function(type, dtmf) {
        var msg = {};
        msg.name = "dtmfString";
        msg.value = dtmf;
        msg.contact_type = contact_type;		
        return this.ETS_SendMessage(CMD_SEND_DTMF, msg, type);
    },
    ConsultCall : function(type, contact_type, dial_type, call_id, number, call_data, target_system) {
        var msg = {};
        msg.number = number;
        msg.dial_type = dial_type;
		msg.cti_contact_id = call_id;
        msg.contact_type = contact_type;
        if(call_data){
            msg.call_variables = call_data.variables;
        }
        if(target_system){
            msg.target_system = target_system;
        }
        return this.ETS_SendMessage(CMD_CONSULT, msg, type);
    },
    TransferComplete : function(type, contact_type) {
        var msg = {};
        msg.contact_type = contact_type;
        return this.ETS_SendMessage(CMD_TRANSFER, msg, type);
    },
    ConferenceComplete : function(type, contact_type) {
        var msg = {};
        msg.contact_type = contact_type;
        return this.ETS_SendMessage(CMD_CONFERENCE, msg, type);
    },
    BlindTransfer : function(type, contact_type, dial_type, call_id, number, call_data) {
        var msg = {};
        msg.number = number;
        msg.dial_type = dial_type;
		msg.cti_contact_id = call_id;
        msg.contact_type = contact_type;
        if(call_data){
            msg.call_variables = call_data.variables;
        }
        return this.ETS_SendMessage(CMD_BLIND_TRANSFER, msg, type);
    },
    BlindConference : function(type, contact_type, dial_type, call_id, number, call_data) {
        var msg = {};
        msg.number = number;
        msg.dial_type = dial_type;
        msg.cti_contact_id = call_id;
        msg.contact_type = contact_type;
        if(call_data){
            msg.call_variables = call_data.variables;
        }
        return this.ETS_SendMessage(CMD_BLIND_CONFERENCE, msg, type);
    },
    CancelConsult : function(type, contact_type, dial_type, call_id, held_call_id) {
        var msg = {};
        msg.dial_type = dial_type;
        msg.cti_contact_id = call_id;
        msg.held_cti_contact_id = held_call_id;
        msg.contact_type = contact_type;
        return this.ETS_SendMessage(CMD_CANCEL_CONSULT, msg, type);
    },
    RemoveParty : function(type, contact_type, call_id, remove_party_number) {
        var msg = {};
        msg.contact_type = contact_type;
        msg.cti_contact_id = call_id;
        msg.number = remove_party_number;
        return this.ETS_SendMessage(CMD_REMOVE_PARTY, msg, type);
    },
    GetCallData : function(type, contact_type, call_id) {
        var msg = {};
		msg.cti_contact_id = call_id;
        msg.contact_type = contact_type;
        return this.ETS_SendMessage(CMD_GET_CALL_DATA, msg, type);
    },
    SetCallData : function(type, contact_type, call_id, call_data) {
        var msg = {};
        msg.call_variables = call_data.call_variables;
		msg.cti_contact_id = call_id;
        msg.contact_type = contact_type;
        if(call_data){
            msg.call_variables = call_data.variables;
        }
        return this.ETS_SendMessage(CMD_SET_CALL_DATA, msg, type);
    },
    SilentMonitorStart : function(type, contact_type, user_dn) {
        var msg = {};
        msg.contact_type = contact_type;
        msg.user_dn = user_dn;
        return this.ETS_SendMessage(CMD_SILENT_MONITOR_START, msg, type);
    },
    SilentMonitorEnd : function(type, contact_type) {
        var msg = {};
        msg.contact_type = contact_type;
        return this.ETS_SendMessage(CMD_SILENT_MONITOR_END, msg, type);
    },
    BargeInCallStart : function(type, contact_type, call_id, user_dn) {
        var msg = {};
        msg.cti_contact_id = call_id;
        msg.contact_type = contact_type;
        msg.user_dn = user_dn;
        return this.ETS_SendMessage(CMD_BARGE_IN_CALL_START, msg, type);
    },
    BargeInCallEnd : function(type, contact_type) {
        var msg = {};
        msg.contact_type = contact_type;
        return this.ETS_SendMessage(CMD_BARGE_IN_CALL_END, msg, type);
    },
    CoachingStart : function(type, contact_type, user_dn) {
        var msg = {};
        msg.contact_type = contact_type;
        msg.user_dn = user_dn;
        return this.ETS_SendMessage(CMD_COACHING_START, msg, type);
    },
    CoachingEnd : function(type, contact_type) {
        var msg = {};
        msg.contact_type = contact_type;
        return this.ETS_SendMessage(CMD_COACHING_END, msg, type);
    },
    SupervisorReady : function(type, contact_type, user_id, user_pw, user_dn) {
        var msg = {};
        msg.user_id = user_id;
        msg.user_pw = user_pw;
        msg.user_dn = user_dn;
        msg.contact_type = contact_type;
        return this.ETS_SendMessage(CMD_SUPERVISOR_READY, msg, type);
    },
    SupervisorNotReady : function(type, contact_type, user_id, user_pw, user_dn) {
        var msg = {};
        msg.user_id = user_id;
        msg.user_pw = user_pw;
        msg.user_dn = user_dn;
        msg.contact_type = contact_type;
        return this.ETS_SendMessage(CMD_SUPERVISOR_NOT_READY, msg, type);
    },
    SupervisorLogout : function(type, contact_type, user_id, user_dn) {
        var msg = {};
        msg.user_id = user_id;
        msg.user_dn = user_dn;
        msg.contact_type = contact_type;
        return this.ETS_SendMessage(CMD_SUPERVISOR_LOGOUT, msg, type);
    },
	
	/** CISCO **/
    GetQueueInfo: function(type, contact_type, queueID) {		
        var msg = {};
        msg.queue_id = queueID;
        msg.contact_type = contact_type;
        return this.ETS_SendMessage(CMD_GET_QUEUE, msg, type);
    },
    GetUserQueue: function(type, contact_type) {
        var msg = {};
        msg.contact_type = contact_type;
        return this.ETS_SendMessage(CMD_GET_USER_QUEUE, msg, type);
    },
    GetTeamMembers: function(type, contact_type, team_id) {
        var msg = {};
        msg.team_id = team_id;
        msg.contact_type = contact_type;
        return this.ETS_SendMessage(CMD_GET_TEAM_MEMEBER, msg, type);
    },
    GetUserList: function(type, contact_type) {
        var msg = {};
        msg.contact_type = contact_type;
        return this.ETS_SendMessage(CMD_GET_ALL_USERS, msg, type);
    },
    GetUserInfo: function(type, contact_type, id, pw) {
        var msg = {};
		msg.id = id;
		msg.pw = pw;
        msg.contact_type = contact_type;
        return this.ETS_SendMessage(CMD_GET_USER_INFO, msg, type);
    },
    GetReasonCode: function(type, contact_type) {
        var msg = {};
        msg.contact_type = contact_type;
        return this.ETS_SendMessage(CMD_GET_REASON_CODES, msg, type);
    },
	
	
	/** ASPECT **/
    NextCalls : function(type, contact_type, disp_code) {
        var msg = {};
        msg.disp_code = disp_code;
        msg.contact_type = contact_type;
        return this.ETS_SendMessage(CMD_NEXT_CALL, msg, type);
    },
	TakeCalls : function(type) {
        var msg = {};
		msg.contact_type = contact_type;
        return this.ETS_SendMessage(CMD_TAKE_CALLS, msg, type);
    },
    GetInfos : function(type, contact_type, list_type) {
        var msg = {};
        msg.list_type = list_type;
        msg.contact_type = contact_type;
        return this.ETS_SendMessage(CMD_GET_INFOS, msg, type);
    },
    Record : function(type, contact_type, rec_type, file_name) {
        var msg = {};
        msg.rec_type = rec_type;
        msg.file_name = file_name;
        msg.contact_type = contact_type;
        return this.ETS_SendMessage(CMD_RECORD, msg, type);
    },
	GenerateDTMF : function(type, contact_type, dtmf) {
        var msg = {};
		msg.contact_type = contact_type;
        msg.dtmf = dtmf;
        return this.ETS_SendMessage(CMD_GENERATE_DTMF, msg, type);
    },
    Exclude : function(type, contact_type, e_id, e_type, e_value, e_start, e_end) {
        var msg = {};
        msg.app_id = e_id;
        msg.end_date = e_end;
        msg.call_type = e_type;
        msg.start_date = e_start;
        msg.exclude_value = e_value;
        msg.contact_type = contact_type;
        return this.ETS_SendMessage(CMD_EXCLUDE, msg, type);
    },
    Callback : function(type, contact_type, date_time, same_agt, phone_num, disp_code, meno) {
        var msg = {};
        msg.meno = meno;
        msg.same_agt = same_agt;
        msg.date_time = date_time;
        msg.phone_num = phone_num;
        msg.disp_code = disp_code;
        msg.contact_type = contact_type;
        return this.ETS_SendMessage(CMD_CALLBACK, msg, type);
    },
	GetDBInfo : function(type, contact_type, query_id, param1, param2, param3, param4, param5) {
        var msg = {};
		msg.contact_type = contact_type;
        msg.query_id = query_id;
        msg.param1 = param1;
        msg.param2 = param2;
        msg.param3 = param3;
        msg.param4 = param4;
        msg.param5 = param5;

        return this.ETS_SendMessage(CMD_GET_DB_INFO, msg, type);
    },
	GetUserDefinedItems : function(type) {
        return this.ETS_SendMessage(CMD_GET_USER_DEFINED_ITEMS, null, type);
    },
    SetUserDefinedItems : function(type, contact_type, item_index, item_key, item_value) {
        var msg = {};
		msg.contact_type = contact_type;
        msg.item_index = item_index;
        msg.item_key = item_key;
        msg.item_value = item_value;
        return this.ETS_SendMessage(CMD_SET_USER_DEFINED_ITEM, msg, type);
    },
	
    /**
     * ECC *
     **/
    MediaJoin : function(type, contact_type, room_key, isManager, isControl) {
        var msg = {};
		msg.mm_contact_id = room_key;
        msg.contact_type = contact_type;
		if(isManager === true) {
			msg.manager = "ON";
		} else {
			msg.manager = "OFF";
		}
		if(isControl === true) {
			msg.control = "ON";
		} else {
			msg.control = "OFF";
		}
		
        return this.ETS_SendMessage(CMD_JOIN, msg, type);
    },
    MediaExit : function(type, contact_type, room_key) {
        var msg = {};
		msg.mm_contact_id = room_key;
        msg.contact_type = contact_type;
		
        return this.ETS_SendMessage(CMD_EXIT, msg, type);
    },
    MediaHold : function(type, contact_type, room_key, isHold) {
        var msg = {};
		msg.mm_contact_id = room_key;
        msg.contact_type = contact_type;
		if(isHold === true) {
			msg.hold = "ON";
		} else {
			msg.hold = "OFF";
		}
			
        return this.ETS_SendMessage(CMD_HOLD, msg, type);
    },
    MediaActive : function(type, contact_type, room_key, isActive) {
        var msg = {};
		msg.mm_contact_id = room_key;
        msg.contact_type = contact_type;
		if(isActive === true) {
			msg.active = "ON";
		} else {
			msg.active = "OFF";
		}
		
        return this.ETS_SendMessage(CMD_ACTIVE, msg, type);
    },
    MediaMessage : function(type, contact_type, room_key, message_type, message) {
        var msg = {};
        msg.message = message;
		msg.message_type ='text';
		if(message_type != 'text') {
			msg.message_type = message_type;
		}
		msg.mm_contact_id = room_key;
        msg.contact_type = contact_type;
		
        return this.ETS_SendMessage(CMD_MESSAGE, msg, type);
    },
	MediaMessageExtra : function(type, contact_type, room_key, message_type, message, message_extra) {
        var msg = {};
        msg.message = message;
		msg.message_type ='text';
		if(message_type != 'text') {
			msg.message_type = message_type;
		}
		msg.message_extra = message_extra;
		msg.mm_contact_id = room_key;
        msg.contact_type = contact_type;
		
        return this.ETS_SendMessage(CMD_MESSAGE, msg, type);
    },
    MediaMessageList : function(type, contact_type, room_key, page, pageCnt) {
        var msg = {};
        msg.page = page;
        msg.page_count = pageCnt;
		msg.mm_contact_id = room_key;
        msg.contact_type = contact_type;
		
        return this.ETS_SendMessage(CMD_MESSAGE_LIST, msg, type);
    },	
    MediaImage : function(type, contact_type, room_key, message) {
        var msg = {};
        msg.mm_contact_id = room_key;
        msg.contact_type = contact_type;
		
        return this.ETS_SendMessage(CMD_MESSAGE, msg, type);
    },


    /**
     * EMC *
      **/
    EMC_acw: function (type, contact_type, contact_id) {
        var msg = this.EMC_createMsgAndSetCID(contact_id);
        msg.contact_type = contact_type;
        return this.ETS_SendMessage("ACW", msg, type);
    },
    EMC_ContactList : function(type) {
        var msg = {};
        return this.ETS_SendMessage(CMD_CONTACT_LIST, msg, type);
    },
	EMC_ContactInfo : function(type, contact_type, contact_id) {
        var msg = {};
        msg.cti_contact_id = contact_id;
        msg.contact_type = contact_type;
        return this.ETS_SendMessage(CMD_CONTACT_INFO, msg, type);
    },
    EMC_createMsgAndSetCID: function (contact_id) {
        var msg = {};
        if (contact_id && 0 < contact_id.length)
            msg.cti_contact_id = contact_id;

        return msg;
    },
    EMC_transfer : function(type, contact_type, skill, contact_id, custom_data) {
        var msg = this.EMC_createMsgAndSetCID(contact_id);
        msg.skill = skill;
        msg.contact_type = contact_type;
        msg.custom_data = custom_data;
        return this.ETS_SendMessage(CMD_TRANSFER, msg, type);
    },
    EMC_transferToAgent : function(type, contact_type, agent_id, contact_id, custom_data) {
        var msg = this.EMC_createMsgAndSetCID(contact_id);
        msg.agent_id = agent_id;
        msg.contact_type = contact_type;
        msg.custom_data = custom_data;
        return this.ETS_SendMessage(CMD_TRANSFER, msg, type);
    },
    EMC_transferComplete : function(type, contact_type, contact_id) {
        var msg = this.EMC_createMsgAndSetCID(contact_id);
        return this.ETS_SendMessage(CMD_TRANSFER_COMPLETE, msg, type);
    },
    EMC_transferCancel : function(type, contact_type, conatct_id) {
        var msg = this.EMC_createMsgAndSetCID(conatct_id);
        return this.ETS_SendMessage(CMD_TRANSFER_CANCEL, msg, type);
    },


    /**
     * EMail *
     **/
    Email_RequestGetApi : function(url){
		return new Promise( function (resolve, reject) {
			let request = new XMLHttpRequest();
			var resStatus=0;
			let dataObj = new Object();
			AddLog("Request URL: " + url)

			request.open('GET', url, false);
			request.setRequestHeader("Access-Control-Allow-Origin", "*");
			
			request.onload = function() {
				resStatus = request.status;
				if(resStatus === 200 || resStatus === 201) {
					dataObj = JSON.parse(request.response);
					
					AddLog("Response Status: " + resStatus);
					AddLog("Response Data: " + JSON.stringify(dataObj, null, "\t"));
					
					resolve(JSON.stringify(dataObj, null, "\t"));
				}else{
					AddLog("Status[" + resStatus + "] : " + request.statusText);
				}
			}
			request.send();
		})
    },
	Email_RequestPostApi : function(url, body) {

		return new Promise( function (resolve, reject){
			
			let request = new XMLHttpRequest();
			var resStatus=0;
			var msgBody = JSON.stringify(body);
			var dataObj = new Object();
			AddLog("Request URL: " + url)

			request.open('POST', url, true);
			request.setRequestHeader("Access-Control-Allow-Origin", "*");
			request.setRequestHeader("Content-Type", "application/json");
		
			request.onload = function() {
				resStatus = request.status;
				if(resStatus === 200 || resStatus === 201) {
					dataObj = JSON.parse(request.response);
					
					AddLog("Response Status: " + resStatus);
					AddLog("Response Data: " + JSON.stringify(dataObj, null, "\t"));
					
					resolve(JSON.stringify(dataObj, null, "\t"));
				} else{
					AddLog("Status[" + resStatus + "] : " + request.statusText);
				}
			}
			request.send(msgBody);
		});
    },
	/** SEND MESSAGE **/
    ETS_SendMessage : function(command, msg, type) {
        var cmd = {};
        cmd.cmd = command;
        cmd.msg_type = type;
        console.log("ETS_SendMessage :" + JSON.stringify(cmd, null, "\t"));
        return this.sendMessage(cmd, msg);
    }
};