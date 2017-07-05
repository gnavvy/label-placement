import {
  getIndices,
  convertRayIndexToTheta,
  getBoundingBox,
  getLineSegmentIntersect,
  sampleCandidates
} from './utils';

const DEFAULT_LABEL_WIDTH = 100;
const DEFAULT_LABEL_HEIGTH = 100;
const DEFAULT_POINT_WIDTH = 15;
const DEFAULT_POINT_HEIGHT = 15;
const DEFAULT_NUM_RAYS = 64;
const DEFAULT_STEP_SIZE = 5;

export default class LabelPlacement {
  constructor(
    points,
    {
      canvasWidth,
      canvasHeight,
      pointWidth = DEFAULT_POINT_WIDTH,
      pointHeight = DEFAULT_POINT_HEIGHT,
      labelWidth = DEFAULT_LABEL_WIDTH,
      labelHeight = DEFAULT_LABEL_HEIGTH,

      numRays = DEFAULT_NUM_RAYS,
      stepSize = DEFAULT_STEP_SIZE
    }
  ) {
    this.points = points;

    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    this.rayLength = canvasWidth + canvasHeight;

    this.pointWidth = pointWidth;
    this.pointHeight = pointHeight;
    this.pointRadius = Math.sqrt(
      pointWidth * pointWidth + pointHeight * pointHeight
    );

    this.labelWidth = labelWidth;
    this.labelHeight = labelHeight;

    this.numRays = numRays;
    this.stepSize = stepSize;
  }

  updateCanvasSize({width, height}) {
    this.canvasWidth = width;
    this.canvasHeight = height;
    this.rayLength = width + height;
  }

  updateLabelSize({width, height}) {
    this.labelWidth = width;
    this.labelHeight = height;
  }

  _getRayCandidateMap() {
    const {labelWidth, labelHeight, numRays, pointRadius} = this;

    return getIndices(numRays).reduce((candidateMap, rayIndex) => {
      const theta = convertRayIndexToTheta(rayIndex, numRays);
      const labelRadius =
        Math.max(
          Math.abs(labelWidth * Math.cos(theta)),
          Math.abs(labelHeight * Math.sin(theta))
        ) / 2;
      candidateMap[rayIndex] = [[0, pointRadius + labelRadius]];
      return candidateMap;
    }, {});
  }

  _getFilteredCandidateMap(queryPoint) {
    const rayCandidateMap = this._getRayCandidateMap();
    // console.log(rayCandidateMap);
    const {labelWidth, labelHeight, pointRadius, rayLength, numRays} = this;

    this.points.forEach(point => {
      // a ----------- c
      // |    -----    |
      // |    | x |    |
      // |    -----    |
      // b ----------- d
      const [a, b, c, d] = getBoundingBox(
        point,
        labelWidth + pointRadius * 2,
        labelHeight + pointRadius * 2
      );

      const sideLineSegments = [
        [{x: a.x, y: a.y}, {x: b.x, y: b.y}],
        [{x: a.x, y: a.y}, {x: c.x, y: c.y}],
        [{x: b.x, y: b.y}, {x: d.x, y: d.y}],
        [{x: c.x, y: c.y}, {x: d.x, y: d.y}]
      ];

      Object.keys(rayCandidateMap).forEach(i => {
        // convert ray index to ray theta
        const theta = convertRayIndexToTheta(i, numRays);
        // create a fake end point for the ray, for interact calculation
        const rayEndPoint = {
          x: queryPoint.x + Math.cos(theta) * rayLength,
          y: queryPoint.y + Math.sin(theta) * rayLength
        };

        const range = sideLineSegments
          // get intersection between the ray segment and each side segment
          .map(([p1, p2]) =>
            getLineSegmentIntersect(p1, p2, queryPoint, rayEndPoint)
          )
          // get rid of non-intersect ones
          .filter(Boolean)
          // get the distance instead of x, y
          .map(({x, y}) => {
            const {x: qx, y: qy} = queryPoint;
            return Math.sqrt((qx - x) * (qx - x) + (qy - y) * (qy - y));
          })
          .sort((p, q) => p - q);

        if (range.length > 0) {
          if (range.length === 1) {
            range.unshift(0);
          }
          rayCandidateMap[i].push(range);
        }
      });
    });

    return rayCandidateMap;
  }

  getLabelPosition(queryPoint) {
    if (Number.isNaN(queryPoint.x) || Number.isNaN(queryPoint.y)) {
      return null;
    }

    const {rayLength, stepSize, numRays} = this;
    const rayCandidateMap = this._getFilteredCandidateMap(queryPoint);

    let theta = null;

    const candidates = sampleCandidates(rayLength, stepSize);

    const minRadius = candidates.find(d => {
      const placeableRays = Object.keys(rayCandidateMap).filter(rayIndex => {
        // check if d is beyond all (overlapping) ranges
        return rayCandidateMap[rayIndex].every(
          range => d < range[0] || range[1] < d
        );
      });
      if (placeableRays.length > 0) {
        theta = convertRayIndexToTheta(placeableRays[0], numRays);
        return true;
      }
      return false;
    });

    return {
      x: queryPoint.x + minRadius * Math.cos(theta),
      y: queryPoint.y + minRadius * Math.sin(theta)
    };
  }
}
