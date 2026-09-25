const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const p = new PrismaClient();

async function seedMultipleResources() {
  const hash = await bcrypt.hash('password123', 10);

  const resourceUsers = [
    // Multiple Guides (for testing guide 1-to-1 dispatch)
    { email: 'guide1@demo.com', name: 'Ramesh Kumar (Guide 1)', role: 'guide', phone: '+91 94421 10701' },
    { email: 'guide2@demo.com', name: 'Priya Sundaram (Guide 2)', role: 'guide', phone: '+91 94421 10702' },
    { email: 'guide@demo.com', name: 'Karthik Raja (Lead Guide)', role: 'guide', phone: '+91 94421 10700' },
    
    // Multiple Ambulances
    { email: 'ambulance@demo.com', name: 'Rapid Ambulance Unit 1', role: 'ambulance', phone: '+91 94421 10801' },
    { email: 'ambulance2@demo.com', name: 'City Hospital Ambulance 2', role: 'ambulance', phone: '+91 94421 10802' },

    // Multiple Police QRT
    { email: 'police@demo.com', name: 'Central Police QRT 1', role: 'police', phone: '+91 94421 10001' },
    { email: 'police2@demo.com', name: 'Highway Patrol QRT 2', role: 'police', phone: '+91 94421 10002' },

    // Fire & Security
    { email: 'fire@demo.com', name: 'SDRF Fire & Rescue Squad', role: 'fire', phone: '+91 94421 10100' },
    { email: 'security@demo.com', name: 'Tourist Security Patrol 1', role: 'security', phone: '+91 94421 10900' },
  ];

  console.log('Seeding user accounts and EmergencyResource records...');

  for (const u of resourceUsers) {
    // 1. Create or update User record
    let userRecord = await p.user.findUnique({ where: { email: u.email } });
    if (!userRecord) {
      userRecord = await p.user.create({
        data: {
          email: u.email,
          name: u.name,
          role: u.role,
          phone: u.phone,
          passwordHash: hash,
        }
      });
      console.log(`Created User: ${u.email} (${u.role})`);
    } else {
      userRecord = await p.user.update({
        where: { email: u.email },
        data: { role: u.role, name: u.name, phone: u.phone }
      });
      console.log(`Updated User: ${u.email} (${u.role})`);
    }

    // 2. Create or update distinct EmergencyResource record for each user
    let resRecord = await p.emergencyResource.findFirst({
      where: { email: u.email }
    });

    if (!resRecord) {
      resRecord = await p.emergencyResource.create({
        data: {
          name: u.name,
          type: u.role,
          email: u.email,
          phone: u.phone,
          isAvailable: true,
          notes: `Dedicated resource unit for ${u.name}`,
        }
      });
      console.log(`  -> Created EmergencyResource record: ${resRecord.name} (ID: ${resRecord.id})`);
    } else {
      await p.emergencyResource.update({
        where: { id: resRecord.id },
        data: {
          name: u.name,
          type: u.role,
          phone: u.phone,
          isAvailable: true,
        }
      });
      console.log(`  -> Updated EmergencyResource record: ${resRecord.name} (ID: ${resRecord.id})`);
    }
  }

  console.log('\nAll multiple resource units ready for 1-to-1 dispatch testing!');
  console.log('------------------------------------------------------------');
  console.log('Guides:');
  console.log('  guide1@demo.com / password123 (Guide 1)');
  console.log('  guide2@demo.com / password123 (Guide 2)');
  console.log('Ambulances:');
  console.log('  ambulance@demo.com / password123 (Ambulance 1)');
  console.log('  ambulance2@demo.com / password123 (Ambulance 2)');
  console.log('Police:');
  console.log('  police@demo.com / password123 (Police 1)');
  console.log('  police2@demo.com / password123 (Police 2)');
}

seedMultipleResources()
  .catch(e => { console.error('Error:', e); process.exit(1); })
  .finally(() => p.$disconnect());
