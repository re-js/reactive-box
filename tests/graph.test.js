import { mut, run, comp, selec, runer, expr } from "./lib";

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

  test("infinity loop error for expr cycle", () => {
    const m = mut(0);
    const r = runer(() => {
      m.val += 1;
    });
    expect(r).toThrow("Infinity reactions loop");
  });

  test("infinity loop error for write updates", () => {
    const m = mut(0);
    const b = mut(0);
    run(() => {
      if (b.val) m.val += 1;
    });
    expect(() => ++b.val).toThrow("Infinity reactions loop");
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

  test("write and read selector in write phase", () => {
    const spy = jest.fn();
    const a = mut(0);
    const b = mut(1);
    const s_1 = comp(() => b.val + 1);
    const s_2 = comp(() => s_1.val + 1);
    const s_3 = comp(() => s_2.val + 1);

    const e = expr(() => {
      if (a.val > 0) {
        b.val = a.val + 1;
        spy(s_3.val);
      }
    });
    e[0]();

    expect(s_3.val).toBe(4);

    a.val = 1;

    expect(spy).toHaveBeenNthCalledWith(1, 5);
    expect(spy).toBeCalledTimes(1);
  });

  test("deep struct with modify", () => {
    const spy1 = jest.fn();
    const spy2 = jest.fn();
    const a = mut(0);
    const b = mut(0);

    const n1 = comp(() => a.val + 1);
    const n2 = comp(() => n1.val + 1);
    const r1 = comp(() => a.val + "-" + n2.val);

    run(() => {
      spy1(r1.val);
      if (a.val === 1) {
        a.val = 2;
        b.val = 1;
      }
    });
    const r2 = comp(() => {
      return r1.val + "-" + b.val;
    });
    run(() => {
      spy2(r2.val);
    });

    expect(spy1).toHaveBeenNthCalledWith(1, "0-2");
    expect(spy1).toBeCalledTimes(1);
    expect(spy2).toHaveBeenNthCalledWith(1, "0-2-0");
    expect(spy2).toBeCalledTimes(1);

    a.val = 1;

    expect(spy1).toHaveBeenNthCalledWith(2, "1-3");
    expect(spy1).toHaveBeenNthCalledWith(3, "2-4");
    expect(spy1).toBeCalledTimes(3);
    expect(spy2).toHaveBeenNthCalledWith(2, "2-4-1");
    expect(spy2).toBeCalledTimes(2);
  });

  test("binary tree", () => {
    const spy = jest.fn();
    const a1 = mut(0);
    const a2 = mut(0);
    const a3 = mut(0);
    const a4 = mut(0);
    const c1 = comp(() => a1.val + a2.val);
    const c2 = comp(() => a3.val + a4.val);
    const c3 = comp(() => c1.val + c2.val);

    run(() => spy(c3.val));
    expect(spy).toHaveBeenNthCalledWith(1, 0);
    a1.val = 1;
    expect(spy).toHaveBeenNthCalledWith(2, 1);
    a2.val = 1;
    expect(spy).toHaveBeenNthCalledWith(3, 2);
    a3.val = 1;
    expect(spy).toHaveBeenNthCalledWith(4, 3);
    a4.val = 1;
    expect(spy).toHaveBeenNthCalledWith(5, 4);
  });
});
