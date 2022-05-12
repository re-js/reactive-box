const { mut, selec, sel, comp, run, runer, sync, on } = require("./lib");

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

  test("sel run only once on leave and comback to graph", () => {
    const spy = jest.fn();
    const a = mut(1);
    const s = selec(() => (spy(a.val), a.val));
    const b = mut(0);
    run(() => {
      if (b.val === 0) s();
    });

    expect(spy).toBeCalledTimes(1);
    expect(spy).toHaveBeenLastCalledWith(1);
    expect(s()).toBe(1);
    b.val = 1;
    b.val = 0;
    expect(s()).toBe(1);
    expect(spy).toBeCalledTimes(1);
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

  test("should safe consistent for init modifiable selector", () => {
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

  test("should safe double consistent for modifiable selector and expr", () => {
    const spy = jest.fn();
    const a = mut(0);
    const b = mut(0);
    const c = comp(() => {
      if (a.val < 10) a.val += 1;

      if (b.val === 1) {
        if (a.val < 20) a.val += 1;
        else b.val = 2;
      }
      return a.val;
    });
    run(() => {
      const m = c.val;
      const v = !b.val ? ((b.val = 1), b.val) : b.val;
      spy(m, v);
    });

    expect(spy).toHaveBeenNthCalledWith(1, 10, 1);
    expect(spy).toHaveBeenNthCalledWith(2, 20, 2);
    expect(spy).toBeCalledTimes(2);
  });

  test("should safe correct reactions order for changing depth without modification", () => {
    const spy = jest.fn();
    const a = mut(0);
    const b = mut(0);

    const m0 = comp(() => {
      return !b.val ? a.val : k0.val;
    });
    const k0 = comp(() => {
      return !b.val ? m0.val : a.val;
    });

    const m = comp(() => m0.val);
    const k = comp(() => k0.val);

    let i = 0;
    run(() => (k.val, spy("k", i++)));
    run(() => (m.val, spy("m", i++)));

    expect(spy).toHaveBeenNthCalledWith(1, "k", 0);
    expect(spy).toHaveBeenNthCalledWith(2, "m", 1);
    expect(spy).toBeCalledTimes(2);
    spy.mockReset();

    a.val = 1;
    expect(spy).toHaveBeenNthCalledWith(1, "m", 2);
    expect(spy).toHaveBeenNthCalledWith(2, "k", 3);
    expect(spy).toBeCalledTimes(2);
    spy.mockReset();

    // switch
    b.val = 1;
    expect(spy).toBeCalledTimes(0);

    // check
    a.val = 2;
    // TODO: Whats happends with order of execution if will change depth but not a value?
    // TODO: check failed (m:4, k:5)
    // expect(spy).toHaveBeenNthCalledWith(1, 'k', 4);
    // expect(spy).toHaveBeenNthCalledWith(2, 'm', 5);
    expect(spy).toBeCalledTimes(2);
    spy.mockReset();
  });

  test("stop should work correctly in self", () => {
    const spy = jest.fn();
    const spy_2 = jest.fn();
    const a = mut(0);

    const [r1, s1] = sel(() => {
      if (a.val) {
        s1();
      }
      spy(a.val);
      return a.val;
    });

    run(() => spy_2(r1()));

    expect(spy).toBeCalledTimes(1);
    a.val = 1;
    expect(spy).toBeCalledTimes(2);
    expect(spy_2).toHaveBeenNthCalledWith(1, 0);

    a.val = 0;
    expect(spy).toBeCalledTimes(2);
    expect(spy_2).toBeCalledTimes(1);
  });

  test("stop and run again should work correctly in self", () => {
    const spy = jest.fn();
    const spy_2 = jest.fn();
    const a = mut(0);

    const [r1, s1] = sel(() => {
      spy(a.val);
      if (a.val === 1) {
        s1();
        a.val = 0;
        r1();
      }
      return a.val;
    });
    run(() => spy_2(r1()));

    expect(spy).toBeCalledTimes(1);
    a.val = 1;
    expect(spy).toHaveBeenNthCalledWith(2, 1);
    expect(spy).toHaveBeenNthCalledWith(3, 0);
    expect(spy).toBeCalledTimes(3);
    expect(a.val).toBe(0);
    expect(spy_2).toHaveBeenNthCalledWith(1, 0);

    a.val = 2;
    expect(spy).toBeCalledTimes(4);
    expect(spy).toHaveBeenNthCalledWith(4, 2);
    expect(spy_2).toBeCalledTimes(1);
  });

  test("cached value as first argument of body function", () => {
    const spy = jest.fn();
    const spy_on = jest.fn();

    const a = mut(1);
    const stop = mut(0);
    const s = selec((cache) => (spy(cache), a.val, stop.val ? cache : a.val));

    sync(s, spy_on);
    expect(spy).toBeCalledWith(undefined); spy.mockReset();
    expect(spy_on).toBeCalledWith(1); spy_on.mockReset();

    a.val = 2;
    expect(spy).toBeCalledWith(1); spy.mockReset();
    expect(spy_on).toBeCalledWith(2); spy_on.mockReset();

    stop.val = 1;
    expect(spy).toBeCalledWith(2); spy.mockReset();
    expect(spy_on).toBeCalledTimes(0);

    a.val = 3;
    expect(spy).toBeCalledWith(2); spy.mockReset();
    expect(spy_on).toBeCalledTimes(0);

    stop.val = 0;
    expect(spy).toBeCalledWith(2); spy.mockReset();
    expect(spy_on).toBeCalledWith(3); spy_on.mockReset();
  });

  test("two nested selectors just reading in reaction order", () => {
    const spy = jest.fn();

    const a = mut([]);
    const b = comp(() => a.val[0]);
    const c = comp(() => b.val);

    on(() => a.val, () => spy(c.val));

    a.val = [2];
    expect(spy).toBeCalledWith(2); spy.mockReset();
    a.val = [2];
    expect(spy).toBeCalledWith(2); spy.mockReset();
    a.val = [4];
    expect(spy).toBeCalledWith(4); spy.mockReset();
  });
});
