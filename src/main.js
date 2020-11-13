/**
 * 0: rels or (sync for expr)
 * 1: deps
 * 2: (valid for sel)
 */
let context_node;

// node: box or sel node
const read = (node) => {
  if (context_node) {
    context_node[1].add(node);
    node[0].add(context_node);
  }
};

const write = (box_node) => {
  box_node[0].forEach((rel) => {
    rel.length === 3 ? (rel[2] = 0) : rel[0]();
  });
};

const box = (value, change_listener) => {
  const box_node = [new Set()];
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
          Object.is(value, next_value) ||
            ((value = next_value), write(box_node));
        },
  ];
};

// node: sel or expr node
const free = (node, type) => (
  node[type].forEach((target) => target[1-type].delete(node))
)

const sel = (body) => {
  const sel_node = [new Set(), new Set(), 0];
  let cache;
  return [
    () => {
      read(sel_node);
      if (!sel_node[2]) {
        const stack = context_node;

        free(sel_node, 1);
        context_node = sel_node;

        cache = body();
        context_node = stack;
        sel_node[2] = 1;
      }
      return cache;
    },
    () => (free(sel_node, 1), free(sel_node, 0)),
  ]
};

const expr = (body, sync = body) => {
  const expr_node = [sync, new Set()];
  return [
    // start
    function () {
      let result;
      const stack = context_node;

      free(expr_node, 1);
      context_node = expr_node;

      result = body.apply(this, arguments);
      context_node = stack;
      return result;
    },
    // stop
    () => free(expr_node, 1),
  ];
};

module.exports = { box, sel, expr };
