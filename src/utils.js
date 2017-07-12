const DEGREE_TO_RADIAN = Math.PI / 180;

export function getRandomPoints(numPoints = 100) {
  return Array.from(Array(numPoints)).map((_, i) => ({
    id: i,
    x: Math.random(),
    y: Math.random()
  }));
}

export function getIndices(numIndices = 100) {
  return Array.from(Array(numIndices)).map((_, i) => i);
}

export function convertRayIndexToTheta(index, numRays = 64) {
  return 360 * DEGREE_TO_RADIAN * index / numRays;
}

export function sampleCandidates(range, stepSize) {
  const numCandidates = Math.ceil(range / stepSize);
  return Array.from(Array(numCandidates)).map((_, i) => i * stepSize);
}

export function getBoundingBox({x, y}, width, height) {
  return [
    {x: x - width / 2, y: y - height / 2},
    {x: x - width / 2, y: y + height / 2},
    {x: x + width / 2, y: y - height / 2},
    {x: x + width / 2, y: y + height / 2}
  ];
}

export function getLineIntersect({x: x1, y: y1}, {x: x2, y: y2}, {x: x3, y: y3}, {x: x4, y: y4}) {
  const denominator = (y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1);
  if (denominator === 0) {
    return null;
  }
  const ua = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / denominator;
  const ub = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / denominator;
  return {
    x: x1 + ua * (x2 - x1),
    y: y1 + ua * (y2 - y1),
    betweenP1P2: ua >= 0 && ua <= 1,
    betweenP3P4: ub >= 0 && ub <= 1
  };
}

export function getLineSegmentIntersect(p1, p2, p3, p4) {
  const intersect = getLineIntersect(p1, p2, p3, p4);
  if (!intersect) {
    return null;
  }

  const {x = null, y = null, betweenP1P2 = null, betweenP3P4 = null} = intersect;

  return betweenP1P2 && betweenP3P4 ? {x, y} : null;
}

// p: query point, q: ray end point, [a, b, c, d]: four corners of bbox
export function getPointBoundingBoxIntersectRange([p, q], [a, b, c, d]) {
  return (
    [
      [{x: a.x, y: a.y}, {x: b.x, y: b.y}],
      [{x: a.x, y: a.y}, {x: c.x, y: c.y}],
      [{x: b.x, y: b.y}, {x: d.x, y: d.y}],
      [{x: c.x, y: c.y}, {x: d.x, y: d.y}]
    ]
      // get intersection between the ray segment and each side segment
      .map(([p1, p2]) => getLineSegmentIntersect(p1, p2, p, q))
      // get rid of non-intersect ones
      .filter(Boolean)
      // get the distance instead of x, y
      .map(({x, y}) => {
        const {x: px, y: py} = p;
        return Math.sqrt((px - x) * (px - x) + (py - y) * (py - y));
      })
  );
}
