"use strict";

import dgram from "dgram";
import url from "whatwg-url";
import buffer from "buffer";
import crypto from "crypto";
import { genId } from "./util.js";
import { torrentSize } from "./torrent-parser.js";

const Buffer = buffer.Buffer;
const parseUrl = url.parseURL;

export function getPeers(torrent, callback) {
  const socket = dgram.createSocket("udp4");
  const url = torrent.announce;

  udpSend(socket, buildConnReq(), url);

  socket.on("message", (response) => {
    if (respType(response) === "connect") {
      const connResp = parseConnResp(response);

      const announceReq = buildAnnounceReq(connResp.connectionId, torrent);
      udpSend(socket, announceReq, url);
    } else if (respType(response) === "announce") {
      const announceResp = parseAnnounceResp(response);
      callback(announceResp.peers);
    }
  });
}

function udpSend(socket, message, rawUrl, callback = () => {}) {
  const url = parseUrl(rawUrl);
  socket.send(message, 0, message.length, url.port, url.host, callback);
}

function respType(resp) {
  const action = resp.readUInt32BE(0);
  if (action === 0) return "connect";
  if (action === 1) return "announce";
  return "unknown";
}

function buildConnReq() {
  const buf = Buffer.alloc(16);

  // Protocol id
  buf.writeUInt32BE(0x417, 0);
  buf.writeUInt32BE(0x27101980, 4);

  // Action (connect)
  buf.writeUInt32BE(0, 8);

  // Transaction id
  crypto.randomBytes(4).copy(buf, 12);

  return buf;
}

function parseConnResp(resp) {
  return {
    action: resp.readUInt32BE(0),
    transactionId: resp.readUInt32BE(4),
    connectionId: resp.slice(8),
  };
}

function buildAnnounceReq(connectionId, torrent, port = 6881) {
  const buf = Buffer.alloc(98);

  connectionId.copy(buf, 0); // buf.writeInt32BE(connectionId, 0) (same thing)
  buf.writeInt32BE(1, 8); // 1 for announce
  crypto.randomBytes(4).copy(buf, 12);
  // buf.writeInt32BE(crypto.randomBytes(4), 12); (again, same thing)

  // hash
  // peer
  genId().copy(buf, 36);

  Buffer.alloc(8).copy(buf, 56);
  buf.writeInt;
  buf.writeInt32BE(torrentSize(torrent), 64);
  // console.log(buf);

  // pr
  //torrentSize(torrent).copy(buf, 64);
  // left is size basically
  Buffer.alloc(8).copy(buf, 72);

  buf.writeInt32BE(0, 80);
  buf.writeInt32BE(0, 84);
  crypto.randomBytes(4).copy(buf, 88);
  buf.writeInt32BE(-1, 92);
  buf.writeInt16BE(port, 96);

  return buf;
}

function parseAnnounceResp(resp) {
  function group(iterable, groupSize) {
    let groups = [];
    for (let i = 0; i < iterable.length; i += groupSize) {
      groups.push(iterable.slice(i, i + groupSize));
    }
    return groups;
  }

  return {
    action: resp.readUInt32BE(0),
    transactionId: resp.readUInt32BE(4),
    leechers: resp.readUInt32BE(8),
    seeders: resp.readUInt32BE(12),
    peers: group(resp.slice(20), 6).map((address) => {
      return {
        ip: address.slice(0, 4).join("."),
        port: address.readUInt16BE(4),
      };
    }),
  };
}
