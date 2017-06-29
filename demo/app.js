/* global document, window,*/
/* eslint-disable no-console */
import React, {Component} from 'react';
import {render} from 'react-dom';

const NUM_POINTS = 100;
const NUM_RAYS = 64;
const DEGREE_TO_RADIAN = Math.PI / 180;
const POINT_RADIUS = 15;
const LABEL_WIDTH = 40;
const LABEL_HEIGHT = 24;
const RAY_STEP_SIZE = 5;

function generateRandomPoints(n = NUM_POINTS) {
  const points = [];
  for (let i = 0; i < n; i++) {
    points.push({id: i, x: Math.random(), y: Math.random()});
  }
  return points;
}

function generateThetas(n = NUM_RAYS) {
  const thetas = [];
  for (let i = 0; i < n; i++) {
    thetas.push(360 / NUM_RAYS * i * DEGREE_TO_RADIAN);
  }
  return thetas;
}

class Demo extends Component {
  constructor(props) {
    super(props);

    this.state = {
      width: 500,
      height: 500,
      points: generateRandomPoints(),
      hovered: null
    };
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
    this.setState({width, height});
  }

  handleHovering(point) {
    this.setState({hovered: point});
  }

  renderPoints() {
    const {points, hovered, width, height} = this.state;
    return points.map((p, i) => {
      const isHovered = hovered && p.id === hovered.id;
      const x = p.x * width;
      const y = p.y * height;
      return (
        <g key={`point-${i}`}>
          <rect
            key={`interact-${i}`}
            x={x - POINT_RADIUS}
            y={y - POINT_RADIUS}
            width={POINT_RADIUS * 2}
            height={POINT_RADIUS * 2}
            fill={'white'}
            onMouseOver={() => this.handleHovering(p)}
            onMouseOut={() => this.handleHovering(null)}
          />
          <circle
            key={`center-${i}`}
            cx={x}
            cy={y}
            r={3}
            fill={isHovered ? 'red' : 'grey'}
            pointerEvents={'none'}
          />
          <rect
            key={`radius-${i}`}
            x={x - POINT_RADIUS}
            y={y - POINT_RADIUS}
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
    const {points, width, height} = this.state;
    return points.map((p, i) => {
      const x = p.x * width;
      const y = p.y * height;
      return (
        <rect
          key={`mask-${i}`}
          x={x - POINT_RADIUS - LABEL_WIDTH}
          y={y - POINT_RADIUS - LABEL_HEIGHT}
          width={POINT_RADIUS * 2 + LABEL_WIDTH * 2}
          height={POINT_RADIUS * 2 + LABEL_HEIGHT * 2}
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
    const thetas = generateThetas();
    return thetas.map((theta, i) => {
      const x = hovered.x * width;
      const y = hovered.y * height;
      return (
        <line
          key={i}
          x1={x}
          y1={y}
          x2={x + Math.cos(theta) * radius}
          y2={y + Math.sin(theta) * radius}
          stroke={'green'}
          strokeDasharray={`1, ${RAY_STEP_SIZE - 1}`}
        />
      );
    });
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
        </svg>
      </div>
    );
  }
}

const root = document.createElement('div');
document.body.appendChild(root);

render(<Demo />, root);
