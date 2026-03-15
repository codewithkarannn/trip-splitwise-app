import {Component, computed, input, signal} from '@angular/core';
import {Expense} from '../../models/expense';
import {AppUser} from '../../models/app-user';
import {IndianRupee, LucideAngularModule, X} from 'lucide-angular';
import {DecimalPipe} from '@angular/common';

@Component({
  selector: 'app-trip-settlements',
  imports: [
    LucideAngularModule,
    DecimalPipe
  ],
  templateUrl: './trip-settlements.html',
  styleUrl: './trip-settlements.css',
})
export class TripSettlements {
  expenses = input.required<Expense[]>();
  currentUser = input.required<AppUser>();
  getUser = input.required<(uid: string) => AppUser | undefined>();

  showModal = signal<'owe' | 'owed' | null>(null);




  owedBreakdown = computed(() => {
    const currentUid = this.currentUser()?.uid;
    if (!currentUid) return [];

    const owedMap = new Map<string, number>();

    for (const expense of this.expenses()) {
      const members = expense.members;
      if (!members?.length) continue;

      const share = expense.amount / members.length;

      if (expense.paidBy !== currentUid && members.includes(currentUid)) {
        owedMap.set(expense.paidBy, (owedMap.get(expense.paidBy) ?? 0) + share);
      }
    }

    return Array.from(owedMap.entries())
      .map(([uid, amount]) => ({
        user: this.getUser()(uid),
        amount: Math.round(amount)
      }))
      .filter(e => e.user && e.amount > 0);
  });


  owedToMeBreakdown = computed(() => {
    const currentUid = this.currentUser()?.uid;
    if (!currentUid) return [];

    const owedMap = new Map<string, number>();

    for (const expense of this.expenses()) {
      const members = expense.members;
      if (!members?.length) continue;

      const share = expense.amount / members.length;

      if (expense.paidBy === currentUid) {
        for (const memberId of members) {
          if (memberId === currentUid) continue;
          owedMap.set(memberId, (owedMap.get(memberId) ?? 0) + share);
        }
      }
    }

    return Array.from(owedMap.entries())
      .map(([uid, amount]) => ({
        user: this.getUser()(uid),
        amount: Math.round(amount)
      }))
      .filter(e => e.user && e.amount > 0);
  });

  totalOwed = computed(() =>
    this.owedBreakdown().reduce((sum, e) => sum + e.amount, 0)
  );

  totalOwedToMe = computed(() =>
    this.owedToMeBreakdown().reduce((sum, e) => sum + e.amount, 0)
  );
  protected readonly IndianRupee = IndianRupee;
  protected readonly X = X;
}
