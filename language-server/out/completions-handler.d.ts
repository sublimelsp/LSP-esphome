import { Position, CompletionItem } from "./editor-shims";
import { ESPHomeDocuments } from "./esphome-document";
export declare class CompletionsHandler {
    private documents;
    constructor(documents: ESPHomeDocuments);
    private document;
    private docMap;
    private position;
    private lineContent;
    getCompletions(uri: string, position: Position): Promise<CompletionItem[]>;
    private getPlatformNames;
    private getCoreComponents;
    private getChipset;
    private mapHasScalarKey;
    private resolveConfigVar;
    private getConfigVars;
    private resolveSchema;
    private addEnums;
    private resolveTrigger;
    private resolveTriggerInner;
    private addRegistry;
    private resolveRegistryInner;
    private findClosestNode;
    private getIndentation;
    private getProperParentByIndentation;
}
