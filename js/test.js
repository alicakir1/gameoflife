var boxWidth = 1800;
var boxHeight = 900;
var canvasPadding = 10;
var canvasWidth = boxWidth + (canvasPadding*2) + 1;
var canvasHeight = boxHeight + (canvasPadding*2) + 1;
var boardColors = ["#000000", "#404040", "#ffffff"];//[canvasColor, borderColor, cellColor];
var selectionColors = ["green", "lime", "lime"]; //[canvasCopyColor, borderCopyColor, cellCopyColor];
var zoomColors = [boardColors[0], "white", boardColors[2]];//[canvasColor, borderColor, cellColor];
var zoomColors = ["white", boardColors[1], "gray"];//[canvasColor, borderColor, cellColor];

var cellAmount = 200; // high int value causes canvas to crash(like 500) edit1: 200 is new dimension edit2: i realised it crashes when cellWidth or cellHeight is irrational number so we need to Math.floor the value
var cellXAmount = cellAmount||20;
var cellYAmount = cellAmount/2||10;
var cellWidth = boxWidth / cellXAmount;
var cellHeight = boxHeight / cellYAmount;
var cellState = new Array(cellXAmount);
for (var i = 0; i < cellXAmount; i++) {
  cellState[i] = new Array(cellYAmount);
}
var state = 0;
var neighborCount = 0;
var cellTemp = new Array(cellXAmount);
for (var i = 0; i < cellXAmount; i++) {
  cellTemp[i] = new Array(cellYAmount);
}

var cursorX, cursorY;//cursorX, cursorY: raw cursor coordinates;
var cursorCellX, cursorCellY;//cursorCellX, cursorCellY: cursor cell coordinates;
var selectedK, selectedL;//selectedK, selectedL: stored cursor cell row/column;
var cursorCellK, cursorCellL;//cursorCellK, cursorCellL: cell row/column;

var gol;
var settings;
var nextStepbtn;
var playstopbtn;
var zoombtn;
var canvas;

var ctx;
var playstop;
var Hz = 10; //step per sec
var state;
var mousedown = 0;

var copyState;

var zoom = 0;
var zoomAmount = 2;

