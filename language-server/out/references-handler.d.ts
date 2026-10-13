import { Position } from "./editor-shims";
import { ESPHomeDocuments } from "./esphome-document";
export declare class ReferencesHandler {
    private documents;
    constructor(documents: ESPHomeDocuments);
    getReferences(uri: string, position: Position): Promise<{
        uri: string;
        range: {
            start: Position;
            end: Position;
        };
    }[] | null | undefined>;
}
