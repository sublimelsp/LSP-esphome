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
exports.ESPHomeLocalConnection = void 0;
const process_1 = require("process");
const child_process_1 = require("child_process");
const connection_1 = require("./connection");
const types_1 = require("./types");
function execPromise(command) {
    return new Promise((resolve, reject) => {
        (0, child_process_1.exec)(command, (error, stdout, stderr) => {
            resolve({ error, stdout, stderr });
        });
    });
}
class ESPHomeLocalConnection extends connection_1.ESPHomeConnection {
    constructor(pythonPath) {
        super();
        this.pythonPath = pythonPath;
        this.killed = false;
    }
    sendMessageInternal(msg) {
        let send = JSON.stringify(msg) + "\n";
        // todo check process is alive
        if (this.process.stdin !== null) {
            this.process.stdin.write(send);
        }
    }
    initialize_command() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.pythonPath) {
                const cmd = `"${this.pythonPath}" -m esphome version`;
                const result = yield execPromise(cmd);
                if (result.stderr) {
                    const errorMessage = `Could not execute ESPHome. Make sure selected Python interpreter is correct and restart VS Code. Actual interpreter ${this.pythonPath}.`;
                    console.error(errorMessage);
                    return undefined;
                }
                console.log(`Using venv "${this.pythonPath}" -- ${result.stdout}`);
                return `"${this.pythonPath}" -m esphome vscode dummy`;
            }
            const cmd = "esphome version";
            const result = yield execPromise(cmd);
            if (result.stderr) {
                const errorMessage = "Could not execute ESPHome. Make sure you can run ESPHome from the command line. If you have ESPHome in a virtual environment, install the Python extension and select it.";
                console.error(errorMessage);
                return undefined;
            }
            console.log(`Using ${result.stdout}`);
            return "esphome vscode dummy";
        });
    }
    connect() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log("Using local ESPHome");
            var environment = process_1.env;
            environment.PYTHONIOENCODING = "utf-8";
            if (this.command === undefined)
                this.command = yield this.initialize_command();
            if (!this.command) {
                console.error("Cannot start ESPHome");
                return;
            }
            this.process = (0, child_process_1.exec)(this.command, {
                encoding: "utf-8",
                env: environment,
            });
            if (this.process.stdout !== null) {
                this.process.stdout.on("data", (data) => {
                    try {
                        if (data.length < 2) {
                            console.log(`Unexpected data too small: ${data}'`);
                            return;
                        }
                        const msg = JSON.parse(data);
                        this.handleMessage(msg);
                    }
                    catch (e) {
                        console.log(`Error handling response: data: ${typeof data}: '${data === null || data === void 0 ? void 0 : data.toString()}' ${e}`);
                    }
                });
            }
            if (this.process.stderr !== null) {
                this.process.stderr.on("data", (data) => {
                    console.error("StdErr:" + data.toString());
                    this.handleMessage({
                        type: types_1.MESSAGE_STD_ERR_OUT,
                        std_err: data.toString(),
                    });
                });
            }
            this.process.on("close", (code, signal) => {
                console.log("Got close: ", code, signal);
            });
            this.process.on("exit", (code, signal) => __awaiter(this, void 0, void 0, function* () {
                console.log("Got exit: ", code, signal);
                yield this.connect();
            }));
            this.process.on("error", (args) => {
                if (this.killed)
                    return;
                if (args.message.startsWith("spawn esphome")) {
                    const errorMessage = "Could not execute ESPHome. Make sure you can run ESPHome from the command line.";
                    console.error(errorMessage);
                }
                console.error("Got error: ", args);
            });
        });
    }
    disconnect() {
        this.killed = true;
        this.process.kill();
    }
}
exports.ESPHomeLocalConnection = ESPHomeLocalConnection;
//# sourceMappingURL=connection-local.js.map