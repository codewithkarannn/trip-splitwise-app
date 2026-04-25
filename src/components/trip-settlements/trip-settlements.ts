import {Component, computed, inject, input, signal} from '@angular/core';
import {Expense} from '../../models/expense';
import {AppUser} from '../../models/app-user';
import {IndianRupee, LucideAngularModule, Smartphone, X} from 'lucide-angular';
import {DecimalPipe} from '@angular/common';
import {ExpenseService} from '../../services/expense-service';
import {UpiPayment} from '../upi-payment/upi-payment';

@Component({
  selector: 'app-trip-settlements',
  imports: [LucideAngularModule, DecimalPipe, UpiPayment],
  templateUrl: './trip-settlements.html',
  styleUrl: './trip-settlements.css',
})
export class TripSettlements {
  expenses    = input.required<Expense[]>();
  currentUser = input.required<AppUser>();
  getUser     = input.required<(uid: string) => AppUser | undefined>();
  tripId       = input.required<string>();
  expenseService = inject(ExpenseService);
  settling     = signal<string | null>(null);
  upiEntry = signal<{ expense: Expense; payer: AppUser } | null>(null);


  showModal = signal<'owe' | 'owed' | null>(null);
  protected readonly IndianRupee = IndianRupee;
  // ── Step 2: Build pairwise net balances (A↔B independent of A↔C) ────────
  protected readonly X = X;
  protected readonly Smartphone = Smartphone;
  // ── Step 1: Filter out fully-settled expenses ────────────────────────────
  private activeExpenses = computed(() => {
    return this.expenses().filter(expense => {
      const members = expense.members;
      if (!members?.length) return false;

      // Single member expenses are irrelevant
      if (members.length === 1) return false;

      // Get all non-payer members
      const nonPayers = members.filter(m => m !== expense.paidBy);
      if (!nonPayers.length) return false;

      // Exclude expense if ALL non-payers have paid: true in settlements
      const allSettled = nonPayers.every(memberId => {
        const settlement = expense.settlements?.find(s => s.userId === memberId);
        return settlement?.paid === true;
      });

      return !allSettled;
    });
  });
  // Key format: `smallerUid|largerUid`, value = net (positive = first uid is creditor)
  private pairwiseBalances = computed(() => {
    const me = this.currentUser()?.uid;
    // Map<`uid1|uid2`, number>
    // Positive means uid1 is owed by uid2
    const map = new Map<string, number>();

    const addBalance = (creditor: string, debtor: string, amount: number) => {
      // Always store with smaller uid first for consistency
      const [a, b] = creditor < debtor
        ? [creditor, debtor]
        : [debtor, creditor];
      const key = `${a}|${b}`;
      const sign = creditor === a ? 1 : -1; // positive = a is creditor
      map.set(key, (map.get(key) ?? 0) + sign * amount);
    };

    for (const expense of this.activeExpenses()) {
      const members = expense.members;
      const share = expense.amount / members.length;

      for (const memberId of members) {
        if (memberId === expense.paidBy) continue;

        // Check if this specific member has already settled this expense
        const alreadyPaid = expense.settlements?.find(
          s => s.userId === memberId
        )?.paid === true;

        if (alreadyPaid) continue; // skip settled individual shares too

        addBalance(expense.paidBy, memberId, share);
      }
    }

    return map;
  });
  // ── Step 3: Extract what current user owes others ────────────────────────
  owedBreakdown = computed(() => {
    const me = this.currentUser()?.uid;
    if (!me) return [];

    const result: {
      user: AppUser | undefined;
      amount: number;
      originalAmount: number;
      wasMutual: boolean;
      savedAmount: number;
    }[] = [];

    for (const [key, net] of this.pairwiseBalances().entries()) {
      const [a, b] = key.split('|');
      const otherUid = a === me ? b : b === me ? a : null;
      if (!otherUid) continue;

      // net > 0 means `a` is creditor. If me === b and net > 0, I owe `a`
      // If me === a and net < 0, I owe `b`
      const iOwe =
        (me === b && net > 0.01) ||   // a is creditor, I am b (debtor)
        (me === a && net < -0.01);     // b is creditor, I am a (debtor)

      if (!iOwe) continue;

      const finalAmount = Math.round(Math.abs(net));
      if (finalAmount <= 0) continue;

      // originalAmount: what I would owe ignoring their counter-debt
      const rawShare = this.activeExpenses()
        .filter(e =>
          e.paidBy === otherUid &&
          e.members.includes(me) &&
          !(e.settlements?.find(s => s.userId === me)?.paid === true)
        )
        .reduce((sum, e) => sum + e.amount / e.members.length, 0);

      const originalAmount = Math.round(rawShare);
      const savedAmount    = Math.max(0, originalAmount - finalAmount);

      result.push({
        user:           this.getUser()(otherUid),
        amount:         finalAmount,
        originalAmount,
        wasMutual:      savedAmount > 0,
        savedAmount,
      });
    }

    return result.filter(e => e.user);
  });
  totalOwed = computed(() =>
    this.owedBreakdown().reduce((sum, e) => sum + e.amount, 0)
  );
  // ── Step 4: Extract what others owe current user ─────────────────────────
  owedToMeBreakdown = computed(() => {
    const me = this.currentUser()?.uid;
    if (!me) return [];

    const result: {
      user: AppUser | undefined;
      amount: number;
      originalAmount: number;
      wasMutual: boolean;
      savedAmount: number;
    }[] = [];

    for (const [key, net] of this.pairwiseBalances().entries()) {
      const [a, b] = key.split('|');
      const otherUid = a === me ? b : b === me ? a : null;
      if (!otherUid) continue;

      // net > 0 means `a` is creditor. If me === a and net > 0, other owes me
      // If me === b and net < 0, other owes me
      const theyOweMe =
        (me === a && net > 0.01) ||   // I am creditor
        (me === b && net < -0.01);    // b is creditor = me

      if (!theyOweMe) continue;

      const finalAmount = Math.round(Math.abs(net));
      if (finalAmount <= 0) continue;

      // originalAmount: what they owe ignoring their counter-expenses
      const rawShare = this.activeExpenses()
        .filter(e =>
          e.paidBy === me &&
          e.members.includes(otherUid) &&
          !(e.settlements?.find(s => s.userId === otherUid)?.paid === true)
        )
        .reduce((sum, e) => sum + e.amount / e.members.length, 0);

      const originalAmount = Math.round(rawShare);
      const savedAmount    = Math.max(0, originalAmount - finalAmount);

      result.push({
        user:           this.getUser()(otherUid),
        amount:         finalAmount,
        originalAmount,
        wasMutual:      savedAmount > 0,
        savedAmount,
      });
    }

    return result.filter(e => e.user);
  });
  totalOwedToMe = computed(() =>
    this.owedToMeBreakdown().reduce((sum, e) => sum + e.amount, 0)
  );

