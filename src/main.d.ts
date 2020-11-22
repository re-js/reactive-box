declare function box<T>(
  initialValue?: T,
  onChange?: (currentValue?: T, previousValue?: T) => void,
  comparer?: (value?: T, nextValue?: T) => boolean
): [() => T, (nextValue?: T) => void];

declare function sel<T extends () => any>(
  body: T,
  comparer?: (value?: T, prevValue?: T) => boolean
): [T, () => void];

declare function expr<T extends () => void>(body: T): [T, () => void];
declare function expr<T extends (...args: any[]) => any>(
  body: T,
  updater: () => void
): [T, () => void];

export { box, sel, expr };
