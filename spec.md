# Multiplayer Tic-Tac-Toe — Developer Spec

## Overview

A minimal, real-time two-player tic-tac-toe web application. Two anonymous players on separate devices share a unique session link and play a single game against each other. No accounts, no persistence, no rematch.

---

## Tech Stack (Recommended)

| Layer | Technology |
|---|---|
| Frontend | Vanilla HTML/CSS/JS (single `index.html`) or lightweight framework like Vite + vanilla JS |
| Backend | Node.js with Express |
| Real-time | WebSockets via `ws` or `socket.io` |
| Session IDs | UUID v4 (e.g. `crypto.randomUUID()`) |
| Hosting | Any Node-compatible host (e.g. Railway, Render, Fly.io) |

No database required. All game state lives in server memory for the duration of the session.

---

## User Flow

1. **Player 1** visits the app's root URL.
2. A unique session ID is generated (UUID v4) and Player 1 is redirected to:
   `https://yourdomain.com/game/{sessionId}`
3. The page displays a **shareable link** and a "Waiting for opponent..." message.
4. **Player 2** opens the shared link in their browser on a separate device.
5. Both players are connected via WebSocket to the same session room.
6. The game begins. Player 1 is **X**, Player 2 is **O**.
7. Players take turns clicking cells. The active player's turn is enforced server-side.
8. The game ends when there's a winner or a draw.
9. A result screen is shown to both players. No rematch option. Session is over.

---

## Game Rules

- Standard 3×3 grid.
- Player 1 = **X** (color: `#E05C5C` — warm red), Player 2 = **O** (color: `#4A90D9` — calm blue).
- Players alternate turns, X goes first.
- Win condition: 3 in a row horizontally, vertically, or diagonally.
- Draw condition: all 9 cells filled with no winner.
- A player cannot click on an already-filled cell.
- A player cannot click when it's not their turn.

---

## Frontend

### Pages / States (single page, state-driven)

| State | Description |
|---|---|
| `LOBBY` | "Waiting for opponent..." + shareable link display |
| `PLAYING` | Active game board |
| `ENDED` | Result screen (Win / Loss / Draw) |

### UI Components

- **Header:** Game title ("Tic-Tac-Toe") — minimal, centered.
- **Status bar:** Shows current turn ("Your turn" / "Opponent's turn") or result.
- **Game board:** 3×3 CSS Grid. Each cell is a clickable square. Clicking sends a move to the server.
- **Shareable link:** Displayed during `LOBBY` state with a "Copy Link" button.
- **Winning line highlight:** Optional — highlight the three winning cells (change background or add a line overlay) when the game ends.

### Visual Style

- Clean, minimal design. White/light grey background. Dark text.
- No animations required.
- X rendered in `#E05C5C` (red), O rendered in `#4A90D9` (blue).
- Font: System font stack or Google Fonts (e.g. Inter).
- Fully responsive — works on mobile and desktop.

---

## Backend

### Session Management

- Sessions stored in a server-side `Map` keyed by `sessionId`.
- Each session object:

```js
{
  sessionId: "uuid-v4",
  players: [socketId1, socketId2],   // max 2
  board: Array(9).fill(null),        // null | 'X' | 'O'
  currentTurn: 'X',                  // 'X' or 'O'
  status: 'waiting' | 'playing' | 'ended',
  winner: null | 'X' | 'O' | 'draw'
}
```

- Sessions are deleted from memory when either player disconnects or the game ends.

### API / Routing

| Route | Description |
|---|---|
| `GET /` | Generates a new sessionId, redirects to `/game/{sessionId}` |
| `GET /game/:sessionId` | Serves the single-page app HTML |
| WebSocket | All game communication |

### WebSocket Events

#### Client → Server

| Event | Payload | Description |
|---|---|---|
| `join` | `{ sessionId }` | Player joins a session room |
| `move` | `{ sessionId, cellIndex }` | Player makes a move (0–8) |

#### Server → Client

| Event | Payload | Description |
|---|---|---|
| `waiting` | `{ sessionId, shareUrl }` | Sent to Player 1 while waiting for P2 |
| `start` | `{ board, currentTurn, yourRole }` | Sent to both players when game begins |
| `update` | `{ board, currentTurn }` | Sent to both after each valid move |
| `end` | `{ board, winner }` | Sent to both when game ends (`winner`: `'X'`, `'O'`, or `'draw'`) |
| `opponent_left` | `{}` | Sent if the other player disconnects mid-game |
| `error` | `{ message }` | Invalid move or session not found |

### Server-side Validation

- Reject move if: cell already occupied, not that player's turn, game already ended, or session doesn't exist.
- Compute win/draw after every move server-side. Never trust the client for game state.

---

## Win Detection Logic

Check all 8 winning combinations after each move:

```
Rows:    [0,1,2], [3,4,5], [6,7,8]
Cols:    [0,3,6], [1,4,7], [2,5,8]
Diags:   [0,4,8], [2,4,6]
```

If all 9 cells are filled and no winner → draw.

---

## Security / Edge Cases

| Scenario | Handling |
|---|---|
| Third player tries to join a full session | Reject with an error message: "This game is already full." |
| Player visits an invalid/expired sessionId | Show "Session not found" message |
| Player disconnects mid-game | Notify the remaining player with `opponent_left` event and end the session |
| Player tries to move out of turn | Server rejects silently or returns `error` event |

---

## File Structure (suggested)

```
/
├── server.js          # Express + WebSocket server
├── package.json
├── public/
│   └── index.html     # Full SPA (HTML + CSS + JS inline or linked)
```

---

## Out of Scope

- User accounts or authentication
- Game history or persistence
- Rematch functionality
- AI opponent
- Chat or any other communication between players
- Spectator mode

---

## Summary of Key Decisions

| Decision | Choice |
|---|---|
| Players | 2, anonymous |
| Multiplayer | Real-time WebSocket, same session link |
| Session ID | UUID v4 in URL |
| Persistence | None (in-memory only) |
| Rematch | Not supported |
| X color | `#E05C5C` (red) |
| O color | `#4A90D9` (blue) |
| Style | Minimal, clean, responsive |
| Game logic authority | Server-side only |