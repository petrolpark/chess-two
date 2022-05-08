const ContentPackObject = require("./ContentPackObject.js")

class PieceType extends ContentPackObject {
    //moveSet, pieceClass and specialMove must remain public
    #name; //str, aesthetic purposes
    #shorthand; //str, aesthetic purposes
    #description; //str, aesthetic purposes
    #pointValue; //int
    moveSet; //MoveSet object
    pieceClass; //PieceClass object
    specialMove; //SpecialMove object
    #tags; //list of strings

    constructor({id, name, shorthand, description, pointValue, moveSet, pieceClass, specialMove, tags={}}) {
        super(id);
        this.#name = name;
        this.#shorthand = shorthand;
        this.#description = description;
        this.#pointValue = pointValue;
        this.moveSet = moveSet;
        this.pieceClass = pieceClass;
        this.specialMove = specialMove;
        this.#tags = tags;
    };

    getName() {
        return this.#name;
    };

    getShorthand() {
        return this.#shorthand;
    };

    getDescription() {
        return this.#description;
    };

    getPointValue() {
        return this.#pointValue;
    };

    hasTag(tag) {
        return this.#tags[tag] || false;
    };

    getMoveSetFunction() {
        return this.moveSet.getFunction();
    };
};

module.exports = PieceType;