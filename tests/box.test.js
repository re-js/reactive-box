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
    const a = mut(NaN, (val, next) => val === next);
    run(() => spy(a.val));

    expect(spy).toBeCalledTimes(1);
    a.val = NaN;
    expect(spy).toBeCalledTimes(2);
  });
});
