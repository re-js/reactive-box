const { mut, run, comp } = require("./lib");

describe("Graph", () => {
  test("expr run only once for three deep sel", () => {
    const spy = jest.fn();
    const m = mut(1);
    const a = comp(() => m.val);
    const b = comp(() => a.val);
    const c = comp(() => b.val);
    run(() => c.val, spy);

    expect(spy).toBeCalledTimes(0);
    m.val = 2;
    expect(spy).toBeCalledTimes(1);
  });
});
