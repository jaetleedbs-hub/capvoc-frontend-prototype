/**
 * Define Websocket Status code
 */
var SOCKET_CONNECTING = 0;
var SOCKET_OPEN = 1;
var SOCKET_CLOSING = 2;
var SOCKET_CLOSED = 3;

var ETS_RET_ERROR_IS_NOT_CONNECT = -1;
var ETS_RET_ERROR_SEND_FAIL = -2;
var ETS_RET_ERROR_IS_ALREADY_CONNECT = -3;
var ETS_RET_ERROR_NOT_EXIST_CALLID = -4;
var ETS_RET_ERROR_CONNECT_FAIL = -10;
var ETS_RET_ERROR_SERVER_INFO = -11;
var ETS_RET_SUCCESS = 0;

function getETSRetCodeToStr(code) {
    switch (code) {
        case ETS_RET_ERROR_IS_NOT_CONNECT:
            return "SERVER_IS_NOT_CONNECT";
        case ETS_RET_ERROR_SEND_FAIL:
            return "SEND_FAIL";
        case ETS_RET_ERROR_IS_ALREADY_CONNECT:
            return "SERVER_IS_ALREADY_CONNECT";
        case ETS_RET_ERROR_CONNECT_FAIL:
            return "SERVER_CONNECT_FAIL";
        case ETS_RET_ERROR_SERVER_INFO:
            return "ERR_SERVER_INFO_NOT_CORRECT";
        case ETS_RET_ERROR_NOT_EXIST_CALLID:
            return "ETS_RET_ERROR_NOT_EXIST_CALLID";
        case ETS_RET_SUCCESS:
            return "SUCCESS";
    }
}

String.format = function () {
    var theString = arguments[0];
    for (var i = 1; i < arguments.length; i++) {
        var regEx = new RegExp("\\{" + (i - 1) + "\\}", "gm");
        theString = theString.replace(regEx, arguments[i]);
    }
    return theString;
};

/**
 * @return {ETSClientBase}
 */
function CreateETSMsgLib() {
    var etsClientBase = new ETSClientBase();
	var etsFinesse = new ETS_CLIENT();
	for(var prop1 in etsFinesse) {
		etsClientBase[prop1] = etsFinesse[prop1];
	}
    return etsClientBase;
}

function AddETSMsgLib(type, etsClientBase) {
    if(etsClientObj) {
        switch(type) {
            case "monitor":
                var monitorClient = new MonitorClient();
                etsClientBase.OnMonitorEvent = monitorClient.OnMonitorEvent;
            return AddETSMsgFunctions(etsClientBase, monitorClient);
            case "tools":
                var toolsClient = new ToolsClient();
                etsClientBase.OnToolsEvent = toolsClient.OnToolEvent;
            return AddETSMsgFunctions(etsClientBase, toolsClient);
        }
    }
}

function AddETSMsgFunctions(etsClientObj, msgObj) {
    for(var prop in msgObj) {
        etsClientObj[prop] = msgObj[prop];
    }
    return etsClientObj;
}

/********************************************************************************************
 * WebSocket Logic
 */

function ETSClientBase(msgType) {
    /** WebSocket Library information */
    this.SOCK_LIB_VERSION = "2.5.0";
    this.SOCK_BUILD_DATE = "2025-06-18 20:53";

    /** About Agent id/dn save Variable for reconnect... */
    this._id = "";
    this._dn = "";
    this._isL4 = "";
    this._msgType = msgType;

    /** About Socket Variable */
    this._webSocket = null;

    this.sequence = 0;
    this.connectionURLS = [];
    this.connURL = "";
    this.SOCK_RETRY_CNT = 2;
    this.retryCnt = 0;
    this.OnMsgEvt = undefined;
    this.OnServerEvent = undefined;
	this.OnMonitorEvent = undefined;
}

