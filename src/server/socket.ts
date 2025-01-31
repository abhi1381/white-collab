import { Server } from "socket.io";

interface User {
  id: string;
  name: string;
  emoji: string;
  position: { x: number; y: number };
  isDrawing?: boolean;
}

const io = new Server(3001, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

const activeUsers = new Map<string, User>();

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("user-joined", ({ name, emoji }) => {
    activeUsers.set(socket.id, {
      id: socket.id,
      name,
      emoji,
      position: { x: 0, y: 0 }
    });
    io.emit("users-update", Array.from(activeUsers.values()));
  });

  socket.on("draw", (data) => {
    try {
      const user = activeUsers.get(socket.id);
      if (user) {
        user.isDrawing = data.type === "start";
        activeUsers.set(socket.id, user);
        
        // Include user info in the draw event
        socket.broadcast.emit("draw", {
          ...data,
          user: {
            id: socket.id,
            name: user.name,
            emoji: user.emoji
          },
          timestamp: Date.now()
        });
        
        // Broadcast updated user status
        io.emit("users-update", Array.from(activeUsers.values()));
      }
    } catch (error) {
      console.error("Error broadcasting draw event:", error);
    }
  });

  socket.on("clear", () => {
    socket.broadcast.emit("clear");
  });

  socket.on("user-position", (data) => {
    const user = activeUsers.get(socket.id);
    if (user) {
      user.position = data.position;
      activeUsers.set(socket.id, user);
      socket.broadcast.emit("user-position", {
        ...user,
        position: data.position
      });
    }
  });

  socket.on("disconnect", () => {
    activeUsers.delete(socket.id);
    io.emit("users-update", Array.from(activeUsers.values()));
    io.emit("user-disconnected", socket.id);
    console.log("User disconnected:", socket.id);
  });
});

export default io;
