import { AppletAction, AppletHeader, AppletMessage, ActionParams, AppletManifest } from './types';
export declare function getHeaders(url: string): Promise<AppletHeader[]>;
export declare function getManifests(url: string): Promise<any[]>;
export declare function load(url: string, container: HTMLIFrameElement): Promise<Applet>;
export declare class Applet<T = unknown> extends EventTarget {
    #private;
    actions: AppletAction[];
    manifest: AppletManifest;
    container: HTMLIFrameElement;
    constructor();
    get state(): T;
    set state(state: T);
    toJson(): {
        [k: string]: any;
    };
    resizeContainer(dimensions: {
        height: number;
        width: number;
    }): void;
    onstateupdated(event: CustomEvent): void;
    disconnect(): void;
    dispatchAction(actionId: string, params: ActionParams): Promise<AppletMessage<any>>;
}
export declare function loadManifest(url: string): Promise<AppletManifest>;
//# sourceMappingURL=client.d.ts.map