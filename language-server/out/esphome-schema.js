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
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ESPHomeSchema = void 0;
const yaml_1 = require("yaml");
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
    getDocComponents(doc) {
        return __asyncGenerator(this, arguments, function* getDocComponents_1() {
            var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
            const docMap = doc.contents;
            let addPollingComponent = false;
            const yieldedComponents = [];
            for (const k of docMap.items) {
                if ((0, yaml_1.isPair)(k) && (0, yaml_1.isScalar)(k.key)) {
                    const componentName = k.key.value;
                    const isPlatformComponent = yield __await(this.isPlatform(componentName));
                    if (!isPlatformComponent &&
                        !(componentName in (yield __await(this.getSchema())).core.components)) {
                        // invalid or unknown name
                        continue;
                    }
                    const component = yield __await(this.getComponent(componentName));
                    if (!yieldedComponents.includes(componentName)) {
                        yield yield __await([componentName, component, k.value]);
                        yieldedComponents.push(componentName);
                    }
                    if (isPlatformComponent) {
                        // iterate elements and lookup platform to load components
                        const platList = docMap.get(componentName);
                        if ((0, yaml_1.isSeq)(platList)) {
                            for (const plat of platList.items) {
                                if ((0, yaml_1.isMap)(plat)) {
                                    const platCompName = plat.get("platform");
                                    if (platCompName in component.components) {
                                        if (!addPollingComponent) {
                                            const platComponent = yield __await(this.getComponent(platCompName, componentName));
                                            if ((_e = (_d = (_c = (_b = (_a = platComponent.schemas.CONFIG_SCHEMA) === null || _a === void 0 ? void 0 : _a.schema) === null || _b === void 0 ? void 0 : _b.config_vars.id) === null || _c === void 0 ? void 0 : _c.id_type) === null || _d === void 0 ? void 0 : _d.parents) === null || _e === void 0 ? void 0 : _e.includes("PollingComponent")) {
                                                addPollingComponent = true;
                                            }
                                        }
                                        if (!yieldedComponents.includes(platCompName)) {
                                            yield yield __await([
                                                platCompName,
                                                yield __await(this.getComponent(platCompName)),
                                                plat,
                                            ]);
                                            yieldedComponents.push(platCompName);
                                        }
                                    }
                                }
                            }
                        }
                    }
                    else {
                        if (!addPollingComponent &&
                            ((_k = (_j = (_h = (_g = (_f = component.schemas.CONFIG_SCHEMA) === null || _f === void 0 ? void 0 : _f.schema) === null || _g === void 0 ? void 0 : _g.config_vars.id) === null || _h === void 0 ? void 0 : _h.id_type) === null || _j === void 0 ? void 0 : _j.parents) === null || _k === void 0 ? void 0 : _k.includes("PollingComponent"))) {
                            addPollingComponent = true;
                        }
                        if (componentName === "api" &&
                            !yieldedComponents.includes("homeassistant")) {
                            yield yield __await([
                                "homeassistant",
                                yield __await(this.getComponent("homeassistant")),
                                k.value,
                            ]);
                        }
                    }
                }
            }
            if (addPollingComponent) {
                yield yield __await(["component", yield __await(this.getComponent("component")), undefined]);
            }
            yield yield __await(["core", (yield __await(this.getSchema())).core, undefined]);
        });
    }
    getRegistry(registry, doc) {
        return __asyncGenerator(this, arguments, function* getRegistry_1() {
            var _a, e_1, _b, _c;
            if (registry.includes(".")) {
                // e.g. sensor.filter only items from one component
                const [domain, registryName] = registry.split(".");
                if (this.isRegistry(registryName)) {
                    for (const name in (yield __await(this.getSchema()))[domain][registryName]) {
                        yield yield __await([name, (yield __await(this.getSchema()))[domain][registryName][name]]);
                    }
                }
            }
            else {
                // e.g. action, condition: search in all domains
                if (this.isRegistry(registry))
                    try {
                        for (var _d = true, _e = __asyncValues(this.getDocComponents(doc)), _f; _f = yield __await(_e.next()), _a = _f.done, !_a; _d = true) {
                            _c = _f.value;
                            _d = false;
                            const [componentName, component] = _c;
                            // component might be undefined if this component has no registries
                            const componentRegistry = component ? component[registry] : undefined;
                            if (componentRegistry !== undefined) {
                                for (const name in componentRegistry) {
                                    if (componentName === "core") {
                                        yield yield __await([name, componentRegistry[name]]);
                                    }
                                    else {
                                        yield yield __await([
                                            componentName.split(".").reverse().join(".") + "." + name,
                                            componentRegistry[name],
                                        ]);
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
        });
    }
    getRegistryConfigVar(registry, entry) {
        return __awaiter(this, void 0, void 0, function* () {
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
                    for (const c in this.schema) {
                        const schema = yield this.getComponent(c);
                        if (schema[registry] !== undefined &&
                            schema[registry][entry] !== undefined) {
                            return schema[registry][entry];
                        }
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
            var ret = Object.assign({}, cv);
            if (cv.type === "schema" && cv.schema.extends !== undefined) {
                for (const extended of cv.schema.extends) {
                    const s_cv = yield this.getExtendedConfigVar(extended);
                    ret = Object.assign(Object.assign({}, s_cv), ret);
                    ret.type = s_cv.type;
                }
            }
            return ret;
        });
    }
    iterConfigVars(schema_1, doc_1) {
        return __asyncGenerator(this, arguments, function* iterConfigVars_1(schema, doc, yielded = []) {
            var _a, e_2, _b, _c;
            var _d;
            const docMap = doc.contents;
            for (var prop in schema.config_vars) {
                if (((_d = schema.extends) === null || _d === void 0 ? void 0 : _d.includes("core.MQTT_COMPONENT_SCHEMA")) &&
                    (prop === "mqtt_id" || prop === "expire_after") &&
                    docMap.get("mqtt") === undefined) {
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
                        docMap.get("mqtt") === undefined) {
                        continue;
                    }
                    const s = yield __await(this.getExtendedConfigVar(extended));
                    if (s.type === "schema") {
                        try {
                            for (var _e = true, _f = (e_2 = void 0, __asyncValues(this.iterConfigVars(s.schema, doc, yielded))), _g; _g = yield __await(_f.next()), _a = _g.done, !_a; _e = true) {
                                _c = _g.value;
                                _e = false;
                                const pair = _c;
                                yield yield __await(pair);
                            }
                        }
                        catch (e_2_1) { e_2 = { error: e_2_1 }; }
                        finally {
                            try {
                                if (!_e && !_a && (_b = _f.return)) yield __await(_b.call(_f));
                            }
                            finally { if (e_2) throw e_2.error; }
                        }
                    }
                    else if (s.type === "typed") {
                        yield yield __await([s.typed_key, s]);
                    }
                }
            }
        });
    }
    findConfigVar(schema, prop, doc) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, e_3, _b, _c;
            try {
                for (var _d = true, _e = __asyncValues(this.iterConfigVars(schema, doc)), _f; _f = yield _e.next(), _a = _f.done, !_a; _d = true) {
                    _c = _f.value;
                    _d = false;
                    const [p, config] = _c;
                    if (p === prop) {
                        return config;
                    }
                }
            }
            catch (e_3_1) { e_3 = { error: e_3_1 }; }
            finally {
                try {
                    if (!_d && !_a && (_b = _e.return)) yield _b.call(_e);
                }
                finally { if (e_3) throw e_3.error; }
            }
            return undefined;
        });
    }
    iterDeclaringIdsInner(idType, map, declaringCv, doc) {
        return __asyncGenerator(this, arguments, function* iterDeclaringIdsInner_1() {
            var _a, e_4, _b, _c, _d, e_5, _e, _f;
            var _g;
            let schema;
            if (declaringCv.type === "schema") {
                schema = declaringCv.schema;
            }
            else if (declaringCv.type === "typed") {
                const schemaType = map.get(declaringCv.typed_key);
                schema = declaringCv.types[schemaType];
            }
            else {
                return yield __await(void 0);
            }
            for (const k of map.items) {
                if ((0, yaml_1.isPair)(k) && (0, yaml_1.isScalar)(k.key)) {
                    const propName = k.key.value;
                    const cv = yield __await(this.findConfigVar(schema, propName, doc));
                    if (cv) {
                        const idCv = cv;
                        if (idCv.id_type &&
                            (idCv.id_type.class === idType ||
                                ((_g = idCv.id_type.parents) === null || _g === void 0 ? void 0 : _g.includes(idType)))) {
                            yield yield __await(k.value);
                        }
                        if ((0, yaml_1.isMap)(k.value)) {
                            try {
                                for (var _h = true, _j = (e_4 = void 0, __asyncValues(this.iterDeclaringIdsInner(idType, k.value, cv, doc))), _k; _k = yield __await(_j.next()), _a = _k.done, !_a; _h = true) {
                                    _c = _k.value;
                                    _h = false;
                                    const yieldNode = _c;
                                    yield yield __await(yieldNode);
                                }
                            }
                            catch (e_4_1) { e_4 = { error: e_4_1 }; }
                            finally {
                                try {
                                    if (!_h && !_a && (_b = _j.return)) yield __await(_b.call(_j));
                                }
                                finally { if (e_4) throw e_4.error; }
                            }
                        }
                        else if (cv.is_list && (0, yaml_1.isSeq)(k.value)) {
                            for (const seqItem of k.value.items) {
                                if ((0, yaml_1.isMap)(seqItem)) {
                                    try {
                                        for (var _l = true, _m = (e_5 = void 0, __asyncValues(this.iterDeclaringIdsInner(idType, seqItem, cv, doc))), _o; _o = yield __await(_m.next()), _d = _o.done, !_d; _l = true) {
                                            _f = _o.value;
                                            _l = false;
                                            const yieldNode = _f;
                                            yield yield __await(yieldNode);
                                        }
                                    }
                                    catch (e_5_1) { e_5 = { error: e_5_1 }; }
                                    finally {
                                        try {
                                            if (!_l && !_d && (_e = _m.return)) yield __await(_e.call(_m));
                                        }
                                        finally { if (e_5) throw e_5.error; }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });
    }
    iterDeclaringIds(idType, doc) {
        return __asyncGenerator(this, arguments, function* iterDeclaringIds_1() {
            var _a, e_6, _b, _c, _d, e_7, _e, _f, _g, e_8, _h, _j, _k, e_9, _l, _m;
            const docMap = doc.contents;
            for (const k of docMap.items) {
                if ((0, yaml_1.isPair)(k) && (0, yaml_1.isScalar)(k.key)) {
                    const componentName = k.key.value;
                    if (componentName in (yield __await(this.getSchema())).core.components ||
                        (yield __await(this.isPlatform(componentName)))) {
                        const component = yield __await(this.getComponent(componentName));
                        const cv = component.schemas.CONFIG_SCHEMA;
                        if ((0, yaml_1.isMap)(k.value) && (0, yaml_1.isScalar)(k.value.get("id", true)) && cv) {
                            try {
                                for (var _o = true, _p = (e_6 = void 0, __asyncValues(this.iterDeclaringIdsInner(idType, k.value, cv, doc))), _q; _q = yield __await(_p.next()), _a = _q.done, !_a; _o = true) {
                                    _c = _q.value;
                                    _o = false;
                                    const yieldNode = _c;
                                    yield yield __await(yieldNode);
                                }
                            }
                            catch (e_6_1) { e_6 = { error: e_6_1 }; }
                            finally {
                                try {
                                    if (!_o && !_a && (_b = _p.return)) yield __await(_b.call(_p));
                                }
                                finally { if (e_6) throw e_6.error; }
                            }
                        }
                        else if ((0, yaml_1.isSeq)(k.value) && cv && cv.is_list) {
                            const nodeList = k.value;
                            for (const item of nodeList.items) {
                                if ((0, yaml_1.isMap)(item) && (0, yaml_1.isScalar)(item.get("id", true)) && cv) {
                                    try {
                                        for (var _r = true, _s = (e_7 = void 0, __asyncValues(this.iterDeclaringIdsInner(idType, item, cv, doc))), _t; _t = yield __await(_s.next()), _d = _t.done, !_d; _r = true) {
                                            _f = _t.value;
                                            _r = false;
                                            const yieldNode = _f;
                                            yield yield __await(yieldNode);
                                        }
                                    }
                                    catch (e_7_1) { e_7 = { error: e_7_1 }; }
                                    finally {
                                        try {
                                            if (!_r && !_d && (_e = _s.return)) yield __await(_e.call(_s));
                                        }
                                        finally { if (e_7) throw e_7.error; }
                                    }
                                }
                            }
                        }
                        if (yield __await(this.isPlatform(componentName))) {
                            // iterate elements and lookup platform to load components
                            const platNode = k.value;
                            if ((0, yaml_1.isSeq)(platNode)) {
                                for (const seqItemNode of platNode.items) {
                                    if ((0, yaml_1.isMap)(seqItemNode)) {
                                        const platCompName = seqItemNode.get("platform");
                                        if (platCompName in component.components) {
                                            const component = yield __await(this.getComponent(platCompName, componentName));
                                            const platCv = component.schemas.CONFIG_SCHEMA;
                                            try {
                                                for (var _u = true, _v = (e_8 = void 0, __asyncValues(this.iterDeclaringIdsInner(idType, seqItemNode, platCv, doc))), _w; _w = yield __await(_v.next()), _g = _w.done, !_g; _u = true) {
                                                    _j = _w.value;
                                                    _u = false;
                                                    const yieldNode = _j;
                                                    yield yield __await(yieldNode);
                                                }
                                            }
                                            catch (e_8_1) { e_8 = { error: e_8_1 }; }
                                            finally {
                                                try {
                                                    if (!_u && !_g && (_h = _v.return)) yield __await(_h.call(_v));
                                                }
                                                finally { if (e_8) throw e_8.error; }
                                            }
                                        }
                                    }
                                }
                            }
                            else if ((0, yaml_1.isMap)(platNode)) {
                                const platCompName = platNode.get("platform");
                                if (platCompName in component.components) {
                                    const component = yield __await(this.getComponent(platCompName, componentName));
                                    const platCv = component.schemas.CONFIG_SCHEMA;
                                    try {
                                        for (var _x = true, _y = (e_9 = void 0, __asyncValues(this.iterDeclaringIdsInner(idType, platNode, platCv, doc))), _z; _z = yield __await(_y.next()), _k = _z.done, !_k; _x = true) {
                                            _m = _z.value;
                                            _x = false;
                                            const yieldNode = _m;
                                            yield yield __await(yieldNode);
                                        }
                                    }
                                    catch (e_9_1) { e_9 = { error: e_9_1 }; }
                                    finally {
                                        try {
                                            if (!_x && !_k && (_l = _y.return)) yield __await(_l.call(_y));
                                        }
                                        finally { if (e_9) throw e_9.error; }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });
    }
    findComponentDefinition(id_type, id, doc) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, e_10, _b, _c;
            try {
                for (var _d = true, _e = __asyncValues(this.iterDeclaringIds(id_type, doc)), _f; _f = yield _e.next(), _a = _f.done, !_a; _d = true) {
                    _c = _f.value;
                    _d = false;
                    const item = _c;
                    if ((0, yaml_1.isScalar)(item) && item.value === id) {
                        return item.range;
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
    getUsableIds(use_id_type, doc) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, e_11, _b, _c;
            const ret = [];
            try {
                for (var _d = true, _e = __asyncValues(this.iterDeclaringIds(use_id_type, doc)), _f; _f = yield _e.next(), _a = _f.done, !_a; _d = true) {
                    _c = _f.value;
                    _d = false;
                    const item = _c;
                    ret.push(item.toString());
                }
            }
            catch (e_11_1) { e_11 = { error: e_11_1 }; }
            finally {
                try {
                    if (!_d && !_a && (_b = _e.return)) yield _b.call(_e);
                }
                finally { if (e_11) throw e_11.error; }
            }
            return ret;
        });
    }
}
exports.ESPHomeSchema = ESPHomeSchema;
//# sourceMappingURL=esphome-schema.js.map