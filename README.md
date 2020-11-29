[![npm version](https://img.shields.io/npm/v/reactive-box?style=flat-square)](https://www.npmjs.com/package/reactive-box) [![bundle size](https://img.shields.io/bundlephobia/minzip/reactive-box?style=flat-square)](https://bundlephobia.com/result?p=reactive-box) [![code coverage](https://img.shields.io/coveralls/github/betula/reactive-box?style=flat-square)](https://coveralls.io/github/betula/reactive-box) [![typescript supported](https://img.shields.io/npm/types/typescript?style=flat-square)](./src/main.d.ts)

Minimalistic, [fast](https://github.com/betula/reactive-box-performance), and highly efficient reactivity.

Hi friends! Today I will tell you how I came to this.

Redux has so many different functions, Mobx has mutable objects by default, Angular so heavy, Vue so strange, and other them so young :sweat_smile:

These funny thoughts served as fuel for writing the reaction core. So that everyone can make their own syntax for managing the state of the application in 100-150 lines :+1:

It only three functions:

+ `box` - is the container for an immutable value.
+ `sel` - is the cached selector (or computed value in another terminology) who will mark for recalculating If some of read inside boxes or selectors changed.
+ `expr` - is the expression who detects all boxes and selectors read inside and reacted If some of them changed.

```javascript
import { box, sel, expr } import "reactive-box";

const [get, set] = box(0);
const [next] = sel(() => get() + 1);
const [run, stop] = expr(() => {
	console.log(`Counter: ${get()} (next value: ${next()})`)
});
run();
set(get() + 1);
```

[Try on RunKit!](https://runkit.com/betula/5fbf60565572d7001a76cd29)

Basic examples:

- [Counter with Node.js on RunKit](https://runkit.com/betula/5fbde8473dd2b0001bb8f9be)
- [Counter with React on CodeSandbox](https://codesandbox.io/s/reactive-box-counter-35bp9?hidenavigation=1&module=%2Fsrc%2FApp.tsx)

It is minimal core for a big family of state managers' syntax. You can use the different syntax of your data flow on one big project, but the single core of your reactions provides the possibility for easy synchronization between them.

Examples of state managers' syntax:

- [Simple store and actions and only hooks with React on CodeSandbox](https://codesandbox.io/s/reactive-box-store-nku88?hidenavigation=1&module=%2Fsrc%2FApp.tsx)
- [Simple model with React on CodeSandbox](https://codesandbox.io/s/reactive-box-model-yopk5?hidenavigation=1&module=%2Fsrc%2FApp.tsx)
- [Mobx like todo-mvc with React on CodeSandbox](https://codesandbox.io/s/reactive-box-todos-u5q3e?hidenavigation=1&module=%2Fsrc%2Fshared%2Ftodos.ts)

You can make your own state manager system or another observable and reactive data flow. It so fun!

Install

```bash
npm i reactive-box
```

Cheers and happy coding! 👋
