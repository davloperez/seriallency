import { EventEmitter } from "events";
import { SeriallencyQueueItem } from "./SeriallencyQueueItem";
import { SeriallencyItem } from "./SeriallencyItem";

export class Seriallency extends EventEmitter {
    private queues: {
        [key: string]: SeriallencyQueueItem[]
    };
    private inProcess: {
        [key: string]: SeriallencyQueueItem
    }
    constructor() {
        super();
        this.queues = {};
        this.inProcess = {};
    }

    public getQuantityProcessing(): number {
        return Object.keys(this.inProcess).length;
    }

    public getQueueSize(serializeBy?: string): number {
        if (typeof serializeBy === 'undefined') {
            return Object.keys(this.queues).reduce((prev, key) => prev + this.queues[key].length, 0);
        } else if (serializeBy in this.queues) {
            return this.queues[serializeBy].length;
        } else {
            return 0;
        }
    }

    public push(item: SeriallencyItem): void {
        if (typeof item !== 'object') {
            throw new Error('"item" to serialize must be an object');
        }
        if (typeof item.serializeBy !== 'string' || item.serializeBy.length === 0) {
            throw new Error('"item.serializeBy" must be a valid string');
        }
        if (typeof item.fn !== 'function') {
            throw new Error('"fn" must be a function');
        }
        if (!Array.isArray(item.params)) {
            item.params = (typeof item.params === 'undefined') ? [] : [item.params];
        }
        if (typeof this.queues[item.serializeBy] === 'undefined') {
            this.queues[item.serializeBy] = [];
        }
        this.queues[item.serializeBy].push(item);
        this.proceed(item.serializeBy);
    }

    private proceed(serializeBy: string): void {
        if (typeof this.inProcess[serializeBy] === 'undefined' && typeof this.queues[serializeBy] !== 'undefined') {
            let item = this.queues[serializeBy].splice(0, 1)[0];
            if (this.queues[serializeBy].length === 0) {
                delete this.queues[serializeBy];
            }
            this.inProcess[serializeBy] = item;
            Promise.resolve(item.fn.apply(item.thisObj, item.params))
                .then(this.onPromiseResolved.bind(this, item), this.onPromiseRejected.bind(this, item));
        }
    }

    private onPromiseResolved(item: SeriallencyQueueItem, result: any): void {
        delete this.inProcess[item.serializeBy];
        this.proceed(item.serializeBy);
        this.emit('resolved', result, item);
    }

    private onPromiseRejected(item: SeriallencyQueueItem, reason: any): void {
        delete this.inProcess[item.serializeBy];
        this.proceed(item.serializeBy);
        this.emit('rejected', reason, item);
    }
}