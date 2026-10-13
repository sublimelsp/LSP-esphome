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
var __await = (this && this.__await) || function (v) { return this instanceof __await ? (this.v = v, this) : new __await(v); }
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
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
exports.ESPHomeSchema = void 0;
class ESPHomeSchema {
    constructor(schemaLoader) {
        this.schemaLoader = schemaLoader;
        this.loaded_schemas = ["core", "esphome"];
    }
    getSchema() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.schema) {
                return this.schema;
            }
            this.schema = yield this.schemaLoader("esphome");
            return this.schema;
        });
    }
    getPlatformList() {
        return __awaiter(this, void 0, void 0, function* () {
            return (yield this.getSchema()).core.platforms;
        });
    }
    getComponentList() {
        return __awaiter(this, void 0, void 0, function* () {
            return (yield this.getSchema()).core.components;
        });
    }
    getComponent(domain_1) {
        return __awaiter(this, arguments, void 0, function* (domain, platform = null) {
            if (!this.loaded_schemas.includes(domain)) {
                this.schema = Object.assign(Object.assign({}, this.schema), (yield this.schemaLoader(domain)));
                this.loaded_schemas.push(domain);
            }
            if (platform !== null) {
                return (yield this.getSchema())[`${domain}.${platform}`];
            }
            return (yield this.getSchema())[domain];
        });
    }
    getComponentSchema(domain) {
        return __awaiter(this, void 0, void 0, function* () {
            const component = yield this.getComponent(domain);
            return component.schemas.CONFIG_SCHEMA;
        });
    }
    getComponentPlatformSchema(domain, platform) {
        return __awaiter(this, void 0, void 0, function* () {
            const component = yield this.getComponent(domain, platform);
            return component.schemas.CONFIG_SCHEMA;
        });
    }
    getExtendedConfigVar(name) {
        return __awaiter(this, void 0, void 0, function* () {
            const parts = name.split(".");
            if (parts.length === 3) {
                const c = yield this.getComponent(parts[0], parts[1]);
                return c.schemas[parts[2]];
            }
            const c = yield this.getComponent(parts[0]);
            return c.schemas[parts[1]];
        });
    }
    isPlatform(name) {
        return __awaiter(this, void 0, void 0, function* () {
            return name in (yield this.getSchema()).core.platforms;
        });
    }
    /**
     * Iterate config vars for a schema. Accepts an optional YAMLMap from the
     * current document to enable context-aware filtering (e.g. MQTT props).
     */
    iterConfigVars(schema_1, docMap_1) {
        return __asyncGenerator(this, arguments, function* iterConfigVars_1(schema, docMap, yielded = []) {
            var _a, e_1, _b, _c;
            var _d;
            for (var prop in schema.config_vars) {
                if (((_d = schema.extends) === null || _d === void 0 ? void 0 : _d.includes("core.MQTT_COMPONENT_SCHEMA")) &&
                    (prop === "mqtt_id" || prop === "expire_after") &&
                    (docMap === null || docMap === void 0 ? void 0 : docMap.get("mqtt")) === undefined) {
                    // filter mqtt props if mqtt is not used
                    continue;
                }
                if (yielded.includes(prop)) {
                    continue;
                }
                yielded.push(prop);
                yield yield __await([prop, yield __await(this.getConfigVarComplete(schema, prop))]);
            }
            if (schema.extends !== undefined) {
                for (var extended of schema.extends) {
                    if (extended.startsWith("core.MQTT") &&
                        (docMap === null || docMap === void 0 ? void 0 : docMap.get("mqtt")) === undefined) {
                        continue;
                    }
                    const s = yield __await(this.getExtendedConfigVar(extended));
                    if (s.type === "schema") {
                        try {
                            for (var _e = true, _f = (e_1 = void 0, __asyncValues(this.iterConfigVars(s.schema, docMap, yielded))), _g; _g = yield __await(_f.next()), _a = _g.done, !_a; _e = true) {
                                _c = _g.value;
                                _e = false;
                                const pair = _c;
                                yield yield __await(pair);
                            }
                        }
                        catch (e_1_1) { e_1 = { error: e_1_1 }; }
                        finally {
                            try {
                                if (!_e && !_a && (_b = _f.return)) yield __await(_b.call(_f));
                            }
                            finally { if (e_1) throw e_1.error; }
                        }
                    }
                    else if (s.type === "typed") {
                        yield yield __await([s.typed_key, s]);
                    }
                }
            }
        });
    }
    findConfigVar(schema, prop, docMap) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, e_2, _b, _c;
            try {
                for (var _d = true, _e = __asyncValues(this.iterConfigVars(schema, docMap)), _f; _f = yield _e.next(), _a = _f.done, !_a; _d = true) {
                    _c = _f.value;
                    _d = false;
                    const [p, config] = _c;
                    if (p === prop) {
                        return config;
                    }
                }
            }
            catch (e_2_1) { e_2 = { error: e_2_1 }; }
            finally {
                try {
                    if (!_d && !_a && (_b = _e.return)) yield _b.call(_e);
                }
                finally { if (e_2) throw e_2.error; }
            }
            return undefined;
        });
    }
    getConfigVarComplete(schema, key) {
        return __awaiter(this, void 0, void 0, function* () {
            var cv = Object.assign({}, schema.config_vars[key]);
            const appendCvs = (s, c) => __awaiter(this, void 0, void 0, function* () {
                if (s.extends !== undefined) {
                    for (const extended of s.extends) {
                        const s_cv = yield this.getExtendedConfigVar(extended);
                        if (s_cv.type === "schema") {
                            if (s_cv.schema.config_vars !== undefined &&
                                key in s_cv.schema.config_vars) {
                                c = Object.assign(Object.assign({}, s_cv.schema.config_vars[key]), c);
                            }
                            c = yield appendCvs(s_cv.schema, c);
                        }
                    }
                }
                return c;
            });
            cv = yield appendCvs(schema, cv);
            return yield this.getConfigVarComplete2(cv);
        });
    }
    getConfigVarComplete2(cv) {
        return __awaiter(this, void 0, void 0, function* () {
            if (cv.type !== "schema" || cv.schema.extends === undefined) {
                return cv;
            }
            let mergedConfigVars = Object.assign({}, cv.schema.config_vars);
            let maybe = cv.maybe;
            for (const extended of cv.schema.extends) {
                const s_cv = yield this.getExtendedConfigVar(extended);
                if (s_cv.type === "schema") {
                    const completedExtended = yield this.getConfigVarComplete2(s_cv);
                    if (completedExtended.type === "schema") {
                        mergedConfigVars = Object.assign(Object.assign({}, completedExtended.schema.config_vars), mergedConfigVars);
                        if (maybe === undefined) {
                            maybe = completedExtended.maybe;
                        }
                    }
                }
            }
            return Object.assign(Object.assign({}, cv), { maybe, schema: {
                    config_vars: mergedConfigVars,
                    extends: [],
                } });
        });
    }
    /**
     * Iterate a domain-specific registry (registry must contain ".").
     * E.g. "sensor.filter" yields all sensor filters.
     */
    getDomainRegistry(domainRegistry) {
        return __asyncGenerator(this, arguments, function* getDomainRegistry_1() {
            const [domain, registryName] = domainRegistry.split(".");
            if (this.isRegistry(registryName)) {
                const schemaSet = yield __await(this.getSchema());
                const domainData = schemaSet[domain];
                if (domainData && domainData[registryName]) {
                    for (const name in domainData[registryName]) {
                        yield yield __await([name, domainData[registryName][name]]);
                    }
                }
            }
        });
    }
    getRegistryConfigVar(registry, entry) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c;
            if (registry.includes(".")) {
                const [domain, registryName] = registry.split(".");
                if (this.isRegistry(registryName))
                    return (yield this.getComponent(domain))[registryName][entry];
            }
            else {
                if (this.isRegistry(registry)) {
                    if (entry.includes(".")) {
                        const parts = entry.split(".");
                        if (parts.length === 3) {
                            const [domain, platform, actionName] = parts;
                            return (yield this.getComponent(platform, domain))[registry][actionName];
                        }
                        else {
                            const [domain, actionName] = parts;
                            return (yield this.getComponent(domain))[registry][actionName];
                        }
                    }
                    if (((_a = this.schema) === null || _a === void 0 ? void 0 : _a.core[registry]) !== undefined &&
                        ((_b = this.schema) === null || _b === void 0 ? void 0 : _b.core[registry][entry]) !== undefined) {
                        return (_c = this.schema) === null || _c === void 0 ? void 0 : _c.core[registry][entry];
                    }
                }
            }
            return undefined;
        });
    }
    isRegistry(name) {
        return (name === "filter" ||
            name === "effects" ||
            name === "condition" ||
            name === "action");
    }
    getActionConfigVar(entry) {
        return __awaiter(this, void 0, void 0, function* () {
            return (yield this.getRegistryConfigVar("action", entry));
        });
    }
    getPinConfigVar(component) {
        return __awaiter(this, void 0, void 0, function* () {
            var c = yield this.getComponent(component);
            if (!c.pin)
                throw new Error("Attempt to get pin from not pin component.");
            return c.pin;
        });
    }
    getPins() {
        return __awaiter(this, void 0, void 0, function* () {
            return (yield this.getSchema()).core.pins;
        });
    }
}
exports.ESPHomeSchema = ESPHomeSchema;
//# sourceMappingURL=esphome-schema.js.map