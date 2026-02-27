export const NotificationService = {
  async registerForPushNotificationsAsync() {
    console.log('Push notifications are disabled in Expo Go test builds.');
    return null;
  },

  async sendLocalNotification(title: string, body: string, data: any = {}) {
    console.log(`[Notification Stub] ${title}: ${body}`);
  },

  async sendPushNotificationToPeers(actor: string, action: string, label: string) {
    console.log(`[Push Notification Stub] ${actor} ${action}: ${label}`);
  }
};
