import 'mocha';
import { expect, use } from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import { Seriallency } from "../src/Seriallency";
use(chaiAsPromised);

it('should be initialized with an empty queue', () => {
    const seriallency = new Seriallency();
    expect(seriallency.getQueueSize()).to.be.eql(0);
});

it('should be initialized with quantityProcessing = 0', () => {
    const seriallency = new Seriallency();
    expect(seriallency.getQuantityProcessing()).to.be.eql(0);
});

it('should have empty queue if asking for an unused queue', () => {
    const seriallency = new Seriallency();
    expect(seriallency.getQueueSize('a')).to.be.eql(0);
});

it('should throw error if invalid item is passed to push method', () => {
    const seriallency = new Seriallency();
    expect(() => {
        seriallency.push(undefined);
    }).to.throw(Error);
    expect(() => {
        seriallency.push({ serializeBy: undefined, fn: Promise.resolve });
    }).to.throw(Error);
    expect(() => {
        seriallency.push({ serializeBy: 'a', fn: undefined as any });
    }).to.throw(Error);
});

it('should process one single promise correctly', (done) => {
    const seriallency = new Seriallency();
    const fn = (): Promise<any> => {
        return new Promise((resolve, reject) => {
            setImmediate(resolve);
        });
    };
    expect(seriallency.getQueueSize()).to.be.eql(0);
    seriallency.push({ serializeBy: 'a', fn });
    expect(seriallency.getQueueSize()).to.be.eql(0);
    expect(seriallency.getQuantityProcessing()).to.be.eql(1);
    seriallency.on('resolved', () => {
        expect(seriallency.getQueueSize()).to.be.eql(0);
        expect(seriallency.getQuantityProcessing()).to.be.eql(0);
        done();
    });
});

it('should process multiple promise correctly at the same time if they does not share "serializeBy" key', (done) => {
    const seriallency = new Seriallency();
    let calledCount = 0;
    const fn = (): Promise<any> => {
        calledCount += 1;
        return new Promise((resolve, reject) => {
            setImmediate(resolve);
        });
    };
    for (let counter = 0; counter < 10; counter += 1) {
        seriallency.push({ serializeBy: 'a' + counter, fn });
    }
    expect(seriallency.getQueueSize()).to.be.eql(0);
    expect(seriallency.getQuantityProcessing()).to.be.eql(10);
    seriallency.on('resolved', () => {
        expect(seriallency.getQueueSize()).to.be.eql(0);
        expect(seriallency.getQuantityProcessing()).to.be.lessThan(10);
        if (seriallency.getQuantityProcessing() === 0) {
            expect(calledCount).to.be.eql(10);
            done();
        }
    });
});

it('should process multiple promise correctly one afther another if they share "serializeBy" key', (done) => {
    const seriallency = new Seriallency();
    let calledCount = 0;
    const fn = (): Promise<any> => {
        calledCount += 1;
        return new Promise((resolve, reject) => {
            setImmediate(resolve);
        });
    };
    for (let counter = 0; counter < 10; counter += 1) {
        seriallency.push({ serializeBy: 'a', fn });
    }
    expect(seriallency.getQueueSize()).to.be.eql(9);
    expect(seriallency.getQuantityProcessing()).to.be.eql(1);
    seriallency.on('resolved', () => {
        expect(seriallency.getQueueSize()).to.be.eql(seriallency.getQueueSize('a'));
        expect(seriallency.getQueueSize()).to.be.lessThan(10);
        expect(seriallency.getQuantityProcessing()).to.be.lessThan(2);
        if (seriallency.getQuantityProcessing() === 0) {
            expect(calledCount).to.be.eql(10);
            done();
        }
    });
});

it('should process multiple promise correctly one afther another if they share "serializeBy" key,' +
    ' and concurrently if they do not', (done) => {
        const seriallency = new Seriallency();
        let calledCount = 0;
        const fn = (): Promise<any> => {
            calledCount += 1;
            return new Promise((resolve, reject) => {
                setImmediate(resolve);
            });
        };
        for (let counter = 0; counter < 10; counter += 1) {
            seriallency.push({ serializeBy: 'a', fn });
        }
        for (let counter = 0; counter < 10; counter += 1) {
            seriallency.push({ serializeBy: 'a' + counter, fn });
        }
        expect(seriallency.getQueueSize()).to.be.eql(9);
        expect(seriallency.getQuantityProcessing()).to.be.eql(11);
        seriallency.on('resolved', () => {
            expect(seriallency.getQueueSize()).to.be.lessThan(10);
            expect(seriallency.getQuantityProcessing()).to.be.lessThan(12);
            if (seriallency.getQuantityProcessing() === 0) {
                expect(calledCount).to.be.eql(20);
                done();
            }
        });
    });

it('should emit "resolved" event with the Promise resolved value as first parameter and the' +
    ' original SeriallencyItem as second parameter', (done) => {
        const seriallency = new Seriallency();
        let errorOccured = false;
        const fn = (param1: number): Promise<any> => {
            return new Promise((resolve, reject) => {
                setImmediate(() => {
                    resolve(param1 * 2);
                });
            });
        };
        for (let counter = 0; counter < 10; counter += 1) {
            seriallency.push({ serializeBy: 'a', fn, params: counter });
        }
        seriallency.on('resolved', (result, seriallencyItem) => {
            if (result !== seriallencyItem.params[0] * 2) {
                errorOccured = true;
            }
            if (seriallency.getQuantityProcessing() === 0) {
                // tslint:disable-next-line:no-unused-expression
                expect(errorOccured).to.be.false;
                done();
            }
        });
    });

it('should emit "rejected" event with the Promise rejection reason as first parameter' +
    ' and the original SeriallencyItem as second parameter', (done) => {
        const seriallency = new Seriallency();
        let errorOccured = false;
        const fn = (param1: number): Promise<any> => {
            return new Promise((resolve, reject) => {
                setImmediate(() => {
                    reject(param1 * 2);
                });
            });
        };
        for (let counter = 0; counter < 10; counter += 1) {
            seriallency.push({ serializeBy: 'a', fn, params: [counter] });
        }
        seriallency.on('rejected', (reason, seriallencyItem) => {
            if (reason !== seriallencyItem.params[0] * 2) {
                errorOccured = true;
            }
            if (seriallency.getQuantityProcessing() === 0) {
                // tslint:disable-next-line:no-unused-expression
                expect(errorOccured).to.be.false;
                done();
            }
        });
    });