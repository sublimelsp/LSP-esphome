import { Document, Node } from "yaml";
import { Range } from "yaml/dist/nodes/Node";
import { Component, ConfigVar, ESPHomeSchema, Schema } from "./esphome-schema";
import { TextBuffer } from "./utils/text-buffer";
/**
 * Represents a single ESPHome YAML file with its parsed content.
 * The schema is injected so it can be shared across documents.
 *
 * Scope distinction:
 * - "local" scope: only this file's YAML (e.g. for deduplicating root keys,
 *    since YAML does not allow duplicate keys in the same file)
 * - "merged" scope: this file + all included files (e.g. for ID lookups,
 *    since ESPHome merges all dicts from included files at runtime)
 */
export declare class ESPHomeDocument {
    text: TextBuffer;
    private schema;
    /** Absolute URI/path for resolving relative includes */
    fileUri?: string | undefined;
    yaml: Document;
    bufferText?: string;
    /** Documents loaded from !include / packages references */
    private includedDocuments;
    constructor(text: TextBuffer, schema: ESPHomeSchema, 
    /** Absolute URI/path for resolving relative includes */
    fileUri?: string | undefined);
    update(buffer: TextBuffer): void;
    private parse;
    getParent(nodeToFind: Node): Node | undefined;
    getPath(node: Node): (number | string)[];
    getNodeFromOffset(offset: number): Node | undefined;
    /**
     * Walk the path through YAML and schema simultaneously, returning the
     * ConfigVar and YAML node at the end of the path.
     */
    getConfigVarAndPathNode(path: (string | number)[]): Promise<[ConfigVar, Node] | undefined>;
    /**
     * Iterate config vars for a schema using this document's local YAML for
     * context-aware filtering (e.g. MQTT props hidden when mqtt not present).
     * Use this for completions that operate on the current file.
     */
    iterConfigVars(schema: Schema, yielded?: string[]): AsyncGenerator<[string, ConfigVar]>;
    /**
     * Find a config var by name within a schema, using local document context.
     */
    findConfigVar(schema: Schema, prop: string): Promise<ConfigVar | undefined>;
    /**
     * Iterate components used in a single YAML document, contributing results
     * into the shared `yieldedComponents` / `addPollingComponent` state so that
     * callers can merge multiple documents without duplicates.
     */
    private iterSingleYamlComponents;
    /**
     * Iterate all components actively used across this file AND all included
     * files (merged scope). Deduplicates by component name so each component is
     * yielded only once even if it appears in multiple files.
     *
     * Used for:
     *   - determining available action/condition/filter registries
     *   - detecting PollingComponent for component.update
     */
    getDocComponents(): AsyncGenerator<[string, Component, Node?]>;
    /**
     * Iterate registry entries available in this document (merged scope).
     *
     * - For domain-specific registries (e.g. "sensor.filter"): pure schema lookup.
     * - For global registries (e.g. "action", "condition"): uses getDocComponents()
     *   which already covers this file and all included files.
     */
    getRegistry(registry: string): AsyncGenerator<[string, ConfigVar]>;
    private iterDeclaringIdsInner;
    /**
     * Iterate all YAML nodes that declare an ID matching `idType` in a single
     * parsed YAML document.
     */
    private iterDeclaringIdsInDoc;
    /**
     * Iterate all nodes declaring an ID of `idType` across this file AND all
     * included files (merged scope). Yields [owning document, node] pairs so
     * callers can determine which file the declaration lives in.
     */
    iterDeclaringIds(idType: string): AsyncGenerator<[ESPHomeDocument, Node]>;
    /**
     * Get all usable IDs of a given type across this document and its includes.
     * Use this for `use_id` completions — needs merged scope.
     */
    getUsableIds(use_id_type: string): Promise<string[]>;
    /**
     * Find an ID declaration across this document and its includes.
     * Returns the owning document and YAML range for goto-definition.
     */
    findComponentDefinition(id_type: string, id: string): Promise<{
        doc: ESPHomeDocument;
        range: Range;
    } | null | undefined>;
    /**
     * Returns all documents in the merged set: this document first, then any
     * loaded included documents.
     */
    getAllDocuments(): ESPHomeDocument[];
    /**
     * Extract relative file paths referenced by !include tags and the packages:
     * section in this document's YAML.
     */
    getIncludeUris(): string[];
    /**
     * Load included files using the provided loader and attach them to this
     * document. Called by ESPHomeDocuments when a document is updated.
     *
     * Included documents share the same schema instance.
     */
    loadIncludes(loader: (relativePath: string, baseUri: string) => Promise<string | undefined>): Promise<void>;
}
export declare class ESPHomeDocuments {
    private schema;
    private documents;
    private fileLoader?;
    constructor(schema: ESPHomeSchema);
    setFileLoader(loader: (relativePath: string, baseUri: string) => Promise<string | undefined>): void;
    update(uri: string, buffer: TextBuffer): Promise<void>;
    getDocument(uri: string): ESPHomeDocument;
}
