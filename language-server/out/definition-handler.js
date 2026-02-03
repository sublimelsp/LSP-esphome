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
                    fullCv = yield editor_shims_1.coreSchema.getConfigVarComplete2(fullCv);
                }
                if (fullCv.type === "use_id" && (0, yaml_1.isScalar)(pathNode)) {
                    const typeId = fullCv.use_id_type;
                    const targetId = pathNode.value;
                    const range = yield editor_shims_1.coreSchema.findComponentDefinition(typeId, targetId, document.yaml);
                    if (!range) {
                        return null;
                    }
                    const definition = {
                        uri: uri,
                        range: {
                            start: document.text.getPosition(range[0]),
                            end: document.text.getPosition(range[0] + targetId.length),
                        },
                    };
                    return definition;
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