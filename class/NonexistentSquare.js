const Square = require("./Square.js")

class NonexistentSquare extends Square {

    constructor(game, x, y, piece) {
        super(game, x, y, piece);
    };

    getX() {
        return NaN;
    };

    getY() {
        return NaN;
    };

    hasPiece() {
        return false;
    };

    hasPieceTakeableBy(player) {
        return false;
    };

    isFreeForPlayer(player) {
        return false;
    };

    isPassableByPiece(piece) {
        return false;
    };

    setPiece() {
        return this;
    };
};

module.exports = NonexistentSquare;