/* global document, window,*/
/* eslint-disable no-console */
import React, {Component} from 'react';
import {render} from 'react-dom';

import {
  LabelPlacement,
  getRandomPoints,
  getIndices,
  convertRayIndexToTheta
} from '../src';

const NUM_POINTS = 64;
const NUM_RAYS = 64;
const POINT_RADIUS = 15;
const LABEL_WIDTH = 120;
const LABEL_HEIGHT = 80;
const STEP_SIZE = 5;

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

    const {points, width, height} = this.state;
    // no heavy data preprocessing in LabelPlacement, just re-instantiate
    const labelPosition = new LabelPlacement(points, {
      canvasWidth: width,
      canvasHeight: height,
      pointWidth: POINT_RADIUS,
      pointHeigh: POINT_RADIUS,
      labelWidth: LABEL_WIDTH,
      labelHeight: LABEL_HEIGHT,
      numRays: NUM_RAYS,
      stepSize: STEP_SIZE
    }).getLabelPosition(queryPoint);

    this.setState({hovered: queryPoint, position: labelPosition});
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
          <text x={p.x} y={p.y} pointerEvents={'none'}>
            {i}
          </text>
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
          opacity={0.5}
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

    return getIndices(NUM_RAYS).map(rayIndex => {
      const theta = convertRayIndexToTheta(rayIndex, NUM_RAYS);
      return (
        <line
          key={rayIndex}
          x1={hovered.x}
          y1={hovered.y}
          x2={hovered.x + Math.cos(theta) * radius}
          y2={hovered.y + Math.sin(theta) * radius}
          stroke={'green'}
          strokeWidth={2}
          strokeDasharray={`1, ${STEP_SIZE - 1}`}
        />
      );
    });
  }

  renderLabelAreas() {
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
          fill={'green'}
          stroke={'black'}
          opacity={0.2}
          strokeOpacity={1.0}
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
          {this.renderLabelAreas()}
        </svg>
      </div>
    );
  }
}

const root = document.createElement('div');
document.body.appendChild(root);

render(<Demo />, root);
