import { ActionHandlerDict, AppletState, AppletMessage, AppletMessageType, AppletMessageCallback, ActionParams, ActionHandler } from './types';
/**
 * Context
 */
export declare class AppletContext<StateType = AppletState> extends EventTarget {
    client: AppletClient;
    actionHandlers: ActionHandlerDict;
    state: StateType;
    connect(): this;
    setActionHandler<T extends ActionParams>(actionId: string, handler: ActionHandler<T>): void;
    setState(state: StateType): Promise<void>;
    onload(): Promise<void> | void;
    onready(): Promise<void> | void;
    onrender(): void;
}
/**
 * Client
 */
declare class AppletClient {
    on(messageType: AppletMessageType, callback: AppletMessageCallback): void;
    send(message: AppletMessage): Promise<void>;
}
export declare const appletContext: AppletContext<AppletState>;
export {};
//# sourceMappingURL=context.d.ts.map