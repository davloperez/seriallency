import { EventEmitter } from "events";
import { SeriallencyQueueItem } from "./SeriallencyQueueItem";
import { SeriallencyItem } from "./SeriallencyItem";

/**
 * Use this class to serialize a bunch of promises acording to a specific field. Like a in-memory-queue,
 * Seriallency instances store internally the functions reference and params of returning-promise functions
 * that must be execute one after another in some cases, but concurrently in others.
 *
 * @export
 * @class Seriallency
 * @extends {EventEmitter}
 */
export class Seriallency extends EventEmitter {
    private queues: {
        [key: string]: SeriallencyQueueItem[]
    };
    private inProcess: {
        [key: string]: SeriallencyQueueItem
    };
    /**
     * Creates an instance of Seriallency.
     * @memberof Seriallency
     */
    constructor() {
        super();
        this.queues = {};
        this.inProcess = {};
    }

    /**
     * Get the quantity of processing Promises (pending to be resolved or rejected) right now.
     *
     * @returns {number}
     * @memberof Seriallency
     */
    public getQuantityProcessing(): number {
        return Object.keys(this.inProcess).length;
    }

    /**
     * Get the aggregated queues size of internal state of this Seriallency instance. If a 'serializeBy'
     * string is supplied, it returns the current queue size for that specific serializing key.
     *
     * @param {string} [serializeBy] Queue name to get queue size.
     * @returns {number} The queuse size for the specified serilizing key, or the aggregated queues size if
     * serializeBy param is undefined.
     * @memberof Seriallency
     */
    public getQueueSize(serializeBy?: string): number {
        if (typeof serializeBy === 'undefined') {
            return Object.keys(this.queues).reduce((prev, key) => prev + this.queues[key].length, 0);
        } else if (serializeBy in this.queues) {
            return this.queues[serializeBy].length;
        } else {
            return 0;
        }
    }

    /**
     * Queue new SeriallencyItem (that contains the 'serializeBy' string, function to be executed and params).
     * If queue for that serializeBy is empty, it launch immediatelly the supplied function with the supplied
     * params.
     *
     * @param {SeriallencyItem} item An object that contains the 'serializeBy' string by which this item must be
     * serialized, the function that must be executed and the params to execute that function.
     * @memberof Seriallency
     */
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
            const item = this.queues[serializeBy].splice(0, 1)[0];
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