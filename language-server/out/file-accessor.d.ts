import { TextDocuments } from "vscode-languageserver";
import { TextDocument } from "vscode-languageserver-textdocument";
export interface FileAccessor {
    checkPathExists(uri: string): Promise<boolean>;
    getFileContents(fileName: string): Promise<string>;
    getFilesInFolder(subFolder: string): string[];
    getFilesInFolderRelativeFrom(subFolder: string, relativeFrom: string): string[];
    getFilesInFolderRelativeFromAsFileUri(subFolder: string, relativeFrom: string): string[];
    getRelativePath(relativeFrom: string, filename: string): string;
    getRelativePathAsFileUri(relativeFrom: string, filename: string): string;
}
export declare class VsCodeFileAccessor implements FileAccessor {
    private documents;
    private ourRoot;
    constructor(documents: TextDocuments<TextDocument>);
    checkPathExists(uri: string): Promise<boolean>;
    getFileContents(uri: string): Promise<string>;
    getFilesInFolder(subFolder: string, file_list?: string[]): string[];
    private dealtWithRelativeFrom;
    getFilesInFolderRelativeFrom(subFolder: string, relativeFrom: string): string[];
    getFilesInFolderRelativeFromAsFileUri(subFolder: string, relativeFrom: string): string[];
    getRelativePath: (relativeFrom: string, filename: string) => string;
    getRelativePathAsFileUri: (relativeFrom: string, filename: string) => string;
}
