const { mut, selec, sel, run } = require("./lib");

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
    const s = sel(function () {
      spy(this);
    })[0];
    const m = {};
    s.call(m);
    expect(spy).toBeCalledWith(m);
  });
});
