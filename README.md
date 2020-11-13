[![npm version](https://img.shields.io/npm/v/reactive-box?style=flat-square)](https://www.npmjs.com/package/reactive-box) [![bundle size](https://img.shields.io/bundlephobia/minzip/reactive-box?style=flat-square)](https://bundlephobia.com/result?p=reactive-box) [![code coverage](https://img.shields.io/coveralls/github/betula/reactive-box?style=flat-square)](https://coveralls.io/github/betula/reactive-box) [![typescript supported](https://img.shields.io/npm/types/typescript?style=flat-square)](./src/main.d.ts)

Minimal reactive box

```javascript
import { box, sel, expr } from 'reactive-box';

const [getTodos, setTodos] = box(
  JSON.parse(localStorage.getItem('todos') || '[]')
);
const [getCompleted] = sel(() =>
  getTodos().filter(todo => todo.completed)
);
const [save] = expr(() => {
  localStorage.setItem('todos', JSON.stringify(
    getTodos()
  ));
});
save();

setTodos([
  { text: 'Idea', completed: true },
  { text: 'Code', completed: true },
  { text: 'Tests', completed: false },
  { text: 'Docs', completed: false },
]);
console.log(getCompleted());
console.log(localStorage.getItem('todos'));

```

[![Edit on CodeSandbox](https://codesandbox.io/static/img/play-codesandbox.svg)](https://codesandbox.io/s/minimal-todos-on-reactive-box-tkj1n?expanddevtools=1&fontsize=14&hidenavigation=1&module=%2Fsrc%2Findex.js)

[Try on RunKit](https://runkit.com/betula/5fae378c6cf6c5001b79c59c)

