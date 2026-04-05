import {Component, inject, input, OnInit, output, signal} from '@angular/core';
import {AppUser} from '../../models/app-user';
import {UpiService} from '../../services/upi-service';
import {AlertCircle, Check, LucideAngularModule, Pencil} from 'lucide-angular';
import {FormsModule} from '@angular/forms';

@Component({
  selector: 'app-upi-id-settings',
  imports: [
    LucideAngularModule,
    FormsModule
  ],
  templateUrl: './upi-id-settings.html',
  styleUrl: './upi-id-settings.css',
})
export class UpiIdSettings implements OnInit {


  currentUser = input.required<AppUser>();
   saved = output<string>();   // emits the saved UPI ID

  upiId      = signal('');
  isEditing  = signal(false);
  isSaving   = signal(false);
  saveError  = signal('');
  saveSuccess = signal(false);
  protected readonly Pencil = Pencil;
  protected readonly Check = Check;
  protected readonly AlertCircle = AlertCircle;
  private upiService = inject(UpiService);

  get isValid(): boolean {
    return this.upiService.validateUpiId(this.upiId());
  }

  ngOnInit() {
    this.upiId.set(this.currentUser()?.upiId ?? '');
  }

  startEdit() {
    this.isEditing.set(true);
    this.saveError.set('');
    this.saveSuccess.set(false);
  }

  cancel() {
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
      await this.upiService.saveUpiId(this.currentUser().uid, this.upiId());
      this.saveSuccess.set(true);
      this.isEditing.set(false);
      this.saved.emit(this.upiId());
      setTimeout(() => this.saveSuccess.set(false), 3000);
    } catch {
      this.saveError.set('Failed to save. Please try again.');
    } finally {
      this.isSaving.set(false);
    }
  }
  
  applyHandle(handle: string) {
    const name = this.upiId()?.split('@')[0] || '';
    this.upiId.set(name + handle);
  }
}
