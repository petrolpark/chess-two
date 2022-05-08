const fs = require("fs");
const path = require("path");

const Player = require("./Player.js");
const Square = require("./Square.js")
const NonexistentSquare = require("./NonexistentSquare");
const Piece = require("./Piece.js");
const PieceType = require("./PieceType.js");
const PieceClass = require("./PieceClass.js");
const SpecialMove = require("./SpecialMove.js");
const MoveSet = require("./MoveSet.js");
const Macro = require("./Macro.js")

const { LATEST_CONTENT_PACK_FORMAT } = require("../globals.js");

const CLASSES = {
    "pieceType": PieceType,
    "pieceClass": PieceClass,
    "moveSet": MoveSet,
    "specialMove": SpecialMove,
    "macro": Macro
};

class Game {
    name; //string, aesthetic purposes
    description; //str, aesthetic purposes
    author; //str, aesthetic purposes
    #contentPacks = {}; //list of ContentPack objects
    #players = {}; //list of Player objects, including non-players
    #playOrder = []; //list of Player objects
    #boardWidth; //int
    #boardHeight; //int
    #board = [[]]; //2D list of Square objects
    #turn = 0; //int, number of complete iterations of playerOrder completed
    #playerTurn = 0; //int, position in playerOrder
    #isPlayingForward = true; //bool,  direction of play (forward or backward through playerOrder)
    #turnTimeLimit; //int, maximum frames system should wait until moving to the next Player
    #turnTime = 0; //int, current number of frames the Player is taking for their move
    #shouldDestroyDeadPieces = true; //bool, if Pieces belonging to Players who have lost are to be removed from the board
    #isWon; //bool, if the Game is over

