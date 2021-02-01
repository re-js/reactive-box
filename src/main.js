/**
 * 0: rels or (sync for expr)
 * 1: deps
 * 2: level
 * 3: (valid for sel)
 * 4: (recalc for sel)
 */
let context_node;
// let write_phase;
let level_nodes;
let stack_nodes = new Map();
let level_current;
let transaction_nodes;

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

// const digest = () => {
//   const stack_write_phase = write_phase;
//   write_phase = 1;

//   try {
//     while (level_current) {
//       let nodes = level_nodes.get(level_current);

//       if (!nodes.size) {
//         level_current = 0;
//         level_nodes.forEach(
//           (list, level) =>
//             list.size &&
//             (!level_current || level_current > level) &&
//             (level_current = level)
//         );
//       }
//       if (!level_current) break;
//       nodes = level_nodes.get(level_current);

//       const iter = nodes.values();
//       const node = iter.next().value;

//       let expr, sel;

//       if (node.length === 3) expr = 1;
//       else {
//         if (node[0].size) sel = 1;
//         else node[3] = 0;
//       }

//       free(node, 1);
//       nodes.delete(node);

//       const stack_node_h = stack_nodes.get(node);

//       stack_node_h[0] = 1;
//       if (expr) node[0]();
//       if (sel) {
//         if (node[4]()) {
//           node_expand(node);
//           free(node, 0);
//         }
//       }

//       if (stack_node_h[1]) console.log('AAAAAAAA!!!!!');
//       stack_nodes.delete(node);
//     }
//   } finally {
//     write_phase = stack_write_phase;
//     if (!write_phase) {
//       level_nodes.clear();
//       level_current = 0;
//       stack_nodes.clear();
//     }
//   }
// };

const node_expand = (node) => {
  node &&
    node[0].forEach((rel) => {
      const stack_node_h = stack_nodes.get(rel);
      if (stack_node_h) {
        if (stack_node_h[0]) stack_node_h[1] = 1;
        return;
      }
      stack_nodes.set(rel, [0, 0]);

      let level = rel[2];
      let list = level_nodes.get(level);
      !list && level_nodes.set(level, (list = new Set()));

      if (!level_current || level_current > level) level_current = level;

      list.add(rel);

      // Мне видимо так же в стек нужно отпавлять и level_nodes
      // и level_current
      // Что бы для каждого digest цикла был свой набор контекста. (уровень и ноды)
      // и!
      // Будет сквозной набор нод stack_nodes, который не будет позволять
      // зупаскать ноды выбранные в очередь на запуск во внешних циклах записи

      // А те ноды что в процессе помечаются флагом на необходимость перезапуска
      // и сами себя перезапускают, так мы уходим от переполнения по рекурсии
    });
}

const write = (box_node, set_of) => {
  if (transaction_nodes) return !set_of
    ? transaction_nodes.add(box_node)
    : box_node.forEach(transaction_nodes.add.bind(transaction_nodes));

  const stack_level_current = level_current;
  const stack_level_nodes = level_nodes;
  // const stack_write_phase = write_phase;
  level_current = 0;
  level_nodes = new Map();
  // write_phase = 1;

  !set_of
    ? node_expand(box_node)
    : box_node.forEach(node_expand);

  try {
    let limit = 1000000;

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

      do {
        stack_node_h[1] = 0;
        let expr, sel;

        if (node.length === 3) expr = 1;
        else {
          if (node[0].size) sel = 1;
          else node[3] = 0;
        }

        free(node, 1);
        nodes.delete(node);

        if (expr) node[0]();
        if (sel) {
          if (node[4]()) {
            node_expand(node);
            free(node, 0);
          }
        }

        if (!--limit) throw new Error("Infinity reactions loop");
      } while (stack_node_h[1]);

      // if (stack_node_h[1]) console.log('AAAAAAAA!!!!!');
      stack_nodes.delete(node);
    }
  } finally {
    level_current = stack_level_current;
    level_nodes = stack_level_nodes;

    // write_phase = stack_write_phase;

    // if (!write_phase) {
    //   level_nodes.clear();
    //   level_current = 0;
    //   stack_nodes.clear();
    // }
  }

};

const transaction = () => {
  const stack = transaction_nodes;
  transaction_nodes = new Set();

  return () => {
    const nodes = transaction_nodes;
    // if (transaction_nodes.size) {
    //   transaction_nodes.forEach(
    //     !stack
    //       ? node_expand
    //       : stack.add.bind(stack)
    //   );
    // }
    transaction_nodes = stack;
    nodes.size && write(nodes, 1);
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