ETSClientBase.prototype =  {
    setServerInfo : function(ipa, porta, ipb, portb, isSSL, isL4) {
        this.ipA = ipa;
        this.portA = porta;
        this.ipB = ipb;
        this.portB = portb;
        this._isSSL = isSSL;

        /**
         * L4 를 사용하지 않을 때만 서버 세션정보를 가지고 온다.
         */
        if (this._isL4 !== true) {
            var ip = this._getSessionInfo(this._isSSL, this.ipA, this.ipB);
            if (ip) {
                this.ipA = ip[0];
                this.ipB = ip[1];
            }
        }

        this.connectionURLS = [];

        if(isSSL === true) {
            this.connectionURLS.push("wss://" + this.ipA + ":" + this.portA + "/etsclient");
            this.connectionURLS.push("wss://" + this.ipB + ":" + this.portB + "/etsclient");
        } else {
            this.connectionURLS.push("ws://" + this.ipA + ":" + this.portA + "/etsclient");
            this.connectionURLS.push("ws://" + this.ipB + ":" + this.portB + "/etsclient");
        }

        this.connURL = this.connectionURLS[0];
    },

    SetOnServerEvent : function (OnEvt) {
        this.OnServerEvent = OnEvt;
    },

    ServerConnect : function() {
        try {
            this.call_id_dicObj = {};

            if(this.connectionURLS === undefined || this.connectionURLS === null)
                return ETS_RET_ERROR_SERVER_INFO;

            if(this.connectionURLS.length <= 0)
                return ETS_RET_ERROR_SERVER_INFO;

            if(this._webSocket) {
                if(this._webSocket.readyState === SOCKET_OPEN)
                    return ETS_RET_ERROR_IS_ALREADY_CONNECT;

                this._webSocket.close();
                this._webSocket = null;
            }

            this.connURL = this.GetConnUrl();
            this._webSocket = new WebSocket(this.connURL);

            this._webSocket.onopen = this.OnWsOpenEvt.bind(this);
            this._webSocket.onclose = this.OnWsCloseEvt.bind(this);
            this._webSocket.onmessage = this.OnWsOnMessage.bind(this);
            this._webSocket.onerror = this.OnWsOnError.bind(this);

            var that = this;
            var timerid = setTimeout(function(){
                console.log(" ** SocketConnCheck connection checker... TimerID:" + timerid);
                if(that._webSocket.readyState === SOCKET_CONNECTING
                    || that._webSocket.readyState  === SOCKET_CLOSING) {

                    that._webSocket.close();
                }
            }, 3000);
            console.log("Login Try... TimerID:" + timerid);
            return ETS_RET_SUCCESS;
        } catch (err) {
            console.log("Event Exception:" + err);
        }

        return ETS_RET_ERROR_CONNECT_FAIL;
    },

    ReconnectServer : function() {
        var that = this;
        setTimeout(function() {
            console.log(" ** Socket connection timeout!!");
            console.log("RetryCnt:" + that.retryCnt);
            that.GetConnUrl();

            if(that._webSocket.readyState === SOCKET_CONNECTING) {
                that._webSocket.close();
            }

            that.ServerConnect();
            that.retryCnt = that.retryCnt + 1;
        }, 5000);
    },

    GetConnUrl : function() {
        var tmpURL = "";
        if(this.retryCnt % 2  === 0)
            tmpURL = this.connectionURLS[0];
        else
            tmpURL = this.connectionURLS[1];

        console.log("Change Url URL:" + this.connURL + " >> URL:" + tmpURL);
        this.connURL = tmpURL;
        return this.connURL;
    },

    OnWsOpenEvt: function (message) {
        this.retryCnt = 0;
        console.log("Login Success!! url:" + message.currentTarget.url);
        this.StartHeartBeat();
        console.log("StartHeartBeat TimerId: " + this._timerId);
    },

    OnWsCloseEvt : function(message) {
        if(this._timerId !== undefined) {
            console.log("StopHeartBeat TimerId: " + this._timerId);
            this.StopHeartBeat();
        }

        if(this.OnServerEvent) {
            const cmd = {};
            cmd.cmd = "server";
            cmd.ret = "" + message.code;
            cmd.desc = "disconnect server";

            const msg = {};
            msg.url = this.connURL;
            cmd.msg = msg;

            this.OnServerEvent(JSON.stringify(cmd, null, "\t"));
        }

        switch(message.code) {
            case 1000:
                console.log("[1000] Close Normally!!");
                return;
            case 1005:
                console.log("[1005] Close Normally!!");
                return;
            default:
        }

        if(this.retryCnt < this.SOCK_RETRY_CNT) {
            console.log("ReconnectServer retryCnt:" + this.SOCK_RETRY_CNT);
            this.ReconnectServer();
        } else {
            console.log("retry Count is Over MAX_RETRY_CNT:" + this.SOCK_RETRY_CNT);
        }

    },

    OnWsOnMessage : function(message) {
        var dataObj = JSON.parse(message.data);
        var cmd = dataObj.cmd;

        if("STATUSCHK" === cmd || "STATUSOK" === cmd ) return;

        if(this.OnServerEvent && cmd === "SERVER") {
            this.OnServerEvent(message.data);
        } else if(this.OnMsgEvent && cmd === "AGENT_STATE") {
            this.OnMsgEvent(message.data);
        } else if(this.OnMsgEvent && dataObj.msg_type === "uip") {
            this.OnMsgEvent(message.data);
        } else if(this.OnMsgEvent && dataObj.msg_type === "emc") {
            this.OnMsgEvent(message.data);
        } else if(this.OnMsgEvent && dataObj.msg_type === "ecc") {
            this.OnMsgEvent(message.data);
        } else if(this.OnMsgEvent && dataObj.msg_type === "finesse") {
            this.OnMsgEvent(message.data);
        }
    },

    OnWsOnError : function (message) {
        var cmd = {};
        cmd.cmd = "server";
        cmd.ret = ETS_RET_ERROR_IS_NOT_CONNECT;
        cmd.desc = "client is not connect server!!";

        var msg = {};
        msg.url = this.connURL;
        msg.desc = message;
        cmd.msg = msg;

        if(this.OnServerEvent)
            this.OnServerEvent(JSON.stringify(cmd, null, "\t"));

        switch(message.code) {
            case 'ECONNREFUSED':
                if(this.retryCnt < this.SOCK_RETRY_CNT) {
                    this.ReconnectServer();
                }

                break;
        }
    },

    disconnect : function() {
        if(this._webSocket === null) {
            var cmd = {};
            cmd.cmd = "server";
            cmd.ret = ETS_RET_ERROR_IS_NOT_CONNECT;
            cmd.desc = "client is not connect server!!";

            var msg = {};
            msg.url = this.connURL;

            cmd.msg = msg;

            if(this.OnServerEvent !== null) {
                this.OnServerEvent(JSON.stringify(cmd, null, "\t"));
            }

            return;
        }

        this._webSocket.close();
        this.retryCnt = 0;
        return ETS_RET_SUCCESS;
    },

    sendMessage : function(cmd, msg) {
        if(this._webSocket === null || this._webSocket.readyState !== SOCKET_OPEN) {
            return ETS_RET_ERROR_IS_NOT_CONNECT;
        }

        if(!cmd) cmd = {};
        cmd.dn = this._dn;
        cmd.id = this._id;

        var d = new Date();
        cmd.msg_id = this.sequence + "-" + d.getTime();
        this.sequence++;

        if(!msg) msg = {};

        cmd.msg = msg;
        console.log("send msg:" + JSON.stringify(cmd, null, "\t"));

        if(this.OnLogEvent) {
            this.OnLogEvent(JSON.stringify(cmd, null, "\t"));
        }

        this._webSocket.send(JSON.stringify(cmd));
        return ETS_RET_SUCCESS;
    },

    HeartBeat : function() {
        const cmd = {};
        cmd.cmd = "STATUSCHK";

        cmd.msg_id = "000-" + new Date().getTime();
        cmd.msg_type = "finesse";
        this.sequence++;

        this._webSocket.send(JSON.stringify(cmd));
        return ETS_RET_SUCCESS;
    },
    StartHeartBeat : function() {
        const that = this;
        that.HeartBeat();
        that._timerId = setTimeout(function(){
            that.StartHeartBeat();
        }, 10000);
    },
    StopHeartBeat : function() {
        if(this._timerId !== undefined) {
            clearTimeout(this._timerId);
            this._timerId = undefined;
        }
    },
    _getSessionInfo(isSSL, ipA, ipB) {
        var ip = new Array();
        ip.push(ipA);
        ip.push(ipB);

        var cmd = new Object();
        cmd.cmd = "GET_SESSION_INFO";

        var d = new Date();
        cmd.msg_id = "000-" + d.getTime();
        cmd.msg_type = this._msgType;

        for (var i = 0; i < ip.length; i++) {
            var url = '';
            try {
                if (isSSL === true) {
                    url = 'https://' + ip[i] + ':7823/?';
                } else {
                    url = 'http://' + ip[i] + ':7823/?';
                }

                url += encodeURI(JSON.stringify(cmd));
                console.log(url);

                const xmlhttp = new XMLHttpRequest();
                xmlhttp.open('GET', url, false);
                xmlhttp.setRequestHeader('Content-Type', 'text/plain');

                xmlhttp.send();

                console.log(xmlhttp.responseText);

                var serverList = (JSON.parse(xmlhttp.responseText)).msg.server;

                var server = new Array();

                if (serverList.length == 0) {
                    break;
                } else if (serverList.length == 1) {
                    server.push(serverList[0]["ip"]);
                    server.push(serverList[0]["ip"]);
                } else if (serverList.length >= 2) {
                    server.push(serverList[0]["ip"]);
                    server.push(serverList[1]["ip"]);
                }
                return server;
            } catch (e) {
                //console.log(e);
            }
        }

        return ip;
    }
};

/**
*   WebSocket Logic
********************************************************************************************/
