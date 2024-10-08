export interface AppletManifest {
    type: 'applet';
    name: string;
    description: string;
    icon?: string;
    entrypoint: string;
    actions: AppletAction[];
}
export interface AppletAction {
    id: string;
    description: string;
    params?: ActionParamSchema;
}
export interface AppletHeader {
    name: string;
    description: string;
    url: string;
    params: {
        [key: string]: string;
    };
}
export type AppletState = Record<string, Serializable>;
export type ActionParamSchema = Record<string, {
    description: string;
    type: 'string';
}>;
export type ActionParams = Record<string, unknown>;
export type ActionHandlerDict = {
    [key: string]: ActionHandler<any>;
};
export type ActionHandler<T extends ActionParams> = (params: T) => void | Promise<void>;
export type AnyAppletMessage = AppletMessage | AppletStateMessage | AppletActionMessage;
export interface AppletStateMessage<T = any> extends AppletMessage {
    type: 'state';
    state: T;
}
export interface AppletActionMessage<T = any> extends AppletMessage {
    type: 'action';
    actionId: string;
    params: T;
}
export declare class AppletMessage<T = any> {
    type: AppletMessageType;
    id: string;
    timeStamp: number;
    constructor(type: AppletMessageType, values?: T);
    toJson(): {
        [k: string]: any;
    };
    resolve(): void;
}
export type AppletMessageType = 'action' | 'render' | 'state' | 'ready' | 'resolve' | 'resize';
export type AppletMessageCallback = (message: AnyAppletMessage) => void;
type Serializable = string | number | boolean | null | Serializable[] | {
    [key: string]: Serializable;
};
export {};
//# sourceMappingURL=types.d.ts.map