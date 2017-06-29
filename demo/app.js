/* global document, window,*/
/* eslint-disable no-console */
import React, {Component} from 'react';
import {render} from 'react-dom';

const NUM_POINTS = 100;
const NUM_RAYS = 64;

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
    thetas.push(i / 360);
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
      return (
        <g key={`point-${i}`}>
          <circle
            key={`interact-${i}`}
            cx={p.x * width}
            cy={p.y * height}
            r={15}
            fill={'white'}
            onMouseOver={() => this.handleHovering(p)}
            onMouseOut={() => this.handleHovering(null)}
          />
          <circle
            key={`center-${i}`}
            cx={p.x * width}
            cy={p.y * height}
            r={3}
            fill={isHovered ? 'red' : 'grey'}
            pointerEvents={'none'}
          />
          <circle
            key={`radius-${i}`}
            cx={p.x * width}
            cy={p.y * height}
            r={15}
            fill={'none'}
            stroke={'red'}
            strokeDasharray={isHovered ? '1, 0' : '2, 5'}
          />
        </g>
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
          {this.renderPoints()}
        </svg>
      </div>
    );
  }
}

const root = document.createElement('div');
document.body.appendChild(root);

render(<Demo />, root);
