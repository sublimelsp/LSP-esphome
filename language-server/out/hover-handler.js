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
exports.HoverHandler = void 0;
const yaml_1 = require("yaml");
const editor_shims_1 = require("./editor-shims");
const objects_1 = require("./utils/objects");
class HoverHandler {
    constructor(documents) {
        this.documents = documents;
    }
    getHover(uri, position) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            try {
                const document = this.documents.getDocument(uri);
                const lineContent = document.text.getLineContent(position.line);
                if (lineContent.trim().length === 0) {
                    return;
                }
                const offset = document.text.offsetAt(position);
                const node = document.getNodeFromOffset(offset);
                if (!node)
                    return;
                let startPos = (_a = node.range) === null || _a === void 0 ? void 0 : _a[0];
                if (node.tag) {
                    startPos -= node.tag.length + 1;
                }
                const range = {
                    start: document.text.getPosition(startPos),
                    end: document.text.getPosition((_b = node.range) === null || _b === void 0 ? void 0 : _b[1]),
                };
                var path = document.getPath(node);
                if (path.length === 1) {
                    const rootComponents = yield editor_shims_1.coreSchema.getComponentList();
                    if (path[0] in rootComponents) {
                        const docs = rootComponents[path[0]].docs;
                        if (docs) {
                            return (0, editor_shims_1.createHover)(docs, range);
                        }
                    }
                    const platformComponents = yield editor_shims_1.coreSchema.getPlatformList();
                    if (path[0] in platformComponents) {
                        const docs = platformComponents[path[0]].docs;
                        if (docs) {
                            return (0, editor_shims_1.createHover)(docs, range);
                        }
                    }
                    return;
                }
                const cvAndPath = yield document.getConfigVarAndPathNode(path);
                if (cvAndPath === undefined) {
                    return;
                }
                const [cv, pathNode] = cvAndPath;
                let content = undefined;
                if (cv !== undefined) {
                    content = cv.docs;
                    if (content === undefined &&
                        path.length === 3 &&
                        path[2] === "platform" &&
                        (0, yaml_1.isScalar)(pathNode) &&
                        (0, objects_1.isString)(path[0])) {
                        content = (yield editor_shims_1.coreSchema.getComponent(path[0])).components[pathNode.value].docs;
                    }
                    if (content) {
                        return (0, editor_shims_1.createHover)(content, range);
                    }
                }
                return;
            }
            catch (error) {
                console.log("Hover:" + error);
            }
            return;
        });
    }
}
exports.HoverHandler = HoverHandler;
//# sourceMappingURL=hover-handler.js.map