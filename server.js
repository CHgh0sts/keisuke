const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");
const { Server } = require("socket.io");

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = parseInt(process.env.PORT || "3000", 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  const io = new Server(server, {
    path: "/api/socket",
    addTrailingSlash: false,
  });

  // Store connected users
  const connectedUsers = new Map();

  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);

    socket.on("join", ({ userId, teamId }) => {
      if (userId) {
        connectedUsers.set(socket.id, { userId, teamId });
        
        // Join user's personal room
        socket.join(`user:${userId}`);
        
        // Join global room
        socket.join("global");
        
        // Join team room if user has a team
        if (teamId) {
          socket.join(`team:${teamId}`);
        }
        
        console.log(`User ${userId} joined rooms`);
      }
    });

    socket.on("send-message", async (data) => {
      const { conversationId, content, senderId } = data;
      
      // Broadcast to the conversation room
      io.emit("new-message", {
        conversationId,
        content,
        senderId,
        createdAt: new Date().toISOString(),
        tempId: Date.now().toString(),
      });
    });

    socket.on("mark-read", ({ conversationId, userId }) => {
      io.emit("message-read", { conversationId, userId });
    });

    socket.on("disconnect", () => {
      connectedUsers.delete(socket.id);
      console.log("Client disconnected:", socket.id);
    });
  });

  server.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
  });
});

