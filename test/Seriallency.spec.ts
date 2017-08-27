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