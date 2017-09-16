export class SeriallencyItem {
    public serializeBy: string;
    public fn: (...args: any[]) => Promise<any>;
    public params?: any[] | any;
    public thisObj?: any;
}