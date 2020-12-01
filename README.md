[![npm version](https://img.shields.io/npm/v/reactive-box?style=flat-square)](https://www.npmjs.com/package/reactive-box) [![bundle size](https://img.shields.io/bundlephobia/minzip/reactive-box?style=flat-square)](https://bundlephobia.com/result?p=reactive-box) [![code coverage](https://img.shields.io/coveralls/github/betula/reactive-box?style=flat-square)](https://coveralls.io/github/betula/reactive-box) [![typescript supported](https://img.shields.io/npm/types/typescript?style=flat-square)](./src/main.d.ts)

Minimalistic, [fast](https://github.com/betula/reactive-box-performance), and highly efficient reactivity.

Hi friends! Today I will tell you how I came to this.

Redux has so many different functions, Mobx has mutable objects by default, Angular so heavy, Vue so strange, and other them so young :sweat_smile:

These funny thoughts served as fuel for writing the minimal reaction core. So that everyone can make their own syntax for managing the state of the application in less than 100 lines of code :+1:

It only three functions:

+ `box` - is the container for an immutable value.
+ `sel` - is the cached selector (or computed value in another terminology) who will mark for recalculating If some of read inside boxes or selectors changed.
+ `expr` - is the expression who detects all boxes and selectors read inside and reacted If some of them changed.

```javascript
import { box, sel, expr } from "reactive-box";

const [get, set] = box(0);
const [next] = sel(() => get() + 1);
const [run, stop] = expr(() => {
  console.log(`Counter: ${get()} (next value: ${next()})`)
});
run();          // "Counter 0 (next value: 1)"
set(get() + 1); // "Counter 1 (next value: 2)"
```

[Try It on RunKit!](https://runkit.com/betula/5fbf60565572d7001a76cd29)

Basic usage examples:

- [Counter with Node.js on RunKit](https://runkit.com/betula/5fbde8473dd2b0001bb8f9be)
- [Counter with React on CodeSandbox](https://codesandbox.io/s/reactive-box-counter-35bp9?hidenavigation=1&module=%2Fsrc%2FApp.tsx)

It is minimal core for a big family of state managers' syntax. You can use the different syntax of your data flow on one big project, but the single core of your reactions provides the possibility for easy synchronization between them.

Mobx like syntax example ([57 lines of core](https://codesandbox.io/s/reactive-box-mobx-like-counter-nv8rq?hidenavigation=1&module=/src/App.tsx&file=/src/core.ts)):

```javascript
import React from "react";
import { computed, immutable, observe, shared } from "./core";

class Counter {
  @immutable value = 0;

  @computed get next() {
    return this.value + 1;
  }

  increment = () => this.value += 1;
  decrement = () => this.value -= 1;
}

const App = observe(() => {
  const { value, next, increment, decrement } = shared(Counter);

  return (
    <p>
      Counter: {value} (next value: {next})
      <br />
      <button onClick={decrement}>Prev</button>
      <button onClick={increment}>Next</button>
    </p>
  );
});
```

[Try It on CodeSandbox](https://codesandbox.io/s/reactive-box-mobx-like-counter-nv8rq?hidenavigation=1&module=%2Fsrc%2FApp.tsx)

Effector like syntax example ([76 lines of core](https://codesandbox.io/s/reactive-box-store-nku88?hidenavigation=1&module=/src/App.tsx&file=/src/core.ts)):

```javascript
import React from "react";
import { action, store, selector, useState } from "./core";

const increment = action();
const decrement = action();

const counter = store(0)
  .on(increment, (state) => state + 1)
  .on(decrement, (state) => state - 1);

const next = selector(() => counter.get() + 1);

const App = () => {
  const value = useState(counter);
  const nextValue = useState(next);

  return (
    <p>
      Counter: {value} (next value: {nextValue})
      <br />
      <button onClick={decrement}>Prev</button>
      <button onClick={increment}>Next</button>
    </p>
  );
}
```

[Try It on CodeSandbox](https://codesandbox.io/s/reactive-box-store-nku88?hidenavigation=1&module=%2Fsrc%2FApp.tsx)

More examples:

- [Simple model with React on CodeSandbox](https://codesandbox.io/s/reactive-box-model-yopk5?hidenavigation=1&module=%2Fsrc%2FApp.tsx)
- [Mobx like todo-mvc with React on CodeSandbox](https://codesandbox.io/s/reactive-box-todos-u5q3e?hidenavigation=1&module=%2Fsrc%2Fshared%2Ftodos.ts)

Articles

- [664 Bytes reactivity on dev.to](https://dev.to/betula/reactive-box-1hm5)

You can easily make your own state manager system or another observable and reactive data flow. It's so funny :blush:

Install

```bash
npm i reactive-box
```

Thank you for your time!
