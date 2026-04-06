import {Component, effect, inject, input, OnInit, output, signal} from '@angular/core';
import {FormsModule} from '@angular/forms';

import {AlertCircle, Check, LucideAngularModule, Pencil, Trash, X} from 'lucide-angular';
import {UpiService} from '../../services/upi-service';
import {AppUser} from '../../models/app-user';

@Component({
  selector: 'app-upi-id-settings',
  imports: [FormsModule, LucideAngularModule],
  templateUrl: './upi-id-settings.html',
})
export class UpiIdSettings implements OnInit {

  currentUser = input.required<AppUser>();

  saved   = output<string>();
  removed = output<void>();

  upiId        = signal('');
  isEditing    = signal(false);
  isRemoving   = signal(false);  // confirm remove state
  isSaving     = signal(false);
  saveError    = signal('');
  saveSuccess  = signal(false);


  protected readonly Pencil      = Pencil;
  protected readonly Check       = Check;
  protected readonly X           = X;
  protected readonly AlertCircle = AlertCircle;
  protected readonly Trash       = Trash;

  private upiService = inject(UpiService);

  constructor() {
    effect(() => {
      const user = this.currentUser();
      this.upiId.set(user?.upiId ?? '');
    });
  }

  get isValid(): boolean {
    return this.upiService.validateUpiId(this.upiId());
  }

  ngOnInit() {
    this.upiId.set(this.currentUser()?.upiId ?? '');

    console.log( "upi id ",this.upiId);
    console.log( "current user ",this.currentUser());

  }

  startEdit() {
    this.isEditing.set(true);
    this.isRemoving.set(false);
    this.saveError.set('');
    this.saveSuccess.set(false);
  }

  cancelEdit() {
    this.upiId.set(this.currentUser()?.upiId ?? '');
    this.isEditing.set(false);
    this.saveError.set('');
  }

  async save() {
    if (!this.isValid) {
      this.saveError.set('Enter a valid UPI ID (e.g. name@okaxis)');
      return;
    }

    this.isSaving.set(true);
    this.saveError.set('');

    try {
      const value = this.upiId().trim().toLowerCase();

      await this.upiService.saveUpiId(this.currentUser().uid, value);

      this.saveSuccess.set(true);
      this.isEditing.set(false);

      this.saved.emit(value);

      setTimeout(() => this.saveSuccess.set(false), 3000);

    } catch {
      this.saveError.set('Failed to save. Please try again.');
    } finally {
      this.isSaving.set(false);
    }
  }
  confirmRemove() {
    this.isRemoving.set(true);
    this.isEditing.set(false);
  }

  cancelRemove() {
    this.isRemoving.set(false);
  }



  async remove() {
    this.isSaving.set(true);
    this.saveError.set('');

    try {
      await this.upiService.removeUpiId(this.currentUser().uid);

      this.upiId.set('');
      this.isRemoving.set(false);
      this.saveSuccess.set(true);

      this.removed.emit();

      setTimeout(() => this.saveSuccess.set(false), 3000);

    } catch {
      this.saveError.set('Failed to remove. Please try again.');
    } finally {
      this.isSaving.set(false);
    }
  }
}
