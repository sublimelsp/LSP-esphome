import { ESPHomeDocuments } from "./esphome-document";
import { Position } from "./editor-shims";
export declare class HoverHandler {
    private documents;
    constructor(documents: ESPHomeDocuments);
    getHover(uri: string, position: Position): Promise<import("vscode-languageserver-types").Hover | undefined>;
}
