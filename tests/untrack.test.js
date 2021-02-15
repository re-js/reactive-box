const { box, run, untrack } = require("./lib");

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
});
