import {inject, Injectable} from '@angular/core';
import {addDoc, collection, deleteDoc, doc, getDocs, onSnapshot, orderBy, query, updateDoc} from 'firebase/firestore';
import {Expense} from '../models/expense';
import {Observable} from 'rxjs';
import {Firestore} from '@angular/fire/firestore';
@Injectable({
  providedIn: 'root',
})
export class ExpenseService {
  private fireStore = inject(Firestore);

  async addExpense(expense: Expense) {
    const expensesRef = collection(this.fireStore, `trips/${expense.tripId}/expenses`);
    try {
      const docRef = await addDoc(expensesRef, {
        ...expense,
        createdAt: new Date().toISOString(),
      });
      return docRef;
    } catch (error) {
      console.error('Error adding expense:', error);
      throw error;
    }
  }

  async getExpensesOnce(tripId: string): Promise<Expense[]> {
    const ref  = collection(this.fireStore, `trips/${tripId}/expenses`);
    const snap = await getDocs(ref);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Expense));
  }

  deleteExpense(tripId: string, expenseId: string) {
    const ref = doc(this.fireStore, `trips/${tripId}/expenses/${expenseId}`);
    return deleteDoc(ref);
  }

  async updateExpense(tripId: string, expenseId: string, data: Partial<Expense>) {
    const ref = doc(this.fireStore, `trips/${tripId}/expenses/${expenseId}`);
    return updateDoc(ref, data);
  }

  getExpenses(tripId: string): Observable<Expense[]> {
    return new Observable(observer => {
      const expensesRef = collection(this.fireStore, `trips/${tripId}/expenses`);
      const q = query(expensesRef, orderBy('createdAt', 'desc'));
      const unsub = onSnapshot(q, snapshot => {
        const expenses = snapshot.docs.map(d => ({id: d.id, ...d.data()} as Expense));
        observer.next(expenses);
      }, error => observer.error(error));

      return () => unsub();
    });

  }
  async markSettlementPaid(tripId: string, expenseId: string, debtorId: string) {
    const expense = (await this.getExpensesOnce(tripId))
      .find(e => e.id === expenseId);
    if (!expense) return;

    const existing = expense.settlements ?? [];

    // If entry exists, flip to paid. Otherwise add it.
    const updated = existing.some(s => s.userId === debtorId)
      ? existing.map(s => s.userId === debtorId ? { ...s, paid: true } : s)
      : [...existing, { userId: debtorId, paid: true }];

    return this.updateExpense(tripId, expenseId, { settlements: updated });
  }
}
