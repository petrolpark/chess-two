const { DIRECTION_MATRIX } = require("../globals.js");

class Player {
    #id; //str
    #name; //str, aesthetic purposes, e.g. "White"
    #isUserControlled; //bool, whether this Player is controlled by a user (i.e. not an NPC)
    #hasLost = false; //bool, whether this Player is still in the Game
    #color; //color str, color transformation to be applied to piece sprites
    #playDirection; //str, "north""|"south"|"east"|"west"|"nothing", key in DIRECTION_MATRIX
    #gold; //int
    #goldTotalEarned = 0; //int, total gold ever acquired
    #goldTotalSpent = 0; //int, total gold ever lost
    #vitalPieceCount = 0; //int, number of Pieces this Player has remaining which must be taken to win the Game
    #lostPieces = []; //list of Piece objects, Pieces which this Player has had captured from them
    #capturedPieces = []; //list of Piece objects, Pieces which this Player has captured from other Players

    constructor({id, name, isUserControlled, color = "#000000", playDirection = "NORTH", gold = 0}) {
        //check identifier supplied is valid
        if(!id || typeof id !== "string") {
            throw "Invalid identifier: "+id;
        };
        this.#id = id;

        //check name supplied is valid
        if (!name || typeof name !== "string") {
            throw "Invalid name: "+name;
        };
        this.#name = name;

        //check whether the isUserControlled field is valid
        if (isUserControlled === undefined || typeof isUserControlled !== "boolean") {
            throw "Invalid NPC specification: "+isUserControlled;
        };
        this.#isUserControlled = isUserControlled;

        //check color is valid (NOTE: TODO)
        this.#color = color;

        //check play direction is valid
        if (!DIRECTION_MATRIX.hasOwnProperty(playDirection)) {
            throw "Invalid direction: "+playDirection;
        };
        this.#playDirection = playDirection;

        //check starting Gold is valid
        if (!Number.isInteger(gold)) {
            throw "Invalid starting gold: "+gold;
        };
        this.#gold = gold;
    };

    getID() {
        return this.#id;
    };

    getName() {
        return this.#name;
    };

    isUserControlled() {
        return this.#isUserControlled;
    };

    disableUserControl() {
        if (this.hasLost()) {
            this.#isUserControlled = false;
        };
        return this;
    };

    hasLost() {
        return this.#hasLost;
    };

    getColor() {
        return this.#color;
    };

    getPlayDirection() {
        return this.#playDirection;
    };

    addGold(n) { // increase (or decrease) Player's balance of gold
        this.#gold += n;
        if (n >= 0) {
            this.#goldTotalEarned += n;
        } else {
            this.#goldTotalSpent -= n;
        };
        return this;
    };

    getGold() {
        return this.#gold;
    };

    getGoldTotalEarned() {
        return this.#goldTotalEarned;
    };

    getGoldTotalSpent() {
        return this.#goldTotalSpent;
    };

    getShorthand() {
        return this.#name[0];
    };

    addVitalPieceCount(n) {
        this.#vitalPieceCount += n;
        if (this.#vitalPieceCount === 0) { //if this Player has no vital Pieces left
            this.#hasLost = true;
        };
    };

    addLostPiece(piece) {
        this.#lostPieces.push(piece);
    };

    addCapturedPiece(piece) {
        this.#capturedPieces.push(piece);
    };
};

module.exports = Player;