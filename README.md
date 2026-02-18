# Multiplayer Tic-Tac-Toe

Real-time two-player tic-tac-toe. No accounts, no persistence — just share a link and play.

## Getting Started

```bash
npm install
npm start
```

Open <http://localhost:3000>. You’ll be redirected to a unique game session. Share the URL with a friend to start playing.

## Tech Stack

- **Backend:** Node.js + Express
- **Real-time:** WebSockets (`ws`)
- **Frontend:** Vanilla HTML/CSS/JS (single file)
- **Sessions:** UUID v4, in-memory only

## How to Play

1. Visit the app — you’re automatically assigned a session as **X**
1. Copy the session URL and send it to your opponent
1. Once they join, the game begins — X goes first
1. Click a cell on your turn to place your mark
1. First to get 3 in a row wins. All 9 filled with no winner = draw

## Deploying

Works on any Node.js host (Railway, Render, Fly.io, etc.). Set the `PORT` environment variable if needed.

```bash
# Example with Railway
railway up
```

## File Structure

```
├── server.js        # Express + WebSocket server + game logic
├── package.json
└── public/
    └── index.html   # Full SPA (HTML + CSS + JS inline)
```
