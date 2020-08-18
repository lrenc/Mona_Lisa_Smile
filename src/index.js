import { sample, randomInt, choice, clamp } from './util';
import Img from './origin.png';
import './index.css';

const wrap = document.getElementById('wrap');
const originCanvas = document.getElementById('origin');
const originCtx = originCanvas.getContext('2d');
const width = originCanvas.width;
const height = originCanvas.height;

const sideCount = 6; // 多边形
const geneCount = 50; // 一幅图片包含的多边形个数
const pictureCount = 30;

let ctxs = [];
let pictures = [];
let origin;

function randomGene(gene) {
  const color = {
    r: randomInt(0, 255),
    g: randomInt(0, 255),
    b: randomInt(0, 255),
    a: randomInt(0, 255)
  };
  const shape = [];
  for (let i = 0; i < sideCount; i ++) {
    shape.push({
      x: randomInt(0, width),
      y: randomInt(0, height)
    });
  }
  if (gene) {
    gene.color = color;
    gene.shape = shape;
  } else {
    return { color, shape };
  }
}

function mutationColor(gene) {
  const { color } = gene;
  Object.keys(color).forEach(function(key) {
    color[key] = clamp(color[key] + randomInt(-15, 15), 0, 255);
  });
}

function mutationPoint(gene) {
  const { shape } = gene;
  if (!shape.find(point => point.x !== 0 || point.y !== 0)) {
    randomGene(gene);
    return;
  }
  const count = randomInt(1, sideCount);
  const points = sample(shape, count);
  points.forEach(function(point) {
    point.x = clamp(point.x + randomInt(-15, 15), 0, width);
    point.y = clamp(point.y + randomInt(-15, 15), 0, height);
  });
}

function resetPoint(gene) {
  const { shape } = gene;
  shape.forEach(function(point) {
    point.x = 0;
    point.y = 0;
  });
}

function mutationLayer(genes) {
  const index = randomInt(0, genes.length - 1);
  genes.push(genes.splice(index, 1)[0]);
}

function clone(gene) {
  const color = { ...gene.color };
  const shape = gene.shape.map(function(item) {
    return { ...item };
  });
  return {
    color, shape
  };
}

function initPopulation() {
  if (pictures.length) {
    pictures = [];
  }
  for (let i = 0; i < pictureCount; i ++) {
    let genes = [];
    for (let j = 0; j < geneCount; j ++) {
      genes.push(randomGene());
    }
    pictures.push({ genes });
  }
}

function draw() {
  if (!ctxs.length) {
    for (let i = 0; i < pictureCount; i ++) {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      wrap.appendChild(canvas);
      const ctx = canvas.getContext('2d');
      ctxs.push(ctx);
    }
  }
  for (let i = 0; i < pictureCount; i ++) {
    const ctx = ctxs[i];
    const { genes } = pictures[i];
    ctx.clearRect(0, 0, width, height);
    for (let j = 0; j < geneCount; j ++) {
      const { color, shape } = genes[j];
      const { r, g, b, a } = color;
      ctx.beginPath();
      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${a / 255})`;
      ctx.moveTo(shape[0].x, shape[0].y);
      for (let k = 1; k < shape.length; k ++) {
        ctx.lineTo(shape[k].x, shape[k].y);
      }
      ctx.fill();
    }
    const { data } = ctx.getImageData(0, 0, width, height);
    pictures[i].dist = diff(data);
  }
}

function diff(data) {
  if (!origin) {
    throw new Error('Origin data is not ready.');
  }
  if (!data) {
    return Infinity;
  }
  let dist = 0;
  for (let i = 0, l = data.length; i < l; i ++) {
    dist += Math.abs(origin[i] - data[i]);
  }
  return dist;
}

function multiply(a, b) {
  const genes = [];
  for (let i = 0; i < geneCount; i ++) {
    const index = choice([1, 2]);
    let gene;
    if (index === 1) {
      gene = clone(a.genes[i]);
    } else {
      gene = clone(b.genes[i]);
    }
    genes.push(gene);
  }
  const mutation = randomInt(0, 100);
  const target = randomInt(0, geneCount - 1);
  if (mutation < 80) {
    const gene = genes[target];
    if (mutation < 35) {
      mutationColor(gene);
    } else if (mutation < 70) {
      mutationPoint(gene);
    } else {
      mutationColor(gene);
      mutationPoint(gene);
    }
  } else if (mutation < 90) {
    const gene = randomGene();
    genes.splice(target, 1, gene);
  } else {
    mutationLayer(genes);
  }
  return { genes };
}

function evolution() {
  pictures.sort(function(a, b) {
    return a.dist - b.dist;
  });
  const next = pictures.slice(0, 3);
  for (let i = 0; i < pictureCount - 3; i ++) {
    let n = Math.floor(i / 3);
    next.push(multiply(pictures[n], pictures[n + 1]));
  }
  pictures = next;
}

function drawOrigin() {
  return new Promise(function(resolve) {
    const img = new Image();
    img.onload = function() {
      originCtx.drawImage(img, 0, 0);
      const { data } = originCtx.getImageData(0, 0, width, height);
      resolve(data);
    };
    img.src = Img;
  });
}

async function main() {
  origin = await drawOrigin();
  initPopulation();
  setInterval(function() {
    draw();
    evolution();
  }, 100);
}

main();
