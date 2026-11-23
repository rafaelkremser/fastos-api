// E-mails are kept and looked up in lowercase, without surrounding spaces, so
// "Ana@Loja.com" and "ana@loja.com" are the same person. The database refuses
// any other form
export function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}
