import { box, expr, sel, batch, untrack } from "..";

module.exports.batch = batch;
module.exports.untrack = untrack;

module.exports.box = box;
module.exports.mut = (value, comparer) => {
  const b = box(value, comparer);
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

module.exports.delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
