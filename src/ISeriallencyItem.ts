/**
 * This represents an item that can be pushed to a Seriallency object.
 *
 * @export
 * @interface ISeriallencyItem
 */
export interface ISeriallencyItem {
    /**
     * Key by which this item must be serialized.
     *
     * @type {string}
     * @memberof ISeriallencyItem
     */
    serializeBy: string;
    /**
     * Function (that returns a Promise) that will be executed by the Seriallency object passing
     * this 'params' and having 'thisObj' context.
     *
     * @memberof ISeriallencyItem
     */
    fn: (...args: any[]) => Promise<any>;
    /**
     * Parameters (in order) that will be passed to fn function.
     *
     * @type {(any[] | any)}
     * @memberof ISeriallencyItem
     */
    params?: any[] | any;
    /**
     * The context (value of 'this') that will have fn function.
     *
     * @type {*}
     * @memberof ISeriallencyItem
     */
    thisObj?: any;
}