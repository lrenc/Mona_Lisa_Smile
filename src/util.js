
export function randomInt(a, b) {
  return Math.floor(Math.random() * (b - a + 1)) + a;
}

export function choice(array, prob) {
  let length = array.length;
  if (typeof prob === 'undefined') {
    prob = array.map(() => 1/length);
  }
  let weight = [];
  prob.forEach((item, i) => {
    if (i === 0) {
      weight[i] = prob[i];
    } else {
      weight[i] = weight[i - 1] + prob[i];
    }
  });
  let count = Math.random();
  let index;
  for (let i = 0; i < length; i ++) {
    if (count <= weight[i]) {
      index = i;
      break;
    }
  }
  return array[index];
}

export function clamp(value, min, max) {
	return Math.max(min, Math.min(max, value));
}

export function sample(array, size) {
  let batch = [];
  let length = array.length;
  if (size >= length) {
    return array.slice();
  }
  while (true) {
    let index = randomInt(0, length - 1);
    if (!~batch.indexOf(index)) {
      batch.push(index);
    }
    if (batch.length === size) {
      break;
    }
  }
  let result = [];
  array.forEach((item, index) => {
    if (~batch.indexOf(index)) {
      result.push(item);
    }
  });
  return result;
}
