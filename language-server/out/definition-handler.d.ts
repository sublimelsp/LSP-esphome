import { Position } from "./editor-shims";
import { ESPHomeDocuments } from "./esphome-document";
export declare class DefinitionHandler {
    private documents;
    constructor(documents: ESPHomeDocuments);
    getDefinition(uri: string, position: Position): Promise<{
        uri: string;
        range: {
            start: {
                line: number;
                character: number;
            };
            end: {
                line: number;
                character: number;
            };
        };
    } | null | undefined>;
}
