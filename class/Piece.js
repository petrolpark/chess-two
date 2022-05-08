const { DIRECTION_MATRIX } = require("../globals.js");

class Piece {
    #player; //Player object to whom this piece belongs
    #pieceType; //PieceType object of which this Piece is an instance
    #square; //Square object
    #isVital; //bool, whether or not this piece must be taken to win the game
    #moves = 0; //int, number of times this piece has been moved
    #tags; //dict

    constructor({player, pieceType, isVital = false, tags = {}}) {
        this.#player = player;
        this.#pieceType = pieceType;
        this.#isVital = isVital;
        this.#tags = tags;
    };

    getPlayer() {
        return this.#player;
    };

    getPieceType() {
        return this.#pieceType;
    };

    getSquare() {
        return this.#square;
    };

    setSquare(square) {
        if (square.getPiece() === this) { //only reset the Square this Piece is on if that Square contains this Piece
            this.#square = square;
        } else {
            throw `Did not redfine Square for ${this.#player.getName()}'s ${this.#pieceType.getName()}.`;
        };
        return this;
    };

    isVital() {
        return this.#isVital;
    };

    getMovesMade() {
        return this.#moves;
    };

    incrementMovesMade() {
        this.#moves++;
        return this;
    };

    enableTag(tag) {
        this.#tags[tag] = true;
        return this;
    };

    disableTag(tag) {
        this.#tags[tag] = false;
        return this;
    };

    defaultTag(tag) {
        delete this.#tags[tag];
        return this;
    };

    hasTag(tag) {
        if (typeof this.#tags[tag] === "undefined") {
            return this.#pieceType.hasTag(tag);
        } else {
            return this.#tags[tag];
        };
    };

    getMoveableSquareCoordinates(game) {
        return this.#pieceType.getMoveSetFunction()({
            game: game,
            x: this.#square.getX(),
            y: this.#square.getY(),
            direction: DIRECTION_MATRIX[this.#player.getPlayDirection()]
        });
    };
};

module.exports = Piece;