/* global document, window,*/
/* eslint-disable no-console */
import React, {Component} from 'react';
import {render} from 'react-dom';

const NUM_POINTS = 100;
const NUM_RAYS = 64;
const DEGREE_TO_RADIAN = Math.PI / 180;
const POINT_RADIUS = 15;
const LABEL_WIDTH = 100;
const LABEL_HEIGHT = 60;
const STEP_SIZE = 5;

function getRandomPoints(numPoints = 100) {
  return Array.from(Array(numPoints)).map((_, i) => ({
    id: i,
    x: Math.random(),
    y: Math.random()
  }));
}

function getRayIndices(numRays = 64) {
  return Array.from(Array(numRays)).map((_, i) => i);
}

function getThetaByIndex(i, numRays = 64) {
  return 360 * DEGREE_TO_RADIAN * i / numRays;
}

function getCandidates(range, stepSize) {
  const numCandidates = Math.ceil(range / stepSize);
  return Array.from(Array(numCandidates)).map((_, i) => i * stepSize);
}

function getRectangleCorners(center, width, height) {
  const {x, y} = center;
  return [
    {x: x - width / 2, y: y - height / 2},
    {x: x - width / 2, y: y + height / 2},
    {x: x + width / 2, y: y - height / 2},
    {x: x + width / 2, y: y + height / 2}
  ];
}

