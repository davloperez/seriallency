import 'mocha';
import { expect, use } from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import { Seriallency } from "../src/Seriallency";
use(chaiAsPromised);

it('should be initialized with an empty queue', () => {
    let seriallency = new Seriallency();
    expect(seriallency.getQueueSize()).to.be.eql(0);
});

it('should be initialized with quantityProcessing = 0', () => {
    let seriallency = new Seriallency();
    expect(seriallency.getQuantityProcessing()).to.be.eql(0);
});

it('should process one single promise correctly', (done) => {
    let seriallency = new Seriallency();
    let fn = function fn(): Promise<any> {
        return new Promise((resolve, reject) => {
            setImmediate(resolve);
        });
    };
    expect(seriallency.getQueueSize()).to.be.eql(0);
    seriallency.push({ serializeBy: 'a', fn: fn });
    expect(seriallency.getQueueSize()).to.be.eql(0);
    expect(seriallency.getQuantityProcessing()).to.be.eql(1);
    seriallency.on('resolved', () => {
        expect(seriallency.getQueueSize()).to.be.eql(0);
        expect(seriallency.getQuantityProcessing()).to.be.eql(0);
        done();
    });
});

it('should process multiple promise correctly at the same time if they does not share "serializeBy" key', (done) => {
    let seriallency = new Seriallency();
    let calledCount = 0;
    let fn = function fn(): Promise<any> {
        calledCount += 1;
        return new Promise((resolve, reject) => {
            setImmediate(resolve);
        });
    };
    for (let counter = 0; counter < 10; counter += 1) {
        seriallency.push({ serializeBy: 'a' + counter, fn: fn });
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
    let seriallency = new Seriallency();
    let calledCount = 0;
    let fn = function fn(): Promise<any> {
        calledCount += 1;
        return new Promise((resolve, reject) => {
            setImmediate(resolve);
        });
    };
    for (let counter = 0; counter < 10; counter += 1) {
        seriallency.push({ serializeBy: 'a', fn: fn });
    }
    expect(seriallency.getQueueSize()).to.be.eql(9);
    expect(seriallency.getQuantityProcessing()).to.be.eql(1);
    seriallency.on('resolved', () => {
        expect(seriallency.getQueueSize()).to.be.lessThan(10);
        expect(seriallency.getQuantityProcessing()).to.be.lessThan(2);
        if (seriallency.getQuantityProcessing() === 0) {
            expect(calledCount).to.be.eql(10);
            done();
        }
    });
});

it('should process multiple promise correctly one afther another if they share "serializeBy" key, and concurrently if they do not', (done) => {
    let seriallency = new Seriallency();
    let calledCount = 0;
    let fn = function fn(): Promise<any> {
        calledCount += 1;
        return new Promise((resolve, reject) => {
            setImmediate(resolve);
        });
    };
    for (let counter = 0; counter < 10; counter += 1) {
        seriallency.push({ serializeBy: 'a', fn: fn });
    }
    for (let counter = 0; counter < 10; counter += 1) {
        seriallency.push({ serializeBy: 'a' + counter, fn: fn });
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

it('should emit "resolved" event with the Promise resolved value as first parameter and the original SeriallencyItem as second parameter', (done) => {
    let seriallency = new Seriallency();
    let errorOccured = false;
    let fn = function fn(param1: number): Promise<any> {
        return new Promise((resolve, reject) => {
            setImmediate(function () {
                resolve(param1 * 2);
            });
        });
    };
    for (let counter = 0; counter < 10; counter += 1) {
        seriallency.push({ serializeBy: 'a', fn: fn, params: [counter] });
    }
    seriallency.on('resolved', (result, seriallencyItem) => {
        if (result !== seriallencyItem.params[0] * 2) {
            errorOccured = true;
        }
        if (seriallency.getQuantityProcessing() === 0) {
            expect(errorOccured).to.be.false;
            done();
        }
    });
});

it('should emit "rejected" event with the Promise rejection reason as first parameter and the original SeriallencyItem as second parameter', (done) => {
    let seriallency = new Seriallency();
    let errorOccured = false;
    let fn = function fn(param1: number): Promise<any> {
        return new Promise((resolve, reject) => {
            setImmediate(function () {
                reject(param1 * 2);
            });
        });
    };
    for (let counter = 0; counter < 10; counter += 1) {
        seriallency.push({ serializeBy: 'a', fn: fn, params: [counter] });
    }
    seriallency.on('rejected', (reason, seriallencyItem) => {
        if (reason !== seriallencyItem.params[0] * 2) {
            errorOccured = true;
        }
        if (seriallency.getQuantityProcessing() === 0) {
            expect(errorOccured).to.be.false;
            done();
        }
    });
});