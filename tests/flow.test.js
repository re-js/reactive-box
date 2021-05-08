const { mut, run, compflow, flowstop, delay, transaction } = require("./lib");

describe("Flow", () => {
  test("should work flow deps", () => {
    const spy = jest.fn();
    const a = mut(0);
    const b = compflow(() => a.val);
    run(() => spy(b.val));

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenLastCalledWith(0);
    spy.mockReset();

    a.val = 1;
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenLastCalledWith(1);
  });

  test("should work flow comparer", () => {
    const spy = jest.fn();
    const a = mut(0, void 0, () => false);
    const b = compflow(() => a.val, void 0, (a, b) => a === b);
    run(() => spy(b.val));
    a.val = 0;
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenLastCalledWith(0);
    spy.mockReset();

    a.val = NaN;
    a.val = NaN;
    expect(spy).toHaveBeenCalledTimes(2);
    expect(spy).toHaveBeenNthCalledWith(1, NaN);
    expect(spy).toHaveBeenNthCalledWith(2, NaN);
  });

  test("should work flow empty value", async () => {
    const b = compflow(() => flowstop, 15);
    expect(b.val).toBe(15);
  });

  test("should work flow async", async () => {
    const spy = jest.fn();
    const a = mut(1);
    const b = compflow((resolve) => {
      setTimeout(() => resolve(a.val + 5), 10);
      setTimeout(() => resolve(a.val + 10), 100);
      return a.val;
    });
    run(() => spy(b.val));

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenLastCalledWith(1);
    spy.mockReset();

    await delay(50);
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenLastCalledWith(6);
    spy.mockReset();

    await delay(100);
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenLastCalledWith(11);
  });

  test("should work flow only stop return", () => {
    const spy = jest.fn();
    const a = mut(0);
    const b = compflow(() => a.val % 2 === 1 ? flowstop : a.val);
    run(() => spy(b.val));

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenLastCalledWith(0);
    spy.mockReset();

    for (let i = 0; i < 5; i++) a.val = i;

    expect(spy).toHaveBeenCalledTimes(2);
    expect(spy).toHaveBeenNthCalledWith(1, 2);
    expect(spy).toHaveBeenNthCalledWith(2, 4);
  });

  test("should work flow resolve", () => {
    const spy = jest.fn();
    const a = mut(0);
    const b = compflow((resolve) => {
      for (let i = 0; i < a.val; i++) {
        resolve(i);
        resolve(i);
      }
      return a.val
    });
    run(() => spy(b.val));

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenLastCalledWith(0);
    spy.mockReset();

    a.val = 3;
    expect(spy).toHaveBeenCalledTimes(3);
    expect(spy).toHaveBeenNthCalledWith(1, 1);
    expect(spy).toHaveBeenNthCalledWith(2, 2);
    expect(spy).toHaveBeenNthCalledWith(3, 3);
  });

  test("should work flow correct exec order", () => {
    const spy = jest.fn();

    const a = mut(0);
    const c = mut(1);
    const b = compflow(() => (c.val > 1 ? a.val : 0));
    run(() => spy(b.val, a.val));

    expect(spy).toHaveBeenLastCalledWith(0, 0);
    expect(spy).toHaveBeenCalledTimes(1);
    spy.mockReset();
    c.val = 2;

    a.val = 1;
    expect(spy).toHaveBeenLastCalledWith(1, 1);
    expect(spy).toHaveBeenCalledTimes(1);
  });

  test("should work flow with transaction", () => {
    const spy = jest.fn();

    const a = mut(0);
    const b = compflow((resolve) => {
      const commit = transaction();
      for (let i = 0; i < a.val; i++) {
        resolve(i);
      }
      commit();
      return a.val
    });
    run(() => spy(b.val, a.val));
    expect(spy).toHaveBeenLastCalledWith(0, 0);
    expect(spy).toHaveBeenCalledTimes(1);
    spy.mockReset();

    a.val = 3;
    // TODO: incorrect result, must be two operations instead of 1
    // expect(spy).toHaveBeenNthCalledWith(1, 2, 3);
    // expect(spy).toHaveBeenNthCalledWith(2, 3, 3);
    // expect(spy).toHaveBeenCalledTimes(2);
    expect(spy).toHaveBeenCalledWith(3, 3);
  });

  test("should cache last value", () => {
    const a = mut(0);

    let i = 0;
    const f = compflow(() => (i++, a.val + 1));
    expect(i).toBe(1);

    expect(f.val).toBe(1);
    expect(f.val).toBe(1);
    expect(i).toBe(1);

    a.val = 1;
    expect(f.val).toBe(2);
    expect(f.val).toBe(2);
    expect(i).toBe(2);
  });

  test("should work simple stop (reset)", () => {
    const spy = jest.fn();
    const a = mut(0);

    const f = compflow(() => a.val);
    run(() => spy(f.val));

    expect(spy).toHaveBeenLastCalledWith(0);
    expect(spy).toHaveBeenCalledTimes(1);
    spy.mockReset();

    f.stop();
    a.val = 1;
    expect(spy).toHaveBeenCalledTimes(0);
  });

  test("stop should work correctly in self", () => {
    const spy = jest.fn();
    const spy_2 = jest.fn();
    const a = mut(0);

    const f = compflow(() => {
      if (a.val) {
        f.stop();
      }
      spy(a.val);
      return a.val;
    });

    run(() => spy_2(f.val));

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

    const f = compflow(() => {
      spy(a.val);
      if (a.val === 1) {
        f.stop()
        a.val = 0;
        f.val;
      }
      return a.val;
    });
    run(() => spy_2(f.val));

    expect(spy).toBeCalledTimes(1);
    a.val = 1;
    expect(spy).toHaveBeenNthCalledWith(2, 1);
    expect(spy).toBeCalledTimes(2);

    expect(a.val).toBe(0);
    expect(spy_2).toHaveBeenNthCalledWith(1, 0);

    a.val = 2;
    expect(spy).toBeCalledTimes(2);
    expect(spy_2).toBeCalledTimes(1);
  });

});