function getLineIntersect(
  {x: x1, y: y1},
  {x: x2, y: y2},
  {x: x3, y: y3},
  {x: x4, y: y4}
) {
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

function getLineSegmentIntersect(p1, p2, p3, p4) {
  const intersect = getLineIntersect(p1, p2, p3, p4);
  if (!intersect) {
    return null;
  }

  const {
    x = null,
    y = null,
    betweenP1P2 = null,
    betweenP3P4 = null
  } = intersect;

  return betweenP1P2 && betweenP3P4 ? {x, y} : null;
}

class Demo extends Component {
  constructor(props) {
    super(props);

    this.state = {
      width: 0,
      height: 0,
      points: getRandomPoints(NUM_POINTS),
      hovered: null,
      candidateMap: null,
      position: null
    };

    this.handleHovering = this.handleHovering.bind(this);
  }

  componentWillMount() {
    window.addEventListener('resize', this.handleResize.bind(this));
    this.handleResize();
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.handleResize.bind(this));
  }

  handleResize() {
    const {innerWidth: width, innerHeight: height} = window;
    const points = this.state.points.map(point => ({
      ...point,
      x: point.x * width,
      y: point.y * height
    }));

    this.setState({width, height, points});
  }

  handleHovering(queryPoint) {
    if (!queryPoint) {
      return;
    }

    const {width, height} = this.state;
    // width + height > diagonal length > all distances between points
    const rayLength = width + height;
    const pointRadius = Math.sqrt(2) * POINT_RADIUS;
    const rayMap = getRayIndices(NUM_RAYS).reduce((result, index) => {
      const theta = getThetaByIndex(index, NUM_RAYS);
      const labelRadius =
        Math.max(
          Math.abs(LABEL_WIDTH * Math.cos(theta)),
          Math.abs(LABEL_HEIGHT * Math.sin(theta))
        ) / 2;
      result[index] = [[0, pointRadius + labelRadius]];
      return result;
    }, {});

    this.state.points.forEach(point => {
      // a ----------- c
      // |    -----    |
      // |    | x |    |
      // |    -----    |
      // b ----------- d
      const [a, b, c, d] = getRectangleCorners(
        point,
        LABEL_WIDTH + POINT_RADIUS * 2,
        LABEL_HEIGHT + POINT_RADIUS * 2
      );

      const sideSegments = [
        [{x: a.x, y: a.y}, {x: b.x, y: b.y}],
        [{x: a.x, y: a.y}, {x: c.x, y: c.y}],
        [{x: b.x, y: b.y}, {x: d.x, y: d.y}],
        [{x: c.x, y: c.y}, {x: d.x, y: d.y}]
      ];

      Object.keys(rayMap).forEach(i => {
        // convert ray index to ray theta
        const theta = getThetaByIndex(i, NUM_RAYS);
        // create a fake end point for the ray, for interact calculation
        const rayEndPoint = {
          x: queryPoint.x + Math.cos(theta) * rayLength,
          y: queryPoint.y + Math.sin(theta) * rayLength
        };

        const range = sideSegments
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
          rayMap[i].push(range);
        }
      });
    });

    let theta = null;
    const radius = getCandidates(rayLength, STEP_SIZE).find(d => {
      const placeableRays = Object.keys(rayMap).filter(rayIndex => {
        // check if d is beyond all (overlapping) ranges
        return rayMap[rayIndex].every(range => d < range[0] || range[1] < d);
      });
      if (placeableRays.length > 0) {
        theta = getThetaByIndex(placeableRays[0], NUM_RAYS);
        return true;
      }
      return false;
    });

    const position = {
      x: queryPoint.x + radius * Math.cos(theta),
      y: queryPoint.y + radius * Math.sin(theta)
    };

    this.setState({hovered: queryPoint, position});
  }

  renderPoints() {
    const {points, hovered} = this.state;
    return points.map((p, i) => {
      const isHovered = hovered && p.id === hovered.id;
      return (
        <g key={`point-${i}`}>
          <rect
            key={`interact-${i}`}
            x={p.x - POINT_RADIUS}
            y={p.y - POINT_RADIUS}
            width={POINT_RADIUS * 2}
            height={POINT_RADIUS * 2}
            fill={'white'}
            onMouseOver={() => this.handleHovering(p)}
            onMouseOut={() => this.handleHovering(null)}
          />
          <text x={p.x} y={p.y}>{i}</text>
          <circle
            key={`center-${i}`}
            cx={p.x}
            cy={p.y}
            r={3}
            fill={isHovered ? 'red' : 'grey'}
            pointerEvents={'none'}
          />
          <rect
            key={`radius-${i}`}
            x={p.x - POINT_RADIUS}
            y={p.y - POINT_RADIUS}
            width={POINT_RADIUS * 2}
            height={POINT_RADIUS * 2}
            fill={'none'}
            stroke={'red'}
            strokeDasharray={isHovered ? '1, 0' : '2, 5'}
          />
        </g>
      );
    });
  }

  renderMasks() {
    const {points} = this.state;
    return points.map((p, i) => {
      return (
        <rect
          key={`mask-${i}`}
          x={p.x - POINT_RADIUS - LABEL_WIDTH / 2}
          y={p.y - POINT_RADIUS - LABEL_HEIGHT / 2}
          width={POINT_RADIUS * 2 + LABEL_WIDTH}
          height={POINT_RADIUS * 2 + LABEL_HEIGHT}
          fill={'white'}
          stroke={'grey'}
          strokeDasharray={'2, 5'}
        />
      );
    });
  }

  renderRays() {
    const {hovered, width, height} = this.state;
    if (!hovered) {
      return null;
    }

    const radius = Math.sqrt(width * width + height * height);

    return getRayIndices(NUM_RAYS).map(rayIndex => {
      const theta = getThetaByIndex(rayIndex, NUM_RAYS);
      return (
        <line
          key={rayIndex}
          x1={hovered.x}
          y1={hovered.y}
          x2={hovered.x + Math.cos(theta) * radius}
          y2={hovered.y + Math.sin(theta) * radius}
          stroke={'green'}
          strokeDasharray={`1, ${STEP_SIZE - 1}`}
        />
      );
    });
  }

  renderLabel() {
    const {position} = this.state;
    if (!position) {
      return null;
    }

    return (
      <g>
        <rect
          x={position.x - LABEL_WIDTH / 2}
          y={position.y - LABEL_HEIGHT / 2}
          width={LABEL_WIDTH}
          height={LABEL_HEIGHT}
          fill={'none'}
          stroke={'green'}
        />
        <circle cx={position.x} cy={position.y} r={2} fill={'green'} />
      </g>
    );
  }

  render() {
    const {width, height} = this.state;
    if (width <= 0 || height <= 0) {
      return null;
    }

    return (
      <div>
        <svg width={width} height={height}>
          {this.renderRays()}
          {this.renderMasks()}
          {this.renderPoints()}
          {this.renderLabel()}
        </svg>
      </div>
    );
  }
}

const root = document.createElement('div');
document.body.appendChild(root);

render(<Demo />, root);
