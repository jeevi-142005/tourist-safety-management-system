const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function linkResourceEmails() {
  const links = [
    { email: 'ambulance@demo.com', type: 'ambulance' },
    { email: 'police@demo.com', type: 'police' },
    { email: 'fire@demo.com', type: 'fire' },
    { email: 'security@demo.com', type: 'security' },
  ];

  for (const l of links) {
    const r = await p.emergencyResource.findFirst({ where: { type: l.type } });
    if (r) {
      await p.emergencyResource.update({ where: { id: r.id }, data: { email: l.email } });
      console.log(`Linked ${l.email} -> ${r.name}`);
    } else {
      console.log(`No EmergencyResource found for type: ${l.type}`);
    }
  }
  console.log('\nResource emails linked successfully!');
}

linkResourceEmails()
  .catch(e => { console.error('Error:', e); process.exit(1); })
  .finally(() => p.$disconnect());
