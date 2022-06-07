const { mut, run } = require("./lib");

describe("Flow", () => {
  test("should work flow", () => {
    const spy = jest.fn();

    const a = mut(0);
    const c = mut(1);

    // flow section
    const b = mut(0);
    run(() => {
      b.val = (c.val > 1) ? a.val : 0;
    })
    // end flow section

    // TODO: Whats happends with order of execution if will change depth but not a value?

    run(() => {
      spy(b.val, a.val);
    });

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenLastCalledWith(0, 0);
    c.val = 2;

    a.val = 1;
    expect(spy).toHaveBeenNthCalledWith(2, 0, 1); // TODO: broken execution order
    expect(spy).toHaveBeenNthCalledWith(3, 1, 1);

    // expect(spy).toHaveBeenCalledTimes(2);
  });
});
