export type KingdomNotificationCategory =
  | 'assignment'
  | 'care'
  | 'documents'
  | 'host'
  | 'message'
  | 'review'
  | 'travel';

export type KingdomNotificationTone =
  | 'attention'
  | 'info'
  | 'success';

export interface KingdomNotification {
  id: string;
  category: KingdomNotificationCategory;
  tone: KingdomNotificationTone;

  title: string;
  description: string;
  context: string;

  createdUtc: string;
  route: string;
  actionLabel: string;

  read: boolean;
}
