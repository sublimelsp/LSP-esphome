import { ESPHomeConnection } from "./connection";
export declare class ESPHomeDashboardConnection extends ESPHomeConnection {
    readonly endPoint: string;
    private ws;
    constructor(endPoint: string);
    sendMessageInternal(msg: any): void;
    connect(): Promise<void>;
    disconnect(): void;
}
