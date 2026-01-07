"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ESPHomeConnection = void 0;
class ESPHomeConnection {
    constructor() {
        this._isConnected = false;
    }
    sendMessage(msg) {
        console.log("send " + JSON.stringify(msg).substring(0, 150));
        this.sendMessageInternal(msg);
    }
    get isConnected() {
        return this._isConnected;
    }
    setIsConnected(v) {
        this._isConnected = v;
    }
    handleMessage(msg) {
        console.log("rcvd " + JSON.stringify(msg).substring(0, 150));
        this.handleMessage_(msg);
    }
    onResponse(handleMessage) {
        this.handleMessage_ = handleMessage;
    }
}
exports.ESPHomeConnection = ESPHomeConnection;
//# sourceMappingURL=connection.js.map