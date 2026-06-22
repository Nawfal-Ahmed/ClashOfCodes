export const initializeSocket = (io) => {
  io.on("connection", (socket) => {
    console.log("User Connected:", socket.id);

    socket.on("joinLobby", (code) => {
      socket.join(code);
    });

    socket.on("leaveLobby", (code) => {
      socket.leave(code);
    });

    socket.on("disconnect", () => {
      console.log("User Disconnected:", socket.id);
    });
  });
};