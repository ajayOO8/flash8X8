function getSize() { 
  var reg = new RegExp("(^|&)size=([^&]*)(&|$)", "i");
  var r = location.search.substr(1).match(reg);
  if (r != null) {
    return parseInt(unescape(decodeURI(r[2])));
  }
  return 8; 
}

function getMode() { 
  var reg = new RegExp("(^|&)mode=([^&]*)(&|$)", "i");
  var r = location.search.substr(1).match(reg);
  if (r != null) {
    return unescape(decodeURI(r[2]));
  }
  return "normal"; 
}

var game;
window.requestAnimationFrame(function () {
  var size = getSize();
  var container = document.getElementById('grid-container');
  var html = '';
  for (var i = 0; i < size; ++i) {
    html += '<div class="grid-row">';
    for (var j = 0; j < size; ++j) {
      html += '<div class="grid-cell"></div>';
    }
    html += '</div>';
  }
  container.innerHTML = html;
  game = new GameManager(8, KeyboardInputManager, HTMLActuator, LocalScoreManager);
  var mode = normal();

});

var last = '';
var dir = 0;
var cnt = 0;

var mover = undefined;

function doMovementPattern(moveType) {
  if (typeof(mover) != 'undefined') {
    clearInterval(mover);
  }
  mover = setInterval(moveType, 50);
}

function stopMovement() {
  if (typeof(mover) != 'undefined') {
    clearInterval(mover);
    mover = undefined;
  }
}

function corner() {
  if (game == null || typeof(game) === "undefined") {
    return;
  }
  var item = document.getElementById('tile-container');
  if (item.innerHTML == last) {
    if (++cnt > 0) {
      dir = 1 - dir;
      cnt = 0;
    }
  }
  last = item.innerHTML;
  if (0 === dir) {
    game.move(0);
    setTimeout(function() {game.move(3)}, 20);
  } else {
    game.move(0);
    setTimeout(function() {game.move(1)}, 20);
  }
}


function changeRule(add, merge, win) {
  game.addRandomTile = function () {
    if (this.grid.cellsAvailable()) {
      var tile = new Tile(this.grid.randomAvailableCell(), add());
      this.grid.insertTile(tile);
    }
  };
  game.tileMatchesAvailable = function () {
    var self = this;
    var tile;
    for (var x = 0; x < this.size; x++) {
      for (var y = 0; y < this.size; y++) {
        tile = this.grid.cellContent({ x: x, y: y });
        if (tile) {
          for (var direction = 0; direction < 4; direction++) {
            var vector = self.getVector(direction);
            var cell   = { x: x + vector.x, y: y + vector.y };
            var other  = self.grid.cellContent(cell);
            if (other && merge(other.value, tile.value)) {
              return true;
            }
          }
        }
      }
    }
    return false;
  };
  game.move = function (direction) {
    var self = this;
    if (this.over || this.won) return;
    var cell, tile;
    var vector     = this.getVector(direction);
    var traversals = this.buildTraversals(vector);
    var moved      = false;
    this.prepareTiles();
    traversals.x.forEach(function (x) {
      traversals.y.forEach(function (y) {
        cell = { x: x, y: y };
        tile = self.grid.cellContent(cell);
        if (tile) {
          var positions = self.findFarthestPosition(cell, vector);
          var next      = self.grid.cellContent(positions.next);
          if (next && !next.mergedFrom && merge(next.value, tile.value)) {
            var merged = new Tile(positions.next, tile.value + next.value);
            merged.mergedFrom = [tile, next];
            self.grid.insertTile(merged);
            self.grid.removeTile(tile);
            tile.updatePosition(positions.next);
            self.score += merged.value;
            if (win(merged.value)) self.won = true;
          } else {
            self.moveTile(tile, positions.farthest);
          }
          if (!self.positionsEqual(cell, tile)) {
            moved = true; 
          }
        }
      });
    });
    if (moved) {
      this.addRandomTile();
      if (!this.movesAvailable()) {
        this.over = true; 
      }
      this.actuate();
    }
  };
  game.inputManager.events["move"] = [];
  game.inputManager.on("move", game.move.bind(game));
  game.restart();
}

function normalAdd() {
  return Math.random() < 0.9 ? 2:4;
}

function normalMerge(a, b) {
  return a === b;
}


function normal() {
  changeRule(normalAdd, 
    function(a, b) { return a === b; }, 
    function(merged) { return merged === 2147483648; });
}

function showDiv() {
	document.getElementById('welcomediv').style.display="block";
}

