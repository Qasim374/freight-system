const bcrypt = require("bcryptjs");

async function hashPassword() {
  const password = "securepass123";
  const saltRounds = 12;

  try {
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    console.log("Original password:", password);
    console.log("Hashed password:", hashedPassword);
    console.log("\nCopy this hashed password and update your database!");
  } catch (error) {
    console.error("Error hashing password:", error);
  }
}

hashPassword();
