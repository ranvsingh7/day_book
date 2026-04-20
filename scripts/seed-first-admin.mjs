import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import nextEnv from "@next/env";

const { loadEnvConfig } = nextEnv;

loadEnvConfig(process.cwd());

const ADMIN_DATA = {
  name: "Ranveer Singh",
  mobile: "7877763051",
  email: "ranvsingh7@gmail.com",
  role: "admin",
  password: "Admin@123",
};

async function seedFirstAdmin() {
  const mongodbUri = process.env.MONGODB_URI;

  if (!mongodbUri) {
    throw new Error("MONGODB_URI is missing. Add it to .env.local before running the script.");
  }

  await mongoose.connect(mongodbUri);

  const users = mongoose.connection.collection("users");
  const hashedPassword = await bcrypt.hash(ADMIN_DATA.password, 12);
  const now = new Date();

  const result = await users.updateOne(
    {
      $or: [{ mobile: ADMIN_DATA.mobile }, { email: ADMIN_DATA.email }],
    },
    {
      $set: {
        name: ADMIN_DATA.name,
        mobile: ADMIN_DATA.mobile,
        email: ADMIN_DATA.email,
        role: ADMIN_DATA.role,
        password: hashedPassword,
        updatedAt: now,
      },
      $setOnInsert: {
        createdAt: now,
      },
    },
    { upsert: true }
  );

  if (result.upsertedCount > 0) {
    console.log("Admin user created successfully.");
  } else if (result.modifiedCount > 0) {
    console.log("Admin user updated successfully.");
  } else {
    console.log("Admin user already up-to-date.");
  }

  await mongoose.disconnect();
}

seedFirstAdmin().catch(async (error) => {
  console.error("Failed to seed admin user:", error.message);
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  process.exit(1);
});
