/**
 * 0: rels or (sync for expr)
 * 1: deps
 * 2: level
 * 3: (valid for sel)
 * 4: (recalc for sel)
 */
let context_node;
let context_untrack;
let level_nodes;
let stack_nodes = new Map();
let level_current;
let batch_nodes;

const reactions_loop_limit = 1000000;
const flow_stop = Symbol();

// node: sel or expr node
// type: 0 - rels, 1 - deps
const free = (node, type) => {
  node[type].forEach((target) => target[1 - type].delete(node));
  node[type].clear();
};

// node: box or sel node
const read = (node) => {
  if (context_node && !context_untrack) {
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

const node_expand = (node) =>
  node[0].forEach((rel) => {
    const stack_node_h = stack_nodes.get(rel);
    if (stack_node_h) {
      if (stack_node_h[0]) stack_node_h[1] = 1;
      return;
    }
    // [<now_in_execution>, <marked_for_recalc>, <is_stopped>]
    stack_nodes.set(rel, [0, 0, 0]);

    let level = rel[2];
    let list = level_nodes.get(level);
    !list && level_nodes.set(level, (list = new Set()));

    if (!level_current || level_current > level) level_current = level;

    list.add(rel);
  });

const throw_infinity_reactions = () => {
  throw new Error("Infinity reactions loop");
};

const write = (box_node, is_array) => {
  if (batch_nodes)
    return is_array
      ? box_node.forEach(batch_nodes.add.bind(batch_nodes))
      : batch_nodes.add(box_node);

  const stack_level_current = level_current;
  const stack_level_nodes = level_nodes;

  level_current = 0;
  level_nodes = new Map();

  is_array ? box_node.forEach(node_expand) : node_expand(box_node);

  try {
    let limit = reactions_loop_limit;

    while (level_current) {
      let nodes = level_nodes.get(level_current);

      if (!nodes.size) {
        level_current = 0;
        level_nodes.forEach(
          (list, level) =>
            list.size &&
            (!level_current || level_current > level) &&
            (level_current = level)
        );
      }
      if (!level_current) break;
      nodes = level_nodes.get(level_current);

      const iter = nodes.values();
      const node = iter.next().value;

      const stack_node_h = stack_nodes.get(node);
      stack_node_h[0] = 1;
      const len = node.length;

      if (stack_node_h[2]) nodes.delete(node);
      else
        do {
          stack_node_h[1] = 0;
          let expr, sel;

          if (len === 3) expr = 1;
          else {
            if (node[0].size || len === 4) sel = 1 /* sel or flow */;
            else node[3] = 0;
          }

          free(node, 1);
          nodes.delete(node);

          if (expr) node[0]();
          if (sel) {
            if (node[len - 1]()) {
              node_expand(node);
              free(node, 0);
            }
          }
          if (stack_node_h[2]) {
            free(node, 1);
            sel && free(node, 0);
            break;
          }
          if (!--limit) throw_infinity_reactions();
        } while (stack_node_h[1]);

      stack_nodes.delete(node);
    }
  } finally {
    level_current = stack_level_current;
    level_nodes = stack_level_nodes;
  }
};

const batch = () => {
  const stack = batch_nodes;
  batch_nodes = new Set();

  return () => {
    const nodes = batch_nodes;
    batch_nodes = stack;
    nodes.size && write(nodes, 1);
  };
};

const untrack = () => {
  const stack = context_untrack;
  context_untrack = 1;
  return () => (context_untrack = stack);
};

const box = (value, change_listener, is_equals = Object.is) => {
  // rels, _, level
  const box_node = [new Set(), 0, 0];
  return [
    () => (read(box_node), calculate_level(box_node), value),
    change_listener
      ? (next_value) => {
          if (!is_equals(value, next_value)) {
            const prev_value = value;
            value = next_value;
            change_listener(value, prev_value);
            write(box_node);
          }
        }
      : (next_value) => {
          if (!is_equals(value, next_value)) {
            value = next_value;
            write(box_node);
          }
        },
  ];
};

const sel = (body, is_equals = Object.is) => {
  let cache;
  let last_context;
  const run = () => {
    const stack_context_node = context_node;
    const stack_untrack = context_untrack;
    context_untrack = 0;

    const h = stack_nodes.get(sel_node);
    if (h && h[2]) h[2] = 0;

    context_node = sel_node;
    context_node[2] = 0; // clear level

    try {
      return body.call(last_context, cache);
    } finally {
      context_node = stack_context_node;
      context_untrack = stack_untrack;
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
      return !sel_node[3] || is_equals(cache, next)
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
      stack_nodes.has(sel_node) && (stack_nodes.get(sel_node)[2] = 1);
    },
  ];
};

const expr = (body, sync) => {
  let last_context;
  if (!sync) sync = () => run.call(last_context);

  // sync, deps, level
  const expr_node = [sync, new Set(), 0];

  function run() {
    const body_run = () => body.apply((last_context = this), arguments);

    const stack_context_node = context_node;
    const stack_untrack = context_untrack;
    context_untrack = 0;

    context_node = expr_node;
    context_node[2] = 0; // clear level

    let result;
    let h = stack_nodes.get(expr_node);
    let is_entry;
    // [<now_in_execution>, <marked_for_recalc>, <is_stopped>]
    if (!h) {
      stack_nodes.set(expr_node, (is_entry = h = [1, 0, 0]));
    } else if (h[2]) h[2] = 0;

    try {
      if (is_entry) {
        let limit = reactions_loop_limit;
        do {
          expr_node[1].size && free(expr_node, 1);
          h[1] = 0;
          result = body_run();
          if (!--limit) throw_infinity_reactions();
        } while (h[1] && !h[2]);

        stack_nodes.delete(expr_node);
        h[2] && free(expr_node, 1);
      } else {
        result = body_run();
      }
    } finally {
      context_node = stack_context_node;
      context_untrack = stack_untrack;
    }
    return result;
  }

  return [
    run,
    () => {
      free(expr_node, 1);
      last_context = null;
      stack_nodes.has(expr_node) && (stack_nodes.get(expr_node)[2] = 1);
    },
  ];
};

const flow = (fn, empty_value, is_equals = Object.is) => {
  let value = empty_value;

  const resolve = (next_value) => {
    if (!is_equals(value, next_value)) {
      value = next_value;
      write(flow_node);
    }
  };
  const body_run = () => fn(resolve, value);

  const digest_run = () => {
    const stack_context_node = context_node;
    const stack_untrack = context_untrack;
    context_untrack = 0;

    context_node = flow_node;
    context_node[2] = 0; // clear level

    let result;
    let h = stack_nodes.get(flow_node);
    let is_entry;
    // [<now_in_execution>, <marked_for_recalc>, <is_stopped>]
    if (!h) {
      stack_nodes.set(flow_node, (is_entry = h = [1, 0, 0]));
    } else if (h[2]) h[2] = 0;

    try {
      if (is_entry) {
        let limit = reactions_loop_limit;
        do {
          flow_node[1].size && free(flow_node, 1);
          h[1] = 0;
          result = body_run();
          if (!--limit) throw_infinity_reactions();
        } while (h[1] && !h[2]);

        stack_nodes.delete(flow_node);
        h[2] && (free(flow_node, 1), free(flow_node, 0));
      } else {
        result = body_run();
      }
    } finally {
      context_node = stack_context_node;
      context_untrack = stack_untrack;
    }
    return result;
  };
  const run = () => {
    let next = digest_run();
    return next === flow_stop || is_equals(value, next)
      ? false
      : ((value = next), true);
  };

  // rels, deps, level, fn
  const flow_node = [new Set(), new Set(), 0, run];

  return [
    run,
    () => {
      read(flow_node);
      calculate_level(flow_node);
      return value;
    },
    () => {
      free(flow_node, 1);
      free(flow_node, 0);
      value = empty_value;
      stack_nodes.has(flow_node) && (stack_nodes.get(flow_node)[2] = 1);
    },
  ];
};
flow.stop = flow_stop;

module.exports = { box, sel, expr, flow, batch, untrack };
