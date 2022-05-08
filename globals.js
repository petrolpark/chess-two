module.exports = {
    LATEST_CONTENT_PACK_FORMAT: 1,
    
    DIRECTION_MATRIX : { //'dictionary' of rotation matrices from north
        "NORTH": [[1,0],[0,1]],
        "EAST": [[0,1],[-1,0]],
        "SOUTH": [[-1,0],[0,-1]],
        "WEST": [[0,-1],[1,0]],
        "NOWHERE": [[0,0],[0,0]]
    }
}