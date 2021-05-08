const { mut, run, compflow, flowstop } = require("./lib");

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
});
