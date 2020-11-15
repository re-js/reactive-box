const { box, expr, sel } = require("..");

module.exports.box = box;
module.exports.mut = (value) => {
  const b = box(value);
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

module.exports.sel = sel;
module.exports.selec = (body) => sel(body)[0];
module.exports.comp = (body) => {
  const s = sel(body);
  const obj = {};
  Object.defineProperty(obj, "val", {
    get: s[0],
  });
  return obj;
};
