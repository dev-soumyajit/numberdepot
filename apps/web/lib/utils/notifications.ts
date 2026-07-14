import { ObjectId } from 'mongodb';
import { getNotificationsCollection } from '../collections';

export async function createNotification(params: {
  userId: string;
  title: string;
  message: string;
  type: 'order' | 'offer' | 'system' | 'billing';
  actionUrl?: string;
  entityType?: string;
  entityId?: string;
}) {
  const col = await getNotificationsCollection();
  await col.insertOne({
    userId: new ObjectId(params.userId),
    title: params.title,
    message: params.message,
    type: params.type,
    read: false,
    actionUrl: params.actionUrl,
    entityType: params.entityType,
    entityId: params.entityId,
    createdAt: new Date(),
  });
}
