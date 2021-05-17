declare function box<T>(
  initialValue?: T,
  onChange?: (currentValue: T, prevValue: T) => void,
  comparer?: (value: T, nextValue: T) => boolean
): [() => T, (nextValue: T) => void];

declare function sel<T extends () => any>(
  body: T,
  comparer?: (value: T, nextValue: T) => boolean
): [T, () => void];

declare function expr<T extends () => void>(body: T): [T, () => void];
declare function expr<T extends (...args: any[]) => any>(
  body: T,
  updater: () => void
): [T, () => void];

declare function flow<R extends any>(
  body: (resolve: (value: R) => any, prevValue: R) => R | symbol,
  emptyValue?: R,
  comparer?: (value: R, nextValue: R) => boolean
): [() => void, () => R, () => void];
declare namespace flow {
  var stop: symbol;
}

declare function transaction(): () => void;
declare function untrack(): () => void;

export { box, sel, expr, flow, transaction, untrack };
