import prisma from '../config/db';

export const scanMediaStorage = async () => {
  try {
    const mediaMessages = await prisma.message.findMany({
      where: {
        type: { in: ['IMAGE', 'VIDEO', 'FILE', 'VOICE'] },
        fileUrl: { not: null },
      },
      select: {
        id: true,
        fileName: true,
        fileSize: true,
        fileUrl: true,
        type: true,
        createdAt: true,
      },
    });

    const totalMediaFiles = mediaMessages.length;
    const totalSizeBytes = mediaMessages.reduce((sum, m) => sum + (m.fileSize || 0), 0);

    // Identify duplicates by name & size match
    const hashMap = new Map<string, typeof mediaMessages>();
    mediaMessages.forEach((m) => {
      const key = `${m.fileName}_${m.fileSize}`;
      if (!hashMap.has(key)) hashMap.set(key, []);
      hashMap.get(key)!.push(m);
    });

    const duplicateGroups: any[] = [];
    hashMap.forEach((list, key) => {
      if (list.length > 1) {
        duplicateGroups.push({ key, count: list.length, items: list });
      }
    });

    // Dangerous extensions detection
    const DANGEROUS_EXTS = ['.exe', '.bat', '.cmd', '.vbs', '.js', '.sh', '.php'];
    const dangerousFiles = mediaMessages.filter((m) =>
      DANGEROUS_EXTS.some((ext) => (m.fileName || '').toLowerCase().endsWith(ext))
    );

    return {
      totalMediaFiles,
      totalSizeMB: (totalSizeBytes / (1024 * 1024)).toFixed(2),
      duplicateCount: duplicateGroups.length,
      duplicateGroups,
      dangerousFileCount: dangerousFiles.length,
      dangerousFiles,
      cleanStatus: dangerousFiles.length === 0 ? 'SECURE' : 'THREATS_DETECTED',
    };
  } catch (err) {
    console.error('Error scanning media storage:', err);
    return {
      totalMediaFiles: 0,
      totalSizeMB: '0.00',
      duplicateCount: 0,
      duplicateGroups: [],
      dangerousFileCount: 0,
      dangerousFiles: [],
      cleanStatus: 'ERROR',
    };
  }
};

export const cleanupBrokenMedia = async () => {
  try {
    // Find messages marked deleted where fileUrl exists
    const result = await prisma.message.updateMany({
      where: {
        isDeletedForEveryone: true,
        fileUrl: { not: null },
      },
      data: {
        fileUrl: null,
        filePublicId: null,
      },
    });
    return { cleanedCount: result.count };
  } catch (err) {
    console.error('Error cleaning up broken media:', err);
    return { cleanedCount: 0 };
  }
};
