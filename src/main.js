/**
 * 0: rels or (sync for expr)
 * 1: deps
 * 2: (valid for sel)
 * 3: (recalc for sel)
 */
let context_node;
let active_bound;

// node: sel or expr node
// type: 0 - rels, 1 - deps
const free = (node, type) => {
  node[type].forEach((target) => target[1 - type].delete(node));
  node[type].clear();
};

// node: box or sel node
const read = (node) => {
  if (context_node) {
    context_node[1].add(node);
    node[0].add(context_node);
  }
};

const write = (box_node) => {
  if (active_bound) box_node[0].forEach((rel) => active_bound.add(rel));
  else {
    const exprs = new Set();
    const sels = new Set();
    let limit = 10000;

    active_bound = new Set(box_node[0]);
    try {
      while (active_bound.size) {
        active_bound.forEach((node) => {
          if (node.length === 2) exprs.add(node);
          else {
            if (node[0].size) sels.add(node);
            else node[2] = 0;
          }
          free(node, 1);
        });
        active_bound.clear();

        sels.forEach((sel_node) => {
          if (sel_node[3]()) {
            sel_node[0].forEach((rel) => active_bound.add(rel));
            free(sel_node, 0);
          }
        });
        sels.clear();

        if (!active_bound.size) {
          const iter = exprs.values();
          let expr_node;
          while ((expr_node = iter.next().value)) {
            expr_node[0]();
            exprs.delete(expr_node);
            if (active_bound.size) break;
          }
        }

        if (!--limit) throw new Error("Infinity reactions loop");
      }
    } finally {
      active_bound = 0;
    }
  }
};

const box = (value, change_listener, comparer = Object.is) => {
  const box_node = [new Set()];
  return [
    () => (read(box_node), value),
    change_listener
      ? (next_value) => {
          if (!comparer(value, next_value)) {
            const prev_value = value;
            value = next_value;
            write(box_node);
            change_listener(value, prev_value);
          }
        }
      : (next_value) => {
          if (!comparer(value, next_value)) {
            value = next_value;
            write(box_node);
          }
        },
  ];
};

const sel = (body, comparer = Object.is) => {
  let cache;
  let last_context;
  const run = () => {
    const stack = context_node;
    context_node = sel_node;
    try {
      return body.call(last_context);
    } finally {
      context_node = stack;
    }
  }
  const sel_node = [new Set(), new Set(), 0, () => {
    let next = run();
    return comparer(cache, next)
      ? false
      : ((cache = next), true);
  }];
  return [
    function () {
      read(sel_node);
      last_context = this;
      if (!sel_node[2]) {
        cache = run();
        sel_node[2] = 1;
      }
      return cache;
    },
    () => {
      free(sel_node, 1);
      free(sel_node, 0);
      sel_node[2] = cache = 0;
      last_context = null;
    },
  ];
};

const expr = (body, sync) => {
  let last_context;
  if (!sync) sync = () => run.call(last_context);
  const expr_node = [sync, new Set()];
  function run() {
    let result;
    const stack = context_node;

    expr_node[1].size && free(expr_node, 1);
    context_node = expr_node;
    try {
      result = body.apply((last_context = this), arguments);
    } finally {
      context_node = stack;
    }
    return result;
  }
  return [
    run,
    () => {
      free(expr_node, 1);
      last_context = null;
    },
  ];
};

module.exports = { box, sel, expr };
