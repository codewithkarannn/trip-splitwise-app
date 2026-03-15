import { Injectable } from '@angular/core';
import {addDoc, collection, Firestore} from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root',
})
export class FireStoreService {
  constructor(private store: Firestore) {}

  async addTestData() {
    const ref = collection(this.store, 'test');
    await addDoc(ref, { name: 'Hello Firebase 🔥' });
    console.log('Data added');
  }
}
