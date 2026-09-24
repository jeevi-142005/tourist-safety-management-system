const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const user = await prisma.user.findFirst({ where: { role: 'tourist' } });
  if (user) {
    await prisma.touristId.create({
      data: {
        userId: user.id,
        documentType: 'passport',
        documentNumber: 'A1234567',
        blockchainHash: 'BCH-TOURIST-ADMIN-999',
        validUntil: new Date('2030-01-01')
      }
    });
    console.log('Created ID: BCH-TOURIST-ADMIN-999');
  } else {
    console.log('No tourist user found.');
  }
}
main().finally(() => prisma.$disconnect());
