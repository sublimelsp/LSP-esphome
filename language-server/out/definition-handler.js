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
exports.DefinitionHandler = void 0;
const yaml_1 = require("yaml");
const editor_shims_1 = require("./editor-shims");
class DefinitionHandler {
    constructor(documents) {
        this.documents = documents;
    }
    getDefinition(uri, position) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
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
                var path = document.getPath(node);
                // Navigate to !include file target
                let includeFile;
                const parentNode = document.getParent(node);
                const isKeyNode = (0, yaml_1.isPair)(parentNode) && parentNode.key === node;
                if (!isKeyNode &&
                    (0, yaml_1.isScalar)(node) &&
                    typeof node.value === "string" &&
                    (node.tag === "!include" ||
                        (path.length > 2 && path[0] === "packages" && path[2] === "file"))) {
                    includeFile = node.value;
                }
                else if ((0, yaml_1.isMap)(node) && node.tag === "!include") {
                    const fileVal = node.get("file");
                    if (typeof fileVal === "string")
                        includeFile = fileVal;
                }
                if (includeFile) {
                    const targetUri = new URL(includeFile, uri).toString();
                    return {
                        uri: targetUri,
                        range: {
                            start: { line: 0, character: 0 },
                            end: { line: 0, character: 0 },
                        },
                    };
                }
                if (path.length === 1) {
                    return null;
                }
                const cvAndPath = yield document.getConfigVarAndPathNode(path);
                if (cvAndPath === undefined) {
                    return;
                }
                const [cv, pathNode] = cvAndPath;
                let fullCv = yield editor_shims_1.coreSchema.getConfigVarComplete2(cv);
                if (fullCv.type === "schema" && fullCv.maybe !== undefined) {
                    fullCv = yield editor_shims_1.coreSchema.getConfigVarComplete(fullCv.schema, fullCv.maybe);
                }
                if (fullCv.type === "use_id" && (0, yaml_1.isScalar)(pathNode)) {
                    const typeId = fullCv.use_id_type;
                    const targetId = pathNode.value;
                    // Use document method for merged-scope ID search (includes all files)
                    const result = yield document.findComponentDefinition(typeId, targetId);
                    if (!result) {
                        return null;
                    }
                    const { doc: defDoc, range } = result;
                    return {
                        uri: (_a = defDoc.fileUri) !== null && _a !== void 0 ? _a : uri,
                        range: {
                            start: defDoc.text.getPosition(range[0]),
                            end: defDoc.text.getPosition(range[0] + targetId.length),
                        },
                    };
                }
            }
            catch (error) {
                console.log("Definition:" + error);
            }
            return null;
        });
    }
}
exports.DefinitionHandler = DefinitionHandler;
//# sourceMappingURL=definition-handler.js.map