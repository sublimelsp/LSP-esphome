import { MessageTypes } from "./types";
export declare abstract class ESPHomeConnection {
    private handleMessage_;
    abstract sendMessageInternal(msg: any): void;
    sendMessage(msg: any): void;
    abstract connect(): Promise<void>;
    abstract disconnect(): void;
    private _isConnected;
    get isConnected(): boolean;
    protected setIsConnected(v: boolean): void;
    protected handleMessage(msg: MessageTypes): void;
    onResponse(handleMessage: (msg: MessageTypes) => void): void;
}
