export function isAdmin(email: string): boolean {
  const adminEmail = process.env.ADMIN_EMAIL;
  // Em dev, permite qualquer seller autenticado acessar o cockpit
  if (!adminEmail && process.env.NODE_ENV !== "production") return true;
  if (!adminEmail) return false;
  return email === adminEmail;
}
