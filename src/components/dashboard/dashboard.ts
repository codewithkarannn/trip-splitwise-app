import {Component, inject, Injector, OnInit, signal} from '@angular/core';
import {AuthService} from '../../services/auth-service';
import {TripService} from '../../services/trip-service';
import {FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import {Trip} from '../../models/trip';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Calendar,
  Check,
  Copy,
  Hash,
  Link,
  LogOut,
  LucideAngularModule,
  Plane,
  Plus,
  Trash,
  Users
} from 'lucide-angular';
import {DatePipe} from '@angular/common';
import {Router} from '@angular/router';
import {toObservable} from '@angular/core/rxjs-interop';
import {filter, switchMap, take} from 'rxjs';
import {ThemeSwitcher} from '../theme-switcher/theme-switcher';
import {AppUser} from '../../models/app-user';

@Component({
  selector: 'app-dashboard',
  imports: [FormsModule, LucideAngularModule, DatePipe, ThemeSwitcher, ReactiveFormsModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit {

  tripService = inject(TripService);
  authService = inject(AuthService);
  router = inject(Router);
  selectedTripId = signal<string | null>(null);
  tripName = '';
  joinCode: string | null = null;
  connectedUserDetails = signal<AppUser[]>([]);
  tripDate: string = new Date().toISOString().split('T')[0];
  loading = signal(true);
  myTrips = signal<Trip[]>([]);
  shareCodeCopied = signal<string | null>(null);
  protected readonly Plane = Plane;
  protected readonly Plus = Plus;
  protected readonly Link = Link;
  protected readonly LogOut = LogOut;
  protected readonly Calendar = Calendar;
  protected readonly Trash = Trash;
  protected readonly Hash = Hash;
  protected readonly ArrowRight = ArrowRight;
  protected readonly Users = Users;
  protected readonly ArrowLeft = ArrowLeft;
  protected readonly AlertCircle = AlertCircle;
  protected readonly Copy = Copy;
  protected readonly Check = Check;
  private injector = inject(Injector);
  private fb = inject(FormBuilder);
  tripForm: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    date: [new Date() , Validators.required]
  });

  get today(): Date {
    return new Date();
  }

  ngOnInit() {

    toObservable(this.authService._user, { injector: this.injector }).pipe(
      filter(user => !!user),
      take(1),
      switchMap(() => this.tripService.getMyTrips())
    ).subscribe(trips => {
      this.myTrips.set(trips);
      this.loading.set(false);
    });
  }

  async createTrip() {
    if (this.tripForm.invalid) {
      this.tripForm.markAllAsTouched();
      return;
    }

    const { name, date } = this.tripForm.value;
    await this.tripService.createTrip(name, new Date(date));

    this.tripForm.reset({
      name: '',
      date: new Date()
    });

    const modal = document.getElementById('create_trip_modal') as HTMLDialogElement;
    modal?.close();
  }

  openTrip(tripId?: string) {
    this.router.navigate(['/trip'], { queryParams: { id: tripId } });
  }

  closeJoinModal() {
    const modal = document.getElementById('join_trip_modal') as HTMLDialogElement;
    modal?.close();
  }

  async joinTrip() {
    try {
      if (this.joinCode) {
        await this.tripService.joinTripByCode(this.joinCode);
        this.joinCode = '';
        this.closeJoinModal();
      }
    } catch (err: any) {
      alert(err.message);
      this.joinCode = '';
    }
  }

  shareCodeCopyToClipboard(text: string) {
    navigator.clipboard.writeText(text).then(() => {
      this.shareCodeCopied.set(text);
      setTimeout(() => this.shareCodeCopied.set(null), 2000);
    });
  }

  getDate(date: any): Date | null {
    if (!date) return null;                                          // missing
    if (date instanceof Date) return date;                          // already Date
    if (date?.toDate) return date.toDate();                        // Firestore Timestamp
    if (date?.seconds) return new Date(date.seconds * 1000);       // plain object {seconds, nanoseconds}
    if (typeof date === 'string') return new Date(date);           // string "2026-04-11"
    return null;
  }



  deleteTrip() {
    const id = this.selectedTripId();
    if (id) {
      this.tripService.deleteTrip(id);
      const modal = document.getElementById('delete_trip_modal') as HTMLDialogElement;
      modal?.close();
    }
  }

  logout() {
    this.authService.logout();
    const modal = document.getElementById('logout_modal') as HTMLDialogElement;
    modal?.close();
  }

  getAllUsers(userIds: string[]) {
    this.authService.getUsersByIds(userIds).subscribe(users => {

      if (users && users.length > 0) {
        this.connectedUserDetails.set(users);
      }
    });
  }

  protected cancelJoinTrip() {
    const modal = document.getElementById('join_trip_modal') as HTMLDialogElement;
    modal?.close();
    this.joinCode = null;
  }
}
