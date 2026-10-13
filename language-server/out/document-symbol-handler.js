"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentSymbolHandler = void 0;
const vscode_languageserver_types_1 = require("vscode-languageserver-types");
const yaml_1 = require("yaml");
/**
 * Handles the extraction and parsing of {@linkcode DocumentSymbol}s from {@linkcode ESPHomeDocument}s
 * such that they can be used for ***navigation***, ***outline view*** and ***symbol search***. Parses the
 * hierarchical yaml content and converts it into LSP-compliant {@linkcode DocumentSymbol}s.
 */
class DocumentSymbolHandler {
    constructor(documents) {
        this.documents = documents;
        // SYMBOLS MAP
        // -----------
        /**
         * Maps ESPHome configuration keys to their corresponding symbol kinds for document symbol representation.
         *
         * This map categorizes various ESPHome YAML configuration options by logical type:
         * - **Classes**: Core components like esphome, esp32, esp8266, logger, ota, and time
         * - **Interfaces**: Communication protocols and services (wifi, api, web_server, mqtt, ethernet, captive_portal, i2c, spi)
         * - **Constants**: Connection parameters (ssid, password, port, host)
         * - **Functions**: Executable blocks (action, lambda)
         * - **Events**: Triggered actions (script, update_interval)
         * - **Classes**: Hardware interfaces (sensor, switch, light, binary_sensor, fan, display)
         * - **Fields**: Common attributes (id, name, pin)
         * - etc.
         */
        this.keyToSymbolMap = new Map([
            // Core components
            ...['esphome', 'esp32', 'esp8266',
                'logger', 'ota', 'time',
                'sensor', 'switch', 'light', 'binary_sensor', 'fan', 'display']
                .map(k => [k, vscode_languageserver_types_1.SymbolKind.Class]),
            // Communication protocols
            ...['wifi', 'api', 'web_server', 'mqtt', 'ethernet', 'captive_portal',
                'i2c', 'spi', 'pin']
                .map(k => [k, vscode_languageserver_types_1.SymbolKind.Interface]),
            // Constants
            ...['ssid', 'password', 'port', 'host']
                .map(k => [k, vscode_languageserver_types_1.SymbolKind.Constant]),
            // Functions
            ...['action', 'lambda']
                .map(k => [k, vscode_languageserver_types_1.SymbolKind.Function]),
            // Events
            ...['script', 'update_interval']
                .map(k => [k, vscode_languageserver_types_1.SymbolKind.Event]),
            // Enums
            ['board', vscode_languageserver_types_1.SymbolKind.Enum],
            // Enum members
            ...['type', 'platform']
                .map(k => [k, vscode_languageserver_types_1.SymbolKind.EnumMember]),
            // Fields
            ...['id', 'name']
                .map(k => [k, vscode_languageserver_types_1.SymbolKind.Field]),
            // Others
            ['substitutions', vscode_languageserver_types_1.SymbolKind.Namespace],
            ['packages', vscode_languageserver_types_1.SymbolKind.Package],
            ['widgets', vscode_languageserver_types_1.SymbolKind.Struct],
            ['font', vscode_languageserver_types_1.SymbolKind.TypeParameter],
        ]);
    }
    /**
     * Retrieves {@link DocumentSymbol document symbols} for the given document URI
     *
     * Parses and extracts all symbols (such as sections, keys, and their hierarchical relationships)
     * that can be displayed in the ***document outline*** or ***symbol navigator***.
     *
     * @param uri - The document URI to extract symbols from
     * @returns An array of {@linkcode DocumentSymbol} objects
     *          representing the structure of the document.
     *          Returns an empty array if the document is _not found_, has _no yaml content_,
     *          or if an _error occurs during parsing_.
     */
    getDocumentSymbols(uri) {
        try {
            const doc = this.documents.getDocument(uri);
            if (!doc || !doc.yaml || !doc.yaml.contents) {
                return [];
            }
            return this.parseNode(doc, doc.yaml.contents);
        }
        catch (error) {
            console.error(`Failed to get document symbols for ${uri}:`, error);
        }
        return [];
    }
    /**
     * Delegates the parsing logic to the appropriate function based on the node's type (`Map` or `Sequence`)
     * @param doc - The {@linkcode ESPHomeDocument} being processed
     * @param node - The yaml node to parse
     * @returns An array of {@linkcode DocumentSymbol} extracted from the node
     */
    parseNode(doc, node) {
        const symbols = [];
        if ((0, yaml_1.isMap)(node)) {
            for (const item of node.items) {
                const symbol = this.createSymbol(doc, item);
                if (symbol) {
                    symbols.push(symbol);
                }
            }
        }
        else if ((0, yaml_1.isSeq)(node)) {
            for (let index = 0; index < node.items.length; index++) {
                const symbol = this.createSequenceSymbol(doc, node, index);
                if (symbol) {
                    symbols.push(symbol);
                }
            }
        }
        return symbols;
    }
    /**
     * Creates a document symbol from a yaml key-value pair.
     * @param doc - The {@linkcode ESPHomeDocument} to determine the {@linkcode Range}
     * @param pair - The yaml key-value {@linkcode Pair} to parse into a {@linkcode DocumentSymbol}
     * @returns A {@linkcode DocumentSymbol} object representing the pair, or `null` if the pair key is not a scalar value
     */
    createSymbol(doc, pair) {
        if (!(0, yaml_1.isScalar)(pair.key)) {
            return null;
        }
        const keyNode = pair.key;
        const valueNode = pair.value;
        if (!keyNode || !valueNode) {
            return null;
        }
        const name = pair.key.value;
        let kind = this.getSymbolKind(name, valueNode);
        let detail = "";
        let children = [];
        const keyRange = this.getRange(doc, keyNode);
        let fullRange = keyRange; // Default to keyRange, but expand to include value if possible
        if (valueNode.range) {
            fullRange = {
                start: keyRange.start,
                end: doc.text.getPosition(valueNode.range[1])
            };
        }
        if ((0, yaml_1.isScalar)(valueNode)) {
            detail = String(valueNode.value);
        }
        else {
            children = this.parseNode(doc, valueNode);
        }
        return vscode_languageserver_types_1.DocumentSymbol.create(name, detail, kind, fullRange, keyRange, children);
    }
    /**
     * Creates a {@link DocumentSymbol document symbol} for an item within a {@link YAMLSeq YAML sequence}.
     * @param doc - The {@linkcode ESPHomeDocument} being processed
     * @param node - The {@link YAMLSeq YAML sequence} node containing the item
     * @param index - The index of the item within the sequence
     * @returns A {@linkcode DocumentSymbol} representing the sequence item, or `null` if the item doesn't exist
     */
    createSequenceSymbol(doc, node, index) {
        var _a;
        const item = node.items[index];
        if (!item) {
            return null;
        }
        let name = (_a = this.getIdentifier(item)) !== null && _a !== void 0 ? _a : `[${index}]`;
        let kind = this.getSymbolKind(name, item);
        const range = this.getRange(doc, item);
        let selectionRange = range;
        const detail = "";
        const children = this.parseNode(doc, item); // Recursively parse children, if any
        return vscode_languageserver_types_1.DocumentSymbol.create(name, detail, kind, range, selectionRange, children);
    }
    // HELPER FUNCTIONS
    // ----------------
    /**
     * Converts a yaml node's {@linkcode YamlRange Range} to a LSP {@linkcode Range} object.
     * @param doc - The {@linkcode ESPHomeDocument} containing {@linkcode Position} information.
     * @param node - The yaml {@linkcode Node} in question
     * @returns A {@linkcode Range} object with {@linkcode Range.start start} and {@linkcode Range.end end} positions.
     *          Returns a zero-length range at the beginning of the document if the node has no range information.
     */
    getRange(doc, node) {
        if (!node.range) {
            return {
                start: { line: 0, character: 0 },
                end: { line: 0, character: 0 }
            };
        }
        return {
            start: doc.text.getPosition(node.range[0]),
            end: doc.text.getPosition(node.range[1])
        };
    }
    /**
     * Extracts an identifier from a YAML node
     *
     * - For scalar nodes, returns the string value of the node as is.
     * - For map nodes, searches for a pair with key `id`, `name`, or `platform`.
     *   Returns the value of the **first** matching key it encounters in the YAML map order.
     *
     * @param node - The YAML node to extract an identifier from
     * @returns The identifier as a string, or undefined if no identifier could be extracted
     */
    getIdentifier(node) {
        if ((0, yaml_1.isScalar)(node)) {
            return String(node.value);
        }
        else if ((0, yaml_1.isMap)(node)) {
            const idPair = node.items.find(item => (0, yaml_1.isScalar)(item.key) && ['id', 'name', 'platform'].includes(item.key.value));
            if (idPair && (0, yaml_1.isScalar)(idPair.value)) {
                return String(idPair.value.value);
            }
        }
    }
    /**
     * Determines the appropriate {@linkcode SymbolKind} for a given node based on its name and structure.
     * @param name - The name of the symbol
     * @param node - The YAML node to analyze
     * @returns The determined {@linkcode SymbolKind} for the given node
     */
    getSymbolKind(name, node) {
        // If the name starts with "on_", consider it an `Event`
        if (name.startsWith("on_")) {
            return vscode_languageserver_types_1.SymbolKind.Event;
        }
        // Lookup special key-names in the map
        if (this.keyToSymbolMap.has(name)) {
            return this.keyToSymbolMap.get(name);
        }
        // If not special, fallback to the node's value's type
        if ((0, yaml_1.isMap)(node)) {
            return vscode_languageserver_types_1.SymbolKind.Object;
        }
        else if ((0, yaml_1.isSeq)(node)) {
            return vscode_languageserver_types_1.SymbolKind.Array;
        }
        else if ((0, yaml_1.isScalar)(node)) {
            switch (typeof node.value) {
                case 'string':
                    return vscode_languageserver_types_1.SymbolKind.String;
                case 'number':
                    return vscode_languageserver_types_1.SymbolKind.Number;
                case 'boolean':
                    return vscode_languageserver_types_1.SymbolKind.Boolean;
                default:
                    return vscode_languageserver_types_1.SymbolKind.Variable;
            }
        }
        // Default fallback
        return vscode_languageserver_types_1.SymbolKind.Field;
    }
}
exports.DocumentSymbolHandler = DocumentSymbolHandler;
//# sourceMappingURL=document-symbol-handler.js.map