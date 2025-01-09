"use strict";

import fs from "fs";
import bencode from "bencode";

export function torrentOpen(filepath) {
  const url = bencode.decode(fs.readFileSync(filepath), "utf8");
  console.log(url);
  return url;
}

export function size() {}

export function infoHash() {}
