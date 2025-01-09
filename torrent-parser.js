"use strict";

import fs from "fs";
import bencode from "bencode";
import crypto from "crypto";
import buffer from "buffer";

const Buffer = buffer.Buffer;

export function torrentOpen(filepath) {
  const url = bencode.decode(fs.readFileSync(filepath), "utf8");
  console.log(url);
  return url;
}

export function torrentSize(torrent) {
  const size = torrent.info.files
    ? torrent.info.files.map((file) => file.length).reduce((a, b) => a + b)
    : torrent.info.length;

  const strSize = BigInt(size).toString();
  console.log("size is : ", strSize);
  Buffer.from(strSize);
}

export function infoHash(torrent) {
  const info = bencode.encode(torrent.info);
  return crypto.createHash("sha1").update(info).digest();
}
