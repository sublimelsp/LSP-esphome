import { Diagnostic } from "vscode-languageserver-protocol";
import { TextDocumentChangeEvent } from "vscode-languageserver";
import { TextDocument } from "vscode-languageserver-textdocument";
import { ESPHomeConnection } from "./connection";
import { FileAccessor } from "./file-accessor";
export declare class Validation {
    private fileAccessor;
    private connection;
    private sendDiagnostics;
    lastRequest: Date;
    constructor(fileAccessor: FileAccessor, connection: ESPHomeConnection, sendDiagnostics: (fileUri: string, diagnostics: Diagnostic[]) => void);
    private diagnosticCollection;
    private addError;
    private addIncludeFile;
    private handleEsphomeError;
    private handleYamlError;
    private getUriStringForValidationPath;
    private handleESPHomeMessage;
    private validating_uri;
    private includedFiles;
    onDocumentChange(e: TextDocumentChangeEvent<TextDocument>): void;
}
