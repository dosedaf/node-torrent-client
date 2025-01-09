"use strict";

import { getPeers } from "./tracker.js";
import { torrentOpen } from "./torrent-parser.js";

const torrent = torrentOpen("flow");

/*
const torrent = bencode.decode(
  fs.readFileSync("Wicked (2024) [1080p] [WEBRip] [5.1] [YTS.MX].torrent"),
  "utf8",
);
*/

getPeers(torrent, (peers) => {
  console.log(torrent);
  console.log("peers: ", peers);
});
