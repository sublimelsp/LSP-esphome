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
exports.Validation = void 0;
const vscode_languageserver_protocol_1 = require("vscode-languageserver-protocol");
const types_1 = require("./types");
const vscodeUri = require("vscode-uri");
const path = require("path");
class Validation {
    constructor(fileAccessor, connection, sendDiagnostics) {
        this.fileAccessor = fileAccessor;
        this.connection = connection;
        this.sendDiagnostics = sendDiagnostics;
        this.diagnosticCollection = new Map();
        this.validating_uri = null;
        this.includedFiles = {};
        connection.onResponse((m) => this.handleESPHomeMessage(m));
    }
    addError(uri, range, message) {
        //console.log(`diag error: ${message} to ${uri}`);
        let diagnostics = this.diagnosticCollection.get(uri) || [];
        const diagnostic = vscode_languageserver_protocol_1.Diagnostic.create(range, message);
        diagnostics = [...diagnostics, diagnostic];
        this.diagnosticCollection.set(uri, diagnostics);
    }
    addIncludeFile(file, included) {
        var includes = this.includedFiles[file] || [];
        if (includes.indexOf(included) === -1) {
            includes.push(included);
            this.includedFiles[file] = includes;
        }
    }
    handleEsphomeError(error) {
        const message = error.message;
        if (error.range !== null) {
            this.addError(this.getUriStringForValidationPath(error.range.document), vscode_languageserver_protocol_1.Range.create(error.range.start_line, error.range.start_col, error.range.end_line, error.range.end_col), message);
        }
        else {
            this.addError(this.validating_uri, vscode_languageserver_protocol_1.Range.create(1, 0, 1, 2), message);
        }
    }
    handleYamlError(error) {
        // expect pair of lines with
        // - error message
        // - location
        let message = "";
        const error_lines = error.message.split("\n");
        if (error_lines.length % 2 != 0) {
            if (this.validating_uri)
                this.addError(this.validating_uri, vscode_languageserver_protocol_1.Range.create(1, 0, 1, 1), error.message);
            else
                console.error("unknown: " + error.message);
            return;
        }
        error_lines.forEach((line) => {
            if (message === "") {
                message = line;
            }
            else {
                let location = line
                    .trimStart()
                    .match(/in "([^"]*)", line (\d*), column (\d*)/);
                if (location) {
                    const uri = this.getUriStringForValidationPath(location[1]);
                    const line_number = parseInt(location[2]) - 1;
                    const col_number = parseInt(location[3]) - 1;
                    const range = vscode_languageserver_protocol_1.Range.create(line_number, col_number, line_number, col_number + 1);
                    this.addError(uri, range, message);
                }
                else {
                    if (this.validating_uri)
                        this.addError(this.validating_uri, vscode_languageserver_protocol_1.Range.create(1, 0, 1, 1), message + " " + line);
                    else
                        console.error("unknown: " + error.message);
                }
                message = "";
            }
        });
    }
    getUriStringForValidationPath(file_path) {
        const absolute_path = path.isAbsolute(file_path)
            ? file_path
            : this.fileAccessor.getRelativePath(vscodeUri.URI.parse(this.validating_uri).fsPath, file_path);
        const uri_string = vscodeUri.URI.file(absolute_path).toString();
        return uri_string;
    }
    handleESPHomeMessage(msg) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                switch (msg.type) {
                    case types_1.MESSAGE_READ_FILE: {
                        const uri = this.getUriStringForValidationPath(msg.path);
                        if (uri !== this.validating_uri) {
                            // Track this as an included file, so when the user edits this file
                            // we know it's and included file and a validation on the master yaml should be executed instead
                            this.addIncludeFile(this.validating_uri, uri);
                            // This file is validated indirectly, if it had errors then they must be cleared
                            this.diagnosticCollection.set(uri, []);
                        }
                        try {
                            const docText = yield this.fileAccessor.getFileContents(uri);
                            this.connection.sendMessage({
                                type: types_1.MESSAGE_FILE_RESPONSE,
                                content: docText,
                            });
                        }
                        catch (e) {
                            // if this is trying to get secrets.yaml from a directory other than validating_uri directory,
                            // it is expected that when the file does not exists it will try to load a secrets.yaml from
                            // the same folder where validating_uri is. See https://github.com/esphome/esphome/pull/5604
                            if (vscodeUri.Utils.basename(vscodeUri.URI.parse(uri)) ==
                                "secrets.yaml" &&
                                this.validating_uri &&
                                vscodeUri.Utils.dirname(vscodeUri.URI.parse(uri)) !=
                                    vscodeUri.Utils.dirname(vscodeUri.URI.parse(this.validating_uri)))
                                return this.handleESPHomeMessage({
                                    type: types_1.MESSAGE_READ_FILE,
                                    path: vscodeUri.Utils.joinPath(vscodeUri.Utils.dirname(vscodeUri.URI.parse(this.validating_uri)), "secrets.yaml").fsPath,
                                });
                            // general case: won't validate as an include file is missing
                            this.addError(this.validating_uri, vscode_languageserver_protocol_1.Range.create(0, 0, 1, 0), `Could not open '${msg.path}': ${e}`);
                            this.connection.sendMessage({
                                type: types_1.MESSAGE_FILE_RESPONSE,
                                content: "",
                            });
                        }
                        break;
                    }
                    case types_1.MESSAGE_RESULT: {
                        msg.validation_errors.forEach((e) => this.handleEsphomeError(e));
                        msg.yaml_errors.forEach((e) => this.handleYamlError(e));
                        this.diagnosticCollection.forEach((diagnostics, uri) => this.sendDiagnostics(uri, diagnostics));
                        this.validating_uri = null;
                        //this.validateNext();
                        break;
                    }
                    case "check_directory_exists": {
                        const uri = vscodeUri.URI.file(msg.path).toString();
                        const pathExists = yield this.fileAccessor.checkPathExists(uri);
                        this.connection.sendMessage({
                            type: "directory_exists_response",
                            content: pathExists,
                        });
                        break;
                    }
                    case "check_file_exists": {
                        const uri = vscodeUri.URI.file(msg.path).toString();
                        const fileExists = yield this.fileAccessor.checkPathExists(uri);
                        this.connection.sendMessage({
                            type: "file_exists_response",
                            content: fileExists,
                        });
                        break;
                    }
                    default: {
                        console.log(`Got unknown message type`, msg);
                        break;
                    }
                }
            }
            catch (e) {
                console.log("Income message error: " + e);
                this.validating_uri = null;
            }
        });
    }
    onDocumentChange(e) {
        try {
            if (vscodeUri.URI.parse(e.document.uri).path.endsWith("secrets.yaml")) {
                // don't validate secrets
                return;
            }
            if (this.validating_uri !== null) {
                const lastRequestElapsedTime = new Date().getTime() - this.lastRequest.getTime();
                // 10 seconds without response
                if (lastRequestElapsedTime < 10000) {
                    return;
                }
                console.log("Timeout waiting for previous validation to complete. Discarding.");
            }
            this.validating_uri = e.document.uri;
            this.diagnosticCollection.clear();
            this.diagnosticCollection.set(this.validating_uri, []);
            const uri = this.validating_uri;
            // Check if this is an included file
            // console.log(`this file path: ${uri}`);
            for (let key in this.includedFiles) {
                // TODO: When an included file is in turn included, this should call the top most file, not the next one.
                // console.log(`testing included files in: ${key} files: ${this.includedFiles[key]}`);
                if (this.includedFiles[key].indexOf(uri) >= 0) {
                    this.validating_uri = key;
                    // console.log(`Not validating ${uri} as is listed as included file. Validating containing document ${key} instead`);
                }
            }
            console.log(`Validating ${this.validating_uri}`);
            this.lastRequest = new Date();
            this.connection.sendMessage({
                type: "validate",
                file: vscodeUri.URI.parse(this.validating_uri).fsPath,
            });
        }
        catch (e) {
            console.log(e);
            this.validating_uri = null;
        }
    }
}
exports.Validation = Validation;
//# sourceMappingURL=validation.js.map