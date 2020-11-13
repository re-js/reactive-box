[![npm version](https://img.shields.io/npm/v/reactive-box?style=flat-square)](https://www.npmjs.com/package/reactive-box) [![bundle size](https://img.shields.io/bundlephobia/minzip/reactive-box?style=flat-square)](https://bundlephobia.com/result?p=reactive-box) [![code coverage](https://img.shields.io/coveralls/github/betula/reactive-box?style=flat-square)](https://coveralls.io/github/betula/reactive-box) [![typescript supported](https://img.shields.io/npm/types/typescript?style=flat-square)](./src/main.d.ts)

Minimal reactive box

```javascript
import { box, sel, expr } from 'reactive-box';

const [getTodos] = box([]);
const [getCompleted] = sel(() =>
  getTodos().filter(todo => todo.completed)
);
const [sync] = expr(() => {
  localStorage.setItem('todos', JSON.stringify(
    getTodos()
  ));
});
sync();

```
