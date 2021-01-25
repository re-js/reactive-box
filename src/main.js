/**
 * 0: rels or (sync for expr)
 * 1: deps
 * 2: level
 * 3: (valid for sel)
 * 4: (recalc for sel)
 */
let context_node;
let write_phase;
let level_nodes = new Map();
let level_current = 0;
let write_called;
let writable_selectors = new Set();

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

const calculate_level = (node) => {
  if (context_node) {
    if (context_node[2] < node[2] + 1) {
      context_node[2] = node[2] + 1;
    }
  }
};

const write = (box_node) => {
  box_node &&
    box_node[0].forEach((rel) => {
      let level = rel[2];
      let list = level_nodes.get(level);
      !list && level_nodes.set(level, (list = new Set()));

      if (!level_current || level_current > level) level_current = level;

      list.add(rel);
    });

  if (!write_phase) {
    write_phase = 1;

    try {
      let limit = 100000;

      while (level_current) {
        const nodes = level_nodes.get(level_current);

        const iter = nodes.values();
        let node, lev;

        while ((node = iter.next().value)) {
          lev = level_current;

          let expr, sel;

          if (node.length === 3) expr = 1;
          else {
            if (node[0].size) sel = 1;
            else if (writable_selectors.has(node)) {
              writable_selectors.delete(node);
              sel = 1;
            } else node[3] = 0;
          }

          free(node, 1);
          nodes.delete(node);

          if (expr) node[0]();
          if (sel) {
            write_called = 0;
            const changed = node[4]();
            if (write_called) writable_selectors.add(node);
            if (changed) {
              write(node);
              free(node, 0);
            }
          }

          if (!nodes.size && lev === level_current) {
            level_current = 0;
            level_nodes.forEach(
              (list, level) =>
                list.size &&
                (!level_current || level_current > level) &&
                (level_current = level)
            );
            break;
          }

          if (level_current < lev) break;
          if (!--limit) throw new Error("Infinity reactions loop");
        }
      }
    } finally {
      write_phase = 0;
      level_nodes.clear();
      level_current = 0;
      writable_selectors.clear();
    }
  }
  write_called = 1;
};

const transaction = () => {
  const stack = write_phase;
  write_phase = 1;

  return () => {
    write_phase = stack;
    write();
  };
};

const box = (value, change_listener, comparer = Object.is) => {
  // rels, _, level
  const box_node = [new Set(), 0, 0];
  return [
    () => (read(box_node), calculate_level(box_node), value),
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
    const stack_context_node = context_node;
    context_node = sel_node;
    context_node[2] = 0; // clear level
    try {
      return body.call(last_context);
    } finally {
      context_node = stack_context_node;
    }
  };
  // rels, deps, level, is_cached, checker
  const sel_node = [
    new Set(),
    new Set(),
    0,
    0,
    () => {
      let next = run();
      return !sel_node[3] || comparer(cache, next)
        ? false
        : ((cache = next), true);
    },
  ];

  return [
    function () {
      last_context = this;
      read(sel_node);
      if (!sel_node[3]) {
        cache = run();
        sel_node[3] = 1;
      }
      calculate_level(sel_node);
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

  // sync, deps, level
  const expr_node = [sync, new Set(), 0];

  function run() {
    let result;
    const stack = context_node;

    expr_node[1].size && free(expr_node, 1);
    context_node = expr_node;
    context_node[2] = 0; // clear level
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

module.exports = { box, sel, expr, transaction };
