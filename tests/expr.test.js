const { mut, runer, expr, run } = require("./lib");

describe("Expr", () => {
  test("(sync on each box change with one box) and (expr return value)", () => {
    const spy = jest.fn();
    const a = mut(1);
    const e = runer(() => a.val, spy);

    expect(e()).toBe(1);
    expect(spy).toBeCalledTimes(0);

    a.val = 2;
    expect(spy).toBeCalledTimes(1);
    expect(e()).toBe(2);
  });

  test("(rerun on each box change with two boxes) and (non reaction before first run)", () => {
    const spy = jest.fn();
    const a = mut(1);
    const b = mut(2);
    const e = runer(() => {
      spy(a.val, b.val);
    });
    a.val = 10;
    b.val = 20;
    expect(spy).toBeCalledTimes(0);
    e();
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenNthCalledWith(1, 10, 20);
    a.val = 11;
    expect(spy).toHaveBeenCalledTimes(2);
    expect(spy).toHaveBeenNthCalledWith(2, 11, 20);
    b.val = 21;
    expect(spy).toHaveBeenCalledTimes(3);
    expect(spy).toHaveBeenNthCalledWith(3, 11, 21);
  });

  test("exclude from graph before run if it necessary", () => {
    const spy = jest.fn();
    let f = 1;
    const a = mut(1);
    const b = mut(1);
    const r = runer(() => (f ? a.val : b.val), spy);
    r();
    f = 0;
    r();
    a.val = 2;
    expect(spy).toBeCalledTimes(0);
  });

  test("exclude from graph on free call", () => {
    const spy = jest.fn();
    const a = mut(1);
    const e = expr(() => a.val, spy);
    e[0]();
    e[1]();
    a.val = 2;
    expect(spy).toBeCalledTimes(0);
    e[0]();
    a.val = 1;
    expect(spy).toBeCalledTimes(1);
  });

  test("get run context from prev run call", () => {
    const spy = jest.fn();
    const a = mut(0);
    const e = runer(function () {
      spy(this, a.val);
    });
    e.call(["a"]);
    expect(spy).toHaveBeenLastCalledWith(["a"], 0);
    a.val = 1;
    expect(spy).toHaveBeenLastCalledWith(["a"], 1);
    e.call(["b"]);
    expect(spy).toHaveBeenLastCalledWith(["b"], 1);
    a.val = 0;
    expect(spy).toHaveBeenLastCalledWith(["b"], 0);
  });

  test("stop should work correctly in another expr", () => {
    const spy = jest.fn();
    const a = mut(0);

    run(
      () => a.val,
      () => s2()
    );
    const [r2, s2] = expr(() => a.val, spy);
    r2();
    run(
      () => a.val,
      () => s2()
    );

    a.val = 1;
    expect(spy).toBeCalledTimes(0);
  });

  test("stop should work correctly in self", () => {
    const spy = jest.fn();
    const a = mut(0);

    const [r1, s1] = expr(() => {
      if (a.val) {
        s1();
      }
      spy(a.val);
    });
    r1();
    expect(spy).toBeCalledTimes(1);
    a.val = 1;
    expect(spy).toBeCalledTimes(2);

    a.val = 0;
    expect(spy).toBeCalledTimes(2);
  });

  test("stop and run again should work correctly in self", () => {
    const spy = jest.fn();
    const a = mut(0);

    const [r1, s1] = expr(() => {
      spy(a.val);
      if (a.val === 1) {
        s1();
        a.val = 0;
        r1();
      }
    });
    r1();
    expect(spy).toBeCalledTimes(1);
    a.val = 1;
    expect(spy).toHaveBeenNthCalledWith(2, 1);
    expect(spy).toHaveBeenNthCalledWith(3, 0);
    expect(spy).toBeCalledTimes(3);
    expect(a.val).toBe(0);
    a.val = 2;
    expect(spy).toBeCalledTimes(4);
    expect(spy).toHaveBeenNthCalledWith(4, 2);
  });

  test("stop in first iteration", () => {
    const spy = jest.fn();
    const spy_2 = jest.fn();
    const b = mut(1);

    const body = () => {
      b.val += b.val;
      b.val += b.val;
      b.val += b.val;
      s();
      spy_2();
    };
    run(() => spy(b.val));

    const [r, s] = expr(body);
    r();

    expect(spy_2).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenNthCalledWith(1, 1);
    expect(spy).toHaveBeenNthCalledWith(2, 2);
    expect(spy).toHaveBeenNthCalledWith(3, 4);
    expect(spy).toHaveBeenNthCalledWith(4, 8);
    expect(spy).toHaveBeenCalledTimes(4);
  });
});
