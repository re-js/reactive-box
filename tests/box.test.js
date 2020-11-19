const { mut, run } = require("./lib");

describe("Box", () => {
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

    expect(spy1).toHaveBeenCalledTimes(3);
    expect(spy1).toHaveBeenNthCalledWith(2, 1);
    expect(spy1).toHaveBeenNthCalledWith(3, 5);
  });
});
