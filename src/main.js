/**
 * 0: rels or (sync for expr)
 * 1: deps
 * 2: deep
 * 3: (valid for sel)
 * 4: (recalc for sel)
 */
let context_node;
// let active_bound;
let write_phase;
let level_nodes = new Map();
let levels = new Set();
// let invalid = new Set();
// let valid = new Set();

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

    // calculate deep
    if (context_node[2] < node[2] + 1) {
      context_node[2] = node[2] + 1;
    }
  }
};

const write = (box_node) => {
  box_node[0].forEach((rel) => {
    const level = rel[2];

    let list = level_nodes.get(level);
    !list && level_nodes.set(level, list = new Set());

    list.add(rel);
    levels.add(level);
  });

  if (!write_phase) {
    write_phase = 1;

    try {
      let limit = 10000;

      while (levels.size) {
        const iter = levels.values();
        let current = iter.next().value;

        while ((level = iter.next().value)) {
          if (level < current) current = level;
        }

        const nodes = level_nodes.get(current);

        nodes.forEach((node) => {
          if (node.length === 3) node[0]();
          else {
            // Perform selector
            if (node[0].size) {
              if (node[4]()) { // if propogate changes
                write(node);
                free(node, 0);
              }
            }
            else node[3] = 0;
          }
          free(node, 1);
        });

        levels.delete(current);
        if (!--limit) throw new Error("Infinity reactions loop");
      }
    }
    finally {
      write_phase = 0;
      level_nodes.clear();
      levels.clear();
    }
  }
};

const box = (value, change_listener, comparer = Object.is) => {
  // rels, _, deep
  const box_node = [new Set(), 0, 0];
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
    context_node[2] = 0; // clear deep
    try {
      return body.call(last_context);
    } finally {
      context_node = stack;
    }
  }
  // rels, deps, deep, is_cached, checker
  const sel_node = [new Set(), new Set(), 0, 0, () => {
    let next = run();
    return comparer(cache, next)
      ? false
      : ((cache = next), true);
  }];
  return [
    function () {
      last_context = this;
      if (!sel_node[3]) {
        cache = run();
        sel_node[3] = 1;
      }
      read(sel_node);
      return cache;
    },
    () => {
      free(sel_node, 1);
      free(sel_node, 0);
      sel_node[3] = cache = 0;
      last_context = null;
    },
  ];
};

const expr = (body, sync) => {
  let last_context;
  if (!sync) sync = () => run.call(last_context);

  // sync, deps, deep
  const expr_node = [sync, new Set(), 0];

  function run() {
    let result;
    const stack = context_node;

    expr_node[1].size && free(expr_node, 1);
    context_node = expr_node;
    context_node[2] = 0; // clear deep
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
