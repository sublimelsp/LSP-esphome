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
var __await = (this && this.__await) || function (v) { return this instanceof __await ? (this.v = v, this) : new __await(v); }
var __asyncDelegator = (this && this.__asyncDelegator) || function (o) {
    var i, p;
    return i = {}, verb("next"), verb("throw", function (e) { throw e; }), verb("return"), i[Symbol.iterator] = function () { return this; }, i;
    function verb(n, f) { i[n] = o[n] ? function (v) { return (p = !p) ? { value: __await(o[n](v)), done: false } : f ? f(v) : v; } : f; }
};
var __asyncGenerator = (this && this.__asyncGenerator) || function (thisArg, _arguments, generator) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var g = generator.apply(thisArg, _arguments || []), i, q = [];
    return i = Object.create((typeof AsyncIterator === "function" ? AsyncIterator : Object).prototype), verb("next"), verb("throw"), verb("return", awaitReturn), i[Symbol.asyncIterator] = function () { return this; }, i;
    function awaitReturn(f) { return function (v) { return Promise.resolve(v).then(f, reject); }; }
    function verb(n, f) { if (g[n]) { i[n] = function (v) { return new Promise(function (a, b) { q.push([n, v, a, b]) > 1 || resume(n, v); }); }; if (f) i[n] = f(i[n]); } }
    function resume(n, v) { try { step(g[n](v)); } catch (e) { settle(q[0][3], e); } }
    function step(r) { r.value instanceof __await ? Promise.resolve(r.value.v).then(fulfill, reject) : settle(q[0][2], r); }
    function fulfill(value) { resume("next", value); }
    function reject(value) { resume("throw", value); }
    function settle(f, v) { if (f(v), q.shift(), q.length) resume(q[0][0], q[0][1]); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ESPHomeDocuments = exports.ESPHomeDocument = void 0;
const yaml_1 = require("yaml");
const objects_1 = require("./utils/objects");
const text_buffer_1 = require("./utils/text-buffer");
const vscode_languageserver_textdocument_1 = require("vscode-languageserver-textdocument");
class CommonTagImpl {
    constructor(tag, type) {
        this.default = false;
        this.tag = tag;
        this.type = type;
    }
    get collection() {
        return undefined;
    }
    identify(_value) {
        return true;
    }
    resolve(value) {
        return value;
    }
}
/**
 * Represents a single ESPHome YAML file with its parsed content.
 * The schema is injected so it can be shared across documents.
 *
 * Scope distinction:
 * - "local" scope: only this file's YAML (e.g. for deduplicating root keys,
 *    since YAML does not allow duplicate keys in the same file)
 * - "merged" scope: this file + all included files (e.g. for ID lookups,
 *    since ESPHome merges all dicts from included files at runtime)
 */
class ESPHomeDocument {
    constructor(text, schema, 
    /** Absolute URI/path for resolving relative includes */
    fileUri) {
        this.text = text;
        this.schema = schema;
        this.fileUri = fileUri;
        /** Documents loaded from !include / packages references */
        this.includedDocuments = [];
        this.bufferText = text.getText();
        this.yaml = this.parse(this.bufferText);
    }
    update(buffer) {
        this.text = buffer;
        const text = this.text.getText();
        if (this.bufferText === text) {
            return;
        }
        this.bufferText = text;
        this.yaml = this.parse(this.bufferText);
        // Invalidate includes so they get re-resolved on next access
        this.includedDocuments = [];
    }
    parse(text) {
        const options = {
            strict: false,
            version: "1.2",
            customTags: [
                new CommonTagImpl("!secret", "scalar"),
                new CommonTagImpl("!include", "scalar"),
                new CommonTagImpl("!lambda", "scalar"),
            ],
        };
        const composer = new yaml_1.Composer(options);
        const lineCounter = new yaml_1.LineCounter();
        let isLastLineEmpty = false;
        const parser = isLastLineEmpty
            ? new yaml_1.Parser()
            : new yaml_1.Parser(lineCounter.addNewLine);
        const tokens = parser.parse(text);
        const tokensArr = Array.from(tokens);
        const docs = composer.compose(tokensArr, true, text.length);
        return Array.from(docs)[0];
    }
    // ─── YAML Navigation ──────────────────────────────────────────────────────
    getParent(nodeToFind) {
        let parentNode = undefined;
        (0, yaml_1.visit)(this.yaml, (_, node, path) => {
            if (node === nodeToFind) {
                parentNode = path[path.length - 1];
                return yaml_1.visit.BREAK;
            }
            return;
        });
        if ((0, yaml_1.isDocument)(parentNode)) {
            return;
        }
        return parentNode;
    }
    getPath(node) {
        const path = [];
        let child = undefined;
        let findingNode = node;
        while (findingNode) {
            if ((0, yaml_1.isPair)(findingNode)) {
                if ((0, yaml_1.isScalar)(findingNode.key)) {
                    path.push(findingNode.key.value);
                }
            }
            if ((0, yaml_1.isSeq)(findingNode) && child !== undefined) {
                path.push(findingNode.items.indexOf(child));
            }
            child = findingNode;
            findingNode = this.getParent(findingNode);
        }
        return path.reverse();
    }
    getNodeFromOffset(offset) {
        let closestNode = undefined;
        let scalarAfterOffset = false;
        (0, yaml_1.visit)(this.yaml, (_key, node) => {
            if (!node || !(0, yaml_1.isNode)(node)) {
                return;
            }
            const range = node.range;
            if (!range) {
                return;
            }
            // tagged node e.g. !secret at the beginning have tag property
            // but the range does not include this tag space
            const startPos = node.tag ? range[0] - node.tag.length - 1 : range[0];
            if ((startPos <= offset && range[2] >= offset) ||
                // handle edge case of null node values
                ((0, yaml_1.isScalar)(node) &&
                    node.value === null &&
                    startPos > offset &&
                    range[1] > offset &&
                    !(0, yaml_1.isScalar)(closestNode) &&
                    !scalarAfterOffset)) {
                closestNode = node;
            }
            else {
                if ((0, yaml_1.isScalar)(node) && startPos > offset && range[1] > offset) {
                    scalarAfterOffset = true;
                }
                return yaml_1.visit.SKIP;
            }
            return;
        });
        return closestNode;
    }
    // ─── Schema + Document traversal ──────────────────────────────────────────
    /**
     * Walk the path through YAML and schema simultaneously, returning the
     * ConfigVar and YAML node at the end of the path.
     */
    getConfigVarAndPathNode(path) {
        return __awaiter(this, void 0, void 0, function* () {
            let pathNode = this.yaml.contents;
            let cv = undefined;
            for (let index = 0; index < path.length; index++) {
                if ((0, objects_1.isString)(path[index]) && (0, yaml_1.isMap)(pathNode)) {
                    if (cv === undefined && index <= 2 && pathNode.get("platform")) {
                        const componentName = pathNode.get("platform");
                        if ((0, objects_1.isString)(componentName)) {
                            const platformComponents = yield this.schema.getPlatformList();
                            if ((0, objects_1.isString)(path[0]) && path[0] in platformComponents) {
                                const c = yield this.schema.getComponent(path[0]);
                                if (c.components !== undefined && componentName in c.components) {
                                    cv = yield this.schema.getComponentPlatformSchema(componentName, path[0]);
                                }
                            }
                        }
                    }
                    pathNode = pathNode.get(path[index], true);
                    if (cv === undefined) {
                        const rootComponents = yield this.schema.getComponentList();
                        if ((0, objects_1.isString)(path[0]) && path[0] in rootComponents) {
                            cv = (yield this.schema.getComponent(path[0])).schemas
                                .CONFIG_SCHEMA;
                        }
                    }
                    else {
                        const pathIndex = path[index];
                        if ((0, objects_1.isString)(pathIndex)) {
                            if (cv.type === "schema" || cv.type === "trigger") {
                                if (cv.schema !== undefined) {
                                    const schema_cv = yield this.findConfigVar(cv.schema, pathIndex);
                                    if (schema_cv !== undefined) {
                                        cv = schema_cv;
                                        continue;
                                    }
                                }
                                if (cv.type === "trigger") {
                                    if (pathIndex === "then") {
                                        continue;
                                    }
                                    const action = yield this.schema.getActionConfigVar(pathIndex);
                                    if (action !== undefined) {
                                        cv = action;
                                        continue;
                                    }
                                }
                            }
                            if (cv.type === "registry") {
                                cv = yield this.schema.getRegistryConfigVar(cv.registry, pathIndex);
                            }
                        }
                    }
                }
                else if ((0, objects_1.isNumber)(path[index]) && (0, yaml_1.isSeq)(pathNode)) {
                    pathNode = pathNode.get(path[index], true);
                }
            }
            if (!cv || !pathNode) {
                return undefined;
            }
            return [cv, pathNode];
        });
    }
    // ─── Schema delegation (with local document context) ──────────────────────
    /**
     * Iterate config vars for a schema using this document's local YAML for
     * context-aware filtering (e.g. MQTT props hidden when mqtt not present).
     * Use this for completions that operate on the current file.
     */
    iterConfigVars(schema_1) {
        return __asyncGenerator(this, arguments, function* iterConfigVars_1(schema, yielded = []) {
            yield __await(yield* __asyncDelegator(__asyncValues(this.schema.iterConfigVars(schema, this.yaml.contents, yielded))));
        });
    }
    /**
     * Find a config var by name within a schema, using local document context.
     */
    findConfigVar(schema, prop) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.schema.findConfigVar(schema, prop, this.yaml.contents);
        });
    }
    // ─── Document-aware component iteration ───────────────────────────────────
    /**
     * Iterate components used in a single YAML document, contributing results
     * into the shared `yieldedComponents` / `addPollingComponent` state so that
     * callers can merge multiple documents without duplicates.
     */
    iterSingleYamlComponents(docYaml, yieldedComponents, pollingRef) {
        return __asyncGenerator(this, arguments, function* iterSingleYamlComponents_1() {
            var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
            const docMap = docYaml.contents;
            if (!(docMap === null || docMap === void 0 ? void 0 : docMap.items))
                return yield __await(void 0);
            for (const k of docMap.items) {
                if ((0, yaml_1.isPair)(k) && (0, yaml_1.isScalar)(k.key)) {
                    const componentName = k.key.value;
                    const isPlatformComponent = yield __await(this.schema.isPlatform(componentName));
                    if (!isPlatformComponent &&
                        !(componentName in (yield __await(this.schema.getSchema())).core.components)) {
                        continue;
                    }
                    const component = yield __await(this.schema.getComponent(componentName));
                    if (!yieldedComponents.includes(componentName)) {
                        yield yield __await([componentName, component, k.value]);
                        yieldedComponents.push(componentName);
                    }
                    if (isPlatformComponent) {
                        const platList = docMap.get(componentName);
                        if ((0, yaml_1.isSeq)(platList)) {
                            for (const plat of platList.items) {
                                if ((0, yaml_1.isMap)(plat)) {
                                    const platCompName = plat.get("platform");
                                    if (platCompName in component.components) {
                                        const platComponent = yield __await(this.schema.getComponent(platCompName, componentName));
                                        if (!pollingRef.value) {
                                            if ((_e = (_d = (_c = (_b = (_a = platComponent.schemas.CONFIG_SCHEMA) === null || _a === void 0 ? void 0 : _a.schema) === null || _b === void 0 ? void 0 : _b.config_vars.id) === null || _c === void 0 ? void 0 : _c.id_type) === null || _d === void 0 ? void 0 : _d.parents) === null || _e === void 0 ? void 0 : _e.includes("PollingComponent")) {
                                                pollingRef.value = true;
                                            }
                                        }
                                        const platKey = `${componentName}.${platCompName}`;
                                        if (!yieldedComponents.includes(platKey)) {
                                            // Yield the platform-specific component with platform set for
                                            // correct action naming (e.g. sensor.template.publish)
                                            yield yield __await([
                                                platCompName,
                                                Object.assign(Object.assign({}, platComponent), { platform: componentName }),
                                                plat,
                                            ]);
                                            yieldedComponents.push(platKey);
                                        }
                                        // Also yield the base component (e.g. "pzemac" without platform)
                                        // so its component-level actions are named pzemac.reset_energy
                                        if (!yieldedComponents.includes(platCompName)) {
                                            const baseComponent = yield __await(this.schema.getComponent(platCompName));
                                            if (baseComponent) {
                                                yield yield __await([platCompName, baseComponent, plat]);
                                            }
                                            yieldedComponents.push(platCompName);
                                        }
                                    }
                                }
                            }
                        }
                    }
                    else {
                        if (!pollingRef.value &&
                            ((_k = (_j = (_h = (_g = (_f = component.schemas.CONFIG_SCHEMA) === null || _f === void 0 ? void 0 : _f.schema) === null || _g === void 0 ? void 0 : _g.config_vars.id) === null || _h === void 0 ? void 0 : _h.id_type) === null || _j === void 0 ? void 0 : _j.parents) === null || _k === void 0 ? void 0 : _k.includes("PollingComponent"))) {
                            pollingRef.value = true;
                        }
                        if (componentName === "api" &&
                            !yieldedComponents.includes("homeassistant")) {
                            yield yield __await([
                                "homeassistant",
                                yield __await(this.schema.getComponent("homeassistant")),
                                k.value,
                            ]);
                            yieldedComponents.push("homeassistant");
                        }
                    }
                }
            }
        });
    }
    /**
     * Iterate all components actively used across this file AND all included
     * files (merged scope). Deduplicates by component name so each component is
     * yielded only once even if it appears in multiple files.
     *
     * Used for:
     *   - determining available action/condition/filter registries
     *   - detecting PollingComponent for component.update
     */
    getDocComponents() {
        return __asyncGenerator(this, arguments, function* getDocComponents_1() {
            const yieldedComponents = [];
            const pollingRef = { value: false };
            for (const doc of this.getAllDocuments()) {
                yield __await(yield* __asyncDelegator(__asyncValues(doc.iterSingleYamlComponents(doc.yaml, yieldedComponents, pollingRef))));
            }
            if (pollingRef.value) {
                yield yield __await([
                    "component",
                    yield __await(this.schema.getComponent("component")),
                    undefined,
                ]);
            }
            yield yield __await(["core", (yield __await(this.schema.getSchema())).core, undefined]);
        });
    }
    /**
     * Iterate registry entries available in this document (merged scope).
     *
     * - For domain-specific registries (e.g. "sensor.filter"): pure schema lookup.
     * - For global registries (e.g. "action", "condition"): uses getDocComponents()
     *   which already covers this file and all included files.
     */
    getRegistry(registry) {
        return __asyncGenerator(this, arguments, function* getRegistry_1() {
            var _a, e_1, _b, _c;
            if (registry.includes(".")) {
                // domain.registryName format — pure schema, no doc context needed
                yield __await(yield* __asyncDelegator(__asyncValues(this.schema.getDomainRegistry(registry))));
            }
            else {
                if (this.schema.isRegistry(registry)) {
                    try {
                        for (var _d = true, _e = __asyncValues(this.getDocComponents()), _f; _f = yield __await(_e.next()), _a = _f.done, !_a; _d = true) {
                            _c = _f.value;
                            _d = false;
                            const [componentName, component,] = _c;
                            const componentRegistry = component
                                ? component[registry]
                                : undefined;
                            if (componentRegistry !== undefined) {
                                for (const name in componentRegistry) {
                                    if (componentName === "core") {
                                        yield yield __await([name, componentRegistry[name]]);
                                    }
                                    else if (component.platform) {
                                        // Platform-specific action: e.g. sensor.template.publish
                                        yield yield __await([
                                            `${component.platform}.${componentName}.${name}`,
                                            componentRegistry[name],
                                        ]);
                                    }
                                    else {
                                        // Base component action: e.g. pzemac.reset_energy
                                        yield yield __await([`${componentName}.${name}`, componentRegistry[name]]);
                                    }
                                }
                            }
                        }
                    }
                    catch (e_1_1) { e_1 = { error: e_1_1 }; }
                    finally {
                        try {
                            if (!_d && !_a && (_b = _e.return)) yield __await(_b.call(_e));
                        }
                        finally { if (e_1) throw e_1.error; }
                    }
                }
            }
        });
    }
    // ─── ID declaration traversal (merged scope) ──────────────────────────────
    iterDeclaringIdsInner(idType, map, declaringCv, localYaml) {
        return __asyncGenerator(this, arguments, function* iterDeclaringIdsInner_1() {
            var _a, e_2, _b, _c, _d, e_3, _e, _f;
            var _g;
            let schema;
            if (declaringCv.type === "schema") {
                schema = declaringCv.schema;
            }
            else if (declaringCv.type === "typed") {
                const schemaType = map.get(declaringCv.typed_key);
                schema =
                    schemaType in declaringCv.types
                        ? declaringCv.types[schemaType]
                        : declaringCv.types[Object.keys(declaringCv.types)[0]];
            }
            else {
                return yield __await(void 0);
            }
            for (const k of map.items) {
                if ((0, yaml_1.isPair)(k) && (0, yaml_1.isScalar)(k.key)) {
                    const propName = k.key.value;
                    const cv = yield __await(this.schema.findConfigVar(schema, propName, localYaml.contents));
                    if (cv) {
                        const idCv = cv;
                        if (idCv.id_type &&
                            (idCv.id_type.class === idType ||
                                ((_g = idCv.id_type.parents) === null || _g === void 0 ? void 0 : _g.includes(idType)))) {
                            yield yield __await(k.value);
                        }
                        if ((0, yaml_1.isMap)(k.value)) {
                            try {
                                for (var _h = true, _j = (e_2 = void 0, __asyncValues(this.iterDeclaringIdsInner(idType, k.value, cv, localYaml))), _k; _k = yield __await(_j.next()), _a = _k.done, !_a; _h = true) {
                                    _c = _k.value;
                                    _h = false;
                                    const yieldNode = _c;
                                    yield yield __await(yieldNode);
                                }
                            }
                            catch (e_2_1) { e_2 = { error: e_2_1 }; }
                            finally {
                                try {
                                    if (!_h && !_a && (_b = _j.return)) yield __await(_b.call(_j));
                                }
                                finally { if (e_2) throw e_2.error; }
                            }
                        }
                        else if (cv.is_list && (0, yaml_1.isSeq)(k.value)) {
                            for (const seqItem of k.value.items) {
                                if ((0, yaml_1.isMap)(seqItem)) {
                                    try {
                                        for (var _l = true, _m = (e_3 = void 0, __asyncValues(this.iterDeclaringIdsInner(idType, seqItem, cv, localYaml))), _o; _o = yield __await(_m.next()), _d = _o.done, !_d; _l = true) {
                                            _f = _o.value;
                                            _l = false;
                                            const yieldNode = _f;
                                            yield yield __await(yieldNode);
                                        }
                                    }
                                    catch (e_3_1) { e_3 = { error: e_3_1 }; }
                                    finally {
                                        try {
                                            if (!_l && !_d && (_e = _m.return)) yield __await(_e.call(_m));
                                        }
                                        finally { if (e_3) throw e_3.error; }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });
    }
    /**
     * Iterate all YAML nodes that declare an ID matching `idType` in a single
     * parsed YAML document.
     */
    iterDeclaringIdsInDoc(idType, doc) {
        return __asyncGenerator(this, arguments, function* iterDeclaringIdsInDoc_1() {
            var _a, e_4, _b, _c, _d, e_5, _e, _f, _g, e_6, _h, _j, _k, e_7, _l, _m;
            const docMap = doc.contents;
            for (const k of docMap.items) {
                if ((0, yaml_1.isPair)(k) && (0, yaml_1.isScalar)(k.key)) {
                    const componentName = k.key.value;
                    if (componentName in (yield __await(this.schema.getSchema())).core.components ||
                        (yield __await(this.schema.isPlatform(componentName)))) {
                        const component = yield __await(this.schema.getComponent(componentName));
                        const cv = component.schemas.CONFIG_SCHEMA;
                        if ((0, yaml_1.isMap)(k.value) && cv) {
                            try {
                                for (var _o = true, _p = (e_4 = void 0, __asyncValues(this.iterDeclaringIdsInner(idType, k.value, cv, doc))), _q; _q = yield __await(_p.next()), _a = _q.done, !_a; _o = true) {
                                    _c = _q.value;
                                    _o = false;
                                    const yieldNode = _c;
                                    yield yield __await(yieldNode);
                                }
                            }
                            catch (e_4_1) { e_4 = { error: e_4_1 }; }
                            finally {
                                try {
                                    if (!_o && !_a && (_b = _p.return)) yield __await(_b.call(_p));
                                }
                                finally { if (e_4) throw e_4.error; }
                            }
                        }
                        else if ((0, yaml_1.isSeq)(k.value) && cv && cv.is_list) {
                            const nodeList = k.value;
                            for (const item of nodeList.items) {
                                if ((0, yaml_1.isMap)(item) && (0, yaml_1.isScalar)(item.get("id", true)) && cv) {
                                    try {
                                        for (var _r = true, _s = (e_5 = void 0, __asyncValues(this.iterDeclaringIdsInner(idType, item, cv, doc))), _t; _t = yield __await(_s.next()), _d = _t.done, !_d; _r = true) {
                                            _f = _t.value;
                                            _r = false;
                                            const yieldNode = _f;
                                            yield yield __await(yieldNode);
                                        }
                                    }
                                    catch (e_5_1) { e_5 = { error: e_5_1 }; }
                                    finally {
                                        try {
                                            if (!_r && !_d && (_e = _s.return)) yield __await(_e.call(_s));
                                        }
                                        finally { if (e_5) throw e_5.error; }
                                    }
                                }
                            }
                        }
                        if (yield __await(this.schema.isPlatform(componentName))) {
                            // iterate elements and lookup platform to load components
                            const platNode = k.value;
                            if ((0, yaml_1.isSeq)(platNode)) {
                                for (const seqItemNode of platNode.items) {
                                    if ((0, yaml_1.isMap)(seqItemNode)) {
                                        const platCompName = seqItemNode.get("platform");
                                        if (platCompName in component.components) {
                                            const platComponent = yield __await(this.schema.getComponent(platCompName, componentName));
                                            const platCv = platComponent.schemas.CONFIG_SCHEMA;
                                            if (platCv !== undefined)
                                                try {
                                                    for (var _u = true, _v = (e_6 = void 0, __asyncValues(this.iterDeclaringIdsInner(idType, seqItemNode, platCv, doc))), _w; _w = yield __await(_v.next()), _g = _w.done, !_g; _u = true) {
                                                        _j = _w.value;
                                                        _u = false;
                                                        const yieldNode = _j;
                                                        yield yield __await(yieldNode);
                                                    }
                                                }
                                                catch (e_6_1) { e_6 = { error: e_6_1 }; }
                                                finally {
                                                    try {
                                                        if (!_u && !_g && (_h = _v.return)) yield __await(_h.call(_v));
                                                    }
                                                    finally { if (e_6) throw e_6.error; }
                                                }
                                        }
                                    }
                                }
                            }
                            else if ((0, yaml_1.isMap)(platNode)) {
                                const platCompName = platNode.get("platform");
                                if (platCompName in component.components) {
                                    const platComponent = yield __await(this.schema.getComponent(platCompName, componentName));
                                    const platCv = platComponent.schemas.CONFIG_SCHEMA;
                                    try {
                                        for (var _x = true, _y = (e_7 = void 0, __asyncValues(this.iterDeclaringIdsInner(idType, platNode, platCv, doc))), _z; _z = yield __await(_y.next()), _k = _z.done, !_k; _x = true) {
                                            _m = _z.value;
                                            _x = false;
                                            const yieldNode = _m;
                                            yield yield __await(yieldNode);
                                        }
                                    }
                                    catch (e_7_1) { e_7 = { error: e_7_1 }; }
                                    finally {
                                        try {
                                            if (!_x && !_k && (_l = _y.return)) yield __await(_l.call(_y));
                                        }
                                        finally { if (e_7) throw e_7.error; }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });
    }
    /**
     * Iterate all nodes declaring an ID of `idType` across this file AND all
     * included files (merged scope). Yields [owning document, node] pairs so
     * callers can determine which file the declaration lives in.
     */
    iterDeclaringIds(idType) {
        return __asyncGenerator(this, arguments, function* iterDeclaringIds_1() {
            var _a, e_8, _b, _c;
            for (const doc of this.getAllDocuments()) {
                try {
                    for (var _d = true, _e = (e_8 = void 0, __asyncValues(doc.iterDeclaringIdsInDoc(idType, doc.yaml))), _f; _f = yield __await(_e.next()), _a = _f.done, !_a; _d = true) {
                        _c = _f.value;
                        _d = false;
                        const node = _c;
                        yield yield __await([doc, node]);
                    }
                }
                catch (e_8_1) { e_8 = { error: e_8_1 }; }
                finally {
                    try {
                        if (!_d && !_a && (_b = _e.return)) yield __await(_b.call(_e));
                    }
                    finally { if (e_8) throw e_8.error; }
                }
            }
        });
    }
    /**
     * Get all usable IDs of a given type across this document and its includes.
     * Use this for `use_id` completions — needs merged scope.
     */
    getUsableIds(use_id_type) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, e_9, _b, _c;
            const ret = [];
            try {
                for (var _d = true, _e = __asyncValues(this.iterDeclaringIds(use_id_type)), _f; _f = yield _e.next(), _a = _f.done, !_a; _d = true) {
                    _c = _f.value;
                    _d = false;
                    const [, item] = _c;
                    ret.push(item.toString());
                }
            }
            catch (e_9_1) { e_9 = { error: e_9_1 }; }
            finally {
                try {
                    if (!_d && !_a && (_b = _e.return)) yield _b.call(_e);
                }
                finally { if (e_9) throw e_9.error; }
            }
            return ret;
        });
    }
    /**
     * Find an ID declaration across this document and its includes.
     * Returns the owning document and YAML range for goto-definition.
     */
    findComponentDefinition(id_type, id) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, e_10, _b, _c;
            try {
                for (var _d = true, _e = __asyncValues(this.iterDeclaringIds(id_type)), _f; _f = yield _e.next(), _a = _f.done, !_a; _d = true) {
                    _c = _f.value;
                    _d = false;
                    const [doc, item] = _c;
                    if ((0, yaml_1.isScalar)(item) && item.value === id) {
                        return { doc, range: item.range };
                    }
                }
            }
            catch (e_10_1) { e_10 = { error: e_10_1 }; }
            finally {
                try {
                    if (!_d && !_a && (_b = _e.return)) yield _b.call(_e);
                }
                finally { if (e_10) throw e_10.error; }
            }
            return null;
        });
    }
    // ─── Include support ───────────────────────────────────────────────────────
    /**
     * Returns all documents in the merged set: this document first, then any
     * loaded included documents.
     */
    getAllDocuments() {
        return [this, ...this.includedDocuments];
    }
    /**
     * Extract relative file paths referenced by !include tags and the packages:
     * section in this document's YAML.
     */
    getIncludeUris() {
        var _a;
        const seen = new Set();
        const add = (path) => {
            if (!seen.has(path))
                seen.add(path);
        };
        if (!((_a = this.yaml) === null || _a === void 0 ? void 0 : _a.contents))
            return [];
        (0, yaml_1.visit)(this.yaml, (_key, node) => {
            // !include scalar: value is the relative path
            if ((0, yaml_1.isScalar)(node) && node.tag === "!include" && (0, objects_1.isString)(node.value)) {
                add(node.value);
                return;
            }
            // !include map: { file: <path>, ... }
            if ((0, yaml_1.isMap)(node) && node.tag === "!include") {
                const fileVal = node.get("file");
                if ((0, objects_1.isString)(fileVal))
                    add(fileVal);
                return;
            }
        });
        // packages: <name>: file: <path>  (dict-format packages without url)
        const docMap = this.yaml.contents;
        const packagesNode = docMap === null || docMap === void 0 ? void 0 : docMap.get("packages", true);
        if ((0, yaml_1.isMap)(packagesNode)) {
            for (const pair of packagesNode.items) {
                if ((0, yaml_1.isPair)(pair) && (0, yaml_1.isMap)(pair.value)) {
                    const fileVal = pair.value.get("file");
                    if ((0, objects_1.isString)(fileVal))
                        add(fileVal);
                }
            }
        }
        return [...seen];
    }
    /**
     * Load included files using the provided loader and attach them to this
     * document. Called by ESPHomeDocuments when a document is updated.
     *
     * Included documents share the same schema instance.
     */
    loadIncludes(loader) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.fileUri)
                return;
            const includeUris = this.getIncludeUris();
            this.includedDocuments = [];
            for (const relativePath of includeUris) {
                try {
                    const content = yield loader(relativePath, this.fileUri);
                    if (content !== undefined) {
                        const resolvedUri = new URL(relativePath, this.fileUri).toString();
                        const textDoc = vscode_languageserver_textdocument_1.TextDocument.create(resolvedUri, "yaml", 0, content);
                        const buffer = new text_buffer_1.TextBuffer(textDoc);
                        const includedDoc = new ESPHomeDocument(buffer, this.schema, resolvedUri);
                        this.includedDocuments.push(includedDoc);
                    }
                }
                catch (_a) {
                    // Skip files that can't be loaded
                }
            }
        });
    }
}
exports.ESPHomeDocument = ESPHomeDocument;
class ESPHomeDocuments {
    constructor(schema) {
        this.schema = schema;
        this.documents = {};
    }
    setFileLoader(loader) {
        this.fileLoader = loader;
    }
    update(uri, buffer) {
        return __awaiter(this, void 0, void 0, function* () {
            const doc = this.documents[uri];
            if (doc === undefined) {
                this.documents[uri] = new ESPHomeDocument(buffer, this.schema, uri);
            }
            else {
                doc.update(buffer);
            }
            if (this.fileLoader) {
                yield this.documents[uri].loadIncludes(this.fileLoader);
            }
        });
    }
    getDocument(uri) {
        return this.documents[uri];
    }
}
exports.ESPHomeDocuments = ESPHomeDocuments;
//# sourceMappingURL=esphome-document.js.map