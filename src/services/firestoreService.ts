import {
  db,
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  limit,
  onSnapshot,
  handleFirestoreError,
  OperationType,
} from './firebase';
import {
  Delivery,
  UserProfile,
  ClassifiedAd,
  AidRequest,
  DailyAdministrativeSummary,
  ChatMessage,
  RentalItem,
  MarketplaceItem,
  AppNotification,
} from '../types';

export const firestoreService = {
  // Sync Delivery to Firestore Cloud
  async saveDelivery(delivery: Delivery): Promise<void> {
    try {
      const deliveryRef = doc(db, 'deliveries', delivery.id);
      await setDoc(deliveryRef, delivery, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `deliveries/${delivery.id}`);
    }
  },

  // Delete Delivery from Firestore Cloud
  async deleteDelivery(deliveryId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'deliveries', deliveryId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `deliveries/${deliveryId}`);
    }
  },

  // Real-time listener for Deliveries
  subscribeDeliveries(callback: (deliveries: Delivery[]) => void): () => void {
    try {
      const q = query(collection(db, 'deliveries'), limit(60));
      return onSnapshot(
        q,
        (snapshot) => {
          if (!snapshot.empty) {
            const list: Delivery[] = [];
            snapshot.forEach((docSnap) => {
              list.push(docSnap.data() as Delivery);
            });
            callback(list);
          }
        },
        (error) => {
          handleFirestoreError(error, OperationType.LIST, 'deliveries');
        }
      );
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, 'deliveries');
      return () => {};
    }
  },

  // Real-time listener for Community Chat Messages
  subscribeMessages(callback: (messages: ChatMessage[]) => void): () => void {
    try {
      const q = query(collection(db, 'messages'), limit(80));
      return onSnapshot(
        q,
        (snapshot) => {
          if (!snapshot.empty) {
            const list: ChatMessage[] = [];
            snapshot.forEach((docSnap) => {
              list.push(docSnap.data() as ChatMessage);
            });
            // Sort by timestamp
            list.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
            callback(list);
          }
        },
        (error) => {
          handleFirestoreError(error, OperationType.LIST, 'messages');
        }
      );
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, 'messages');
      return () => {};
    }
  },

  // Save Community Message
  async saveMessage(message: ChatMessage): Promise<void> {
    try {
      const msgRef = doc(db, 'messages', message.id);
      await setDoc(msgRef, message, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `messages/${message.id}`);
    }
  },

  // Real-time listener for Classified Ads
  subscribeAds(callback: (ads: ClassifiedAd[]) => void): () => void {
    try {
      const q = query(collection(db, 'classifiedAds'), limit(50));
      return onSnapshot(
        q,
        (snapshot) => {
          if (!snapshot.empty) {
            const list: ClassifiedAd[] = [];
            snapshot.forEach((docSnap) => {
              list.push(docSnap.data() as ClassifiedAd);
            });
            callback(list);
          }
        },
        (error) => {
          handleFirestoreError(error, OperationType.LIST, 'classifiedAds');
        }
      );
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, 'classifiedAds');
      return () => {};
    }
  },

  // Real-time listener for Rentals
  subscribeRentals(callback: (rentals: RentalItem[]) => void): () => void {
    try {
      const q = query(collection(db, 'rentals'), limit(50));
      return onSnapshot(
        q,
        (snapshot) => {
          if (!snapshot.empty) {
            const list: RentalItem[] = [];
            snapshot.forEach((docSnap) => {
              list.push(docSnap.data() as RentalItem);
            });
            callback(list);
          }
        },
        (error) => {
          handleFirestoreError(error, OperationType.LIST, 'rentals');
        }
      );
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, 'rentals');
      return () => {};
    }
  },

  // Save Rental Item
  async saveRentalItem(item: RentalItem): Promise<void> {
    try {
      const rentalRef = doc(db, 'rentals', item.id);
      await setDoc(rentalRef, item, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `rentals/${item.id}`);
    }
  },

  // Real-time listener for Marketplace
  subscribeMarketplace(callback: (items: MarketplaceItem[]) => void): () => void {
    try {
      const q = query(collection(db, 'marketplace'), limit(50));
      return onSnapshot(
        q,
        (snapshot) => {
          if (!snapshot.empty) {
            const list: MarketplaceItem[] = [];
            snapshot.forEach((docSnap) => {
              list.push(docSnap.data() as MarketplaceItem);
            });
            callback(list);
          }
        },
        (error) => {
          handleFirestoreError(error, OperationType.LIST, 'marketplace');
        }
      );
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, 'marketplace');
      return () => {};
    }
  },

  // Save Marketplace Item
  async saveMarketplaceItem(item: MarketplaceItem): Promise<void> {
    try {
      const itemRef = doc(db, 'marketplace', item.id);
      await setDoc(itemRef, item, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `marketplace/${item.id}`);
    }
  },

  // Real-time listener for Aid Requests
  subscribeAidRequests(callback: (requests: AidRequest[]) => void): () => void {
    try {
      const q = query(collection(db, 'aidRequests'), limit(50));
      return onSnapshot(
        q,
        (snapshot) => {
          if (!snapshot.empty) {
            const list: AidRequest[] = [];
            snapshot.forEach((docSnap) => {
              list.push(docSnap.data() as AidRequest);
            });
            callback(list);
          }
        },
        (error) => {
          handleFirestoreError(error, OperationType.LIST, 'aidRequests');
        }
      );
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, 'aidRequests');
      return () => {};
    }
  },

  // Fetch Deliveries from Cloud
  async getDeliveries(): Promise<Delivery[]> {
    try {
      const q = query(collection(db, 'deliveries'), limit(50));
      const querySnapshot = await getDocs(q);
      const list: Delivery[] = [];
      querySnapshot.forEach((docSnap) => {
        list.push(docSnap.data() as Delivery);
      });
      return list;
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'deliveries');
      return [];
    }
  },

  // Sync User Profile
  async saveUserProfile(user: UserProfile): Promise<void> {
    try {
      const userRef = doc(db, 'users', user.id);
      await setDoc(userRef, user, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${user.id}`);
    }
  },

  // Sync Admin Daily Summary
  async saveAdminSummary(summary: DailyAdministrativeSummary): Promise<void> {
    try {
      const summaryRef = doc(db, 'adminSummaries', summary.id);
      await setDoc(summaryRef, summary, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `adminSummaries/${summary.id}`);
    }
  },

  // Sync Classified Ad
  async saveClassifiedAd(ad: ClassifiedAd): Promise<void> {
    try {
      const adRef = doc(db, 'classifiedAds', ad.id);
      await setDoc(adRef, ad, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `classifiedAds/${ad.id}`);
    }
  },

  // Delete Classified Ad
  async deleteClassifiedAd(adId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'classifiedAds', adId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `classifiedAds/${adId}`);
    }
  },

  // Sync Mutual Aid Request
  async saveAidRequest(req: AidRequest): Promise<void> {
    try {
      const reqRef = doc(db, 'aidRequests', req.id);
      await setDoc(reqRef, req, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `aidRequests/${req.id}`);
    }
  },

  // Real-time listener for Push Notifications
  subscribeNotifications(callback: (notifications: AppNotification[]) => void): () => void {
    try {
      const q = query(collection(db, 'pushNotifications'), limit(40));
      return onSnapshot(
        q,
        (snapshot) => {
          if (!snapshot.empty) {
            const list: AppNotification[] = [];
            snapshot.forEach((docSnap) => {
              list.push(docSnap.data() as AppNotification);
            });
            list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
            callback(list);
          }
        },
        (error) => {
          handleFirestoreError(error, OperationType.LIST, 'pushNotifications');
        }
      );
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, 'pushNotifications');
      return () => {};
    }
  },

  // Save Push Notification to Cloud
  async saveNotification(notif: AppNotification): Promise<void> {
    try {
      const notifRef = doc(db, 'pushNotifications', notif.id);
      await setDoc(notifRef, notif, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `pushNotifications/${notif.id}`);
    }
  },
};
