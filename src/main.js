
let context_node;

const read = (box_node) => {
  if (context_node) {
    context_node[1].add(box_node);
    box_node[0].add(context_node);
  }
};

const write = (box_node) => {
  box_node[0].forEach(rel => rel[0]());
};

const box = (value, change_listener) => {
  const rels = new Set();
  const box_node = [rels];
  return [
    // get
    () => (read(box_node), value),
    // set
    change_listener
      ? (next_value) => {
          if (!Object.is(value, next_value)) {
            const prev_value = value;
            value = next_value;
            write(box_node);
            change_listener(value, prev_value);
          }
        }
      : (next_value) => {
          Object.is(value, next_value) || ((value = next_value), write(box_node));
        }
  ]
};

const sel = () => {};

const expr = (body, sync) => {
  sync = sync || body;
  const deps = new Set();
  const expr_node = [sync, deps];
  return [
    // start
    function () {
      let result;
      const stack = context_node;

      deps.forEach(dep => dep[0].delete(expr_node));
      context_node = expr_node;

      result = body.apply(this, arguments);
      context_node = stack;
      return result;
    },
    // stop
    () => deps.forEach(dep => dep[0].delete(expr_node))
  ]
}

module.exports = { box, sel, expr }