function addListenerMulti(el, s, fn) {
  s.split(' ').forEach(e => el.addEventListener(e, fn, false));
}
function setcursorPos(e){
  //cursor coordinates
  if (e.layerX > (canvasPadding+boxWidth)) {
    cursorX = canvasPadding+boxWidth-1;
  }
  else {
    cursorX = e.layerX;
  }
  if (e.layerY > (canvasPadding+boxHeight)) {
    cursorY = canvasPadding+boxHeight-1;
  }
  else {
    cursorY = e.layerY;
  }
  //setting coordinates to topleft of the cell
  cursorCellX = cursorX;
  cursorCellY = cursorY;
  cursorCellX -= canvasPadding;
  cursorCellX -= (cursorCellX % cellWidth);
  cursorCellK = cursorCellX/cellWidth;
  cursorCellX += canvasPadding;
  cursorCellY -= canvasPadding;
  cursorCellY -= (cursorCellY % cellHeight);
  cursorCellL = cursorCellY/cellWidth;
  cursorCellY += canvasPadding;
}
function drawBoard(x1, y1, x2, y2, colors){//x1, l: cursorCellK, cursorCellL
  ctx.beginPath();
  if (x1 === undefined) {
    var e = 0;
  }
  else {
    var e = x1;
  }
  if (y1 === undefined) {
    var r = 0;
  }
  else {
    var r = y1;
  }
  if (x2 === undefined) {
    var t = cellXAmount-1;
  }
  else {
    var t = x2;
  }
  if (y2 === undefined) {
    var y = cellYAmount-1;
  }
  else {
    var y = y2;
  }
  if (colors === undefined) {
    var grid = boardColors;
  }
  else {
    var grid = colors;
  }
  e *= cellWidth; //x1
  r *= cellHeight;//y1
  t *= cellWidth; //x2
  y *= cellHeight;//y2
  var temp = 0;
  if (t<e) {
    temp = t;
    t = e;
    e = temp;
  }
  if (y<r) {
    temp = y;
    y = r;
    r = temp;
  }
  if (x2<x1) {
    temp = x2;
    x2 = x1;
    x1 = temp;
  }
  if (y2<y1) {
    temp = y2;
    y2 = y1;
    y1 = temp;
  }
  ctx.fillStyle=grid[0];
  var width = Math.abs(t-e)+cellWidth;
  var height = Math.abs(y-r)+cellHeight;
  ctx.fillRect(canvasPadding + e, canvasPadding + r, width, height);

  if (cellWidth>5&&cellHeight>5) {
    for (var i = e; i <= t + cellWidth; i += cellWidth) {
      ctx.moveTo(0.5 + i + canvasPadding, r +canvasPadding);
      ctx.lineTo(0.5 + i + canvasPadding, y +cellHeight +canvasPadding);
    }
    for (var j = r; j <= y + cellHeight; j += cellHeight) {
      ctx.moveTo(e +canvasPadding, 0.5 + j + canvasPadding);
      ctx.lineTo(t +cellWidth + canvasPadding, 0.5 + j + canvasPadding);
    }

    ctx.strokeStyle = grid[1];
    ctx.stroke();
  }

  for (var i = x1; i < x2+1; i++) {
    for (var j = y1; j < y2+1; j++) {
      selector(i, j, grid, (cellState[i][j]+1)%2);
    }
  }
  ctx.closePath();
}
// function rgbToHex(r, g, b) {
//   if (r > 255 || g > 255 || b > 255)
//     throw "Invalid color component";
//   return ((r << 16) | (g << 8) | b).toString(16);
// }
// function GetPixel(x, y) {
//   var p = ctx.getImageData(x+1, y+1, 1, 1).data;
//   var hex = "#" + ("000000" + rgbToHex(p[0], p[1], p[2])).slice(-6);
//   return hex;
// }
function selector(x, y, color, a){//x, y:cursorCellK, cursorCellL; color:grid;  a: State(reversed);
  if (x === undefined) {
    var i = cursorCellK;
  }
  else {
    var i = x;
  }
  if (y === undefined) {
    var j = cursorCellL;
  }
  else {
    var j = y;
  }
  var k = x * cellWidth +canvasPadding;
  var l = y * cellHeight +canvasPadding;
  if (a === undefined) {
    var state = cellState[x][y];
  }
  else {
    var state = a;
  }
  if (color === undefined) {
    var grid = boardColors;
  }
  else {
    var grid = color;
  }
  if (state===1) {
    ctx.fillStyle=grid[0];
    cellState[i][j] = 0;
  }
  else {
    ctx.fillStyle=grid[2];
    cellState[i][j] = 1;
  }
  ctx.fillRect(k+1, l+1, cellWidth-1, cellWidth-1);
}
function setupElements(){
  gol = document.querySelectorAll("#gameoflife");
  console.log(gol);
  //settings
  settings = document.createElement("div");
  settings.setAttribute("id","settings");
  settings.setAttribute("class","inline");

  //settings -> nextStep button
  nextStepbtn = document.createElement("button");
  nextStepbtn.setAttribute("id","nextStepbtn");
  nextStepbtn.innerHTML = "nextStep";
  settings.appendChild(nextStepbtn);

  //settings -> playstop button
  playstopbtn = document.createElement("button");
  playstopbtn.setAttribute("id","playstopbtn");
  playstopbtn.innerHTML = "play/stop";
  settings.appendChild(playstopbtn);

  //settings -> random button
  randombtn = document.createElement("button");
  randombtn.setAttribute("id","randombtn");
  randombtn.innerHTML = "random";
  settings.appendChild(randombtn);

  //settings -> zoom button
  zoombtn = document.createElement("button");
  zoombtn.setAttribute("id","zoombtn");
  zoombtn.innerHTML = "zoom";
  settings.appendChild(zoombtn);

  var breaker = document.createElement("div");
  breaker.setAttribute("class", "clearBoth");

  //canvas
  canvas = document.createElement("canvas");
  canvas.innerHTML = "Your browser does not support the canvas element.";
  canvas.setAttribute("width",canvasWidth+"px");
  canvas.setAttribute("height",canvasHeight+"px");

  gol.forEach(function(element, index, array) {
    gol[index].appendChild(settings);
    gol[index].appendChild(breaker);
    gol[index].appendChild(canvas);
    console.log(gol[index].innerHTML);

  });
}
function getNeighborCount(x, y){
  var count = 0;
  var i, j;
  for (j=-1; j<2; j++) {
    for (i=-1; i<2; i++) {
      if (cellState[(x+i+cellXAmount)%cellXAmount][(y+j+cellYAmount)%cellYAmount] == 1) {
        count++;
      }
    }
  }
  if (cellState[x][y]==1) {
    count--;
  }
  return count;
}
function nextStep(){
  for (var j = 0; j < cellYAmount; j++) {
    for (var i = 0; i < cellXAmount; i++) {
      var state = cellState[i][j];
      var neighbors = getNeighborCount(i, j);
      if (state == 1) {

        if (neighbors<2 || neighbors>3) {
          cellTemp[i][j] = 1;
        }
      }
      else {
        if (neighbors==3) {
          cellTemp[i][j] = 1;
        }
        // if (neighbors==6) { //enable this for HighLife (Replicator)
        //   cellTemp[i][j] = 1;
        // }
      }
    }
  }
  for (var j = 0; j < cellYAmount; j++) {
    for (var i = 0; i < cellXAmount; i++) {
      if (cellTemp[i][j] == 1) {
        selector(i, j);
        cellTemp[i][j] = 0;
      }
    }
  }
}
function fillRandom(){
    for (var j = 0; j < cellYAmount; j++) {
      for (var i = 0; i < cellXAmount; i++) {
        var random = Math.floor(Math.random()*2)
        selector(i, j, boardColors, random);
      }
    }
}
function copy(){
  drawBoard(selectedK, selectedL, cursorCellK, cursorCellL, boardColors);
  if (cursorCellK<selectedK) {
    var e = cursorCellK;
    var t = selectedK;
  }
  else {
    var e = selectedK;
    var t = cursorCellK;
  }
  if (cursorCellL<selectedL) {
    var r = cursorCellL;
    var y = selectedL;
  }
  else {
    var r = selectedL;
    var y = cursorCellL;
  }
  t++;
  y++;
  copyState = new Array(t-e);
  for (var i = 0; i < Math.abs(t-e); i++) {
    copyState[i] = new Array(y-r);
  }
  for (var i = 0; i < t-e; i++) {
    for (var j = 0; j < y-r; j++) {
      copyState[i][j] = cellState[e+i][r+j];
    }
  }
  selectedK = -1;
  selectedL = -1;
}
function paste(){//x, y:cursorCellX, cursorCellY;
  for (var i = 0; i < copyState.length; i++) {
    for (var j = 0; j < copyState[i].length; j++) {
      selector((cursorCellK+i+cellXAmount)%cellXAmount, (cursorCellL+j+cellYAmount)%cellYAmount, boardColors, (copyState[i][j]+1)%2);
    }
  }
}
function xzoom(){
  canvas.zoom("50%")
  zoom = 0;
  drawBoard();
}
document.addEventListener("DOMContentLoaded",function(){
  //setup
  for (var i = 0; i < cellXAmount; i++) {
    for (var j = 0; j < cellYAmount; j++) {
      cellState[i][j] = 0;
      cellTemp[i][j] = 0;
    }
  }

  //Creating Elements
  setupElements();
  var context = canvas.getContext("2d");
  //draw
  ctx = context;
  drawBoard();
  canvas.addEventListener("mousedown",e =>{
    mousedown = 1;
    if (e.shiftKey) {
      setcursorPos(e);
      selectedK = cursorCellK;
      selectedL = cursorCellL;
      if (cursorCellK != selectedK && cursorCellL != selectedL) {
        drawBoard(selectedK, selectedL, cursorCellK, cursorCellL, selectionColors);
      }
    }
  });
  addListenerMulti(canvas, 'mousemove', e =>{
    if (e.shiftKey&&selectedK!=-1&&mousedown==1&&zoom === 0) {
      drawBoard(selectedK, selectedL, cursorCellK, cursorCellL, boardColors);
      setcursorPos(e);
      if (cursorCellK != selectedK || cursorCellL != selectedL) {
        drawBoard(selectedK, selectedL, cursorCellK, cursorCellL, selectionColors);
      }
    }
    if (zoom === 1) {
      drawBoard(selectedK, selectedL, cellXAmount/2+selectedK, cellYAmount/2+selectedL, boardColors);
      setcursorPos(e);
      if (cursorCellK - Math.floor(cellXAmount/4)<0) {
        selectedK = 0;
      }
      else {
          selectedK = cursorCellK - Math.floor(cellXAmount/4);
          if (cellXAmount/2+selectedK>cellXAmount-1) {
            selectedK = Math.floor(cellXAmount/2)-1
          }
      }
      if (cursorCellL - Math.floor(cellYAmount/4)<0) {
        selectedL = 0;
      }
      else {
        selectedL = cursorCellL - Math.floor(cellYAmount/4);
        if (cellYAmount/2+selectedL>cellYAmount-1) {
          selectedL = Math.floor(cellYAmount/2)-1
        }
      }
      drawBoard(selectedK, selectedL, cellXAmount/2+selectedK, cellYAmount/2+selectedL, zoomColors);
    }
  });
  canvas.addEventListener("mouseup",e =>{
    mousedown = 0;
    if (e.shiftKey&&selectedK!=-1) {
      setcursorPos(e);
      copy();
    }
  });
  // Cell Clicked
  canvas.addEventListener("click",e =>{
    if (zoom === 1) {
      xzoom();
    }
    else {
      setcursorPos(e);
    if (!e.ctrlKey&&!e.shiftKey) {
      selector(cursorCellK, cursorCellL);
    }
    if (e.ctrlKey&&!e.shiftKey) {
      paste(cursorCellX, cursorCellY);
    }
    }
  });
  document.addEventListener('keypress', (event) => {
    if (event.code ==="NumpadAdd") {
      zoomAmount *=2;
    }
    else if (event.code === "NumpadSubtract") {
      zoomAmount /=2;
    }
  });
  nextStepbtn.addEventListener("click",e =>{
    nextStep();
  });
  zoombtn.addEventListener("click",e =>{
    if (zoom === 0) {
      zoom = 1;
    }
    else {
      zoom = 0;
      drawBoard();
    }
  });
  playstopbtn.addEventListener("click",e =>{
    if (state===1) {
      clearInterval(playstop);
      state = 0;
    }
    else {
      playstop = setInterval("nextStep();", Hz);
      state = 1;
    }
  });
  randombtn.addEventListener("click",e =>{
    fillRandom();
  });
});
