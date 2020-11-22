const { mut, selec, sel, run, runer } = require("./lib");

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
    const s = selec(function() {
      spy(this, a.val);
    })
    const e = runer(function() {
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
});
