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
exports.ESPHomeDocuments = exports.ESPHomeDocument = void 0;
const yaml_1 = require("yaml");
const editor_shims_1 = require("./editor-shims");
const objects_1 = require("./utils/objects");
class CommonTagImpl {
    constructor(tag, type) {
        this.default = false;
        this.tag = tag;
        this.type = type;
    }
    get collection() {
        return undefined;
    }
    identify(value) {
        return true;
    }
    resolve(value) {
        return value;
    }
}
class ESPHomeDocument {
    constructor(text) {
        this.text = text;
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
    }
    parse(text) {
        const options = {
            strict: false,
            version: "1.2",
            customTags: [new CommonTagImpl("!secret", "scalar")],
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
        (0, yaml_1.visit)(this.yaml, (key, node) => {
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
    getConfigVarAndPathNode(path) {
        return __awaiter(this, void 0, void 0, function* () {
            let pathNode = this.yaml.contents;
            let cv = undefined;
            for (let index = 0; index < path.length; index++) {
                if ((0, objects_1.isString)(path[index]) && (0, yaml_1.isMap)(pathNode)) {
                    if (cv === undefined && index <= 2 && pathNode.get("platform")) {
                        const componentName = pathNode.get("platform");
                        if ((0, objects_1.isString)(componentName)) {
                            const platformComponents = yield editor_shims_1.coreSchema.getPlatformList();
                            if ((0, objects_1.isString)(path[0]) && path[0] in platformComponents) {
                                const c = yield editor_shims_1.coreSchema.getComponent(path[0]);
                                if (c.components !== undefined && componentName in c.components) {
                                    cv = yield editor_shims_1.coreSchema.getComponentPlatformSchema(componentName, path[0]);
                                }
                            }
                        }
                    }
                    pathNode = pathNode.get(path[index], true);
                    if (cv === undefined) {
                        const rootComponents = yield editor_shims_1.coreSchema.getComponentList();
                        if ((0, objects_1.isString)(path[0]) && path[0] in rootComponents) {
                            cv = (yield editor_shims_1.coreSchema.getComponent(path[0])).schemas.CONFIG_SCHEMA;
                        }
                    }
                    else {
                        const pathIndex = path[index];
                        if ((0, objects_1.isString)(pathIndex)) {
                            if (cv.type === "schema" || cv.type === "trigger") {
                                if (cv.schema !== undefined) {
                                    const schema_cv = yield editor_shims_1.coreSchema.findConfigVar(cv.schema, pathIndex, this.yaml);
                                    if (schema_cv !== undefined) {
                                        cv = schema_cv;
                                        continue;
                                    }
                                }
                                if (cv.type === "trigger") {
                                    if (pathIndex === "then") {
                                        continue;
                                    }
                                    const action = yield editor_shims_1.coreSchema.getActionConfigVar(pathIndex);
                                    if (action !== undefined) {
                                        cv = action;
                                        continue;
                                    }
                                }
                            }
                            if (cv.type === "registry") {
                                cv = yield editor_shims_1.coreSchema.getRegistryConfigVar(cv.registry, pathIndex);
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
}
exports.ESPHomeDocument = ESPHomeDocument;
class ESPHomeDocuments {
    constructor() {
        this.documents = {};
    }
    update(uri, buffer) {
        const doc = this.documents[uri];
        if (doc === undefined) {
            this.documents[uri] = new ESPHomeDocument(buffer);
        }
        else {
            doc.update(buffer);
        }
    }
    getDocument(uri) {
        return this.documents[uri];
    }
}
exports.ESPHomeDocuments = ESPHomeDocuments;
//# sourceMappingURL=esphome-document.js.map