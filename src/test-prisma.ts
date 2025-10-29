import bcrypt from "bcryptjs";

async function probarHash() {
  const password = "123456";
  console.log("🔑 Contraseña original:", password);

  const hash = await bcrypt.hash(password, 10);
  console.log("🔒 Hash generado:", hash);

  const coincide = await bcrypt.compare(password, hash);
  console.log("✅ Coincide:", coincide);
}

probarHash();
