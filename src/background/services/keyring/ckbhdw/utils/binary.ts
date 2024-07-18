export function search<T, K>(
  items: T[],
  key: K,
  compare: (item: T, key: K) => number,
  insert?: boolean
): number {
  let start = 0;
  let end = items.length - 1;

  while (start <= end) {
    const pos = (start + end) >>> 1;
    const cmp = compare(items[pos], key);

    if (cmp === 0) return pos;

    if (cmp < 0) start = pos + 1;
    else end = pos - 1;
  }

  if (!insert) return -1;

  return start;
}

export function insert<T>(
  items: T[],
  item: T,
  compare: (item1: T, item2: T) => number,
  uniq?: boolean
): number {
  const i = exports.search(items, item, compare, true);

  if (uniq && i < items.length) {
    if (compare(items[i], item) === 0) return -1;
  }

  if (i === 0) items.unshift(item);
  else if (i === items.length) items.push(item);
  else items.splice(i, 0, item);

  return i;
}

export function remove<T, K>(
  items: T[],
  item: K,
  compare: (item: T, key: K) => number
) {
  const i = search(items, item, compare, false);

  if (i === -1) return false;

  splice(items, i);

  return true;
}

function splice<T>(list: T[], i: number) {
  if (i === 0) {
    list.shift();
    return;
  }

  let k = i + 1;

  while (k < list.length) list[i++] = list[k++];

  list.pop();
}
