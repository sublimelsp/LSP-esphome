import { YAMLMap } from "yaml";
export interface SchemaSet {
    [name: string]: Component;
    core: CoreComponent;
}
interface ConfigVarBase {
    key: string;
    is_list?: boolean;
    docs?: string;
    maybe?: string;
    templatable?: boolean;
}
export interface ConfigVarRegistry extends ConfigVarBase {
    type: "registry";
    registry: ComponentRegistry;
    filter?: string[];
}
export interface ConfigVarTrigger extends ConfigVarBase {
    type: "trigger";
    schema: Schema | undefined;
    has_required_var: Boolean;
}
export interface ConfigVarEnum extends ConfigVarBase {
    type: "enum";
    values: {
        [key: string]: {
            docs: string;
        } | null;
    };
    default?: string;
}
export interface ConfigVarSchema extends ConfigVarBase {
    type: "schema";
    schema: Schema;
    maybe?: string;
}
export interface ConfigVarTyped extends ConfigVarBase {
    type: "typed";
    typed_key: string;
    types: {
        [name: string]: Schema;
    };
}
export interface ConfigVarPin extends ConfigVarBase {
    type: "pin";
    schema: Boolean;
    internal: Boolean;
    modes: ("output" | "input" | "pullup")[];
}
interface ConfigVarBoolean extends ConfigVarBase {
    type: "boolean";
    default: string;
}
interface ConfigVarString extends ConfigVarBase {
    type: "string" | "integer";
    default?: string;
}
export interface ConfigVarUseId extends ConfigVarBase {
    type: "use_id";
    use_id_type: string;
}
export interface ConfigVarId {
    id_type: {
        class: string;
        parents: string[];
    };
}
export type ConfigVar = ConfigVarSchema | ConfigVarRegistry | ConfigVarEnum | ConfigVarTrigger | ConfigVarTyped | ConfigVarPin | ConfigVarBoolean | ConfigVarString | ConfigVarUseId;
interface ConfigVars {
    [name: string]: ConfigVar | undefined;
    id?: ConfigVar & ConfigVarId;
}
export interface Schema {
    config_vars: ConfigVars;
    extends: string[];
}
export interface Registry {
    [name: string]: ConfigVar;
}
export type ComponentRegistry = "action" | "condition" | "filter" | "effects";
export interface Component {
    schemas: {
        [name: string]: ConfigVar;
        CONFIG_SCHEMA: ConfigVarSchema;
    };
    components: {
        [name: string]: {
            docs?: string;
        };
    };
    action: Registry;
    condition: Registry;
    filter: Registry;
    effects: Registry;
    pin?: ConfigVar;
    /**
     * Set when this component is loaded as a platform-specific entry
     * (e.g. template loaded as sensor platform → platform = "sensor").
     * Used to build the correct action name: sensor.template.publish.
     */
    platform?: string;
}
interface CoreComponent extends Component {
    platforms: {
        [name: string]: {
            docs?: string;
        };
    };
    components: {
        [name: string]: {
            docs?: string;
            dependencies?: string[];
        };
    };
    pins: string[];
}
export declare class ESPHomeSchema {
    private schemaLoader;
    schema: SchemaSet | undefined;
    loaded_schemas: string[];
    constructor(schemaLoader: (schemaName: string) => Promise<any>);
    getSchema(): Promise<SchemaSet>;
    getPlatformList(): Promise<{
        [name: string]: {
            docs?: string;
        };
    }>;
    getComponentList(): Promise<{
        [name: string]: {
            docs?: string;
            dependencies?: string[];
        };
    }>;
    getComponent(domain: string, platform?: string | null): Promise<Component>;
    getComponentSchema(domain: string): Promise<ConfigVar>;
    getComponentPlatformSchema(domain: string, platform: string): Promise<ConfigVar>;
    getExtendedConfigVar(name: string): Promise<ConfigVar>;
    isPlatform(name: string): Promise<boolean>;
    /**
     * Iterate config vars for a schema. Accepts an optional YAMLMap from the
     * current document to enable context-aware filtering (e.g. MQTT props).
     */
    iterConfigVars(schema: Schema, docMap?: YAMLMap, yielded?: string[]): AsyncGenerator<[string, ConfigVar]>;
    findConfigVar(schema: Schema, prop: string, docMap?: YAMLMap): Promise<ConfigVar | undefined>;
    getConfigVarComplete(schema: Schema, key: string): Promise<ConfigVar>;
    getConfigVarComplete2(cv: ConfigVar): Promise<ConfigVar>;
    /**
     * Iterate a domain-specific registry (registry must contain ".").
     * E.g. "sensor.filter" yields all sensor filters.
     */
    getDomainRegistry(domainRegistry: string): AsyncGenerator<[string, ConfigVar]>;
    getRegistryConfigVar(registry: string, entry: string): Promise<ConfigVar | undefined>;
    isRegistry(name: string): name is ComponentRegistry;
    getActionConfigVar(entry: string): Promise<ConfigVarTrigger>;
    getPinConfigVar(component: string): Promise<ConfigVar>;
    getPins(): Promise<string[]>;
}
export {};