    constructor() {
        this.name;
        this.description;
        this.author;
        this.#players = {};
        this.#players["base"] = new Player({
            id: "base",
            name: "Game",
            isUserControlled: false,
            playDirection: "NOWHERE"
        }); //add the Base Player, which controls all empty squares
        this.playerOrder;
        this.#boardWidth;
        this.#boardHeight;
        this.#board;
    };

    getContentPackObject(contentPack, objectClass, objectID) {
        return this.#contentPacks[contentPack][objectClass][objectID];
    };

    getPlayers() {
        return this.#players;
    };

    getPlayerById(playerID) {
        return this.#players[playerID];
    };

    eliminate(playerToBeEliminated) {
        //remove all instances of this Player from the play order
        this.#playOrder = this.#playOrder.filter(player => {
            return player !== playerToBeEliminated;
        });
        this.incrementTurn(0); //reset play order

        if (this.#shouldDestroyDeadPieces) {
            //destroy all Pieces belonging to the Player
            for (var i = 0; i < this.#boardHeight; i++) {
                for (var j = 0; j < this.#boardWidth; j++) {
                    if (this.getSquare([i,j]).getPiece().getPlayer() === playerToBeEliminated) {
                        this.getSquare([i,j]).destroyPiece();
                    };
                };
            };
        };

        playerToBeEliminated.disableUserControl();

        //check if there is a winner
        if (!this.#playOrder.some(player => { //if there are no Players which do not match the first Player (if all Players are the same)
            player !== this.#playOrder[0];
        })) {
            this.#isWon = true;
        };
    };

    getSquare([x,y]) {
        if (x >= 0 && x < this.#boardWidth && y >= 0 && y < this.#boardHeight) {
            return this.#board[y][x];
        } else {
            return new NonexistentSquare(this, NaN, NaN, new Piece({
                pieceType: this.#contentPacks.base.pieceType.empty,
                player: this.#players.base
            }));
        };
    };

    loadContentPacks(contentPacksDir) {
        try {
            var shouldReload = false; //assume every object reference exists
            const objectClassesToLoad = ["pieceType","pieceClass","moveSet","specialMove","macro"];

            for (const contentPack of fs.readdirSync(contentPacksDir)) { //for each Content Pack
                const contentPackDir = path.join(contentPacksDir, contentPack);
                if (fs.statSync(contentPackDir).isDirectory()) { //only attempt if this is a directory (an existing Content Pack)
                    var contentPackInfo;
                    //check if system can read the properties file of this Content Pack
                    try {
                        contentPackInfo = JSON.parse(fs.readFileSync(path.join(contentPackDir, "pack.json")).toString());
                    } catch {
                        throw `Invalid JSON formatting for pack.json of: '${contentPack}'`;
                    };
                    //check if Content Pack is in date
                    if (contentPackInfo.packFormat !== LATEST_CONTENT_PACK_FORMAT) {
                        throw `Wrong Pack Format. Current Content Pack Format is ${LATEST_CONTENT_PACK_FORMAT}, but Content Pack '${contentPack}' has Format ${contentPackInfo.packFormat}`;
                    };
                    //assuming everything is fine:
                    //initialise ContentPack object...
                    this.#contentPacks[contentPack] = {
                        id: contentPack,
                        description: contentPackInfo.description || "No description.",
                        //warning: name of these objects MUST be same as names of properties (particularly those of pieceType)
                    };
                    //...including each object class a Content Pack can contain
                    for (objectClass of objectClassesToLoad) {
                        this.#contentPacks[contentPack][objectClass] = {};
                    };

                    //load objects
                    for (var objectClass of objectClassesToLoad) { //for each Class that a Content Pack can include
                        var objectsLoaded = 0;
                        const contentPackObjectDir = path.join(contentPackDir, objectClass);
                        if (fs.existsSync(contentPackObjectDir)) { //check if this Content Pack has objects of this class
                            for (const contentPackObjectFile of fs.readdirSync(contentPackObjectDir)) { //for every object file of this class
                                if (contentPackObjectFile.endsWith(".json")) { //only attempt if this is a JSON file
                                    const parsee = this.#parseCPObjectFromJSON(path.join(contentPackObjectDir, contentPackObjectFile));
                                    if (parsee.couldNotLoad) {
                                        throw `Invalid JSON formatting for object file: '${path.join(contentPackObjectDir, contentPackObjectFile)}'`;
                                    };
                                    const contentPackObject = new CLASSES[objectClass](parsee.classlessObject);
                                    if (parsee.hasMissingReference) {
                                        shouldReload = true;
                                        contentPackObject.hasMissingReference = true;
                                    };

                                    if (["moveSet","macro","specialMove"].includes(objectClass)) { //if this object is of a class that contains a .js function
                                        try {
                                            contentPackObject.setFunction(require(path.join(contentPackObjectDir, `${contentPackObject.getID()}.js`) ).f);
                                        } catch(e) {
                                            throw `Invalid or nonexistent ${objectClass} function file: '${contentPackObject.getID()}.js': ${e}.`;
                                        };
                                    };
                                    
                                    this.#contentPacks[contentPack][objectClass][contentPackObject.getID()] = contentPackObject;
                                };
                            };
                        };  
                    };
                };
            };

            if (shouldReload) { //if there are missing references
                shouldReload = false;
                for (var contentPack in this.#contentPacks) { //for each content pack...
                    for (var objectClass of objectClassesToLoad) { //...for each class that object pack has...
                        for (var object in this.#contentPacks[contentPack][objectClass]) { //...for each object in that class...
                            const thisObject = this.#contentPacks[contentPack][objectClass][object];
                            if (thisObject.hasMissingReference) {  //...check if that object has a missing reference(s)
                                for (var property in thisObject) { //for each property that object has...
                                    if (typeof thisObject[property] === "string" && thisObject[property].startsWith("@")) { //...if it is still reference which hasn't been parsed...
                                        const referencedObject = this.#parseCPObjectReference(thisObject[property], property); //...find the referenced object
                                        if (referencedObject === "UNDEFINED") { //if the reference object can still not be found (if it does not exist)...
                                            throw `Nonexistent object reference in the object '${contentPack}:${objectClass}:${object}: '${property}: ${thisObject[property]}'`;   
                                        } else {
                                            thisObject[property]= referencedObject;
                                            delete thisObject.hasMissingReference;
                                        };
                                    };
                                };
                            };
                        };
                    };
                };
            };

        } catch(err) {
            console.error("Could not load Content Packs: "+err);
            this.#contentPacks = {};
        };
        return this;
    };

    #parseCPObjectFromJSON(path) { //returns both the object it has parsed and an error code corresponding to if there are any object references it didn't find
        var object;
        var [hasMissingReference, couldNotLoad] = [false, false]; //assume all this objects references (if they exist) are valid
        try {
            object = JSON.parse(fs.readFileSync(path), (key, value) => {
                if (typeof value === "string" && value.startsWith("@")) { //if this property of this object is a reference to another object
                    var reference = this.#parseCPObjectReference(value,key); //search for that reference
                    if (reference === "UNDEFINED") { //if the object referenced has not yet been loaded
                        hasMissingReference = true;
                        reference = value; //change the value back to a reference literal
                    };
                    return reference; 
                } else {
                    return value;
                };
            });
        } catch {
            couldNotLoad = true;
        };
        return {
            classlessObject: object,
            hasMissingReference: hasMissingReference,
            couldNotLoad: couldNotLoad
        };
    };

    #parseCPObjectReference(ref, objectClass) {
        const [contentPackID, objectID] = ref.substring(1).split(":");
        var referencedObject;
        try { //if this clause returns "UNDEFINED", it is because that object does not exist at that location
            referencedObject = this.#contentPacks[contentPackID][objectClass][objectID] || "UNDEFINED"; //check if the object exists (yet)
        } catch { //if THIS clause returns "UNDEFINED", it is because that is an invalid path
            referencedObject = "UNDEFINED";
        };
        return referencedObject;
    };

    loadGame(gameDataFile) {
        try {
            var gameData;
            const playersBySHID = {"0": this.#players.base};
            const pieceTypesBySHID = {"0": this.#contentPacks.base.pieceType.empty};
            try {
                gameData = JSON.parse(fs.readFileSync(gameDataFile), (key, value) => {
                    return value;
                });
            } catch {
                throw "Not a valid JSON file."
            };
            //check for Content Packs
            try {
                if (!gameData.contentPacks || !Array.isArray(gameData.contentPacks)) {
                    throw "'contentPacks' attribute incorrectly defined.";
                };
                for (var contentPack of gameData.contentPacks) {
                    if (!this.#contentPacks[contentPack]) {
                        throw `Missing Content Pack: ${contentPack}`;
                    };
                };
            } catch(err) {
                throw "Could not load Content Packs: "+err;
            };
            //load Players 
            try {
                if (!gameData.players || typeof gameData.players != "object") {
                    throw "'players' attribute incorrectly defined.";
                };
                if (Object.keys(gameData.players).length === 0) { //count number of entries in Players (this does not include the Base player)
                    throw "Cannot have 0 players."
                };
                var thereAreUserControlledPlayers = false; //start by assuming there are no user-controlled Players
                for (var playerSHID in gameData.players) {
                    if (playerSHID === "0") {
                        throw "Shorthand indentifier cannot be 0."
                    };
                    try {
                        this.#players[gameData.players[playerSHID].id] = new Player(gameData.players[playerSHID]); //instantiate Player object and add it to the list of Players in the Game
                        playersBySHID[playerSHID] = this.#players[gameData.players[playerSHID].id]; //note that this Player corresponds to the given Shorthand Identifier
                    } catch(err) {
                        throw "One or more invalid Players: "+err;
                    };
                    if (this.#players[gameData.players[playerSHID].id].isUserControlled()) {
                        thereAreUserControlledPlayers = true;
                    };
                };
                if (!thereAreUserControlledPlayers) {
                    throw "Must have at least one non-NPC.";
                };
            } catch(err) {
                throw "Could not load Players: "+err;
            };
            //load PlayerOrder
            try {
                if (!gameData.playOrder || typeof gameData.playOrder !== "string") {
                    throw "'playOrder' attribute incorrectly defined.";
                };
                for (var playerSHID of gameData.playOrder) { //for each entry in the Play order
                    if (!playersBySHID.hasOwnProperty(playerSHID)) { //ensure this is an existent Player
                        throw "Shorthand identifier '"+playerSHID+"' has no associated Player.";
                    } else if (!playersBySHID[playerSHID].isUserControlled()) { //ensure this is not an NPC
                        throw `Play order cannot include NPCs. ('${playersBySHID[playerSHID].getID()}' is an NPC).`;
                    } else { //as long as no problems occur
                        this.#playOrder.push(playersBySHID[playerSHID]);
                    };
                };
            } catch(err) {
                throw "Could not load play order: "+err;
            };
            //load Pieces
            try {
                if (!gameData.pieces || typeof gameData.pieces !== "object") {
                    throw "'pieces' attribute incorrectly defined.";
                };
                for (var pieceTypeSHID in gameData.pieces) { //for each entry in the Piece list
                    const thisPieceType = this.#parseCPObjectReference(gameData.pieces[pieceTypeSHID], "pieceType");
                    if (typeof pieceTypeSHID !== "string" || pieceTypeSHID in pieceTypesBySHID || pieceTypeSHID.length !== 1) { //ensure that no shorthand identifiers are repeated
                        throw `Invalid or reused shorthand identifier: ${pieceTypeSHID}`;
                    } else if (thisPieceType === "UNDEFINED") {
                        throw `Nonexistent Piece Type reference: ${gameData.pieces[pieceTypeSHID]}`;
                    } else { //as long as no problems occur
                        pieceTypesBySHID[pieceTypeSHID] = thisPieceType;
                    };
                };  
            } catch(err) {
                throw "Could not load Pieces: "+err;
            };
            //set up Board
            try {
                //verify board dimensions
                if (!gameData.boardWidth || !gameData.boardHeight || !Number.isInteger(gameData.boardWidth) || !Number.isInteger(gameData.boardHeight)) {
                    throw `Invalid board dimensions: ${gameData.boardWidth} by ${gameData.boardHeight}`;
                } else { //if nothing goes wrong
                    this.#boardWidth = gameData.boardWidth;
                    this.#boardHeight = gameData.boardHeight;
                };
                //verify board itself
                var parsedBoardString;
                if (!gameData.board || typeof gameData.board !== "string") {
                    throw "Invalid Board string.";
                } else {
                    parsedBoardString = gameData.board.split(" ");
                    if (parsedBoardString.length !== this.#boardWidth * this.#boardHeight) {
                        throw `Board string is of length ${parsedBoardString.length} (should be ${(this.#boardWidth * this.#boardHeight).toString()}).`;
                    };
                };
                //create each Square
                this.#board = []
                for (var y = 0; y < this.#boardHeight; y++) {
                    this.#board.push([]); //create a new empty row
                    for (var x = 0; x < this.#boardWidth; x++) {
                        const thisSquareIndex = y * this.#boardWidth + x; //this calculates the correct position in parsedBoardString for this square
                        //check SHID references are valid
                        if (!playersBySHID[parsedBoardString[thisSquareIndex][0]]) { //if this square references an undefined Player
                            throw `Undefined Player shorthand identifier '${parsedBoardString[thisSquareIndex][0]}' used in Board string at Square (${y},${x}) (position ${thisSquareIndex}).`;
                        };
                        if (!pieceTypesBySHID[parsedBoardString[thisSquareIndex][1]]) { //if this square references an undefined Piece Type
                            throw `Undefined Piece Type shorthand identifier '${parsedBoardString[thisSquareIndex][1]}' used in Board string at Square (${y},${x}) (position ${thisSquareIndex}).`;
                        };
                        //check if this Piece should have any particular properties
                        const specialInformation = {
                            isVital: false
                        };
                        if (parsedBoardString[thisSquareIndex].substring(2).split().includes("*")) {
                            specialInformation.isVital = true;
                            playersBySHID[parsedBoardString[thisSquareIndex][0]].addVitalPieceCount(1); //note that this Player has a vital Piece
                        };
                        //create the Square
                        this.#board[y][x] = new Square(this, x, y, new Piece({
                            player: playersBySHID[parsedBoardString[thisSquareIndex][0]],
                            pieceType: pieceTypesBySHID[parsedBoardString[thisSquareIndex][1]],
                            isVital: specialInformation.isVital
                        }));
                    };
                };
            } catch (err) {
                throw "Could not load board: "+err;
            };
        } catch(err) {
            console.error("Could not load Game: "+err);
        };
        return this;
    };

    stringifiedBoard() {
        var boardString = "y x";
        for (var i = 0; i < this.#boardWidth; i++) {
            boardString += `${i}  `;
        };

        for (var i = 0; i < this.#boardHeight; i++) { //for each column
            boardString += `\n${i}  `;
            for (var j = 0; j < this.#boardWidth; j++) {
                const thisPiece = this.getSquare([j,i]).getPiece();
                boardString += `${thisPiece.getPlayer().getShorthand()}${thisPiece.getPieceType().getShorthand()} `;
            };
        };
        return boardString;
    };

    attemptMove(player, startSquare, destinationSquare) {
        const result = {
            success: false,
            comments: []
        };
        
        try {
            //check the Game is still being Played
            if (this.#isWon) {
                result.comments.push(`Game is over.`);
                return result;
            };
            //check that the Player is still in the Game
            if (player.hasLost()) {
                result.comments.push(`${player.getName()} has lost.`);
                return result;
            };
            //check it is that Player's turn
            if (this.#playOrder[this.#playerTurn] !== player) {
                result.comments.push(`It is not ${player.getName()}'s turn.`);
                return result;
            };
            //check Player can moved the proposed Piece
            if (startSquare.getPiece().getPlayer() !== player) {
                result.comments.push(`${player.getName()} does not have a Piece there.`);
                return result;
            };
            //check proposed Piece can move
            if (startSquare.getPiece().hasTag("isImmobile")) {
                result.comments.push(`The ${startSquare.getPiece().getPieceType().getName()} cannot move.`);
                return result;
            };
            //check destination Square is within Move Set
            if (!startSquare.getPiece().getMoveableSquareCoordinates(this).some(coordinate => {
                return coordinate[0] === destinationSquare.getX() && coordinate[1] === destinationSquare.getY();
            })) {
                result.comments.push(`The ${startSquare.getPiece().getPieceType().getName()} cannot move like that.`);
                return result;
            };
        } catch(err) {
            result.comments.push(`A runtime error occured: ${err}`);
            return result;
        };

        //at this point, if the result has not yet been returned, the Move Attempt is successful
        result.success = true;
        result.comments.push(`Moved ${startSquare.getPiece().getPieceType().getName()}.`);

        //check for taken Piece
        if (!destinationSquare.getPiece().hasTag("isGhostPiece")) {
            result.comments.push(`Took ${destinationSquare.getPiece().getPlayer().getName()}'s ${destinationSquare.getPiece().getPieceType().getName()}.`);
            destinationSquare.takePieceBy(startSquare.getPiece().getPlayer());
        };

        //make the move
        startSquare.getPiece().incrementMovesMade(); //log that this Piece has moved
        destinationSquare.setPiece(startSquare.getPiece()); //set the destination to this Piece
        startSquare.setPiece(new Piece({ //remove the Piece from where it started
            pieceType: this.#contentPacks.base.pieceType.empty,
            player: this.#players.base
        }));
        this.incrementTurn(); //change the turn

        //check for any Player who have lost as a result of this this move
        for (var player in this.#players) {
            if (this.#players[player].hasLost()) {
                result.comments.push(`${this.#players[player].getName()} has lost.`);
                this.eliminate(this.#players[player]);
            };
        };

        //check for a winning Player
        if (this.#isWon) {
            result.comments.push(`${this.#playOrder[0].getName()} has won.`);
        };

        return result;
    };

    incrementTurn(turnsToIncrement = 1) {
        for (var i = 0; i < turnsToIncrement; i++) {
            if (this.#isPlayingForward) {
                this.#playerTurn++;
            } else {
                this.#playerTurn--;
            };
            //check looping
            if (this.#playerTurn >= this.#playOrder.length) {
                this.#playerTurn = 0;
                this.#turn++;
            } else if (this.#playerTurn <= -1) {
                this.#playerTurn = this.#playOrder.length - 1;
                this.#turn++;
            };
        };
    };
};

module.exports = Game;