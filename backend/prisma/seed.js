const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create subjects
  const subjects = [
    { name: 'Mathematics', iconEmoji: '📐', colorHex: '#f6c90e' },
    { name: 'Chemistry', iconEmoji: '🧪', colorHex: '#1DBF73' },
    { name: 'Physics', iconEmoji: '⚡', colorHex: '#4A90D9' },
    { name: 'Computer Science', iconEmoji: '💻', colorHex: '#7B68EE' },
    { name: 'Biology', iconEmoji: '🧬', colorHex: '#FF6B6B' },
    { name: 'History', iconEmoji: '📜', colorHex: '#FF8C42' },
    { name: 'Literature', iconEmoji: '📖', colorHex: '#E91E8C' },
    { name: 'Economics', iconEmoji: '📊', colorHex: '#00BCD4' }
  ];

  for (const sub of subjects) {
    await prisma.subject.upsert({
      where: { name: sub.name },
      update: {},
      create: sub
    });
  }

  console.log('Subjects seeded');

  // Create demo users
  const password = await bcrypt.hash('password123', 10);

  const alice = await prisma.user.upsert({
    where: { email: 'alice@demo.com' },
    update: {},
    create: {
      name: 'Alice Johnson',
      email: 'alice@demo.com',
      password,
      bio: 'Computer Science student passionate about algorithms'
    }
  });

  const bob = await prisma.user.upsert({
    where: { email: 'bob@demo.com' },
    update: {},
    create: {
      name: 'Bob Smith',
      email: 'bob@demo.com',
      password,
      bio: 'Maths enthusiast, loves solving calculus problems'
    }
  });

  console.log('Demo users seeded');

  // Get subjects for creating doubts
  const cs = await prisma.subject.findUnique({ where: { name: 'Computer Science' } });
  const math = await prisma.subject.findUnique({ where: { name: 'Mathematics' } });

  // Create sample doubts
  const doubt1 = await prisma.doubt.create({
    data: {
      title: 'What is the difference between BFS and DFS?',
      body: "I'm trying to understand graph traversal algorithms. Can someone explain when to use BFS vs DFS with examples?",
      authorId: alice.id,
      subjectId: cs.id
    }
  });

  const doubt2 = await prisma.doubt.create({
    data: {
      title: 'How to solve integration by parts?',
      body: 'I keep getting confused about when to apply integration by parts. Can someone walk through an example?',
      authorId: bob.id,
      subjectId: math.id
    }
  });

  // Create sample replies
  await prisma.reply.create({
    data: {
      body: 'BFS uses a queue and explores all neighbors before going deeper — great for shortest path. DFS uses a stack and goes as deep as possible before backtracking — good for cycle detection and topological sort.',
      doubtId: doubt1.id,
      authorId: bob.id,
      voteCount: 3
    }
  });

  await prisma.reply.create({
    data: {
      body: "Integration by parts follows the formula: ∫u dv = uv - ∫v du. The trick is choosing u and dv using the LIATE rule (Logarithm, Inverse trig, Algebraic, Trig, Exponential) — pick u as whichever comes first.",
      doubtId: doubt2.id,
      authorId: alice.id,
      voteCount: 5,
      isAccepted: true
    }
  });

  if (doubt2.authorId === bob.id) {
    await prisma.doubt.update({ where: { id: doubt2.id }, data: { isSolved: true } });
  }

  console.log('Sample doubts and replies seeded');
  console.log('\nDemo credentials:');
  console.log('  alice@demo.com / password123');
  console.log('  bob@demo.com   / password123');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());