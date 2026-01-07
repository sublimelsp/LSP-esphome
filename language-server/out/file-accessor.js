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
exports.VsCodeFileAccessor = void 0;
const fs = require("fs");
const path = require("path");
const vscodeUri = require("vscode-uri");
class VsCodeFileAccessor {
    constructor(documents) {
        this.documents = documents;
        this.dealtWithRelativeFrom = (relativeFrom) => {
            if (relativeFrom.startsWith("file://")) {
                relativeFrom = vscodeUri.URI.parse(relativeFrom).fsPath;
            }
            else {
                if (!relativeFrom.startsWith(this.ourRoot)) {
                    relativeFrom = path.resolve(relativeFrom);
                }
                relativeFrom = vscodeUri.URI.file(relativeFrom).fsPath;
            }
            return relativeFrom;
        };
        this.getRelativePath = (relativeFrom, filename) => {
            relativeFrom = this.dealtWithRelativeFrom(relativeFrom);
            const dirOfFile = path.dirname(relativeFrom);
            const joinedPath = path.join(dirOfFile, filename);
            return joinedPath;
        };
        this.getRelativePathAsFileUri = (relativeFrom, filename) => {
            return vscodeUri.URI.file(this.getRelativePath(relativeFrom, filename)).toString();
        };
        this.ourRoot = path.resolve();
    }
    checkPathExists(uri) {
        return __awaiter(this, void 0, void 0, function* () {
            const fsPath = vscodeUri.URI.parse(uri).fsPath;
            return new Promise((c) => {
                fs.exists(fsPath, (exists) => {
                    c(exists);
                });
            });
        });
    }
    getFileContents(uri) {
        return __awaiter(this, void 0, void 0, function* () {
            const textDocument = this.documents.get(uri);
            if (textDocument) {
                // open file in editor, might not be saved yet
                return textDocument.getText();
            }
            const fsPath = vscodeUri.URI.parse(uri).fsPath;
            return new Promise((c, e) => {
                fs.exists(fsPath, (exists) => {
                    if (!exists) {
                        e("File does not exist");
                    }
                    fs.readFile(fsPath, { encoding: "utf-8" }, (err, result) => {
                        if (err) {
                            e(err);
                        }
                        else {
                            c(result);
                        }
                    });
                });
            });
        });
    }
    getFilesInFolder(subFolder, file_list = []) {
        subFolder = path.normalize(subFolder);
        try {
            fs.readdirSync(subFolder).forEach((file) => {
                file_list = fs.statSync(path.join(subFolder, file)).isDirectory()
                    ? this.getFilesInFolder(path.join(subFolder, file), file_list)
                    : file_list.concat(path.join(subFolder, file));
            });
        }
        catch (err) {
            console.log(`Cannot find the files in folder ${subFolder}`);
        }
        return file_list;
    }
    getFilesInFolderRelativeFrom(subFolder, relativeFrom) {
        relativeFrom = this.dealtWithRelativeFrom(relativeFrom);
        const dirOfFile = path.dirname(relativeFrom);
        subFolder = path.join(dirOfFile, subFolder);
        return this.getFilesInFolder(subFolder);
    }
    getFilesInFolderRelativeFromAsFileUri(subFolder, relativeFrom) {
        const files = this.getFilesInFolderRelativeFrom(subFolder, relativeFrom);
        return files.map((f) => vscodeUri.URI.file(f).toString());
    }
}
exports.VsCodeFileAccessor = VsCodeFileAccessor;
//# sourceMappingURL=file-accessor.js.map