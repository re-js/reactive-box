const { performance } = require('perf_hooks');
const stat = require('simple-statistics');
const { box, sel, expr } = require('../..');

const deep = 8;
let init_times = [];
let times = [];

let has_last_answer = 0;
let last_anwser = 0

for (let i = 0; i < 10; i++) {
  const [ iter_init_time, iter_times, iter_anwser ] = tree(deep, 10);
  init_times.push(iter_init_time);
  times.push(...iter_times);

  if (!has_last_answer) {
    last_anwser = iter_anwser;
    has_last_answer = 1;
  } else {
    if (iter_anwser !== last_anwser) throw 'Results not eqaul'
  }
}

const memory_used = process.memoryUsage();

console.log('Boxes:', (2 << deep));
console.log('Selectors:', (2 << deep) - 2);

console.log('Inits time (ms):');
console.log('Mean:', stat.mean(init_times));
console.log('Median:', stat.median(init_times));
console.log('Harmonic mean:', stat.harmonicMean(init_times));
console.log('Geometric mean:', stat.geometricMean(init_times));

console.log('Ops time (ms):')
console.log('Mean:', stat.mean(times));
console.log('Median:', stat.median(times));
console.log('Harmonic mean:', stat.harmonicMean(times));
console.log('Geometric mean:', stat.geometricMean(times));

console.log('Memory used (MB):')
for (let key in memory_used) {
  console.log(`${key}: ${Math.round(memory_used[key] / 1024 / 1024 * 100) / 100}`);
}

function tree(deep, iters) {
  const boxes = [];
  let answer;
  let time, init_time;
  const times = [];

  function level(deep) {
    if (deep === 0) {
      const x = box(0);
      boxes.push(x);
      return x;
    };

    const a = level(deep - 1);
    const b = level(deep - 1);
    return sel(() => a[0]() + b[0]());
  }

  function make(deep) {
    const a = level(deep);
    const b = level(deep);
    expr(() => (answer = a[0]() + b[0]()))[0]();
  }

  function init(deep) {
    init_time = performance.now();
    make(deep);
    init_time = performance.now() - init_time;
  }

  function op(ind) {
    let total = 0, i = 0, len = boxes.length;

    time = performance.now();
    for (;i < len;i++) {
      boxes[i][1](ind + 1);
      total += answer;
    }
    time = performance.now() - time;
    times.push(time);

    // console.log(`Op${ind + 1}:`, total, '\ttime:', time);
  }

  init(deep);
  for (let i = 0; i < iters; i++) op(i);

  return [
    init_time,
    times,
    answer
  ]
}
