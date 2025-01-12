"use strict";

import crypto from "crypto";

let id = null;

export function genId() {
  if (!id) {
    id = crypto.randomBytes(20);
    Buffer.from("-AT0001-").copy(id, 0); // change AT
  }

  return id;
}
