const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Seed Country
  const country = await prisma.country.upsert({
    where: { code: "IN" },
    update: {},
    create: {
      name: "India",
      code: "IN",
      safetyLevel: 3,
    },
  });
  console.log("Seeded Country:", country);

  // Seed GeoZones near Coimbatore (User's location)
  const zones = [
    {
      name: "Coimbatore City Center (Safe)",
      zoneType: "safe",
      coordinates: JSON.stringify({
        type: "Point",
        coordinates: [76.9368, 11.0159]
      }),
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
      coordinates: JSON.stringify({
        type: "Point",
        coordinates: [76.9650, 11.0180]
      }),
      centerLat: 11.0180,
      centerLng: 76.9650,
      radius: 600,
      description: "Crowded market district. Watch for pickpockets and traffic anomalies.",
      isActive: true,
      countryId: country.id,
    },
    {
      name: "High Crime Hotspot (High Risk)",
      zoneType: "high_risk",
      coordinates: JSON.stringify({
        type: "Point",
        coordinates: [76.9920, 11.0300]
      }),
      centerLat: 11.0300,
      centerLng: 76.9920,
      radius: 500,
      description: "Area with higher incidence of reported night-time crimes. Exercise high caution.",
      isActive: true,
      countryId: country.id,
    },
    {
      name: "Restricted Industrial Zone (Restricted)",
      zoneType: "restricted",
      coordinates: JSON.stringify({
        type: "Point",
        coordinates: [76.9940, 11.0320]
      }),
      centerLat: 11.0320,
      centerLng: 76.9940,
      radius: 400,
      description: "Closed industrial premises. Unauthorized entry is strictly prohibited.",
      isActive: true,
      countryId: country.id,
    }
  ];

  for (const zone of zones) {
    const existingZone = await prisma.geoZone.findFirst({
      where: { name: zone.name }
    });
    if (!existingZone) {
      const created = await prisma.geoZone.create({ data: zone });
      console.log("Seeded GeoZone:", created.name);
    } else {
      console.log("GeoZone already exists:", zone.name);
    }
  }

  console.log("Seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
