import {inject, Injectable, signal} from '@angular/core';
import {addDoc, collection, deleteDoc, doc, getDocs, onSnapshot, query, updateDoc, where} from 'firebase/firestore';
import {AuthService} from './auth-service';
import {Trip} from '../models/trip';
import {Firestore} from '@angular/fire/firestore';
import {Observable, of, switchMap} from 'rxjs';
import {Auth, authState} from '@angular/fire/auth';
import {AppUser} from '../models/app-user';

@Injectable({
  providedIn: 'root',
})
export class TripService {
  searchQuery = signal<string>('');
  private fireStore = inject(Firestore);
  private firebaseAuth = inject(Auth);
  private auth = inject(AuthService);
  private tripCollection = collection(this.fireStore, 'trips');

  async createTrip(name: string, tripDate: Date) {
    const user = this.auth._user();
    if (!user) return;

    return addDoc(this.tripCollection, {
      name,
      createdBy: user.uid,
      tripDate: tripDate,
      shareCode: this.generateShareCode(),
      members: [user.uid],
      createdAt: new Date()
    });
  }

  getTripById(tripId: string): Observable<Trip | null> {
    return new Observable(observer => {
      const tripRef = doc(this.fireStore, `trips/${tripId}`);
      const unsub = onSnapshot(tripRef, snapshot => {
        if (!snapshot.exists()) {
          observer.next(null);
          return;
        }
        observer.next({id: snapshot.id, ...snapshot.data()} as Trip);
      }, error => observer.error(error));

      return () => unsub();
    });
  }

  getMyTrips(): Observable<Trip[]> {
    return authState(this.firebaseAuth).pipe(
      switchMap(user => {
        if (!user) return of([]);

        return new Observable<Trip[]>(observer => {
          const q = query(this.tripCollection, where('members', 'array-contains', user.uid));
          const unsub = onSnapshot(q, snapshot => {
            const trips = snapshot.docs.map(d => ({id: d.id, ...d.data()} as Trip));
            observer.next(trips);
          }, error => observer.error(error));

          return () => unsub();
        });
      })
    );
  }

  updateTrip(id: string, name: string) {
    const tripDoc = doc(this.fireStore, `trips/${id}`);
    return updateDoc(tripDoc, {name});
  }

  async joinTripByCode(code: string) {
    const user = this.auth._user();
    if (!user) return;

    const q = query(this.tripCollection, where('shareCode', '==', code));
    const snapshot = await getDocs(q);

    if (snapshot.empty) throw new Error('Invalid share code');

    const tripDoc = snapshot.docs[0];
    const tripData = tripDoc.data() as Trip;

    if (tripData.members.includes(user.uid)) return;

    const tripRef = doc(this.fireStore, `trips/${tripDoc.id}`);
    await updateDoc(tripRef, {members: [...tripData.members, user.uid]});
  }

  deleteTrip(id: string) {
    const tripDoc = doc(this.fireStore, `trips/${id}`);
    return deleteDoc(tripDoc);
  }

  getMembersByTripId(tripId: string): Observable<AppUser[]> {
    return new Observable(observer => {

      const tripRef = doc(this.fireStore, `trips/${tripId}`);

      //  Listen to trip changes in real-time
      const unsubTrip = onSnapshot(tripRef, async (tripSnap) => {

        if (!tripSnap.exists()) {
          observer.next([]);
          return;
        }

        const trip = tripSnap.data() as any;
        const memberIds: string[] = trip.memberIds || trip.members || [];

        if (!memberIds.length) {
          observer.next([]);
          return;
        }

        const usersRef = collection(this.fireStore, 'users');

        const chunkSize = 10;
        const chunks: string[][] = [];

        for (let i = 0; i < memberIds.length; i += chunkSize) {
          chunks.push(memberIds.slice(i, i + chunkSize));
        }

        let results: any[] = [];

        //  getDocs = one-time fetch (simpler & safe)
        for (const chunk of chunks) {
          const q = query(usersRef, where('__name__', 'in', chunk));
          const snapshot = await getDocs(q);

          results.push(
            ...snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            }))
          );
        }

        observer.next(results);

      }, error => observer.error(error));

      // cleanup
      return () => unsubTrip();
    });
  }
  private generateShareCode(): string {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }
}
