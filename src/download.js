"use strict";

import net from "net";
import buffer from "buffer";
import { getPeers } from "./tracker.js";

import * as message from "./message.js";

export default (torrent) => {
  getPeers(torrent, (peers) => {
    peers.forEach((peer) => download(peer, torrent, requested));
  });
};

function onWholeMsg(socket, callback) {
  let savedBuf = Buffer.alloc(0);
  let handshake = true;

  socket.on("data", (recvBuf) => {
    const msgLen = () =>
      handshake ? savedBuf.readUInt8(0) + 49 : savedBuf.readInt32BE(0) + 4;
    savedBuf = Buffer.concat([savedBuf, recvBuf]);

    while (savedBuf.length >= 4 && savedBuf.length >= msgLen()) {
      callback(savedBuf.subArray(0, msgLen()));
      savedBuf = savedBuf.subArray(msgLen());
      handshake = false;
    }
  });
}

function download(peer, torrent, requested) {
  const socket = new net.Socket();
  socket.on("error", console.log);

  socket.connect(peer.port, peer.ip, () => {
    socket.write(message.buildHandshake(torrent));
  });

  onWholeMsg(socket, (msg) => msgHandler(msg, socket, requested));
}

function msgHandler(msg, socket) {
  if (isHandshake(msg)) {
    socket.write(message.buildInterested());
  } else {
    const m = message.parse(msg);

    if (m.id === 0) chokeHandler();
    if (m.id === 1) unchokeHandler();
    if (m.id === 4) haveHandler(m.payload, socket.requested);
    if (m.id === 5) bitfieldHandler(m.payload);
    if (m.id === 7) pieceHandler(m.payload);
  }
}

function isHandshake(msg) {
  return (
    msg.length === msg.readUInt8(0) + 49 &&
    msg.toString("utf8", 1) === "BitTorrent protocol"
  );
}

function haveHandler(payload, socket, requested) {
  // ...
  const pieceIndex = payload.readUInt32BE(0);
  if (!requested[pieceIndex]) {
    socket.write(message.buildRequest(...));
  }
  requested[pieceIndex] = true;
}
