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
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CompletionsHandler = void 0;
const yaml_1 = require("yaml");
const editor_shims_1 = require("./editor-shims");
const objects_1 = require("./utils/objects");
class CompletionsHandler {
    constructor(documents) {
        this.documents = documents;
    }
    getCompletions(uri, position) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            try {
                this.document = this.documents.getDocument(uri);
                this.position = position;
                this.lineContent = this.document.text.getLineContent(position.line);
                const findByClosest = this.lineContent.trim().length === 0;
                const offset = this.document.text.offsetAt(position);
                // Do not show completions when next to ':'
                if (this.document.text.getText().charAt(offset - 1) === ":") {
                    return [];
                }
                const docMap = this.document.yaml.contents;
                if (!(0, yaml_1.isMap)(docMap)) {
                    this.docMap = undefined;
                    return this.getCoreComponents();
                }
                this.docMap = docMap;
                let node = findByClosest
                    ? this.findClosestNode(position, offset)
                    : this.document.getNodeFromOffset(offset);
                if (!node)
                    return [];
                const range = {
                    start: this.document.text.getPosition((_a = node.range) === null || _a === void 0 ? void 0 : _a[0]),
                    end: this.document.text.getPosition((_b = node.range) === null || _b === void 0 ? void 0 : _b[1]),
                };
                if (range.start.character === 0) {
                    return this.getCoreComponents();
                }
                const p1 = this.document.getParent(node);
                const p2 = p1 !== undefined ? this.document.getParent(p1) : undefined;
                if (!findByClosest && (0, yaml_1.isScalar)(node)) {
                    if ((0, yaml_1.isPair)(p1) && p1.value === null) {
                        // seems to be writing on a key still without value
                        if ((0, yaml_1.isMap)(p2)) {
                            node = p2;
                        }
                    }
                }
                const path = this.document.getPath(node);
                // At this point node and path should be meaningful and consistent
                // Path is were completions need to be listed, it really doesn't matter where the cursor is, cursor shouldn't be checked
                // to see what completions are need
                // List items under - platform: |
                if ((0, yaml_1.isPair)(p1) && (0, yaml_1.isScalar)(p1.key)) {
                    if (p1.key.value === "platform") {
                        if ((0, yaml_1.isMap)(p2)) {
                            const p3 = this.document.getParent(p2);
                            if ((0, yaml_1.isSeq)(p3)) {
                                const p4 = this.document.getParent(p3);
                                if ((0, yaml_1.isPair)(p4) && (0, yaml_1.isScalar)(p4.key)) {
                                    const platform_name = p4.key.value;
                                    return yield this.getPlatformNames(platform_name, range);
                                }
                            }
                        }
                    }
                }
                console.log(node, path, path.length, `'${path[0]}'`);
                let pathElement;
                // First get the root component
                let cv = undefined;
                let pathIndex = 0;
                if (path.length) {
                    pathIndex = 1;
                    pathElement = docMap.get(path[0]);
                    if ((0, objects_1.isString)(path[0]) && (yield editor_shims_1.coreSchema.isPlatform(path[0]))) {
                        if (path.length > 1) {
                            // we are in a platform (e.g. sensor) and there are inner stuff
                            if ((0, objects_1.isNumber)(path[1])) {
                                // the index in the sequence
                                const index = path[1];
                                if ((0, yaml_1.isSeq)(pathElement)) {
                                    pathElement = pathElement.get(index);
                                    pathIndex += 1;
                                }
                            }
                        }
                        // else branch not needed here as pathElement should be pointing
                        // to the object with the platform key
                        if ((0, yaml_1.isMap)(pathElement)) {
                            const domain = pathElement.get("platform");
                            if ((0, objects_1.isString)(domain)) {
                                cv = yield editor_shims_1.coreSchema.getComponentPlatformSchema(domain, path[0]);
                            }
                        }
                        if (!cv) {
                            return [
                                (0, editor_shims_1.createCompletion)("platform", (0, yaml_1.isSeq)(this.document.getParent(node))
                                    ? "platform: "
                                    : "- platform: ", editor_shims_1.CompletionItemKind.EnumMember, undefined, true),
                            ];
                        }
                    }
                    else {
                        pathElement = docMap.get(path[0]);
                        if ((0, objects_1.isString)(path[0])) {
                            cv = yield editor_shims_1.coreSchema.getComponentSchema(path[0]);
                        }
                    }
                }
                return this.resolveConfigVar(path, pathIndex, cv, pathElement, node);
            }
            catch (e) {
                console.log(`Error during evaluating completions ${e}`);
                return [];
            }
        });
    }
    getPlatformNames(platform_name, range) {
        return __awaiter(this, void 0, void 0, function* () {
            const c = yield editor_shims_1.coreSchema.getComponent(platform_name);
            if (c.components === undefined) {
                console.log(`Error: not a platform ${platform_name}`);
                return [];
            }
            const result = [];
            for (var component in c.components) {
                result.push((0, editor_shims_1.createCompletion)(component, component + "\n  ", editor_shims_1.CompletionItemKind.EnumMember, c.components[component].docs, true));
            }
            return result;
        });
    }
    getCoreComponents() {
        return __awaiter(this, void 0, void 0, function* () {
            // suggest platforms, e.g. sensor:, binary_sensor:
            const platformList = yield editor_shims_1.coreSchema.getPlatformList();
            const result = [];
            for (var platformName in platformList) {
                // Don't add duplicate keys
                if (this.docMap && this.mapHasScalarKey(this.docMap, platformName)) {
                    continue;
                }
                result.push((0, editor_shims_1.createCompletion)(platformName, platformName + ":\n  - platform: ", editor_shims_1.CompletionItemKind.Class, platformList[platformName].docs, true));
            }
            // suggest component/hub e.g. dallas:, sim800l:
            const components = yield editor_shims_1.coreSchema.getComponentList();
            for (var componentName in components) {
                // skip platforms added in previous loop
                if (componentName in platformList) {
                    continue;
                }
                // Don't add duplicate keys
                if (this.docMap && this.mapHasScalarKey(this.docMap, componentName)) {
                    continue;
                }
                // Filter esp32 or esp8266 components only when the other target is used
                if (this.docMap && components[componentName].dependencies) {
                    let missingDep = false;
                    for (const dep of components[componentName].dependencies) {
                        if (dep === "esp8266" || dep === "esp32") {
                            if (this.docMap.get(dep) === undefined) {
                                missingDep = true;
                                break;
                            }
                        }
                    }
                    if (missingDep) {
                        continue;
                    }
                }
                result.push((0, editor_shims_1.createCompletion)(componentName, componentName + ":\n  ", editor_shims_1.CompletionItemKind.Field, components[componentName].docs, true));
            }
            return result;
        });
    }
    getChipset() {
        if (this.docMap.get("esp8266", true) !== undefined) {
            return "esp8266";
        }
        if (this.docMap.get("esp32", true) !== undefined) {
            return "esp32";
        }
        const esphome = this.docMap.get("esphome");
        if ((0, yaml_1.isMap)(esphome)) {
            const chipset = esphome.get("platform");
            if ((0, objects_1.isString)(chipset)) {
                if (chipset.toLowerCase() === "esp32") {
                    return "esp32";
                }
                if (chipset.toLowerCase() === "esp8266") {
                    return "esp8266";
                }
            }
        }
        return undefined;
    }
    mapHasScalarKey(map, key) {
        for (var item of map.items) {
            if ((0, yaml_1.isScalar)(item.key) && item.key.value === key) {
                return true;
            }
        }
        return false;
    }
    resolveConfigVar(path, pathIndex, cv, pathNode, cursorNode) {
        return __awaiter(this, void 0, void 0, function* () {
            if (cv.is_list && (0, objects_1.isNumber)(path[pathIndex])) {
                if ((0, yaml_1.isSeq)(pathNode)) {
                    pathNode = pathNode.get(path[pathIndex]);
                }
                pathIndex++;
            }
            if (cv.type === "schema") {
                if ((0, yaml_1.isMap)(pathNode)) {
                    if (pathIndex === path.length) {
                        return this.getConfigVars(cv.schema, pathNode);
                    }
                    return this.resolveSchema(path, pathIndex, cv.schema, pathNode, cursorNode);
                }
                else {
                    if (pathIndex === path.length) {
                        if ((0, yaml_1.isScalar)(cursorNode)) {
                            const complete = yield editor_shims_1.coreSchema.getConfigVarComplete2(cv);
                            if (complete["maybe"] !== undefined) {
                                const maybe_cv = yield editor_shims_1.coreSchema.findConfigVar(cv.schema, complete["maybe"], this.document.yaml);
                                return this.resolveConfigVar(path, pathIndex, maybe_cv, null, cursorNode);
                            }
                        }
                        return this.getConfigVars(cv.schema, null, cv.is_list);
                    }
                    throw new Error("Expected map not found in " + pathIndex);
                }
            }
            else if (cv.type === "enum") {
                return this.addEnums(cv);
            }
            else if (cv.type === "trigger") {
                return this.resolveTrigger(path, pathIndex, pathNode, cv, cursorNode);
            }
            else if (cv.type === "registry") {
                let elem = pathNode;
                if ((0, yaml_1.isSeq)(elem) && elem.items.length) {
                    elem = elem.items[path[pathIndex]];
                    if ((0, yaml_1.isNode)(elem)) {
                        return this.resolveRegistryInner(path, pathIndex + 1, (0, yaml_1.isMap)(elem) ? elem : null, cv, cursorNode);
                    }
                }
                if ((0, yaml_1.isMap)(elem)) {
                    return this.resolveRegistryInner(path, pathIndex, elem, cv, cursorNode);
                }
                return this.resolveRegistryInner(path, pathIndex, (0, yaml_1.isMap)(elem) ? elem : null, cv, cursorNode);
            }
            else if (cv.type === "typed") {
                if (!pathNode) {
                    return [
                        (0, editor_shims_1.createCompletion)(cv.typed_key, cv.typed_key + ": ", editor_shims_1.CompletionItemKind.Enum, undefined, true),
                    ];
                }
                else if (pathIndex + 1 >= path.length &&
                    path[pathIndex] === cv.typed_key) {
                    let result = [];
                    for (const schema_type in cv.types) {
                        result.push((0, editor_shims_1.createCompletion)(schema_type, schema_type + "\n", editor_shims_1.CompletionItemKind.EnumMember, undefined, true));
                    }
                    return result;
                }
                else {
                    if (pathNode !== null && (0, yaml_1.isMap)(pathNode)) {
                        const type = pathNode.get(cv.typed_key);
                        if (type !== null && (0, objects_1.isString)(type)) {
                            if (pathIndex === path.length) {
                                return this.getConfigVars(cv.types[type], pathNode);
                            }
                            return this.resolveSchema(path, pathIndex, cv.types[type], pathNode, cursorNode);
                        }
                        let result = [];
                        // there are other options but still not `type`
                        result.push((0, editor_shims_1.createCompletion)(cv.typed_key, cv.typed_key + ": ", editor_shims_1.CompletionItemKind.EnumMember, undefined, true));
                        return result;
                    }
                }
            }
            else if (cv.type === "string") {
                if (cv.templatable) {
                    return [
                        (0, editor_shims_1.createCompletionSnippet)("!lambda", '!lambda return "${0:<string expression>}";', editor_shims_1.CompletionItemKind.Function),
                    ];
                }
                return [];
            }
            else if (cv.type === "pin") {
                //if (parentElement.items.length > 0 && isScalar(node) && node === parentElement.items[0].value) {
                // cursor is in the value of the pair
                //    return this.resolvePinNumbers(result, cv);
                //}
                if (!cv.schema) {
                    // This pin does not accept schema, e.g. i2c
                    return [];
                }
                let pinCv = undefined;
                if ((0, yaml_1.isMap)(pathNode)) {
                    // Check if it is using a port expander
                    for (const expander of yield editor_shims_1.coreSchema.getPins()) {
                        if (expander !== "esp32" &&
                            expander !== "esp8266" &&
                            this.document.yaml.contents.get(expander)) {
                            if (pathNode.get(expander)) {
                                pinCv = yield editor_shims_1.coreSchema.getPinConfigVar(expander);
                                break;
                            }
                        }
                    }
                }
                if (pinCv === undefined) {
                    const chipset = this.getChipset();
                    if (chipset === "esp32") {
                        pinCv = yield editor_shims_1.coreSchema.getPinConfigVar("esp32");
                    }
                    else if (chipset === "esp8266") {
                        pinCv = yield editor_shims_1.coreSchema.getPinConfigVar("esp8266");
                    }
                }
                if (pinCv !== undefined &&
                    pinCv.type === "schema" &&
                    pathNode === null &&
                    !cv.internal) {
                    // suggest all expanders
                    for (const expander of yield editor_shims_1.coreSchema.getPins()) {
                        if (expander !== "esp32" &&
                            expander !== "esp8266" &&
                            this.docMap.get(expander)) {
                            pinCv.schema.config_vars[expander] = {
                                key: "Optional",
                                type: "string",
                            };
                        }
                    }
                }
                if (!pinCv) {
                    return [];
                }
                return this.resolveConfigVar(path, pathIndex, pinCv, pathNode, cursorNode);
            }
            else if (cv.type === "boolean") {
                let result = [];
                if (cv.templatable) {
                    result.push((0, editor_shims_1.createCompletionSnippet)("!lambda ", '!lambda return "${0:<boolean expression>}";', editor_shims_1.CompletionItemKind.Function));
                }
                for (var value of ["True", "False"]) {
                    result.push((0, editor_shims_1.createCompletion)(value, value, editor_shims_1.CompletionItemKind.Constant, undefined, false, cv.default === value));
                }
                return result;
            }
            else if (cv.type === "use_id") {
                let result = [];
                const usableIds = yield editor_shims_1.coreSchema.getUsableIds(cv.use_id_type, this.document.yaml);
                for (var usableId of usableIds) {
                    result.push((0, editor_shims_1.createCompletion)(usableId, usableId, editor_shims_1.CompletionItemKind.Variable));
                }
                return result;
            }
            else if (cv["templatable"]) {
                let insertText = "!lambda return ${0:<expression>};";
                if (cv.docs && cv.docs.startsWith("**")) {
                    const endStrType = cv.docs.indexOf("**", 2);
                    if (endStrType !== -1) {
                        const strType = cv.docs.substring(2, cv.docs.indexOf("**", 2));
                        if (strType === "string") {
                            insertText = '!lambda return "${0:<string expression>}";';
                        }
                        else {
                            insertText = "!lambda return ${0:<" + strType + " expression>};";
                        }
                    }
                }
                return [
                    (0, editor_shims_1.createCompletionSnippet)("!lambda", insertText, editor_shims_1.CompletionItemKind.Function, cv.docs),
                ];
            }
            throw new Error("Unexpected path traverse.");
        });
    }
    getConfigVars(schema_1, node_1) {
        return __awaiter(this, arguments, void 0, function* (schema, node, isList = false) {
            var _a, e_1, _b, _c;
            const ret = [];
            let prefix = "";
            if (isList) {
                const dashPos = this.lineContent.indexOf("-");
                if (dashPos >= 0 && dashPos < this.position.character) {
                    // there is a dash already, do we need a space?
                    if (dashPos - this.position.character == -1)
                        prefix = " ";
                }
                // there is no dash on the line already, add it
                else
                    prefix = "- ";
            }
            try {
                for (var _d = true, _e = __asyncValues(editor_shims_1.coreSchema.iterConfigVars(schema, this.document.yaml)), _f; _f = yield _e.next(), _a = _f.done, !_a; _d = true) {
                    _c = _f.value;
                    _d = false;
                    const [prop, config] = _c;
                    // Skip existent properties
                    if (node !== null && this.mapHasScalarKey(node, prop)) {
                        continue;
                    }
                    let insertText = prefix + prop + ": ";
                    let triggerSuggest = false;
                    let snippet = false;
                    let sortText = undefined;
                    let detail = undefined;
                    if (config.templatable) {
                        detail = "lambda";
                        triggerSuggest = true;
                    }
                    else {
                        if (config.key === "Required") {
                            sortText = "00" + prop;
                            detail = "Required";
                        }
                        else {
                            if (config.type === "integer" || config.type === "string") {
                                if (config.default) {
                                    snippet = true;
                                    insertText += "${0:" + config.default + "}";
                                }
                            }
                        }
                    }
                    let kind = editor_shims_1.CompletionItemKind.Struct;
                    switch (config.type) {
                        case "schema":
                            kind = editor_shims_1.CompletionItemKind.Struct;
                            insertText += "\n  ";
                            triggerSuggest = true;
                            break;
                        case "typed":
                            kind = editor_shims_1.CompletionItemKind.Struct;
                            insertText += "\n  " + config.typed_key + ": ";
                            triggerSuggest = true;
                            break;
                        case "enum":
                            kind = editor_shims_1.CompletionItemKind.Enum;
                            triggerSuggest = true;
                            break;
                        case "trigger":
                            kind = editor_shims_1.CompletionItemKind.Event;
                            if (prop !== "then" && !config.has_required_var) {
                                insertText += "\n  then:\n    ";
                            }
                            else {
                                insertText += "\n  ";
                            }
                            triggerSuggest = true;
                            break;
                        case "registry":
                            kind = editor_shims_1.CompletionItemKind.Field;
                            break;
                        case "pin":
                            kind = editor_shims_1.CompletionItemKind.Interface;
                            break;
                        case "boolean":
                            triggerSuggest = true;
                            kind = editor_shims_1.CompletionItemKind.Variable;
                            break;
                        default:
                            kind = editor_shims_1.CompletionItemKind.Property;
                            break;
                    }
                    if (config.type === "use_id" || config.maybe) {
                        triggerSuggest = true;
                    }
                    ret.push((0, editor_shims_1.createCompletion)(prop, insertText, kind, config.docs, triggerSuggest, undefined, snippet, sortText, detail));
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (!_d && !_a && (_b = _e.return)) yield _b.call(_e);
                }
                finally { if (e_1) throw e_1.error; }
            }
            return ret;
        });
    }
    resolveSchema(path, pathIndex, schema, pathElement, node) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log("component: " + path[pathIndex]);
            const cv = yield editor_shims_1.coreSchema.findConfigVar(schema, path[pathIndex], this.document.yaml);
            if (cv === undefined)
                return [];
            let innerNode = pathElement !== null
                ? pathElement.get(path[pathIndex])
                : null;
            return yield this.resolveConfigVar(path, pathIndex + 1, cv, innerNode, node);
        });
    }
    addEnums(cv) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const result = [];
            if (cv.templatable) {
                result.push((0, editor_shims_1.createCompletionSnippet)("!lambda", '!lambda return "${0:<enum expression>}";', editor_shims_1.CompletionItemKind.Function));
            }
            for (var value in cv.values) {
                if ((0, objects_1.isNumber)(value)) {
                    value = value.toString();
                }
                result.push((0, editor_shims_1.createCompletion)(value, value, editor_shims_1.CompletionItemKind.EnumMember, (_a = cv.values[value]) === null || _a === void 0 ? void 0 : _a.docs, false, cv.default === value));
            }
            return result;
        });
    }
    resolveTrigger(path, pathIndex, pathNode, cv, node) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log("trigger: " + path[pathIndex]);
            // trigger can be a single item on a map or otherwise a seq.
            if ((0, yaml_1.isSeq)(pathNode)) {
                let innerNode = null;
                if (pathIndex < path.length) {
                    if (pathNode.items.length) {
                        innerNode = pathNode.items[path[pathIndex]];
                    }
                    return this.resolveTriggerInner(path, pathIndex + 1, innerNode, cv, node);
                }
                if (cv.schema && !cv.has_required_var) {
                    // if this has a schema, when inside the list we no longer can setup automation props
                    cv = cv.schema.config_vars.then;
                }
                return this.resolveTriggerInner(path, pathIndex, innerNode, cv, node);
            }
            return this.resolveTriggerInner(path, pathIndex, (0, yaml_1.isMap)(pathNode) ? pathNode : null, cv, node);
        });
    }
    resolveTriggerInner(path, pathIndex, pathNode, cv, node) {
        return __awaiter(this, void 0, void 0, function* () {
            const final = pathIndex === path.length;
            if (final) {
                // If this has a schema, use it, these are suggestions so user will see the trigger parameters even when they are optional
                // However if the only option is 'then:' we should avoid it for readability
                if (cv.schema !== undefined) {
                    return this.getConfigVars(cv.schema, (0, yaml_1.isMap)(pathNode) ? pathNode : null);
                }
                if (pathNode && !(0, yaml_1.isScalar)(pathNode)) {
                    // here in this trigger there is already an action,
                    // we could suggest another actions but in that case we should convert
                    // this action to a list, so just don't suggest anything
                    return [];
                }
                return this.addRegistry({
                    type: "registry",
                    registry: "action",
                    key: "",
                });
            }
            if (path[pathIndex] === "then") {
                // all triggers support then, even when they do not have a schema
                // then is a trigger without schema so...
                let thenNode = pathNode;
                if ((0, yaml_1.isMap)(pathNode)) {
                    thenNode = pathNode.get("then", true);
                }
                return this.resolveTrigger(path, pathIndex + 1, thenNode, {
                    type: "trigger",
                    key: "Optional",
                    schema: undefined,
                    has_required_var: false,
                }, node);
            }
            // navigate into the prop
            // this can be an action or a prop of this trigger
            if (cv.schema !== undefined) {
                const innerProp = yield editor_shims_1.coreSchema.findConfigVar(cv.schema, path[pathIndex], this.document.yaml);
                if (innerProp !== undefined) {
                    return this.resolveSchema(path, pathIndex, cv.schema, (0, yaml_1.isMap)(pathNode) ? pathNode : null, node);
                }
            }
            // is this an action?
            const action = yield editor_shims_1.coreSchema.getActionConfigVar(path[pathIndex]);
            if (action !== undefined && action.schema) {
                var innerNode = null;
                if ((0, yaml_1.isMap)(pathNode)) {
                    const innerPathNode = pathNode.get(path[pathIndex]);
                    if ((0, yaml_1.isNode)(innerPathNode)) {
                        innerNode = innerPathNode;
                    }
                }
                if (pathIndex + 1 === path.length && (0, yaml_1.isMap)(pathNode)) {
                    if ((0, yaml_1.isScalar)(node)) {
                        const complete = yield editor_shims_1.coreSchema.getConfigVarComplete2(action);
                        if (complete.type === "schema" && complete["maybe"] !== undefined) {
                            const maybe_cv = yield editor_shims_1.coreSchema.findConfigVar(action.schema, complete["maybe"], this.document.yaml);
                            if (!maybe_cv) {
                                return [];
                            }
                            return this.resolveConfigVar(path, pathIndex, maybe_cv, null, node);
                        }
                        return [];
                    }
                    return this.getConfigVars(action.schema, innerNode);
                }
                return this.resolveSchema(path, pathIndex + 1, action.schema, innerNode, node);
            }
            return [];
        });
    }
    addRegistry(configVar) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, e_2, _b, _c;
            let prefix = "";
            const dashPos = this.lineContent.indexOf("-");
            if (dashPos >= 0 && dashPos < this.position.character) {
                // there is a dash already, do we need a space?
                if (dashPos - this.position.character == -1)
                    prefix = " ";
            }
            // there is no dash on the line already, add it
            else
                prefix = "- ";
            const result = [];
            try {
                for (var _d = true, _e = __asyncValues(yield editor_shims_1.coreSchema.getRegistry(configVar.registry, this.document.yaml)), _f; _f = yield _e.next(), _a = _f.done, !_a; _d = true) {
                    _c = _f.value;
                    _d = false;
                    const [value, props] = _c;
                    if (configVar.filter && !configVar.filter.includes(value)) {
                        continue;
                    }
                    let insertText = prefix + value + ": ";
                    const completeCv = yield editor_shims_1.coreSchema.getConfigVarComplete2(props);
                    if (!completeCv.maybe) {
                        insertText += "\n    ";
                    }
                    result.push((0, editor_shims_1.createCompletion)(value, insertText, editor_shims_1.CompletionItemKind.Keyword, props.docs, true));
                }
            }
            catch (e_2_1) { e_2 = { error: e_2_1 }; }
            finally {
                try {
                    if (!_d && !_a && (_b = _e.return)) yield _b.call(_e);
                }
                finally { if (e_2) throw e_2.error; }
            }
            return result;
        });
    }
    resolveRegistryInner(path, pathIndex, pathNode, cv, node) {
        return __awaiter(this, void 0, void 0, function* () {
            const final = pathIndex === path.length;
            if (final && pathNode === null) {
                return this.addRegistry(cv);
            }
            const registryCv = yield editor_shims_1.coreSchema.getRegistryConfigVar(cv.registry, path[pathIndex]);
            if (!registryCv) {
                return [];
            }
            const inner = pathNode !== null ? pathNode.get(path[pathIndex]) : null;
            return this.resolveConfigVar(path, pathIndex + 1, registryCv, (0, yaml_1.isMap)(inner) ? inner : null, node);
        });
    }
    findClosestNode(position, offset) {
        const { yaml, text } = this.document;
        let offsetDiff = yaml.contents.range[2];
        let maxOffset = yaml.contents.range[0];
        let closestNode = this.document.yaml.contents;
        (0, yaml_1.visit)(yaml, (key, node) => {
            if (!node || !(0, yaml_1.isNode)(node)) {
                return;
            }
            const range = node.range;
            if (!range) {
                return;
            }
            const diff = range[2] - offset;
            if (maxOffset <= range[0] && diff <= 0 && Math.abs(diff) <= offsetDiff) {
                offsetDiff = Math.abs(diff);
                maxOffset = range[0];
                closestNode = node;
            }
        });
        const lineContent = text.getLineContent(position.line);
        const indentation = this.getIndentation(lineContent, position.character);
        if (closestNode !== undefined && indentation === position.character) {
            closestNode = this.getProperParentByIndentation(indentation, closestNode);
        }
        return closestNode;
    }
    getIndentation(lineContent, position) {
        if (lineContent.length < position - 1) {
            return 0;
        }
        for (let i = 0; i < position; i++) {
            const char = lineContent.charCodeAt(i);
            if (char !== 32 && char !== 9) {
                return i;
            }
        }
        // assuming that current position is indentation
        return position;
    }
    getProperParentByIndentation(indentation, node) {
        if (!node) {
            return this.document.yaml.contents;
        }
        const { text } = this.document;
        if ((0, yaml_1.isNode)(node) && node.range) {
            const position = text.getPosition(node.range[0]);
            if (position.character > indentation && position.character > 1) {
                const parent = this.document.getParent(node);
                if (parent) {
                    return this.getProperParentByIndentation(indentation, parent);
                }
            }
            else if (position.character < indentation) {
                const parent = this.document.getParent(node);
                if ((0, yaml_1.isPair)(parent) && (0, yaml_1.isNode)(parent.value)) {
                    return parent.value;
                }
            }
            else {
                return node;
            }
        }
        else if ((0, yaml_1.isPair)(node)) {
            if ((0, yaml_1.isScalar)(node.value) &&
                node.value.value === null &&
                (0, yaml_1.isScalar)(node.key) &&
                text.getPosition(node.key.range[0]).character < indentation) {
                return node;
            }
            const parent = this.document.getParent(node);
            if ((0, yaml_1.isNode)(parent)) {
                return this.getProperParentByIndentation(indentation, parent);
            }
        }
        return node;
    }
}
exports.CompletionsHandler = CompletionsHandler;
//# sourceMappingURL=completions-handler.js.map