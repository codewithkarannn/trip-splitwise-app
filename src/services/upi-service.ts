import {inject, Injectable} from '@angular/core';
import {deleteField, Firestore} from '@angular/fire/firestore';
import {Expense} from '../models/expense';
import {AppUser} from '../models/app-user';
import {UpiPaymentDetails} from '../models/upi-payment-details';
import {doc, updateDoc} from 'firebase/firestore';

@Injectable({
  providedIn: 'root',
})
export class UpiService {
  private  fireStore = inject(Firestore);

  isAndroid(): boolean {
    return /android/i.test(navigator.userAgent);
  }

  isIos(): boolean {
    return /iphone|ipad|ipod/i.test(navigator.userAgent);
  }


  buildPaymentDetails(expense: Expense, payer: AppUser): UpiPaymentDetails {
    const amount = (expense.amount / expense.members.length).toFixed(2);
    const note   = `${expense.title} - Trip share`;
    return {
      payerName: payer.name ?? 'Payee',
      upiId:     payer.upiId ?? '',
      amount,
      note,
    };
  }

  openAndroidUpi(details: UpiPaymentDetails): boolean {
    if (!details.upiId) return false;

    const name = encodeURIComponent(details.payerName);
    const note = encodeURIComponent(details.note);

    const url = `upi://pay?pa=${details.upiId}&pn=${name}&am=${details.amount}&cu=INR&tn=${note}`;

    window.location.href = url;
    return true;
  }

  async saveUpiId(uid: string, upiId: string): Promise<void> {
    const ref = doc(this.fireStore, `users/${uid}`);
    await updateDoc(ref, { upiId: upiId.trim().toLowerCase() });
  }

  validateUpiId(upiId: string): boolean {
    return /^[\w.\-]{3,}@[a-zA-Z]{3,}$/.test(upiId.trim());
  }

  async removeUpiId(uid: string) {
    const ref = doc(this.fireStore, `users/${uid}`);
    await updateDoc(ref, { upiId: deleteField() });
  }

}
