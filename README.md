[![npm version](https://img.shields.io/npm/v/reactive-box?style=flat-square)](https://www.npmjs.com/package/reactive-box) [![bundle size](https://img.shields.io/bundlephobia/minzip/reactive-box?style=flat-square)](https://bundlephobia.com/result?p=reactive-box) [![code coverage](https://img.shields.io/coveralls/github/betula/reactive-box?style=flat-square)](https://coveralls.io/github/betula/reactive-box) [![typescript supported](https://img.shields.io/npm/types/typescript?style=flat-square)](./src/main.d.ts)

Minimalistic, [fast](https://github.com/betula/reactive-box-performance), and highly efficient reactivity.

Hi friends! Today I will tell you how I came to this.

Redux has so many different functions, Mobx has mutable objects by default, Angular so heavy, Vue so strange, and other them so young :sweat_smile:

These funny thoughts served as fuel for writing the minimal reaction core. So that everyone can make their own syntax for managing the state of the application in less than 100 lines of code :+1:

It only three functions:

+ `box` - is the container for an immutable value.
+ `sel` - is the cached selector (or computed value) who will mark for recalculating If some of read inside boxes or selectors changed.
+ `expr` - is the expression who detects all boxes and selectors read inside and reacted If some of them changed.

```javascript
import { box, sel, expr } from "reactive-box";

const [get, set] = box(0);

const [next] = sel(() => get() + 1);

const [run, stop] = expr(
    () => `Counter: ${get()} (next value: ${next()})`,
    () => console.log(run())
);
console.log(run()); // console: "Counter 0 (next value: 1)"

set(get() + 1);     // console: "Counter 1 (next value: 2)"
```

[Try It on RunKit!](https://runkit.com/betula/5fbf60565572d7001a76cd29)

It is a basis for full feature reactive mathematic!
For example that possible syntax to transcript previous javascript code:

```
  a` = 0                // create reactive value
  next` = a` + 1        // create new reactive value, dependent on the previous one
  expr = { "Counter: ${a`} (next value: ${next`})" }  // create reactive expression

  // subscribe to expression dependencies were change and run It again
  expr: () => console.log(expr())

  // run the expression
  console.log(expr())                         // message to console "Counter: 0 (next value: 1)"

  a` = a` + 1   // here will be fired log to console again with new "Counter: 1 (next value: 2)" message, because a` was changed.
```

1. We create reactive `a`
2. We create reactive operation `a + 1`
3. We create reactive expression `"Counter: ${a} (next value: ${next})"`
4. We subscribe to change of `a` and `next` reactive dependencies
5. We run reactive expression
6. We are increasing the value of reactive `a` for demonstration subscriber reaction

### Atomic

These are three basic elements necessary for creating data flow any difficulty.

The first element is a reactive container for an immutable value. All reactions beginning from container change value reaction.

The second one is the middle element. It uses all reactive containers as a source of values and returns the result of the expression. It's a transformer set of reactive values to a single one. The selector can be used as a reactive container in other selectors and expressions.

It subscribes to change in any of the dependencies. And will recalculate the value if some of the dependency changed, but will propagate changes only if the return value changed.

And the last one is a reaction subscriber. It provides the possibility to subscribe to change any set of reactive containers. It can be run again after the listener was called.

### Deep inside

- It runs calculations synchronously.

- [glitch](https://stackoverflow.com/questions/25139257/terminology-what-is-a-glitch-in-functional-reactive-programming-rx) free - your reactions will only be called when there is a consistent state for them to run on.

- Possibility for modification everywhere: in expressions and selectors!

### In the real world

Below we will talk about more high level abstraction, to the world of React and integration reactive-box into, for best possibilities together!

Basic usage examples:

- [Counter with Node.js on RunKit](https://runkit.com/betula/5fbde8473dd2b0001bb8f9be)
- [Counter with React on CodeSandbox](https://codesandbox.io/s/reactive-box-counter-35bp9?hidenavigation=1&module=%2Fsrc%2FApp.tsx)

It is minimal core for a big family of state managers' syntax. You can use the different syntax of your data flow on one big project, but the single core of your reactions provides the possibility for easy synchronization between them.

#### Mobx like syntax example ([57 lines of reactive core](https://codesandbox.io/s/reactive-box-mobx-like-counter-nv8rq?hidenavigation=1&module=/src/App.tsx&file=/src/core.ts)):

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

#### Effector like syntax example ([76 lines of reactive core](https://codesandbox.io/s/reactive-box-store-nku88?hidenavigation=1&module=/src/App.tsx&file=/src/core.ts)):

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

### More examples

- [Simple model with React on CodeSandbox](https://codesandbox.io/s/reactive-box-model-yopk5?hidenavigation=1&module=%2Fsrc%2FApp.tsx)
- [Mobx like todo-mvc with React on CodeSandbox](https://codesandbox.io/s/reactive-box-todos-u5q3e?hidenavigation=1&module=%2Fsrc%2Fshared%2Ftodos.ts)
- [Realar state manager](https://github.com/betula/realar)

### Articles about

- [664 Bytes reactivity on dev.to](https://dev.to/betula/reactive-box-1hm5)

You can easily make your own state manager system or another observable and reactive data flow. It's so funny :blush:

### How to install

```bash
npm i reactive-box
```

Thanks for your time!
