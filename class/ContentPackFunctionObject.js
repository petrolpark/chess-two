const ContentPackObject = require("./ContentPackObject.js");

class ContentPackFunctionObject extends ContentPackObject {
    #function; //function

    constructor(id) {
        super(id);
    };

    getFunction() {
        return this.#function;
    };

    setFunction(f) {
        this.#function = f;
        return this;
    };
};

module.exports = ContentPackFunctionObject;