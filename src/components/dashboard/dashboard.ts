import {Component, inject, Injector, OnInit, signal} from '@angular/core';
import {AuthService} from '../../services/auth-service';
import {TripService} from '../../services/trip-service';
import {FormsModule} from '@angular/forms';
import {Trip} from '../../models/trip';
import {ArrowLeft, ArrowRight, Calendar, Hash, Link, LogOut, LucideAngularModule, Plane, Plus, Trash, Users} from 'lucide-angular';
import {DatePipe} from '@angular/common';
import {Router} from '@angular/router';
import {toObservable} from '@angular/core/rxjs-interop';
import {filter, switchMap, take} from 'rxjs';
import {ThemeSwitcher} from '../theme-switcher/theme-switcher';

@Component({
  selector: 'app-dashboard',
  imports: [FormsModule, LucideAngularModule, DatePipe, ThemeSwitcher],
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
  tripDate: string = new Date().toISOString().split('T')[0];
  loading = signal(true);
  myTrips = signal<Trip[]>([]);
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
  private injector = inject(Injector);

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
    }
  }

  async createTrip() {
    if (!this.tripName.trim()) return;

    await this.tripService.createTrip(this.tripName, new Date(this.tripDate));
    this.tripName = '';
    this.tripDate = new Date().toISOString().split('T')[0];

    const modal = document.getElementById('create_trip_modal') as HTMLDialogElement;
    modal?.close();
  }

  openDeleteDialog(tripId: string) {
    this.selectedTripId.set(tripId);
    const modal = document.getElementById('delete_trip_modal') as HTMLDialogElement;
    modal?.showModal();
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
}
