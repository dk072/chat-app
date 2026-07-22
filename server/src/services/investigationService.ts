import prisma from '../config/db';

export const getConversationTimeline = async (conversationId: string) => {
  try {
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        user1: { select: { id: true, username: true, email: true } },
        user2: { select: { id: true, username: true, email: true } },
        messages: {
          orderBy: { createdAt: 'asc' },
          include: {
            sender: { select: { id: true, username: true } },
          },
        },
      },
    });
    return conversation;
  } catch (err) {
    console.error('Error fetching conversation timeline:', err);
    return null;
  }
};

export const searchDeletedMessages = async (query = '') => {
  try {
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { isDeletedForEveryone: true },
          { deletedForUsers: { not: '' } },
        ],
        ...(query ? { content: { contains: query } } : {}),
      },
      include: {
        sender: { select: { id: true, username: true } },
        conversation: {
          select: {
            user1: { select: { username: true } },
            user2: { select: { username: true } },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
      take: 50,
    });
    return messages;
  } catch (err) {
    console.error('Error searching deleted messages:', err);
    return [];
  }
};

export const exportEvidenceData = async (conversationId: string, format = 'json') => {
  try {
    const conv = await getConversationTimeline(conversationId);
    if (!conv) return null;

    if (format === 'csv') {
      const header = 'Timestamp,Sender,Content,Type,IsEdited,IsDeleted\n';
      const rows = conv.messages
        .map(
          (m) =>
            `"${m.createdAt.toISOString()}","${m.sender.username}","${(m.content || '').replace(/"/g, '""')}","${m.type}",${m.isEdited},${m.isDeletedForEveryone}`
        )
        .join('\n');
      return { mime: 'text/csv', data: header + rows, filename: `evidence_${conversationId}.csv` };
    }

    return {
      mime: 'application/json',
      data: JSON.stringify(conv, null, 2),
      filename: `evidence_${conversationId}.json`,
    };
  } catch (err) {
    console.error('Error exporting evidence package:', err);
    return null;
  }
};
