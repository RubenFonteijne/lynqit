import { createUser } from "../lib/users";

async function initAdmin() {
  try {
    const email = "rubenfonteijne@gmail.com";
    const password = "adminadmin";
    const role = "admin";

    // Check if admin already exists
    const { getUserByEmail } = await import("../lib/users");
    const existingUser = await getUserByEmail(email);

    if (existingUser) {
      console.log("Admin account already exists!");
      return;
    }

    // Create admin account
    const admin = await createUser(email, password, role);
    console.log(`Admin account created successfully!`);
    console.log(`Email: ${admin.email}`);
    console.log(`Role: ${admin.role}`);
  } catch (error) {
    console.error("Error creating admin account:", error);
    process.exit(1);
  }
}

initAdmin();

