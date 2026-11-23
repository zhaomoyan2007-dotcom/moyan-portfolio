const targetHeight = .22;
const maxHeight = .36;
const gap = .0055;

export function filmRatio(img) {
  return img.naturalWidth && img.naturalHeight ? img.naturalWidth / img.naturalHeight : 0;
}

function planRows(ratios) {
  const aspects = ratios.map(ratio => Number.isFinite(ratio) && ratio > 0 ? ratio : 16/9);
  const costs = Array(aspects.length + 1).fill(Infinity);
  const next = [];
  costs[aspects.length] = 0;

  // Choose row breaks globally so the last few images don't end up in an oversized row.
  for (let start = aspects.length - 1; start >= 0; start--) {
    let sum = 0;
    for (let count = 1; count <= 6 && start + count <= aspects.length; count++) {
      sum += aspects[start + count - 1];
      const fullHeight = (1 - gap * (count - 1)) / sum;
      const height = Math.min(maxHeight, fullHeight);
      const width = height / fullHeight;
      const cost = (Math.log(height / targetHeight)) ** 2 + 2 * (1 - width) ** 2
        + (count === 1 && aspects.length > 1 ? .32 : .04) + costs[start + count];
      if (cost < costs[start]) {
        costs[start] = cost;
        next[start] = { columns: aspects.slice(start, start + count), width };
      }
    }
  }
  const rows = [];
  for (let start = 0; start < aspects.length; start += next[start].columns.length) rows.push(next[start]);
  return { rows, cost: costs[0] };
}

export function filmRows(ratios) {
  return planRows(ratios).rows;
}

export function filmRowStyle({ columns, width }) {
  return {
    width: `${width * 100}%`,
    gridTemplateColumns: columns.map(ratio => `minmax(0,${ratio}fr)`).join(' ')
  };
}

export function autoFilmOrder(ratios) {
  const original = ratios.map((_, index) => index);
  const sorted = original.slice().sort((a, b) => ratios[b] - ratios[a]);
  const mixed = original.map(i => sorted[i % 2 ? sorted.length - 1 - (i >> 1) : i >> 1]);
  const costFor = order => planRows(order.map(i => ratios[i])).cost;
  let best = original, cost = costFor(original);
  const consider = candidate => {
    const nextCost = costFor(candidate);
    if (nextCost < cost - 1e-8) {
      best = candidate;
      cost = nextCost;
    }
  };
  consider(mixed);
  // Try pair swaps for typical contact sheets, keeping large batches responsive.
  if (original.length <= 24) {
    for (let pass = 0; pass < 3; pass++) {
      const baseline = best;
      for (let a = 0; a < baseline.length; a++) {
        for (let b = a + 1; b < baseline.length; b++) {
          if (ratios[baseline[a]] === ratios[baseline[b]]) continue;
          const candidate = baseline.slice();
          [candidate[a], candidate[b]] = [candidate[b], candidate[a]];
          consider(candidate);
        }
      }
      if (baseline === best) break;
    }
  }
  return best;
}
