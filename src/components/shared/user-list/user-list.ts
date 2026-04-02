import {Component, effect, ElementRef, inject, input, signal, ViewChild} from '@angular/core';
import {FormsModule} from "@angular/forms";
import {LucideAngularModule, Users} from "lucide-angular";
import {AppUser} from '../../../models/app-user';
import {TripService} from '../../../services/trip-service';

@Component({
  selector: 'app-user-list',
  imports: [
      FormsModule,
      LucideAngularModule
  ],
  templateUrl: './user-list.html',
  styleUrl: './user-list.css',
})
export class UserList   {

  @ViewChild('dialogRef') dialog!: ElementRef<HTMLDialogElement>;
  public Users = Users;
  tripService = inject(TripService);
  tripId = input.required<string>();
  public connectedUserDetails = signal<AppUser[]>([]);
  public currentUser = input<AppUser | null>(null);

  constructor() {
    effect(() => {
      const id = this.tripId();
      if (id) {
        this.loadMembers(id);
      }
    });
  }

  loadMembers(tripId: string) {
    this.tripService.getMembersByTripId(tripId)
      .subscribe(data => {
        this.connectedUserDetails.set(data);
      });
  }

  open() {
    // const _tripId = this.tripId();
    // if(_tripId)
    // {
    //   this.loadMembers(_tripId);
    // }
    this.dialog.nativeElement.showModal();
  }



}
