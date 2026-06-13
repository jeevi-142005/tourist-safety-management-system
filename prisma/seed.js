const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...\n");

  // ─── 1. Create Demo Users ───────────────────────────────────────────
  const defaultPassword = await bcrypt.hash("password123", 10);

  const users = [
    {
      email: "admin@safetour.com",
      name: "Safety Admin",
      role: "admin",
      passwordHash: defaultPassword,
    },
    {
      email: "tourist@demo.com",
      name: "Demo Tourist",
      role: "tourist",
      passwordHash: defaultPassword,
      blockchainId: "BLK-" + Math.random().toString(36).substring(2, 11).toUpperCase(),
    },
    {
      email: "john.doe@email.com",
      name: "John Doe",
      role: "tourist",
      passwordHash: defaultPassword,
      blockchainId: "BLK-" + Math.random().toString(36).substring(2, 11).toUpperCase(),
    },
  ];

  for (const userData of users) {
    const existing = await prisma.user.findUnique({
      where: { email: userData.email },
    });
    if (!existing) {
      const user = await prisma.user.create({ data: userData });
      console.log("  ✅ Created user:", user.email, "(" + user.role + ")");
    } else {
      console.log("  ⏭️  User already exists:", userData.email);
    }
  }

  // ─── 2. Seed Countries ─────────────────────────────────────────────
  const country = await prisma.country.upsert({
    where: { code: "IN" },
    update: {},
    create: {
      name: "India",
      code: "IN",
      safetyLevel: 3,
    },
  });
  console.log("\n  ✅ Country seeded:", country.name);

  // ─── 3. Seed GeoZones ──────────────────────────────────────────────
  const zones = [
    {
      name: "Coimbatore City Center (Safe)",
      zoneType: "safe",
      coordinates: JSON.stringify({ type: "Point", coordinates: [76.9368, 11.0159] }),
      centerLat: 11.0159,
      centerLng: 76.9368,
      radius: 1000,
      description: "Secure area with high police presence and safety assist kiosks.",
      isActive: true,
      countryId: country.id,
    },
    {
      name: "Gandhipuram Commercial Area (Caution)",
      zoneType: "caution",
      coordinates: JSON.stringify({ type: "Point", coordinates: [76.965, 11.018] }),
      centerLat: 11.018,
      centerLng: 76.965,
      radius: 600,
      description: "Crowded market district. Watch for pickpockets and traffic anomalies.",
      isActive: true,
      countryId: country.id,
    },
    {
      name: "High Crime Hotspot (High Risk)",
      zoneType: "high_risk",
      coordinates: JSON.stringify({ type: "Point", coordinates: [76.992, 11.03] }),
      centerLat: 11.03,
      centerLng: 76.992,
      radius: 500,
      description: "Area with higher incidence of reported night-time crimes.",
      isActive: true,
      countryId: country.id,
    },
    {
      name: "Restricted Industrial Zone",
      zoneType: "restricted",
      coordinates: JSON.stringify({ type: "Point", coordinates: [76.994, 11.032] }),
      centerLat: 11.032,
      centerLng: 76.994,
      radius: 400,
      description: "Closed industrial premises. Unauthorized entry prohibited.",
      isActive: true,
      countryId: country.id,
    },
  ];

  for (const zone of zones) {
    const existing = await prisma.geoZone.findFirst({
      where: { name: zone.name },
    });
    if (!existing) {
      const created = await prisma.geoZone.create({ data: zone });
      console.log("  ✅ GeoZone seeded:", created.name);
    } else {
      console.log("  ⏭️  GeoZone exists:", zone.name);
    }
  }

  console.log("\n🎉 Seeding completed successfully!");
  console.log("\n📋 Demo login credentials:");
  console.log("   Admin  → admin@safetour.com / password123");
  console.log("   Tourist → tourist@demo.com / password123");
  console.log("   Tourist → john.doe@email.com / password123");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
