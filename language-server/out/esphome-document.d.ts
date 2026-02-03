import { Document, Node } from "yaml";
import { ConfigVar } from "./esphome-schema";
import { TextBuffer } from "./utils/text-buffer";
export declare class ESPHomeDocument {
    text: TextBuffer;
    yaml: Document;
    bufferText?: string;
    constructor(text: TextBuffer);
    update(buffer: TextBuffer): void;
    private parse;
    getParent(nodeToFind: Node): Node | undefined;
    getPath(node: Node): (number | string)[];
    getNodeFromOffset(offset: number): Node | undefined;
    getConfigVarAndPathNode(path: (string | number)[]): Promise<[ConfigVar, Node] | undefined>;
}
export declare class ESPHomeDocuments {
    private documents;
    update(uri: string, buffer: TextBuffer): void;
    getDocument(uri: string): ESPHomeDocument;
}
