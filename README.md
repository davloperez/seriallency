# Seriallency
Serialize a bunch of Promises according to a specific field

[![Build Status](https://travis-ci.org/davloperez/seriallency.svg?branch=master)](https://travis-ci.org/davloperez/seriallency)
[![Build Status](https://img.shields.io/badge/node-v6.10.0-blue.svg?style=flat)](https://nodejs.org/en/blog/release/v6.10.0/)

With this module you can serialize multiple Promises by a specific key, so you can be sure that only a single promise for that key. Seriallency uses an internal dictionary to store promises if it already exists one previous Promise associated to the same key. For example:

> You must execute 1 promise for User1, 2 promises for User2 and 3 promises for User3. All promises must be executed as fast as possible, BUT due to requirements, only ONE Promise for each user can be executing at once.
> With Seriallency you can achieve this easily, and get this execution order:
> ![seriallency_schema](https://user-images.githubusercontent.com/1970817/29748565-6e261050-8b19-11e7-8d78-be1ba23d36ed.jpg)

## Installation
```
npm install seriallency --save
```
## Usage
Example 1: basic usage
```typescript
import { Seriallency } from 'seriallency';

let seriallency = new Seriallency();

// USER1
seriallency.push({ serializeBy: 'user1', fn: hardWorkFn, params: ['user1', 1]});
// execute hardWorkFn('user1', 1) immediately

// USER2
seriallency.push({ serializeBy: 'user2', fn: hardWorkFn, params: ['user2', 1]});
// execute hardWorkFn('user2', 1) immediately
seriallency.push({ serializeBy: 'user2', fn: hardWorkFn, params: ['user2', 2]});
// queue hardWorkFn('user2', 2) to be executed when hardWorkFn('user2', 1) is resolved or rejected.

// USER3
seriallency.push({ serializeBy: 'user3', fn: hardWorkFn, params: ['user3', 1]});
// execute hardWorkFn('user3', 1) immediately
seriallency.push({ serializeBy: 'user3', fn: hardWorkFn, params: ['user3', 2]});
// queue hardWorkFn('user3', 2) to be executed when hardWorkFn('user3', 1) is resolved or rejected.
seriallency.push({ serializeBy: 'user3', fn: hardWorkFn, params: ['user3', 3]});
// queue hardWorkFn('user3', 3) to be executed when hardWorkFn('user3', 2) is resolved or rejected.

function hardWorkFn(userName: string, numParam: number): Promise<any>{
    console.log(`Executing hardWorkFn. userName:${userName}, numParam:${numParam}`);
    return new Promise(resolve => {
        // ... do some async process
        setImmediate(resolve);
    });
}

// Output is:
// Executing hardWorkFn. userName: user1, numParam: 1
// Executing hardWorkFn. userName: user2, numParam: 1
// Executing hardWorkFn. userName: user3, numParam: 1
// Executing hardWorkFn. userName: user2, numParam: 2
// Executing hardWorkFn. userName: user3, numParam: 2
// Executing hardWorkFn. userName: user3, numParam: 3
```