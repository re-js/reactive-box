const { box, expr, sel } = require("..");

module.exports.mut = (value) => {
  const b = box(value);
  const obj = {};
  Object.defineProperty(obj, "val", {
    get: b[0],
    set: b[1],
  });
  return obj;
};

module.exports.runer = (body, sync) => expr(body, sync)[0];
module.exports.selec = (body) => sel(body)[0];
