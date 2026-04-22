let io = null;

function setIO(serverOrIO) {
  // accept either an io instance or an http server
  if (serverOrIO && typeof serverOrIO.emit === 'function') {
    io = serverOrIO;
    return io;
  }

  throw new Error('Invalid argument to setIO');
}

function getIO() {
  if (!io) throw new Error('Socket.IO not initialized');
  return io;
}

module.exports = { setIO, getIO };
