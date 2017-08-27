export class SeriallencyItem{
    public serializeBy: string;
    public fn: (...args: any[]) => Promise<any>;
    public params?: any[];
    public thisObj?: any;
}