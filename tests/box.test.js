const { mut, run } = require("./lib");

describe("Box", () => {
  test("should work box", () => {
    const spy = jest.fn();
    const a = mut(0);
    run(() => spy(a.val));

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenLastCalledWith(0);
    a.val = 1;
    expect(spy).toHaveBeenCalledTimes(2);
    expect(spy).toHaveBeenLastCalledWith(1);
    a.val = 1;
    expect(spy).toHaveBeenCalledTimes(2);
  });

  test("should work custom comparer", () => {
    const spy = jest.fn();
    const a = mut(NaN, null, (val, next) => val === next);
    run(() => spy(a.val));

    expect(spy).toBeCalledTimes(1);
    a.val = NaN;
    expect(spy).toBeCalledTimes(2);
  });

  test("should work box change listener", () => {
    const spy = jest.fn();
    const spy1 = jest.fn();
    const a = mut(0, spy);
    run(() => spy1(a.val));
    a.val = 1;
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenNthCalledWith(1, 1, 0);
    a.val = 5;
    expect(spy).toHaveBeenCalledTimes(2);
    expect(spy).toHaveBeenNthCalledWith(2, 5, 1);
    a.val = 5;
    expect(spy).toHaveBeenCalledTimes(2);

    expect(spy1).toHaveBeenNthCalledWith(1, 0);
    expect(spy1).toHaveBeenNthCalledWith(2, 1);
    expect(spy1).toHaveBeenNthCalledWith(3, 5);
    expect(spy1).toHaveBeenCalledTimes(3);
  });
});
