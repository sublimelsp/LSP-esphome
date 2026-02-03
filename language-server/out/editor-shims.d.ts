import { Hover, Range, CompletionItem, CompletionItemKind } from "vscode-languageserver-types";
import { ESPHomeSchema } from "./esphome-schema";
export { Position, Range, CompletionItem, CompletionItemKind, } from "vscode-languageserver-types";
export declare const coreSchema: ESPHomeSchema;
export declare const createHover: (contents: string, range: Range) => Hover;
export declare const createCompletion: (label: string, insertText: string, kind: CompletionItemKind, documentation?: string | undefined, triggerSuggest?: boolean, preselect?: boolean, snippet?: boolean, sortText?: string, detail?: string) => CompletionItem;
export declare const createCompletionSnippet: (label: string, insertText: string, kind: CompletionItemKind, documentation?: string | undefined) => CompletionItem;
