/**
 * A minimal HTTP server implementation using express js for dev testing
 */
const HTTP_PORT = 3000;

const path = require("path");
const express = require("express");
const socket = require("socket.io");
const bodyParser = require("body-parser");

const app = express();
app.use(express.static(__dirname));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// A in-memory data store (indexed by roomid) for holding room offers & ansers.
let rooms = {};

app.post('/push/:room', (req, res) => {
	const room = req.params.room;
	const session = req.body.session;
	const type = req.body.type; // "offer" | "anwser"
	const data = req.body.data; // actual RTC offer or answer object
	rooms[room] = rooms[room] ? rooms[room] : {};
	rooms[room][session] = type;
	rooms[room][type] = data;
	res.status(200);
	console.log(JSON.stringify(rooms));
});
app.get('/ping/:room', (req, res) => {
	console.log('-----GOTCHA PING');
	const room = req.params.room;
	res.json(rooms[room]);
});
app.get('/pong/:room', (req, res) => {
	console.log('-----GOTCHA PONG');
	const room = req.params.room;
	rooms[room] = undefined;
	res.status(200);
});

app.get('/:room', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));


app.listen(HTTP_PORT, err => {
  if (err) console.error(err);
  console.log("Server started on " + HTTP_PORT);
});