  async settleWith(otherUid: string) {
    const me = this.currentUser()?.uid;
    if (!me) return;

    this.settling.set(otherUid);
    try {
      const unsettledExpenses = this.activeExpenses().filter(expense => {
        const isMeDebtor =
          expense.paidBy === otherUid &&
          expense.members.includes(me) &&
          !(expense.settlements?.find(s => s.userId === me)?.paid === true);

        const isThemDebtor =
          expense.paidBy === me &&
          expense.members.includes(otherUid) &&
          !(expense.settlements?.find(s => s.userId === otherUid)?.paid === true);

        return isMeDebtor || isThemDebtor;
      });

      await Promise.all(
        unsettledExpenses.map(expense => {
          // Mark the correct debtor in each expense
          const debtorId = expense.paidBy === me ? otherUid : me;
          return this.expenseService.markSettlementPaid(
            this.tripId(), expense.id!, debtorId
          );
        })
      );
    } finally {
      this.settling.set(null);
    }
  }

  openUpiDialog(otherUid: string) {
    const me = this.currentUser()?.uid;
    if (!me) return;


    const expense = this.activeExpenses()
      .filter(e =>
        e.paidBy === otherUid &&
        e.members.includes(me) &&
        !(e.settlements?.find(s => s.userId === me)?.paid === true)
      )
      .sort((a, b) => b.amount - a.amount)[0]; // largest first

    const payer = this.getUser()(otherUid);
    if (!expense || !payer) return;

    this.upiEntry.set({ expense, payer });
  }

  async onUpiConfirmed(expense: Expense) {
    const otherUid = expense.paidBy;
    this.upiEntry.set(null);
    await this.settleWith(otherUid); // marks ALL expenses between the pair
  }
}
