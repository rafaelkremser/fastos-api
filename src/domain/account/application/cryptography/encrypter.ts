export abstract class Encrypter {
  abstract encrypt(
    payload: Record<string, unknown>,
    expiresInSeconds: number,
  ): Promise<string>
}
