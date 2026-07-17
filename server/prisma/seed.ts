import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Standard password hashes
  const adminPasswordHash = await bcrypt.hash('AdminPassword123', 10);
  const userPasswordHash = await bcrypt.hash('UserPassword123', 10);

  // 1. Create Admin User
  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      email: 'admin@chatapp.com',
      passwordHash: adminPasswordHash,
      bio: 'System Administrator.',
      role: 'ADMIN',
      profilePicture: 'https://res.cloudinary.com/demo/image/upload/d_avatar.png/v1/sample.jpg'
    }
  });
  console.log(`Admin user created: ${admin.username} (${admin.email})`);

  // 2. Create User Alice
  const alice = await prisma.user.upsert({
    where: { username: 'alice' },
    update: {},
    create: {
      username: 'alice',
      email: 'alice@chatapp.com',
      passwordHash: userPasswordHash,
      bio: 'Living life one code block at a time.',
      role: 'USER',
      profilePicture: 'https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg'
    }
  });
  console.log(`User Alice created: ${alice.username} (${alice.email})`);

  // 3. Create User Bob
  const bob = await prisma.user.upsert({
    where: { username: 'bob' },
    update: {},
    create: {
      username: 'bob',
      email: 'bob@chatapp.com',
      passwordHash: userPasswordHash,
      bio: 'Hey, I am online!',
      role: 'USER',
      profilePicture: 'https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg'
    }
  });
  console.log(`User Bob created: ${bob.username} (${bob.email})`);

  // 3.5 Create AI Assistant Antigravity
  const antigravity = await prisma.user.upsert({
    where: { username: 'antigravity' },
    update: {},
    create: {
      username: 'antigravity',
      email: 'antigravity@chatapp.com',
      passwordHash: userPasswordHash, // UserPassword123
      bio: 'Antigravity - Your premium agentic AI coding companion.',
      role: 'USER',
      profilePicture: 'https://res.cloudinary.com/demo/image/upload/d_avatar.png/v1/sample.jpg'
    }
  });
  console.log(`User Antigravity created: ${antigravity.username} (${antigravity.email})`);

  // 4. Create an initial conversation between Alice and Bob to demonstrate real-time features
  const conversation = await prisma.conversation.upsert({
    where: {
      user1Id_user2Id: {
        user1Id: alice.id < bob.id ? alice.id : bob.id,
        user2Id: alice.id < bob.id ? bob.id : alice.id
      }
    },
    update: {},
    create: {
      user1Id: alice.id < bob.id ? alice.id : bob.id,
      user2Id: alice.id < bob.id ? bob.id : alice.id
    }
  });
  console.log(`Initial conversation established between Alice and Bob! ID: ${conversation.id}`);

  // 5. Create some seed messages in the conversation
  const count = await prisma.message.count({ where: { conversationId: conversation.id } });
  if (count === 0) {
    await prisma.message.createMany({
      data: [
        {
          conversationId: conversation.id,
          senderId: alice.id,
          content: 'Hey Bob! Did you see the new chat app design?',
          isDelivered: true,
          isSeen: true,
          createdAt: new Date(Date.now() - 3600000 * 2) // 2 hours ago
        },
        {
          conversationId: conversation.id,
          senderId: bob.id,
          content: 'Yeah, Alice! It looks super premium. Loving the glassmorphic aesthetics.',
          isDelivered: true,
          isSeen: true,
          createdAt: new Date(Date.now() - 3600000) // 1 hour ago
        },
        {
          conversationId: conversation.id,
          senderId: alice.id,
          content: 'Great! Let\'s test out the files and reactions features here.',
          isDelivered: true,
          isSeen: false,
          createdAt: new Date(Date.now() - 60000) // 1 minute ago
        }
      ]
    });
    console.log('Seed messages inserted.');
  }

  // 6. Create a conversation between Alice and Antigravity
  const aiConversation = await prisma.conversation.upsert({
    where: {
      user1Id_user2Id: {
        user1Id: alice.id < antigravity.id ? alice.id : antigravity.id,
        user2Id: alice.id < antigravity.id ? antigravity.id : alice.id
      }
    },
    update: {},
    create: {
      user1Id: alice.id < antigravity.id ? alice.id : antigravity.id,
      user2Id: alice.id < antigravity.id ? antigravity.id : alice.id
    }
  });
  console.log(`AI conversation established! ID: ${aiConversation.id}`);

  // Seeding AI message
  const aiCount = await prisma.message.count({ where: { conversationId: aiConversation.id } });
  if (aiCount === 0) {
    await prisma.message.create({
      data: {
        conversationId: aiConversation.id,
        senderId: antigravity.id,
        content: 'Hello Alice! I am Antigravity, your AI pairing assistant. Welcome to Chime! You can test sending files, audio voice notes, edits, and reactions in this chat room.',
        isDelivered: true,
        isSeen: false
      }
    });
    console.log('AI seed messages inserted.');
  }

  console.log('Database seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
