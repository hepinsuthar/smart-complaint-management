const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const path = require("path");
const http = require("http");
const { setIO } = require("./utils/socket");

require("dotenv").config();
connectDB();
const { createDefaultAdmin } = require("./controllers/authController");
createDefaultAdmin();

const app = express();

app.use(
  cors({
    origin: "*",
    credentials: true,
  })
);

app.use(express.json());

// Serve uploaded files
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/complaints", require("./routes/complaintRoutes"));
app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/notifications", require("./routes/notificationRoutes"));

// const complaintRoutes = require("./routes/complaintRoutes");
// app.use("/api/complaints", complaintRoutes);


const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

setIO(io);

io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);

  socket.on("join", (userId) => {
    if (userId) {
      socket.join(`user_${userId}`);
    }
  });

  socket.on("disconnect", () => {
    // handle disconnect if needed
  });
});
app.get("/", (req, res) => {
  res.send("Smart Complaint Management API is running...");
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
