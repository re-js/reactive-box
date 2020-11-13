const { mut, run, comp, selec, runer } = require("./lib");

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

  test("infinity loop error for read and write updates", () => {
    const m = mut(0);
    const r = runer(() => {
      m.val += 1;
    });
    expect(r).toThrow("Infinity reactions loop");
  });

  test("two expr with two sels and one shared and second box change in first expr", () => {
    const spy = jest.fn();
    const m1 = mut(1);
    const m2 = mut(5);
    const s1 = selec(() => m1.val);
    const s2 = selec(() => m2.val);
    const r1 = runer(() => {
      m2.val = s1() + 1;
    });
    const r2 = runer(() => {
      s1();
      spy(s2());
    });

    r2();
    r1();
    expect(spy).toHaveBeenCalledTimes(2);
    expect(spy).toHaveBeenNthCalledWith(2, 2);
    m1.val = 2;
    expect(spy).toHaveBeenCalledTimes(3);
    expect(spy).toHaveBeenNthCalledWith(3, 3);
  });

});
