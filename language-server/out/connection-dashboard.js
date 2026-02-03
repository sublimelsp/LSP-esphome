"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ESPHomeDashboardConnection = void 0;
const WebSocket = require("ws");
const connection_1 = require("./connection");
class ESPHomeDashboardConnection extends connection_1.ESPHomeConnection {
    constructor(endPoint) {
        super();
        this.endPoint = endPoint;
    }
    sendMessageInternal(msg) {
        // Check if WS is open, otherwise ignore
        if (this.ws.readyState !== 1) {
            return;
        }
        let send = JSON.stringify({
            type: "stdin",
            data: JSON.stringify(msg) + "\n",
        });
        this.ws.send(send);
    }
    connect() {
        return __awaiter(this, void 0, void 0, function* () {
            const regex = /^(([^:/?#]+):)?(\/\/([^/?#]*))?([^?#]*)(\?([^#]*))?(#(.*))?/;
            let uri = this.endPoint;
            if (uri.indexOf("//") === -1) {
                uri = "http://" + uri;
            }
            const match = uri.match(regex);
            if (match === null) {
                console.error(`Could not understand end point '${this.endPoint}'`);
                return;
            }
            const httpUri = `${match[2]}://${match[4]}/`;
            const wsUri = `ws${match[2] === "https" ? "s" : ""}://${match[4]}/vscode`;
            console.log(`Using ESPHome dashboard at: ${wsUri} server: ${httpUri}`);
            this.ws = new WebSocket(wsUri.toString());
            // TODO: Open dynamically, re - open when connection lost etc.
            this.ws.on("open", () => {
                console.log("Connection established.");
                const msg = JSON.stringify({ type: "spawn" });
                this.ws.send(msg);
            });
            this.ws.on("error", (err) => {
                console.log("Cannot connect to ESPHome dashboard" + err);
                console.error(`Cannot connect to ESPHome dashboard. Make sure you can access '${httpUri}' and have set the option 'leave_front_door_open': true`);
            });
            this.ws.on("message", (data) => {
                const raw = JSON.parse(data.toString());
                const msg = JSON.parse(raw.data);
                this.handleMessage(msg);
            });
        });
    }
    disconnect() { }
}
exports.ESPHomeDashboardConnection = ESPHomeDashboardConnection;
//# sourceMappingURL=connection-dashboard.js.map