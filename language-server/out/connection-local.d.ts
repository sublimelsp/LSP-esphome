import { ESPHomeConnection } from "./connection";
export declare class ESPHomeLocalConnection extends ESPHomeConnection {
    private pythonPath?;
    private process;
    private killed;
    private command?;
    constructor(pythonPath?: string | undefined);
    sendMessageInternal(msg: any): void;
    initialize_command(): Promise<string | undefined>;
    connect(): Promise<void>;
    disconnect(): void;
}
