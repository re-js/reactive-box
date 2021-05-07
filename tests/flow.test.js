const { mut, run, compflow } = require("./lib");

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
