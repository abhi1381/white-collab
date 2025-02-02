import { createServer } from "node:http";
import next from "next";
import { Server } from "socket.io";

const dev = process.env.NODE_ENV !== "production";
const port = process.env.PORT || 3000;
const app = next({ dev });
const handler = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer(handler);
  const io = new Server(server);
  const activeUsers = new Map();

  io.on("connection", (socket) => {
    socket.on("user-joined", ({ name, emoji }) => {
      activeUsers.set(socket.id, {
        id: socket.id,
        name,
        emoji,
        position: { x: 0, y: 0 },
      });
      io.emit("users-update", Array.from(activeUsers.values()));
    });

    socket.on("draw", (data) => {
      const user = activeUsers.get(socket.id);
      if (!user) return;

      user.isDrawing = data.type === "start";
      activeUsers.set(socket.id, user);

      socket.broadcast.emit("draw", {
        ...data,
        user: { id: socket.id, name: user.name, emoji: user.emoji },
      });
      io.emit("users-update", Array.from(activeUsers.values()));
    });

    socket.on("user-position", ({ position }) => {
      const user = activeUsers.get(socket.id);
      if (!user) return;

      user.position = position;
      activeUsers.set(socket.id, user);
      socket.broadcast.emit("user-position", { ...user, position });
    });

    socket.on("image-drop", (data) => {
      socket.broadcast.emit("image-drop", data);
    });

    socket.on("disconnect", () => {
      activeUsers.delete(socket.id);
      io.emit("users-update", Array.from(activeUsers.values()));
      io.emit("user-disconnected", socket.id);
    });
  });

  server.listen(port, () => {
    console.log(`> Ready on http://localhost:${port}`);
  });
});
