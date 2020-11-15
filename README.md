[![npm version](https://img.shields.io/npm/v/reactive-box?style=flat-square)](https://www.npmjs.com/package/reactive-box) [![bundle size](https://img.shields.io/bundlephobia/minzip/reactive-box?style=flat-square)](https://bundlephobia.com/result?p=reactive-box) [![code coverage](https://img.shields.io/coveralls/github/betula/reactive-box?style=flat-square)](https://coveralls.io/github/betula/reactive-box) [![typescript supported](https://img.shields.io/npm/types/typescript?style=flat-square)](./src/main.d.ts)

Minimal reactive box

```javascript
import React from "react";
import { box, sel, expr } from "reactive-box";

interface Todo {
  text: string;
  completed: boolean;
}

const [getTodos, setTodos] = box<Todo[]>([]);

const [countActive] = sel(
  () => getTodos().filter((todo) => !todo.completed).length
);

const [countCompleted] = sel(
  () => getTodos().filter((todo) => todo.completed).length
);

const addTodo = (text: string) => {
  setTodos([...getTodos(), { text, completed: false }]);
};

const switchTodo = (target: Todo) => {
  setTodos(
    getTodos().map((todo) =>
      target === todo
        ? {
            ...todo,
            completed: !todo.completed
          }
        : todo
    )
  );
};

const clearCompleted = () => {
  setTodos(getTodos().filter((todo) => !todo.completed));
};

const observe = <T extends React.FC>(Component: T) =>
  React.memo((props) => {
    const update = React.useState(0)[1];
    const ref = React.useRef<[T, () => void]>();
    if (!ref.current) {
      const [Observed, free] = expr(Component, () =>
        update((v) => (v + 1) % 0xffff)
      );
      ref.current = [Observed, free];
    }
    React.useEffect(() => ref.current![1], []);
    return ref.current[0](props);
  });

const TodoInput = observe(() => {
  const [getText, changeHandler, clickHandler] = React.useMemo(() => {
    const [getText, setText] = box("");
    return [
      getText,
      (ev: React.ChangeEvent<HTMLInputElement>) => setText(ev.target.value),
      () => {
        addTodo(getText());
        setText("");
      }
    ];
  }, []);

  return (
    <div>
      Todo: <input value={getText()} onChange={changeHandler} />
      <button onClick={clickHandler}>+</button>
    </div>
  );
});

const TodoList = observe(() => (
  <ul>
    {getTodos().map((todo, key) => (
      <li key={key}>
        {todo.text}{" "}
        <button onClick={() => switchTodo(todo)}>
          {todo.completed ? "open" : "close"}
        </button>
      </li>
    ))}
  </ul>
));

const TodoFooter = observe(() => {
  const active = countActive();
  const completed = countCompleted();
  return (
    <div>
      {active ? `${active} left ` : null}
      {completed ? (
        <button onClick={clearCompleted}>clear completed</button>
      ) : null}
    </div>
  );
});

export default function App() {
  return (
    <>
      <TodoInput />
      <TodoList />
      <TodoFooter />
    </>
  );
}
```

[![Edit on CodeSandbox](https://codesandbox.io/static/img/play-codesandbox.svg)](https://codesandbox.io/s/reactive-box-todos-esq2m?hidenavigation=1&module=%2Fsrc%2FApp.tsx)

```bash
npm i reactive-box
```

Enjoy!
