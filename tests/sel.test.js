const { mut, selec, sel, comp, run, runer } = require("./lib");

describe("Sel", () => {
  test("sel run only once on each box change with one box", () => {
    const spy = jest.fn();
    const a = mut(1);
    const s = selec(() => (spy(), a.val));

    expect(spy).toBeCalledTimes(0);

    expect(s()).toBe(1);
    expect(spy).toBeCalledTimes(1);
    expect(s()).toBe(1);
    expect(spy).toBeCalledTimes(1);

    a.val = 2;
    expect(s()).toBe(2);
    expect(spy).toBeCalledTimes(2);
    expect(s()).toBe(2);
    expect(spy).toBeCalledTimes(2);
  });

  test("should work custom comparer", () => {
    const spy = jest.fn();
    const a = mut(0);
    const s = selec(
      () => (a.val, NaN),
      (val, next) => val === next
    );
    run(() => spy(s()));

    expect(spy).toBeCalledTimes(1);
    a.val = 1;
    expect(spy).toBeCalledTimes(2);
  });

  test("should update cache only if comparer return false", () => {
    const d1 = { a: 0 };
    const d2 = { a: 0 };
    const d3 = { a: 1 };
    const spy = jest.fn();
    const a = mut(d1);
    const s = selec(
      () => a.val,
      (val, next) => val.a === next.a
    );
    run(() => spy(s()));

    expect(spy).toBeCalledTimes(1);
    a.val = d2;
    expect(s()).not.toBe(d2);
    expect(spy).toBeCalledTimes(1);
    a.val = d3;
    expect(spy).toBeCalledTimes(2);
    expect(s()).toBe(d3);
  });

  test("sel should exclude from graph and invalidate after free", () => {
    const spy = jest.fn();
    const spy1 = jest.fn();
    const a = mut(1);
    const s = sel(() => (spy(), a.val));

    run(() => spy1(s[0]()));
    expect(spy).toBeCalledTimes(1);
    expect(spy1).toBeCalledTimes(1);
    s[1]();
    s[0]();
    expect(spy).toBeCalledTimes(2);

    a.val = 2;
    expect(spy1).toBeCalledTimes(1);
  });

  test("sel should pass this context", () => {
    const spy = jest.fn();
    const s = selec(function () {
      spy(this);
    });
    s.call(["a"]);
    expect(spy).toBeCalledWith(["a"]);
  });

  test("sel should propogate change only if return value changed", () => {
    const spy = jest.fn();
    const a = mut("a");
    const s = selec(() => a.val[0]);
    run(() => spy(s()));

    expect(spy).toBeCalledTimes(1);
    expect(spy).toBeCalledWith("a");
    a.val += "b";
    expect(spy).toBeCalledTimes(1);
    a.val = "ba";
    expect(spy).toBeCalledTimes(2);
    expect(spy).toHaveBeenLastCalledWith("b");
  });

  test("should save context for sel recalc from prev call", () => {
    const spy = jest.fn();
    const a = mut(0);
    const s = selec(function () {
      spy(this, a.val);
    });
    const e = runer(function () {
      s.call(this);
    });
    e.call(["a"]);
    expect(spy).toHaveBeenLastCalledWith(["a"], 0);
    a.val = 1;
    expect(spy).toHaveBeenLastCalledWith(["a"], 1);
    e.call(["b"]);
    a.val = 2;
    expect(spy).toHaveBeenLastCalledWith(["b"], 2);
  });

  test("should save consistent data", () => {
    const spy = jest.fn();
    const a = mut(0);
    const n1 = comp(() => a.val + 1);
    const n1_1 = comp(() => n1.val + 1);
    const n1_1_1 = comp(() => n1_1.val + 1);
    const n2 = comp(() => spy(a.val + "-" + n1_1_1.val));

    run(() => n2.val);

    expect(spy).toBeCalledTimes(1);
    expect(spy).toHaveBeenLastCalledWith("0-3");
    a.val = 1;
    expect(spy).toHaveBeenNthCalledWith(2, "1-4");
    expect(spy).toBeCalledTimes(2);
  });

  test("should allow modification in selector", () => {
    const a = mut(0);
    const c = comp(() => {
      return (a.val = a.val || 10);
    });

    expect(c.val).toBe(10);
  });

  test("should safe consistent for modifiable selector", () => {
    const spy = jest.fn();
    const a = mut(0);
    const c = comp(() => {
      if (a.val < 10) {
        a.val += 1;
      }
      return a.val;
    });
    run(() => {
      const m = c.val;
      spy(m);
    });

    expect(spy).toHaveBeenNthCalledWith(1, 10);
    expect(spy).toBeCalledTimes(1);
  });
});
