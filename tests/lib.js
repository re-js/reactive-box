const { box, expr, sel, flow, transaction, untrack } = require("..");

module.exports.transaction = transaction;
module.exports.untrack = untrack;

module.exports.box = box;
module.exports.mut = (value, listener, comparer) => {
  const b = box(value, listener, comparer);
  const obj = {};
  Object.defineProperty(obj, "val", {
    get: b[0],
    set: b[1],
  });
  return obj;
};

module.exports.expr = expr;
module.exports.runer = (body, sync) => expr(body, sync)[0];
module.exports.run = (body, sync) => expr(body, sync)[0]();

module.exports.on = (body, fn) => {
  const e = expr(body, () => fn(e[0]()));
  e[0]();
}
module.exports.sync = (body, fn) => {
  const e = expr(body, () => fn(e[0]()));
  fn(e[0]());
}

module.exports.sel = sel;
module.exports.selec = (body, comparer) => sel(body, comparer)[0];
module.exports.comp = (body, comparer) => {
  const s = sel(body, comparer);
  const obj = {};
  Object.defineProperty(obj, "val", {
    get: s[0],
  });
  return obj;
};

module.exports.flow = flow;
module.exports.flowstop = flow.stop;
module.exports.compflow = (body, empty, comparer) => {
  const f = flow(body, empty, comparer);
  f[0]();
  const obj = { stop: f[2] };
  Object.defineProperty(obj, "val", {
    get: f[1],
  });
  return obj;
};

module.exports.delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
