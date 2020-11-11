export declare function box<T>(
  initialValue?: T,
  onChange?: (currentValue?: T, previousValue?: T) => void
): [() => T, (nextValue?: T) => void];

export declare function sel<R>(body: () => R): [() => R, () => void];

export declare function expr<F extends (...args: any[]) => any>(
  body: F,
  updater?: () => void
): [F, () => void];
