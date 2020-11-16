[![npm version](https://img.shields.io/npm/v/reactive-box?style=flat-square)](https://www.npmjs.com/package/reactive-box) [![bundle size](https://img.shields.io/bundlephobia/minzip/reactive-box?style=flat-square)](https://bundlephobia.com/result?p=reactive-box) [![code coverage](https://img.shields.io/coveralls/github/betula/reactive-box?style=flat-square)](https://coveralls.io/github/betula/reactive-box) [![typescript supported](https://img.shields.io/npm/types/typescript?style=flat-square)](./src/main.d.ts)

Minimalistic, [fast](https://github.com/betula/reactive-box-performance), and highly efficient reactivity.

```javascript
import React from "react";
import { box, sel, expr } from "reactive-box";

const [getCounter, setCounter] = box(0);
const [getNext] = sel(() => getCounter() + 1);

const increment = () => setCounter(getCounter() + 1);
const decrement = () => setCounter(getCounter() - 1);

const useForceUpdate = () => {
  return React.useReducer(() => [], [])[1];
};

const observe = <T extends React.FC>(Component: T) =>
  React.memo((props) => {
    const forceUpdate = useForceUpdate();
    const ref = React.useRef<[T, () => void]>();
    React.useEffect(() => ref.current![1], []);
    if (!ref.current) {
      ref.current = expr(Component, forceUpdate);
    }
    return ref.current[0](props);
  });

const Counter = observe(() => (
  <p>
    Counter: {getCounter()} (next value: {getNext()})
  </p>
));

const Buttons = () => (
  <p>
    <button onClick={decrement}>Prev</button>
    <button onClick={increment}>Next</button>
  </p>
);

export const App = () => (
  <>
    <Counter />
    <Buttons />
  </>
);

```

[![Edit on CodeSandbox](https://codesandbox.io/static/img/play-codesandbox.svg)](https://codesandbox.io/s/reactive-box-counter-35bp9?hidenavigation=1&module=%2Fsrc%2FApp.tsx)

Install

```bash
npm i reactive-box
```

Enjoy!
