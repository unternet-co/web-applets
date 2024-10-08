"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppletMessage = void 0;
class AppletMessage {
    constructor(type, values) {
        this.timeStamp = Date.now();
        this.type = type;
        this.id = crypto.randomUUID();
        if (values)
            Object.assign(this, values);
    }
    toJson() {
        return Object.fromEntries(Object.entries(this).filter(([_, value]) => {
            try {
                JSON.stringify(value);
                return true;
            }
            catch (_a) {
                return false;
            }
        }));
    }
    resolve() { }
}
exports.AppletMessage = AppletMessage;
