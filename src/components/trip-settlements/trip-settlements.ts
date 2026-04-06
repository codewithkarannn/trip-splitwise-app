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
  expenses    = input.required<Expense[]>();
  currentUser = input.required<AppUser>();
  getUser     = input.required<(uid: string) => AppUser | undefined>();

  showModal = signal<'owe' | 'owed' | null>(null);
  protected readonly IndianRupee = IndianRupee;
  protected readonly X = X;
  // Positive = creditor (is owed), Negative = debtor (owes)
  private netBalances = computed(() => {
    const balance = new Map<string, number>();

    for (const expense of this.expenses()) {
      const members = expense.members;
      const settlements = expense.settlements || [];

      if (!members?.length) continue;

      // Skip personal
      if (members.length === 1 && members[0] === expense.paidBy) continue;

      // Only unpaid members
      const unpaidMembers = members.filter(memberId => {
        const s = settlements.find(x => x.userId === memberId);
        return !s?.paid;
      });

      if (unpaidMembers.length === 0) continue;

      const share = expense.amount / members.length;

      // Only count amount still owed
      const totalUnpaid = share * unpaidMembers.length;

      // Payer gets only unpaid portion
      balance.set(
        expense.paidBy,
        (balance.get(expense.paidBy) ?? 0) + totalUnpaid
      );

      // Only unpaid users owe
      for (const memberId of unpaidMembers) {
        balance.set(
          memberId,
          (balance.get(memberId) ?? 0) - share
        );
      }
    }

    return balance;
  });
  // ── Step 2: simplified settlements (minimum transactions) ───────────────
  private settlements = computed(() => {
    const balance = this.netBalances();

    const creditors: { id: string; amount: number }[] = [];
    const debtors:   { id: string; amount: number }[] = [];

    for (const [uid, net] of balance.entries()) {
      if (net >  0.01) creditors.push({ id: uid, amount:  net });
      if (net < -0.01) debtors.push({   id: uid, amount: -net });
    }

    const result: { from: string; to: string; amount: number }[] = [];
    let i = 0, j = 0;

    while (i < debtors.length && j < creditors.length) {
      const debtor   = debtors[i];
      const creditor = creditors[j];
      const settled  = Math.min(debtor.amount, creditor.amount);

      result.push({
        from:   debtor.id,
        to:     creditor.id,
        amount: Math.round(settled),
      });

      debtor.amount   -= settled;
      creditor.amount -= settled;

      if (debtor.amount   < 0.01) i++;
      if (creditor.amount < 0.01) j++;
    }

    return result;
  });

  // ── Public computed for template ─────────────────────────────────────────
  // ── Step 3: raw amounts before netting (to show mutual deduction hint) ──
  private rawOwedByMe = computed(() => {
    const me = this.currentUser()?.uid;
    const map = new Map<string, number>();
    if (!me) return map;

    for (const expense of this.expenses()) {
      const members = expense.members;
      const settlements = expense.settlements || [];

      if (!members?.length || members.length === 1) continue;

      const mySettlement = settlements.find(s => s.userId === me);
      if (mySettlement?.paid) continue; //  skip if already paid

      const share = expense.amount / members.length;

      if (expense.paidBy !== me && members.includes(me)) {
        map.set(expense.paidBy, (map.get(expense.paidBy) ?? 0) + share);
      }
    }

    return map;
  });
  owedBreakdown = computed(() => {
    const me = this.currentUser()?.uid;
    if (!me) return [];

    return this.settlements()
      .filter(s => s.from === me)
      .map(s => {
        const raw = Math.round(this.rawOwedByMe().get(s.to) ?? s.amount);
        return {
          user:           this.getUser()(s.to),
          amount:         s.amount,
          originalAmount: raw,
          wasMutual:      raw > s.amount,
          savedAmount:    raw - s.amount,
        };
      })
      .filter(e => e.user && e.amount > 0);
  });
  // ── Step 1: net balance per user ────────────────────────────────────────
  totalOwed = computed(() =>
    this.owedBreakdown().reduce((sum, e) => sum + e.amount, 0)
  );
  private rawOwedToMe = computed(() => {
    const me = this.currentUser()?.uid;
    const map = new Map<string, number>();
    if (!me) return map;

    for (const expense of this.expenses()) {
      const members = expense.members;
      const settlements = expense.settlements || [];

      if (!members?.length || members.length === 1) continue;

      if (expense.paidBy !== me) continue;

      const share = expense.amount / members.length;

      for (const memberId of members) {
        if (memberId === me) continue;

        const s = settlements.find(x => x.userId === memberId);
        if (s?.paid) continue; //  skip paid users

        map.set(memberId, (map.get(memberId) ?? 0) + share);
      }
    }

    return map;
  });
  owedToMeBreakdown = computed(() => {
    const me = this.currentUser()?.uid;
    if (!me) return [];

    return this.settlements()
      .filter(s => s.to === me)
      .map(s => {
        const raw = Math.round(this.rawOwedToMe().get(s.from) ?? s.amount);
        return {
          user:           this.getUser()(s.from),
          amount:         s.amount,
          originalAmount: raw,
          wasMutual:      raw > s.amount,
          savedAmount:    raw - s.amount,
        };
      })
      .filter(e => e.user && e.amount > 0);
  });
  totalOwedToMe = computed(() =>
    this.owedToMeBreakdown().reduce((sum, e) => sum + e.amount, 0)
  );
}
