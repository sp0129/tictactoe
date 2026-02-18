const express = require(‘express’);
const http = require(‘http’);
const WebSocket = require(‘ws’);
const { v4: uuidv4 } = require(‘uuid’);
const path = require(‘path’);

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// In-memory session store
const sessions = new Map();

// Win combinations
const WIN_COMBOS = [
[0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
[0, 3, 6], [1, 4, 7], [2, 5, 8], // cols
[0, 4, 8], [2, 4, 6],             // diags
];

function checkWinner(board) {
for (const [a, b, c] of WIN_COMBOS) {
if (board[a] && board[a] === board[b] && board[a] === board[c]) {
return { winner: board[a], line: [a, b, c] };
}
}
if (board.every(cell => cell !== null)) return { winner: ‘draw’, line: [] };
return null;
}

function createSession(sessionId) {
return {
sessionId,
players: [],       // [{ socketId, ws }]
board: Array(9).fill(null),
currentTurn: ‘X’,
status: ‘waiting’,
winner: null,
winLine: [],
};
}

function broadcast(session, event, data) {
const msg = JSON.stringify({ event, data });
session.players.forEach(p => {
if (p.ws.readyState === WebSocket.OPEN) {
p.ws.send(msg);
}
});
}

function send(ws, event, data) {
if (ws.readyState === WebSocket.OPEN) {
ws.send(JSON.stringify({ event, data }));
}
}

// Routes
app.use(express.static(path.join(__dirname, ‘public’)));

app.get(’/’, (req, res) => {
const sessionId = uuidv4();
sessions.set(sessionId, createSession(sessionId));
res.redirect(`/game/${sessionId}`);
});

app.get(’/game/:sessionId’, (req, res) => {
res.sendFile(path.join(__dirname, ‘public’, ‘index.html’));
});

// WebSocket
wss.on(‘connection’, (ws) => {
ws.id = uuidv4();

ws.on(‘message’, (raw) => {
let msg;
try { msg = JSON.parse(raw); } catch { return; }
const { event, data } = msg;

```
if (event === 'join') {
  const { sessionId } = data;
  const session = sessions.get(sessionId);

  if (!session) {
    return send(ws, 'error', { message: 'Session not found.' });
  }

  if (session.players.length >= 2) {
    return send(ws, 'error', { message: 'This game is already full.' });
  }

  // Attach session to this socket for cleanup
  ws.sessionId = sessionId;
  session.players.push({ id: ws.id, ws });

  if (session.players.length === 1) {
    // Player 1 waiting
    const shareUrl = `${data.origin}/game/${sessionId}`;
    send(ws, 'waiting', { sessionId, shareUrl });
  } else {
    // Player 2 joined — start game
    session.status = 'playing';
    session.players.forEach((p, i) => {
      send(p.ws, 'start', {
        board: session.board,
        currentTurn: session.currentTurn,
        yourRole: i === 0 ? 'X' : 'O',
      });
    });
  }
}

if (event === 'move') {
  const { sessionId, cellIndex } = data;
  const session = sessions.get(sessionId);

  if (!session || session.status !== 'playing') {
    return send(ws, 'error', { message: 'No active game session.' });
  }

  const playerIndex = session.players.findIndex(p => p.id === ws.id);
  if (playerIndex === -1) return;

  const playerRole = playerIndex === 0 ? 'X' : 'O';

  if (session.currentTurn !== playerRole) {
    return send(ws, 'error', { message: "It's not your turn." });
  }

  if (session.board[cellIndex] !== null) {
    return send(ws, 'error', { message: 'Cell already occupied.' });
  }

  // Apply move
  session.board[cellIndex] = playerRole;

  const result = checkWinner(session.board);
  if (result) {
    session.status = 'ended';
    session.winner = result.winner;
    broadcast(session, 'end', {
      board: session.board,
      winner: result.winner,
      winLine: result.line,
    });
    sessions.delete(sessionId);
  } else {
    session.currentTurn = session.currentTurn === 'X' ? 'O' : 'X';
    broadcast(session, 'update', {
      board: session.board,
      currentTurn: session.currentTurn,
    });
  }
}
```

});

ws.on(‘close’, () => {
const { sessionId } = ws;
if (!sessionId) return;
const session = sessions.get(sessionId);
if (!session) return;

```
// Notify the other player
session.players
  .filter(p => p.id !== ws.id)
  .forEach(p => send(p.ws, 'opponent_left', {}));

sessions.delete(sessionId);
```

});
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
console.log(`Tic-Tac-Toe server running at http://localhost:${PORT}`);
});