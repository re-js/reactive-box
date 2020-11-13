const { mut, selec } = require("./lib");

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
});
