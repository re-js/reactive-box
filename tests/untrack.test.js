const { box, run, runer, untrack } = require("./lib");

describe("Untrack", () => {
  test("should work untrack", () => {
    const spy = jest.fn();
    const a = box(0);
    run(() => {
      a[0]();
      spy();
    });

    a[1](1);
    expect(spy).toHaveBeenCalledTimes(2);

    spy.mockClear();

    run(() => {
      const finish = untrack();
      untrack()();
      const nested_finish = untrack();
      a[0]();
      nested_finish();
      finish();
      spy();
    });

    a[1](1);
    expect(spy).toHaveBeenCalledTimes(1);
  });

  test("should work nested autotrack in untrack", () => {
    const spy = jest.fn();
    const spy_r = jest.fn();
    const a = box(0);

    const r = runer(() => {
      spy_r(a[0]());
    });

    run(() => {
      const track = untrack();
      r();
      a[0]();
      track();
      spy();
    });

    expect(spy_r).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledTimes(1);

    a[1](1);
    expect(spy_r).toHaveBeenCalledTimes(2);
    expect(spy).toHaveBeenCalledTimes(1);
  });
});
