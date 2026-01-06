import crypto from "node:crypto";
import { requireEnv } from "@/lib/env";

export type EncryptedBlobV1 = {
  v: 1;
  alg: "AES-256-GCM";
  iv_b64: string;
  tag_b64: string;
  ciphertext_b64: string;
  wrappedKey: {
    alg: "AES-256-GCM";
    iv_b64: string;
    tag_b64: string;
    ciphertext_b64: string;
  };
};

function b64(buf: Buffer): string {
  return buf.toString("base64");
}

function fromB64(s: string): Buffer {
  return Buffer.from(s, "base64");
}

function getEventKek(): Buffer {
  const kekB64 = requireEnv("EVENT_KEK_BASE64");
  const kek = fromB64(kekB64);
  if (kek.length !== 32) {
    throw new Error(
      `EVENT_KEK_BASE64 must decode to 32 bytes (got ${kek.length})`,
    );
  }
  return kek;
}

function aes256gcmEncrypt(key: Buffer, plaintext: Buffer): { iv: Buffer; tag: Buffer; ciphertext: Buffer } {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();
  return { iv, tag, ciphertext };
}

function aes256gcmDecrypt(key: Buffer, iv: Buffer, tag: Buffer, ciphertext: Buffer): Buffer {
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
}

export function encryptJsonForEvent(payload: unknown): EncryptedBlobV1 {
  const kek = getEventKek();

  // Per-event DEK (data encryption key)
  const dek = crypto.randomBytes(32);
  const plaintext = Buffer.from(JSON.stringify(payload), "utf8");

  const data = aes256gcmEncrypt(dek, plaintext);
  const wrapped = aes256gcmEncrypt(kek, dek);

  return {
    v: 1,
    alg: "AES-256-GCM",
    iv_b64: b64(data.iv),
    tag_b64: b64(data.tag),
    ciphertext_b64: b64(data.ciphertext),
    wrappedKey: {
      alg: "AES-256-GCM",
      iv_b64: b64(wrapped.iv),
      tag_b64: b64(wrapped.tag),
      ciphertext_b64: b64(wrapped.ciphertext),
    },
  };
}

export function decryptJsonForEvent(blob: EncryptedBlobV1): unknown {
  if (blob.v !== 1) throw new Error(`Unsupported encrypted blob version: ${blob.v}`);
  if (blob.alg !== "AES-256-GCM") throw new Error(`Unsupported alg: ${blob.alg}`);

  const kek = getEventKek();
  const dek = aes256gcmDecrypt(
    kek,
    fromB64(blob.wrappedKey.iv_b64),
    fromB64(blob.wrappedKey.tag_b64),
    fromB64(blob.wrappedKey.ciphertext_b64),
  );
  if (dek.length !== 32) throw new Error("Unwrapped DEK length invalid");

  const plaintext = aes256gcmDecrypt(
    dek,
    fromB64(blob.iv_b64),
    fromB64(blob.tag_b64),
    fromB64(blob.ciphertext_b64),
  );

  return JSON.parse(plaintext.toString("utf8")) as unknown;
}

