## See the game running at [https://swap-tiles.herokuapp.com/](https://swap-tiles.herokuapp.com/)

## Running the game:

- build and run the Docker image
- OR: `npm install & npm run setup:client & npm run start:app`

## Development

Note: nodemon seems not to work, need to manually restart server if relevant node files changed. To run the app, you need to install both server and client dependencies.
Run

```bash
npm install
npm run setup:client
```

If done, in the root folder you can start the server with

```bash
npm run start:server
```

and in another terminal window you can start the client with

```bash
npm run start:client
```

and you will see the game running in your browser.

`/js` for the initial js client

`/react` for the newer react client
