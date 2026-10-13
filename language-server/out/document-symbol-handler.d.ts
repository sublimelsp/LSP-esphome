import { DocumentSymbol } from "vscode-languageserver-types";
import { ESPHomeDocuments } from "./esphome-document";
/**
 * Handles the extraction and parsing of {@linkcode DocumentSymbol}s from {@linkcode ESPHomeDocument}s
 * such that they can be used for ***navigation***, ***outline view*** and ***symbol search***. Parses the
 * hierarchical yaml content and converts it into LSP-compliant {@linkcode DocumentSymbol}s.
 */
export declare class DocumentSymbolHandler {
    private documents;
    constructor(documents: ESPHomeDocuments);
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
    getDocumentSymbols(uri: string): DocumentSymbol[];
    /**
     * Delegates the parsing logic to the appropriate function based on the node's type (`Map` or `Sequence`)
     * @param doc - The {@linkcode ESPHomeDocument} being processed
     * @param node - The yaml node to parse
     * @returns An array of {@linkcode DocumentSymbol} extracted from the node
     */
    private parseNode;
    /**
     * Creates a document symbol from a yaml key-value pair.
     * @param doc - The {@linkcode ESPHomeDocument} to determine the {@linkcode Range}
     * @param pair - The yaml key-value {@linkcode Pair} to parse into a {@linkcode DocumentSymbol}
     * @returns A {@linkcode DocumentSymbol} object representing the pair, or `null` if the pair key is not a scalar value
     */
    private createSymbol;
    /**
     * Creates a {@link DocumentSymbol document symbol} for an item within a {@link YAMLSeq YAML sequence}.
     * @param doc - The {@linkcode ESPHomeDocument} being processed
     * @param node - The {@link YAMLSeq YAML sequence} node containing the item
     * @param index - The index of the item within the sequence
     * @returns A {@linkcode DocumentSymbol} representing the sequence item, or `null` if the item doesn't exist
     */
    private createSequenceSymbol;
    /**
     * Converts a yaml node's {@linkcode YamlRange Range} to a LSP {@linkcode Range} object.
     * @param doc - The {@linkcode ESPHomeDocument} containing {@linkcode Position} information.
     * @param node - The yaml {@linkcode Node} in question
     * @returns A {@linkcode Range} object with {@linkcode Range.start start} and {@linkcode Range.end end} positions.
     *          Returns a zero-length range at the beginning of the document if the node has no range information.
     */
    private getRange;
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
    private getIdentifier;
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
    private readonly keyToSymbolMap;
    /**
     * Determines the appropriate {@linkcode SymbolKind} for a given node based on its name and structure.
     * @param name - The name of the symbol
     * @param node - The YAML node to analyze
     * @returns The determined {@linkcode SymbolKind} for the given node
     */
    private getSymbolKind;
}
