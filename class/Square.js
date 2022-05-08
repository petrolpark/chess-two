const Piece = require("./Piece.js");

class Square {
    #game; //Game object
    #x; //int
    #y; //int
    #piece; //Piece object occupying this space
    #playerLists = {
        "trapped": [],
        "protected": [],
        "blind": [],
        "blocked": []
    };

    constructor(game, x, y, piece) {
        this.#game = game;
        this.#x = x;
        this.#y = y;
        this.#piece = piece;
        piece.setSquare(this);
    };

    getGame() {
        return this.#game;
    };
    
    getX() {
        return this.#x;
    };

    getY() {
        return this.#y;
    };

    hasPiece() { //whether this Square has a playing Piece ('empty' does not count as a Piece)
        return (!this.getPiece().hasTag("isGhostPiece"));
    };

    hasPieceTakeableBy(player) { //whether this Square has a Piece which can be taken by normal means
        return (
            !this.getPiece().hasTag("isGhostPiece") //this is not an empty Square
            && !this.getPiece().hasTag("isUntakeable") //the Piece on this Square is takeable
            && this.getPiece().getPlayer() !== player //the Piece on this Square does not belong to the Player trying to take it
            && !this.#playerLists["blocked"].includes(player) //the Player to whom the Piece belongs is not blocked from entering this Square
            && !this.#playerLists["protected"].includes(this.getPiece().getPlayer()) //the Piece that is on this Square is not protected from being taken 
        );
    };

    isFreeForPlayer(player) {  //whether this Square can be moved onto
        return (!this.hasPiece() && !this.#playerLists["blocked"].includes(player));
    };

    isPassableByPiece(piece) {
        return (
            !this.hasPiece() //this is a free Square
            || (piece.hasTag("canJump") && !this.getPiece().hasTag("isUnjumpable")) //this Square has a Piece but it can be jumped over
        );
    };

    getPiece() { //the Piece which is on this Square
        return this.#piece;
    };

    setPiece(piece) { //change the Piece which is on this Square, and the Square to which that Piece belongs
        this.#piece = piece;
        piece.setSquare(this);
        return this;
    };

    takePieceBy(player) { //'take' the Piece, as would be done normally
        player.addCapturedPiece(this.getPiece()); //log that the Player who took this Piece has taken it
        player.addGold(this.getPiece().getPieceType().getPointValue()); //give the Player who took this Piece points
        this.destroyPiece(); //remove the Piece on this Square
    };

    destroyPiece() {
        this.getPiece().getPlayer().addLostPiece(this.getPiece()); //log that the Player who owns this Piece has had this Piece destroyed
        
        if (this.getPiece().isVital()) { //if this Piece is one which must be taken to win the Game
            this.getPiece().getPlayer().addVitalPieceCount(-1);
        };

        //actually remove the Piece
        this.setPiece(new Piece({
            pieceType: this.#game.getContentPackObject("base", "pieceType", "empty"),
            player: this.#game.getPlayerById("base")
        }));
    };

    addPlayerToList(listName, player) {
        if (typeof this.#playerLists[listName] !== "undefined" && !this.#playerLists["blocked"].includes(player)) {
            this.#playerLists[listName].push(player);
        };
        return this;
    };
};

module.exports = Square;