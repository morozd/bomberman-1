Namespace.register("Application");

/*******************************************************
 *	This class is the Observer class that will map the 
 *	engine classes to the respective event occuring.
 *******************************************************/
Application.Core = function () {

	//var socket = new io.Socket(null, {port: 8080}),
	var engine,
		playerId,
		that = {},
		socket = new Socket(that, 8080);
	
	//******************************************************************************
	//	This is a public function for message from the server
	//******************************************************************************
	that.onMessage = function (msg) {
	
		if(msg.code === Server.MessageCode.Initial) {
		
			var i,
				players = JSON.parse(msg.players),
				length = players.length;
			
			playerId = msg.id;
			
			// Start game
			that.start(playerId);
			
			// Add opponent
			for(i = 0; i < length; i++) {
				engine.addPlayer(players[i].playerId, false, players[i]);
			}
			
			// Add yourself
			engine.addPlayer(playerId, true);
			
			// Send to server to be broadcast
			sendMsg(Server.MessageCode.NewPlayer, engine.getPlayer(playerId));
			
			sendMsg(Server.MessageCode.UpdatePlayer, engine.getPlayer(playerId));
			
			// Display to screen
			var input = document.getElementById("name");
			input.value = "Player " + playerId;
			
			var change = document.getElementById("change");
			change.onclick = changeName;
			
		} else if(msg.code === Server.MessageCode.NewPlayer) {
			engine.addPlayer(msg.id, false, msg.x, msg.y);
		} else if(msg.code === Server.MessageCode.Plant) {
			var bombInterface = JSON.parse(msg.bomb);
			
			engine.plantBomb(msg.id, bombInterface);
		} else if(msg.code === Server.MessageCode.Died) {
			engine.playerDied(msg.killerId, msg.id, msg.x, msg.y);
		} else if(msg.code === Server.MessageCode.Disconnect) {
			engine.removePlayer(msg.id);
		} else if(msg.code === Server.MessageCode.UpdatePlayer) {	
			engine.updatePlayer(msg.id, JSON.parse(msg.bomberman));
		} else if(msg.code === Server.MessageCode.UpdatePosition) {	
			engine.updatePlayerPosition(msg.id, JSON.parse(msg.coordinates));
		}
		
	};
	
	//******************************************************************************
	//	This is a public function for disconnecting from the game
	//******************************************************************************
	that.onDisconnect = function () {
		engine.end();
		
		that.clearUI();
		
		UI.writeDebugMessage("Disconnected from server.");
	};
	
	socket.subscribeEvent("message", that.onMessage);
	socket.subscribeEvent("disconnect", that.onDisconnect);
	socket.connect();
	
	//******************************************************************************
	//	This function sends a message to the server through websocket.
	//******************************************************************************
	function sendMsg (code, object, option) {
		var msg,
			coordinates,
			bombInterface,
			bombermanInterface;
		
		if(code === Server.MessageCode.Initial) {
			// Do nothing, because this message should not be sent from players
		} else if(code === Server.MessageCode.NewPlayer) {
			// Send message of player connecting as new player
			msg = {id: playerId, code: code, x: object.x, y: object.y};
		} else if(code === Server.MessageCode.Plant) {
			// Send message of player planting the bomb
			bombInterface = new Bomberman.Data.BombInterface(object);
			
			msg = {id: playerId, code: code, bomb: JSON.stringify(bombInterface)};
		} else if(code === Server.MessageCode.Died) {
			// Send message of player dying
			bombermanInterface = new Bomberman.Data.BombermanInterface(object);
			
			msg = {id: playerId, code: code, killerId: option, x: object.x, y: object.y};
		} else if(code === Server.MessageCode.Disconnect) {
			// Player may choose to disconnect
		} else if(code === Server.MessageCode.UpdatePlayer) {
			// Send message of updating player's information
			bombermanInterface = new Bomberman.Data.BombermanInterface(object);
			
			msg = {id: playerId, code: code, bomberman: JSON.stringify(bombermanInterface)};
		} else if(code === Server.MessageCode.UpdatePosition) {
			// Send message of updating player's coordinates and name
			coordinates = new Bomberman.Data.Coordinates(object);
			
			msg = {id: playerId, code: code, coordinates: JSON.stringify(coordinates)};
		}
		
		socket.send(msg);
	}
	
	//******************************************************************************
	//	This function denotes that the current player has planted a bomb
	//******************************************************************************
	function plantBomb () {
		if( !engine ) { return; }
		var bomb;
		
		bomb = engine.selfPlant();
		
		sendMsg(Server.MessageCode.Plant, bomb);
	}
	
	//******************************************************************************
	//	This function denotes that the current player has made a change of direction
	//******************************************************************************
	function changeDirection (direction) {
		if( !engine ) { return; }
		engine.changeDirection(playerId, direction);
		
		sendMsg(Server.MessageCode.UpdatePosition, engine.getPlayer(playerId));
	}
	
	//******************************************************************************
	//	This function denotes that the current player has stop all movement
	//******************************************************************************
	function stopDirection (directions) {
		if( !engine ) { return; }
		var i, length = directions.length;
		for( i = 0; i < length; i++ ) {
			engine.stopDirection(playerId, directions[i]);
		}
		
		sendMsg(Server.MessageCode.UpdatePosition, engine.getPlayer(playerId));
	}
	
	//******************************************************************************
	//	This function denotes that the current player has made a change of name
	//******************************************************************************
	function changeName() {
		var input = document.getElementById("name");
		
		engine.changeName(input.value.substring(0, 10));
		
		sendMsg(Server.MessageCode.UpdatePosition, engine.getPlayer(playerId));
	}
	
	window.onblur = function (event) {
		stopDirection([Bomberman.Common.Direction.UP, 
					   Bomberman.Common.Direction.DOWN,
					   Bomberman.Common.Direction.LEFT,
					   Bomberman.Common.Direction.RIGHT]);
	};
	
	document.onkeydown = function (event) {
		switch(event.which)
		{
			case 38:	// UP
				changeDirection(Bomberman.Common.Direction.UP);
				return false;
			case 40:	// DOWN
				changeDirection(Bomberman.Common.Direction.DOWN);
				return false;
			case 37:	// LEFT
				changeDirection(Bomberman.Common.Direction.LEFT);
				return false;
			case 39:	// RIGHT
				changeDirection(Bomberman.Common.Direction.RIGHT);
				return false;
			case 27:	// ESC
				break;
			case 13:	// Enter
				break;
			case 32:	// SPACE
				plantBomb();
				break;
			default:
				break;
		}
	};
	
	document.onkeyup = function (event) {
		
		switch(event.which)
		{
			case 38:	// UP
				stopDirection([Bomberman.Common.Direction.UP]);
				break;
			case 40:	// DOWN
				stopDirection([Bomberman.Common.Direction.DOWN]);
				break;
			case 37:	// LEFT
				stopDirection([Bomberman.Common.Direction.LEFT]);
				break;
			case 39:	// RIGHT
				stopDirection([Bomberman.Common.Direction.RIGHT]);
				break;
			default:
				break;
		}
		
		return false;
	};
	
	//******************************************************************************
	//	This is a public function for starting the game
	//******************************************************************************
	that.start = function (playerId) {
		if( !engine ) {
			engine = new Bomberman.Engine(playerId, this);
		}
		
		engine.start();
	};
	
	//******************************************************************************
	//	This is a public function for clearing the details from the map
	//******************************************************************************
	that.clearUI = function () {
		UI.clear();
	};
	
	//******************************************************************************
	//	This is a public function for drawing the game map
	//******************************************************************************
	that.drawMap = function (map) {
		UI.draw(map);
	};
	
	//******************************************************************************
	//	This is a public function for drawing objects to the map
	//******************************************************************************
	that.drawObjects = function (playerObjects) {
		UI.drawObjects(playerObjects);
	};
	
	//******************************************************************************
	//	This is a public function for writing score to the scoreboard
	//******************************************************************************
	that.drawScore = function (scores) {
		UI.writeScoreBoard(scores);
	};
	
	//******************************************************************************
	//	This is a public function for writing a debug message
	//******************************************************************************
	that.writeDebugMessage = function (message) { 
		UI.writeDebugMessage(message);
	};
	
	//******************************************************************************
	//	This is a public function for obtaining the cell width of the map
	//******************************************************************************
	that.getCellWidth = function () {
		return UI.getCellWidth();
	};
	
	//******************************************************************************
	//	This is a public function for sending a message that the player has died
	//******************************************************************************
	that.sendDiedMsg = function (killerId, player) {
		sendMsg(Server.MessageCode.Died, player, killerId);
	};
	
	//******************************************************************************
	//	This is a public function for sending of coordinate message to other players
	//******************************************************************************
	that.sendPosMsg = function (player) {
		sendMsg(Server.MessageCode.UpdatePosition, player);
	};
	
}