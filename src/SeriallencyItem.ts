export class SeriallencyItem{
    public serializeBy: string;
    public fn: () => Promise<any>;
    public params?: any[];
    public thisObj?: any;
}