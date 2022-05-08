const path = require("path");

const { rightArithShift, ResultSetDependencies } = require("mathjs");
const { builtinModules } = require("module");

const Game = require("./class/Game.js");
const ContentPackObject = require("./class/ContentPackObject.js");
const Player = require("./class/Player.js");
const Square = require("./class/Square.js")
const NonexistentSquare = require("./class/NonexistentSquare");
const PieceType = require("./class/PieceType.js");
const PieceClass = require("./class/PieceClass.js");
const ContentPackFunctionObject = require("./class/ContentPackFunctionObject");
const SpecialMove = require("./class/SpecialMove.js");
const MoveSet = require("./class/MoveSet.js");
const Macro = require("./class/Macro.js")

const testGame = new Game()
.loadContentPacks(path.join(__dirname, "./contentpacks"))
.loadGame(path.join(__dirname, "./orthochess.json"));

console.log(testGame.stringifiedBoard())

// const s = testGame.getSquare([3,6]);
// console.log(s.getX(), s.getY());
//testGame.getSquare([1,5]).addPlayerToList("blocked",testGame.getPlayerById("white"));
//testGame.getSquare([2,5]).getPiece().enableTag("isLiableForEnPassant");
console.log(testGame.attemptMove(testGame.getPlayerById("white"), testGame.getSquare([2,1]), testGame.getSquare([3,0])));
console.log(testGame.stringifiedBoard())
console.log(testGame.attemptMove(testGame.getPlayerById("white"), testGame.getSquare([2,1]), testGame.getSquare([3,0])));

