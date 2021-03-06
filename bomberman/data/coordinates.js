// In Nodejs, window does not exist.
if(typeof window === 'undefined') {
	Bomberman = {};
	Bomberman.Data = {};
} else {
	Namespace.register("Bomberman.Data");
}

/*******************************************************
 *	This class is a subset of the information stored
 *	in the bomberman class. It is sent across to other 
 *	players to update them regarding the other players
 *	in game. This is sent only when a player is moving.
 *******************************************************/
Bomberman.Data.Coordinates = function (bomberman) {

	var that				= {};
	
	that.name				= bomberman.name;
	
	// Coordinates
	that.x					= bomberman.x;
	that.y					= bomberman.y;
	
	// Movement related
	that.up					= bomberman.up;
	that.down				= bomberman.down;
	that.left				= bomberman.left;
	that.right				= bomberman.right;
	
	return that;
}

if(typeof window === 'undefined') {
	exports.Bomberman = Bomberman;
	exports.Bomberman.Data = Bomberman.Data;
	exports.Bomberman.Data.Coordinates = Bomberman.Data.Coordinates;
}

