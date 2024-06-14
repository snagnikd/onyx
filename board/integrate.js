import {Chess} from './chess.js';

var board = null
var $board = $('#myBoard')
var r = "w"
let colour;
let colorToHighlight;
let dataTotransmit;
let jsonString;
var game = new Chess()
var $status = $('#status')
var $fen = $('#fen')
var $pgn = $('#pgn')
var p = ""
var squareToHighlight = null
var squareClass = 'square-55d63'
let datareceived;
let status;
const socket = new WebSocket("ws://localhost:8001/")

socket.onopen = function(event){
  console.log('WebSocket connection opened');
};

socket.onclose = function(event){
  console.log('WebSocket connection closed');
};

socket.addEventListener("error",function(event){
  console.log('WebSocket Error:', event);
});

socket.onmessage = function (event) {
    datareceived = JSON.parse(event.data);
    console.log(datareceived)
    if (datareceived["mode"]==="status"){
      colour = (datareceived["colour"] === "White") ? "w" : "b";
      console.log(colour)
    }
    else if (datareceived["mode"]==="move"){
      r = colour
      board.position(datareceived["move"]["after"])
      game.move({
        from: datareceived["move"]["from"],
        to: datareceived["move"]["to"],
        promotion: 'q'
      })
      shade(datareceived["move"])
      updateStatus()
    }
    else if (datareceived["mode"]==="undo"){
      r = ""
      if (game.turn()==="b"){removeHighlights("white")}
      if (game.turn()==="w"){removeHighlights("black")}
      game.undo()
      board.position(game.fen())
      updateStatus()

    }

    else if (datareceived["mode"]==="allowed"){
      window.alert("Takeback Accepted")
      onundo()
    }
    else if (datareceived["mode"]==="rejected"){
      window.alert("Takeback Rejected")
    }
    else if (datareceived["mode"]==="permit"){
      const userInput = window.confirm("Takeback Requested")
      if (userInput){
        dataTotransmit = {"mode":"allowed"}
        jsonString = JSON.stringify(dataTotransmit)
        socket.send(jsonString)     
      }
      else{
        dataTotransmit = {"mode":"rejected"}
        jsonString = JSON.stringify(dataTotransmit)
        socket.send(jsonString)     
      }}
    
    else if (datareceived["mode"]==="reset"){
      game = new Chess()
      board = Chessboard('myBoard', config)
      r = "w"
      removeHighlights("black")
      removeHighlights("white")
      updateStatus()
    }
};


function removeHighlights (color) {
  $board.find('.' + squareClass)
    .removeClass('highlight-' + color)
}


function onreset(){
game = new Chess()
board = Chessboard('myBoard', config)

dataTotransmit = {"mode":"reset"}
removeHighlights("black")
removeHighlights("white")
jsonString = JSON.stringify(dataTotransmit)
socket.send(jsonString)
updateStatus()
r = "w"
}

function onundo() {
  console.log(p)
  if (p!=="" & r===""){
    dataTotransmit = {"mode":"undo"}
    jsonString = JSON.stringify(dataTotransmit)
    if (game.turn()==="b"){removeHighlights("white")}
    if (game.turn()==="w"){removeHighlights("black")}
    board.position(p)
    game.undo()
    socket.send(jsonString)

    p = ""
    r = colour

    updateStatus()

  }}
function permit(){
  dataTotransmit = {"mode":"permit"}
  jsonString = JSON.stringify(dataTotransmit)
  socket.send(jsonString)
}
document.getElementById("undo").addEventListener("click", permit);
document.getElementById("Reset").addEventListener("click", onreset);


function onDragStart (source, piece, position, orientation) {
if (r!==colour) return false
 // do not pick up pieces if the game is over
  if (game.isGameOver()) return false

  // only pick up pieces for the side to move
  if ((game.turn() === 'w' && piece.search(/^b/) !== -1) ||
      (game.turn() === 'b' && piece.search(/^w/) !== -1)) {
    return false
  }
}

function onDrop (source, target) {
  // see if the move is legal
  p = game.fen()
  var move = game.move({
    from: source,
    to: target,
    promotion: 'q' // NOTE: always promote to a queen for example simplicity
  })
  // illegal move
  if (move === "tch") {
    console.log("tch tch")
    // board.position(game.fen())
    return 'snapback'
  }
  // board.position(game.fen())
  shade(move)
  console.log(move)
  console.log(typeof move)
  updateStatus()
  
  dataTotransmit = {"mode":"move","move":move,"status":status}

  jsonString = JSON.stringify(dataTotransmit)
  socket.send(jsonString)


  r = ""

}

function shade(move){
  if (move.color === 'w') {
    $board.find('.' + squareClass).removeClass('highlight-white')
    $board.find('.square-' + move.from).addClass('highlight-white')
    squareToHighlight = move.to
    colorToHighlight = 'white'
  } else {
    $board.find('.' + squareClass).removeClass('highlight-black')
    $board.find('.square-' + move.from).addClass('highlight-black')
    squareToHighlight = move.to
    colorToHighlight = 'black'
  }
  $board.find('.square-' + squareToHighlight)
  .addClass('highlight-' + colorToHighlight)
}

function onMoveEnd () {
  $board.find('.square-' + squareToHighlight)
  .addClass('highlight-' + colorToHighlight)
  // if (game.turn==="w"){

  }


function onSnapEnd () {

  board.position(game.fen())
}

function updateStatus () {

  status = ''
  var moveColor = 'White'
  if (game.turn() === 'b') {
    moveColor = 'Black'
  }

  // checkmate?
  if (game.isCheckmate()) {
    status = 'Game over, ' + moveColor + ' is in checkmate.'
  }

  // draw?
  else if (game.isDraw()) {
    status = 'Game over, drawn position'
  }

  // game still on
  else {
    status = moveColor + ' to move'

    // check?
    if (game.inCheck()) {
      status += ', ' + moveColor + ' is in check'
    }
  }

  $status.html(status)
  $fen.html(game.fen())
  $pgn.html(game.pgn())

}

var config = {

  draggable: true,
  position: 'start',
  onDragStart: onDragStart,
  onDrop: onDrop,
  onSnapEnd: onSnapEnd,
  // onMoveEnd: onMoveEnd,
}
board = Chessboard('myBoard', config)


updateStatus()