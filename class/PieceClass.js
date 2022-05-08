const ContentPackObject = require("./ContentPackObject.js");

class PieceClass extends ContentPackObject {
    name; //str, aesthetic purposes
    description; //str, aesthetic purposes

    constructor({id}) {
        super(id);
    };
};

module.exports = PieceClass;