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
exports.ESPHomeConnectionSource = void 0;
exports.setVersion = setVersion;
exports.version = version;
const connection_dashboard_1 = require("./connection-dashboard");
const connection_local_1 = require("./connection-local");
const types_1 = require("./types");
const connection_1 = require("./connection");
// This class checks configuration settings and decides which connection to use
// The same base ESPHomeConnection is used for this.
const DEFAULT_VERSION = "2025.4.0";
class ESPHomeConnectionSource extends connection_1.ESPHomeConnection {
    connect() {
        return __awaiter(this, void 0, void 0, function* () {
            throw new Error("Method not implemented.");
        });
    }
    disconnect() {
        throw new Error("Method not implemented.");
    }
    sendMessageInternal(msg) {
        throw new Error("Method not implemented.");
    }
    configure(config) {
        return __awaiter(this, void 0, void 0, function* () {
            const newRelayType = config.validator;
            if (this.relayType !== undefined) {
                if (this.relayType != newRelayType)
                    this.relay.disconnect();
                else {
                    if (this.relayType === "local") {
                        // nothing to do
                        return;
                    }
                }
            }
            this.relayType = newRelayType;
            if (config.validator === "local") {
                console.log("Configuring ESPHome with local validation...");
                this.relay = new connection_local_1.ESPHomeLocalConnection(config.pythonPath);
            }
            else {
                if (config.dashboardUri === undefined) {
                    console.error("Invalid dashboard uri. Check the configuration");
                    return;
                }
                console.log(`Configuring ESPHome with dashboard validation at ${config.dashboardUri}...`);
                this.relay = new connection_dashboard_1.ESPHomeDashboardConnection(config.dashboardUri);
            }
            this.relay.onResponse(this.handleRelayResponse.bind(this));
            yield this.relay.connect();
        });
    }
    sendMessage(msg) {
        if (this.relay !== undefined) {
            this.relay.sendMessage(msg);
        }
    }
    onResponse(handleMessage) {
        this.handleMessageSource_ = handleMessage;
    }
    handleRelayResponse(m) {
        // newer versions of esphome push version on connection established
        if (m.type == types_1.MESSAGE_VERSION) {
            setVersion(m.value);
            return;
        }
        else {
            if (_version == undefined) {
                console.log(`First message is not version. Default to ${DEFAULT_VERSION}`);
                setVersion(DEFAULT_VERSION);
            }
        }
        if (this.handleMessageSource_)
            this.handleMessageSource_(m);
    }
}
exports.ESPHomeConnectionSource = ESPHomeConnectionSource;
let _version;
let _version_promise;
let _version_resolve;
let _version_timeout;
function setVersion(newVersion) {
    _version = newVersion;
    if (_version_resolve) {
        clearTimeout(_version_timeout);
        _version_resolve(_version);
        _version_resolve = undefined;
    }
}
function version() {
    return __awaiter(this, void 0, void 0, function* () {
        if (!_version_promise) {
            _version_promise = new Promise((resolve) => {
                if (_version) {
                    resolve(_version);
                    return;
                }
                _version_resolve = resolve;
                _version_timeout = setTimeout(() => {
                    console.log("Version default given by timeout");
                    _version = DEFAULT_VERSION; // Default version
                    resolve(_version); // fallback to current _version
                }, 10000);
            });
        }
        return _version_promise;
    });
}
//# sourceMappingURL=connection-source.js.map