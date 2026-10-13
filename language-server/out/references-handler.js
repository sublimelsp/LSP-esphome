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
exports.ReferencesHandler = void 0;
const yaml_1 = require("yaml");
class ReferencesHandler {
    constructor(documents) {
        this.documents = documents;
    }
    getReferences(uri, position) {
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
                const path = document.getPath(node);
                if (path.length === 1) {
                    return null;
                }
                const cvAndPath = yield document.getConfigVarAndPathNode(path);
                if (cvAndPath === undefined) {
                    return;
                }
                const [cv, pathNode] = cvAndPath;
                const idCv = cv;
                if (idCv.id_type && (0, yaml_1.isScalar)(pathNode)) {
                    const idTypeClass = idCv.id_type.class;
                    const idTypeParents = (_a = idCv.id_type.parents) !== null && _a !== void 0 ? _a : [];
                    const targetId = pathNode.value;
                    // Collect all scalar nodes whose value matches the target id
                    const candidates = [];
                    (0, yaml_1.visit)(document.yaml, (_, visitNode) => {
                        if ((0, yaml_1.isScalar)(visitNode) && visitNode.value === targetId) {
                            candidates.push(visitNode);
                        }
                    });
                    const results = [];
                    for (const candidate of candidates) {
                        const candidatePath = document.getPath(candidate);
                        if (candidatePath.length < 2)
                            continue;
                        try {
                            const result = yield document.getConfigVarAndPathNode(candidatePath);
                            if (!result)
                                continue;
                            const [candidateCv] = result;
                            if (candidateCv.type === "use_id" &&
                                (candidateCv.use_id_type === idTypeClass ||
                                    idTypeParents.includes(candidateCv.use_id_type))) {
                                if (candidate.range) {
                                    results.push({
                                        uri,
                                        range: {
                                            start: document.text.getPosition(candidate.range[0]),
                                            end: document.text.getPosition(candidate.range[0] + targetId.length),
                                        },
                                    });
                                }
                            }
                        }
                        catch (_b) {
                            // skip nodes whose path can't be resolved
                        }
                    }
                    return results;
                }
            }
            catch (error) {
                console.log("References:" + error);
            }
            return null;
        });
    }
}
exports.ReferencesHandler = ReferencesHandler;
//# sourceMappingURL=references-handler.js.map