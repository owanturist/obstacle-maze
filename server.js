/* eslint-disable strict */

'use strict';

const StaticServer = require('static-server');
const path = require('path');

const server = new StaticServer({
    rootPath: path.resolve('./build/'),
    port: 3000,
    name: 'Maze'
});

server.start(() => {
    console.log(`The app running in the browser http://localhost:${server.port}`);
});
