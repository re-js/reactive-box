const { mut, run, comp, batch } = require("./lib");

describe("Batch", () => {
  test("should work batch", () => {
    const spy = jest.fn();
    const a = mut(0);
    const b = mut(0);
    const c = comp(() => a.val * 10 + b.val);
    run(() => spy(c.val));

    expect(spy).toHaveBeenNthCalledWith(1, 0);
    expect(spy).toHaveBeenCalledTimes(1);

    a.val = 1;
    expect(spy).toHaveBeenNthCalledWith(2, 10);
    expect(spy).toHaveBeenCalledTimes(2);

    b.val = 1;
    expect(spy).toHaveBeenNthCalledWith(3, 11);
    expect(spy).toHaveBeenCalledTimes(3);

    const commit = batch();
    a.val = 2;
    b.val = 2;
    expect(spy).toHaveBeenCalledTimes(3);
    commit();
    expect(spy).toHaveBeenCalledTimes(4);
    expect(spy).toHaveBeenNthCalledWith(4, 22);
  });

  test("should work nested batch", () => {
    const spy = jest.fn();
    const a = mut(0);
    const b = mut(0);
    const c = comp(() => a.val * 10 + b.val);
    run(() => spy(c.val));

    expect(spy).toHaveBeenNthCalledWith(1, 0);
    expect(spy).toHaveBeenCalledTimes(1);

    const commit = batch();

    a.val = 2;
    const nested = batch();
    b.val = 2;
    a.val = 3;
    nested();

    expect(spy).toHaveBeenCalledTimes(1);
    commit();
    expect(spy).toHaveBeenCalledTimes(2);
    expect(spy).toHaveBeenNthCalledWith(2, 32);
  });
});
