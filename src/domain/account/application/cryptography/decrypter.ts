export abstract class Decrypter {
  // Null when the token is malformed, tampered with, or expired
  abstract decrypt(token: string): Promise<Record<string, unknown> | null>
}
