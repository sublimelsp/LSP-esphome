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
exports.createCompletionSnippet = exports.createCompletion = exports.createHover = exports.coreSchema = exports.CompletionItemKind = exports.CompletionItem = exports.Range = exports.Position = void 0;
const fs = require("fs");
const path = require("path");
const vscode_languageserver_types_1 = require("vscode-languageserver-types");
const esphome_schema_1 = require("./esphome-schema");
const schema_fetcher_1 = require("./schema-fetcher");
var vscode_languageserver_types_2 = require("vscode-languageserver-types");
Object.defineProperty(exports, "Position", { enumerable: true, get: function () { return vscode_languageserver_types_2.Position; } });
Object.defineProperty(exports, "Range", { enumerable: true, get: function () { return vscode_languageserver_types_2.Range; } });
Object.defineProperty(exports, "CompletionItem", { enumerable: true, get: function () { return vscode_languageserver_types_2.CompletionItem; } });
Object.defineProperty(exports, "CompletionItemKind", { enumerable: true, get: function () { return vscode_languageserver_types_2.CompletionItemKind; } });
exports.coreSchema = new esphome_schema_1.ESPHomeSchema((name) => __awaiter(void 0, void 0, void 0, function* () {
    const schemaPath = yield (0, schema_fetcher_1.ensureSchemaAvailable)();
    const jsonPath = path.join(schemaPath, `schema/${name}.json`);
    const fileContents = fs.readFileSync(jsonPath, "utf-8");
    return JSON.parse(fileContents);
}));
const createHover = (contents, range) => {
    const hover = {
        contents: {
            kind: "markdown",
            value: contents,
        },
        range,
    };
    return hover;
};
exports.createHover = createHover;
const createCompletion = (label, insertText, kind, documentation = undefined, triggerSuggest = false, preselect, snippet, sortText, detail) => {
    const completion = {
        label: label,
        insertText: insertText,
        kind,
        detail,
        sortText,
        preselect,
    };
    if (triggerSuggest) {
        completion.command = {
            title: "chain",
            command: "editor.action.triggerSuggest",
        };
    }
    if (documentation) {
        completion.documentation = {
            kind: "markdown",
            value: documentation,
        };
    }
    if (snippet) {
        completion.insertTextFormat = vscode_languageserver_types_1.InsertTextFormat.Snippet;
    }
    return completion;
};
exports.createCompletion = createCompletion;
const createCompletionSnippet = (label, insertText, kind, documentation = undefined) => {
    const completion = {
        label: label,
        insertText: insertText,
        kind,
        insertTextFormat: vscode_languageserver_types_1.InsertTextFormat.Snippet,
        documentation,
    };
    return completion;
};
exports.createCompletionSnippet = createCompletionSnippet;
//export const createDefinition = ()
//# sourceMappingURL=editor-shims.js.map