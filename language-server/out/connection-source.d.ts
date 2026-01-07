import { ESPHomeSettings } from "./settings";
import { MessageTypes } from "./types";
import { ESPHomeConnection } from "./connection";
export declare class ESPHomeConnectionSource extends ESPHomeConnection {
    private relay;
    private handleMessageSource_;
    private relayType;
    connect(): Promise<void>;
    disconnect(): void;
    sendMessageInternal(msg: any): void;
    configure(config: ESPHomeSettings): Promise<void>;
    sendMessage(msg: any): void;
    onResponse(handleMessage: (msg: MessageTypes) => void): void;
    private handleRelayResponse;
}
export declare function setVersion(newVersion: string): void;
export declare function version(): Promise<string>;
