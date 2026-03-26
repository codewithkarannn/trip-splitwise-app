import {Component, inject, OnInit, signal} from '@angular/core';
import {TripService} from '../../services/trip-service';
import {Trip} from '../../models/trip';
import {ActivatedRoute, Router} from '@angular/router';
import {DatePipe, DecimalPipe} from '@angular/common';
import {ExpenseService} from '../../services/expense-service';
import {Expense} from '../../models/expense';
import {FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import {
  AlertCircle,
  ArrowLeft,
  ArrowUpDown,
  Calendar,
  Filter,
  IndianRupee,
  LucideAngularModule,
  Pencil,
  Plus,
  Receipt,
  Search,
  SortAsc,
  SortDesc,
  StickyNote,
  User,
  Users,
  X
} from 'lucide-angular';
import {AuthService} from '../../services/auth-service';
import {AppUser} from '../../models/app-user';
import {toObservable} from '@angular/core/rxjs-interop';
import {filter, take} from 'rxjs';
import {TripSettlements} from '../trip-settlements/trip-settlements';

@Component({
  selector: 'app-trip-dashboard',
  imports: [
    TripSettlements,
    DatePipe,
    FormsModule,
    LucideAngularModule,
    ReactiveFormsModule,
    DecimalPipe,

  ],
  templateUrl: './trip-dashboard.html',
  styleUrl: './trip-dashboard.css',
})
export class TripDashboard implements OnInit {

  expenseForm!: FormGroup;
  editingExpenseId = signal<string | null>(null);
  isEditMode = signal<boolean>(false);
  tripDetails = signal<Trip>({} as Trip);
  currentUser = signal<AppUser>({} as AppUser);
  tripExpenses = signal<Expense[]>([]);
  totalExpense = signal<number>(0);
  connectedUserDetails = signal<AppUser[]>([]);
  selectedExpenseId = signal<string | null>(null);
  transactionSplitMembers =  signal<AppUser[]>([]);
  filterDateFrom = signal<string>('');
  filterDateTo = signal<string>('');
  filterPaidBy = signal<string>('');
  filterMinAmount = signal<number | null>(null);
  filterMaxAmount = signal<number | null>(null);
  filterSplitMember = signal<string>('');
  showFilters = signal<boolean>(false);
  sortBy = signal<'date' | 'amount' | 'title'>('date');
  sortDir = signal<'asc' | 'desc'>('desc');
  sortFields: { label: string; value: 'date' | 'amount' | 'title' }[] = [
    { label: 'Date', value: 'date' },
    { label: 'Amount', value: 'amount' },
    { label: 'Title', value: 'title' }
  ];
  tripService = inject(TripService);
  authService = inject(AuthService);
  expenseService = inject(ExpenseService);
  route = inject(ActivatedRoute);
  routeLink = inject(Router);
  searchQuery = signal<string>('');
  protected readonly Receipt = Receipt;
  protected readonly Users = Users;
  protected readonly Calendar = Calendar;
  protected readonly Plus = Plus;
  protected readonly IndianRupee = IndianRupee;
  protected readonly StickyNote = StickyNote;
  protected readonly Search = Search;
  protected readonly SortAsc = SortAsc;
  protected readonly SortDesc = SortDesc;
  protected readonly ArrowUpDown = ArrowUpDown;
  protected readonly X = X;
  protected readonly Filter = Filter;
  protected readonly AlertCircle = AlertCircle;
  protected readonly Pencil = Pencil;
  protected readonly ArrowLeft = ArrowLeft;
  protected readonly User = User;
  private fb = inject(FormBuilder);

  constructor() {
    toObservable(this.authService._user).pipe(
      filter(user => !!user),
      take(1)
    ).subscribe(user => {
      this.currentUser.set(user!);
      this.initForm();

      const tripId = this.route.snapshot.queryParamMap.get('id');
      if (tripId) {
        this.getTripDetails(tripId);
      }
    });
  }

  ngOnInit() {

  }

  onSearch(event: Event) {
    this.searchQuery.set((event.target as HTMLInputElement).value);
  }

  clearFilters() {
    this.filterDateFrom.set('');
    this.filterDateTo.set('');
    this.filterPaidBy.set('');
    this.filterMinAmount.set(null);
    this.filterMaxAmount.set(null);
    this.filterSplitMember.set('');
  }

  openEditDialog(expense: Expense) {
    if (expense.paidBy !== this.currentUser().uid) return;
    this.isEditMode.set(true);
    this.editingExpenseId.set(expense.id!);

    this.expenseForm.patchValue({
      title: expense.title,
      amount: expense.amount,
      date: new Date(expense.date).toISOString().split('T')[0],
      notes: expense.notes || '',
      members: expense.members || [],
      paidBy: expense.paidBy
    });

    const modal = document.getElementById('create_expense_modal') as HTMLDialogElement;
    modal?.showModal();
  }

  hasActiveFilters() {
    return this.filterDateFrom() || this.filterDateTo() ||
      this.filterPaidBy() || this.filterMinAmount() !== null ||
      this.filterMaxAmount() !== null || this.filterSplitMember();
  }

  filteredExpenses() {
    const q = this.searchQuery().toLowerCase().trim();
    const field = this.sortBy();
    const dir = this.sortDir();

    let results = this.tripExpenses().filter(e => {
      // Search
      if (q && !(
        e.title?.toLowerCase().includes(q) ||
        e.notes?.toLowerCase().includes(q) ||
        e.amount?.toString().includes(q)
      )) return false;

      // Date range
      const eDate = new Date(e.date).getTime();
      if (this.filterDateFrom() && eDate < new Date(this.filterDateFrom()).getTime()) return false;
      if (this.filterDateTo() && eDate > new Date(this.filterDateTo()).getTime()) return false;

      // Paid by
      if (this.filterPaidBy() && e.paidBy !== this.filterPaidBy()) return false;

      // Amount range
      if (this.filterMinAmount() !== null && e.amount < this.filterMinAmount()!) return false;
      if (this.filterMaxAmount() !== null && e.amount > this.filterMaxAmount()!) return false;

      // Split member
      if (this.filterSplitMember() && !e.members?.includes(this.filterSplitMember())) return false;

      return true;
    });

    return results.sort((a, b) => {
      let valA: any, valB: any;
      if (field === 'amount') { valA = a.amount; valB = b.amount; }
      else if (field === 'title') { valA = a.title?.toLowerCase(); valB = b.title?.toLowerCase(); }
      else { valA = new Date(a.date).getTime(); valB = new Date(b.date).getTime(); }

      if (valA < valB) return dir === 'asc' ? -1 : 1;
      if (valA > valB) return dir === 'asc' ? 1 : -1;
      return 0;
    });
  }

  initForm() {
    const current = this.currentUser()?.uid ?? null;

    this.expenseForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      amount: [0, [Validators.required, Validators.min(1)]],
      date: [new Date().toISOString().split('T')[0], Validators.required],
      paidBy: [current, Validators.required],
      members: [[current].filter(Boolean)],
      notes: ['']
    });
  }

  toggleSort(field: 'date' | 'amount' | 'title') {
    if (this.sortBy() === field) {
      this.sortDir.set(this.sortDir() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortBy.set(field);
      this.sortDir.set('desc');
    }
  }

  resetExpenseForm() {
    const current = this.currentUser()?.uid;
    this.expenseForm.reset({
      title: '',
      amount: 0,
      date: new Date().toISOString().split('T')[0],
      paidBy: current,
      members: current ? [current] : [],
      notes: ''
    });
  }

  getTripDetails(id: string) {
    this.tripService.getTripById(id).subscribe(trip => {
      if (trip) {
        this.tripDetails.set(trip);
        this.getAllUsers(trip.members);
        this.getAllExpenses(id);

      }
    });
  }

  getAllUsers(userIds: string[]) {
    this.authService.getUsersByIds(userIds).subscribe(users => {

      if (users && users.length > 0) {
        this.connectedUserDetails.set(users);
      }
    });
  }

  getAllExpenses(tripId: string) {
    this.expenseService.getExpenses(tripId).subscribe(expenses => {
      if (expenses) {
        this.tripExpenses.set(expenses);

        this.totalExpense.set(
          this.tripExpenses().reduce((sum, expense) => sum + expense.amount, 0)
        );
        // this.initForm();
      }
    });
  }

  async addExpense() {
    if (this.expenseForm.invalid) {
      this.expenseForm.markAllAsTouched();
      return;
    }

    let selectedMembers = this.expenseForm.value.members || [];
    const payer = this.isEditMode()
      ? (this.tripExpenses().find(e => e.id === this.editingExpenseId())?.paidBy ?? this.currentUser().uid)
      : this.currentUser().uid;

    if (!selectedMembers.includes(payer)) {
      selectedMembers = [...selectedMembers, payer];
    }

    const expenseData = {
      title: this.expenseForm.value.title,
      amount: this.expenseForm.value.amount,
      date: this.expenseForm.value.date,
      notes: this.expenseForm.value.notes || '',
      members: selectedMembers,
      tripId: this.tripDetails().id!,
      paidBy: payer,
    };
    if (this.isEditMode()) {
      await this.expenseService.updateExpense(
        this.tripDetails().id!,
        this.editingExpenseId()!,
        expenseData
      );
    } else {
      await this.expenseService.addExpense({
        ...expenseData,
        createdAt: new Date()
      });
    }

    this.closeExpenseModal();
  }

  closeExpenseModal() {
    this.isEditMode.set(false);
    this.editingExpenseId.set(null);
    this.resetExpenseForm();
    const modal = document.getElementById('create_expense_modal') as HTMLDialogElement;
    modal?.close();
  }

  isMemberSelected(uid: string): boolean {
    const members: string[] = this.expenseForm.get('members')?.value || [];
    return members.includes(uid);
  }

  onMemberToggle(uid: string, event: Event) {
    const checkbox = event.target as HTMLInputElement;
    const currentMembers: string[] = this.expenseForm.get('members')?.value || [];

    const updatedMembers = checkbox.checked
      ? [...currentMembers, uid]
      : currentMembers.filter(id => id !== uid);

    this.expenseForm.get('members')?.setValue(updatedMembers);
  }

  getSplitExpenseSortedMembers(memberIds: string[]): string[] {
    const currentUid = this.currentUser()?.uid;
    if (!currentUid) return memberIds;


    return [
      ...memberIds.filter(id => id === currentUid),
      ...memberIds.filter(id => id !== currentUid)
    ];
  }

  getUser(uid: string): AppUser | undefined {
    return this.connectedUserDetails().find(u => u.uid === uid);
  }

  openDeleteDialog(expenseId: string, paidBy: string) {


    if (paidBy !== this.currentUser().uid) return; // guard
    this.selectedExpenseId.set(expenseId);
    const modal = document.getElementById('delete_expense_modal') as HTMLDialogElement;
    modal?.showModal();
  }

  deleteExpense() {
    const tripId = this.tripDetails().id;
    const expenseId = this.selectedExpenseId();
    if (!tripId || !expenseId) return;

    this.expenseService.deleteExpense(tripId, expenseId).then(() => {
      const modal = document.getElementById('delete_expense_modal') as HTMLDialogElement;
      modal?.close();
    });
  }

  isAllSelected(): boolean {
    const otherUsers = this.connectedUserDetails()
      .filter(u => u.uid !== this.currentUser()?.uid)
      .map(u => u.uid);

    const selectedMembers: string[] = this.expenseForm.get('members')?.value || [];

    return otherUsers.every(uid => selectedMembers.includes(uid));
  }

  goBack() {
    this.routeLink.navigate(['/dashboard']);
  }

  toggleSelectAll() {
    const otherUsers = this.connectedUserDetails()
      .filter(u => u.uid !== this.currentUser()?.uid)
      .map(u => u.uid);

    const currentUser = this.currentUser()?.uid;

    if (this.isAllSelected()) {
      // Sirf current user rakhо — deselect all others
      this.expenseForm.get('members')?.setValue(
        currentUser ? [currentUser] : []
      );
    } else {
      // Sab select karo + current user bhi
      this.expenseForm.get('members')?.setValue(
        currentUser ? [currentUser, ...otherUsers] : otherUsers
      );
    }
  }

  isPersonalExpense(memberIds: string[]): boolean {

    return memberIds.length === 1 && memberIds[0] === this.currentUser()?.uid;

  }

  protected openTransactionSplit(memberIds: string[]) {
    const modal = document.getElementById('transaction_members_modal') as HTMLDialogElement;
    modal?.showModal();

    for(const id of memberIds) {
      const user = this.getUser(id);

      if(user)
      {
        this.transactionSplitMembers.update(list => [...list, user]);
      }

    }
    this.transactionSplitMembers.update(list =>
      [...list].sort((a, b) =>
        (a?.name ?? '').localeCompare(b?.name ?? '')
      )
    );
  }

  protected onCloseTransactionSplitMembersModal() {
    const modal = document.getElementById('transaction_members_modal') as HTMLDialogElement;
    modal?.close();

    this.transactionSplitMembers.set([]);
  }
}
