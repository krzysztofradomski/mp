Potential improvements:

- fix shared types, type narrowing for message related stuff on server e.g. `function createMessage(type: MessageType, payload: any) {...}`
- export server types to client
- dockerize the whole app and deploy to fly.io
- make new tiles appear during the game, to fill the gaps made by merging
- swap edge case bugs - tbc
- fix reconnecting to the game after a disconnect
- logging of game events and errors
- better error handling
- rate limiting of the web socket connection
- game rooms with multiple players / spectators
- react to preact?
- react/pixi to v8 when ready
- fix react types
- simplify the game state and reducer
- maybe make it look like the psd? noope, too much work
