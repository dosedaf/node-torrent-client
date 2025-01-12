"use strict";

import { getPeers } from "./src/tracker.js";
import { torrentOpen } from "./src/torrent-parser.js";
import { download } from "./src/download.js";

const torrent = torrentOpen("flow");
//const torrent = torrentOpen(process.argv[2]);

getPeers(torrent, (peers) => {
  console.log(torrent);
  console.log("peers: ", peers);
});

download(torrent);
