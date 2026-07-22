import prisma from '../config/db';

export interface LogAuditParams {
  adminId: string;
  action: string;
  targetType?: string;
  targetId?: string;
  ipAddress?: string;
  details?: Record<string, any>;
}

export const logAdminAction = async (params: LogAuditParams) => {
  try {
    return await prisma.adminAuditLog.create({
      data: {
        adminId: params.adminId,
        action: params.action,
        targetType: params.targetType,
        targetId: params.targetId,
        ipAddress: params.ipAddress || '127.0.0.1',
        details: params.details ? JSON.stringify(params.details) : null,
      },
    });
  } catch (err) {
    console.error('Error recording admin audit log:', err);
    return null;
  }
};

export const getAuditLogs = async (limit = 100, page = 1) => {
  try {
    const skip = (page - 1) * limit;
    const [logs, total] = await Promise.all([
      prisma.adminAuditLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip,
      }),
      prisma.adminAuditLog.count(),
    ]);

    return {
      logs: logs.map((log) => ({
        ...log,
        details: log.details ? JSON.parse(log.details) : null,
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  } catch (err) {
    console.error('Error fetching audit logs:', err);
    return { logs: [], total: 0, page: 1, totalPages: 0 };
  }
};
