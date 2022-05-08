const Math = require("mathjs");

const f = ({game, x, y, direction}) => {
    const me = game.getSquare([x,y]).getPiece();
    const destinations = [];

    //normal movement forwards
    const squareInFront = Math.add([x,y], Math.multiply(direction, [0,-1])); //calculate what the Square in front is
    if (game.getSquare(squareInFront).isFreeForPlayer(me.getPlayer())) { //if there is no Piece in that Square...
        destinations.push(squareInFront); //...it can move forward
    };

    //first turn
    const squareTwoInFront = Math.add([x,y], Math.multiply(direction, [0,-2]));
    if (
        game.getSquare(squareInFront).isPassableByPiece(me) //this Piece can move through the Square in front
        && game.getSquare(squareTwoInFront).isFreeForPlayer(me.getPlayer()) //this Piece can move to the Square two in front
        && me.getMovesMade() === 0 //this is this Piece's first move
    ) {
        destinations.push(squareTwoInFront);
    };

    //taking
    for (var diagonalSquare of [Math.add([x,y], Math.multiply(direction, [1,-1])), Math.add([x,y], Math.multiply(direction, [-1,-1]))]) {
        if (game.getSquare(diagonalSquare).hasPieceTakeableBy(me.getPlayer())) { //if this Square has a takeable Piece...
            destinations.push(diagonalSquare); //...it can move diagonally
        };

        //en passant
        if (game.getSquare(diagonalSquare).isFreeForPlayer(me.getPlayer()) //if diagonal Square has a free space
        && game.getSquare(Math.add(diagonalSquare, Math.multiply(direction, [0,1]))).getPiece().hasTag("isLiableForEnPassant")
        ) {
            destinations.push(diagonalSquare);
        };
    };

    return destinations;
};

module.exports = {
    f: f
};

