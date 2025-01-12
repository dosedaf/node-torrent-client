"use strict";

import buffer from "buffer";
import { infoHash } from "./torrent-parser.js";
import { genId } from "../util.js";

const Buffer = buffer.Buffer;

export function buildHandshake(torrent) {
  const buf = Buffer.alloc(68);

  // protocol string length, 19 huruf
  buf.writeUInt8(19, 0);

  // protocol string
  buf.write("BitTorrent protocol", 1);

  // 8 reserved bytes
  // why can't we do this?
  // buf.writeBigUInt64BEI(0, 20)
  buf.writeUInt32BE(0, 20);
  buf.writeUInt32BE(0, 24);

  // info hash
  infoHash(torrent).copy(buf, 28);

  // 20 byte string used as unique id for the client
  // why do we generate it again?
  buf.write(genId());

  return buf;
}

// https://wiki.theory.org/BitTorrentSpecification#Messages
// <length-prefix><message_id><payload>
// length Big Endian, msg Id single decimal byte, payload msg dependent

// <len=0000>
export function buildKeepAlive() {
  Buffer.alloc(4);
}

// <len=0001> <id=0>
export function buildChoke() {
  const buf = Buffer.alloc(5);

  buf.writeUInt32BE(1, 0);
  buf.writeUint8(0, 4);
}

// <len=0001> <id=1>
export function buildUnchoke() {
  const buf = Buffer.alloc(5);

  buf.writeUInt32BE(1, 0);
  buf.writeUInt8(1, 4);

  return buf;
}

// <len=0001> <id=2>
export function buildInterested() {
  const buf = Buffer.alloc(5);

  buf.writeUInt32BE(1, 0);
  buf.writeUInt8(2, 4);

  return buf;
}

// <len=0001> <id=3>
export function buildUninterested() {
  const buf = Buffer.alloc(5);
  // length
  buf.writeUInt32BE(1, 0);
  // id
  buf.writeUInt8(3, 4);
  return buf;
}

// <len=0005> <id=4> <piece index>
export function buildHave(payload) {
  const buf = Buffer.alloc(9);

  buf.writeUInt32BE(5, 0);
  buf.writeUInt8(4, 4);
  buf.writeUInt32BE(payload, 5);

  console.log("payload length :", payload.length);
  console.log("index length :", payload.index.length);
  console.log("begin length :", payload.begin.length);
  console.log("block length :", payload.block.length);

  return buf;
}

// <len=0001+x> <id=5> <bitfield>
export function buildBitfield(bitfield) {
  const buf = Buffer.alloc(14);

  buf.writeUInt32BE(payload.length + 1, 0);
  buf.writeUInt8(5, 4);
  bitfield.copy(buf, 5);

  return buf;
}

export function buildRequest(payload) {
  const buf = Buffer.alloc(17);
  // length
  buf.writeUInt32BE(13, 0);
  // id
  buf.writeUInt8(6, 4);
  // piece index
  buf.writeUInt32BE(payload.index, 5);
  // begin
  buf.writeUInt32BE(payload.begin, 9);
  // length
  buf.writeUInt32BE(payload.length, 13);
  return buf;
}

export function buildPiece(payload) {
  const buf = Buffer.alloc(payload.block.length + 13);
  // length
  buf.writeUInt32BE(payload.block.length + 9, 0);
  // id
  buf.writeUInt8(7, 4);
  // piece index
  buf.writeUInt32BE(payload.index, 5);
  // begin
  buf.writeUInt32BE(payload.begin, 9);
  // block
  payload.block.copy(buf, 13);
  return buf;
}

export function buildCancel(payload) {
  const buf = Buffer.alloc(17);
  // length
  buf.writeUInt32BE(13, 0);
  // id
  buf.writeUInt8(8, 4);
  // piece index
  buf.writeUInt32BE(payload.index, 5);
  // begin
  buf.writeUInt32BE(payload.begin, 9);
  // length
  buf.writeUInt32BE(payload.length, 13);
  return buf;
}

export function buildPort(payload) {
  const buf = Buffer.alloc(7);
  // length
  buf.writeUInt32BE(3, 0);
  // id
  buf.writeUInt8(9, 4);
  // listen-port
  buf.writeUInt16BE(payload, 5); // pass the first 16bits in the payload??
  return buf;
}

export function parse() {
  const id = msg.length > 4 ? msg.readInt8(4) : null;
  let payload = msg.length > 5 ? msg.slice(5) : null;
  if (id === 6 || id === 7 || id === 8) {
    const rest = payload.slice(8);
    payload = {
      index: payload.readInt32BE(0),
      begin: payload.readInt32BE(4),
    };
    payload[id === 7 ? "block" : "length"] = rest;
  }

  return {
    size: msg.readInt32BE(0),
    id: id,
    payload: payload,
  };
}
