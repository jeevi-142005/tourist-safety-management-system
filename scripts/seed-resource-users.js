const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const p = new PrismaClient();

async function createDemoResourceUsers() {
  const hash = await bcrypt.hash('password123', 10);

  const resourceUsers = [
    { email: 'ambulance@demo.com', name: 'Demo Ambulance Unit', role: 'ambulance' },
    { email: 'police@demo.com', name: 'Demo Police QRT', role: 'police' },
    { email: 'fire@demo.com', name: 'Demo Fire & Rescue', role: 'fire' },
    { email: 'security@demo.com', name: 'Demo Security Guard', role: 'security' },
  ];

  for (const u of resourceUsers) {
    const existing = await p.user.findUnique({ where: { email: u.email } });
    if (!existing) {
      await p.user.create({ data: { ...u, passwordHash: hash } });
      console.log('Created:', u.email, '(' + u.role + ')');
    } else {
      // Update existing user's role if needed
      await p.user.update({ where: { email: u.email }, data: { role: u.role } });
      console.log('Updated role for:', u.email, '->', u.role);
    }
  }
  console.log('\nDemo resource users ready!');
  console.log('  ambulance@demo.com / password123');
  console.log('  police@demo.com / password123');
  console.log('  fire@demo.com / password123');
  console.log('  security@demo.com / password123');
}

createDemoResourceUsers()
  .catch(e => { console.error('Error:', e); process.exit(1); })
  .finally(() => p.$disconnect());
