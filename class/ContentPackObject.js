class ContentPackObject {
    #id; //str

    constructor(id) {
        this.#id = id;
    };

    getID() {
        return this.#id;
    };
};

module.exports = ContentPackObject;