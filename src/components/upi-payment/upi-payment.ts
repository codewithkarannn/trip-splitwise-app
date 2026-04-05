import {Component, inject, input, output, signal} from '@angular/core';
import {Expense} from '../../models/expense';
import {AppUser} from '../../models/app-user';
import {UpiService} from '../../services/upi-service';
import {UpiPaymentDetails} from '../../models/upi-payment-details';
import {Check, Copy, LucideAngularModule, Smartphone, X} from 'lucide-angular';


@Component({
  selector: 'app-upi-payment',
  imports: [
    LucideAngularModule
  ],
  templateUrl: './upi-payment.html',
  styleUrl: './upi-payment.css',
})
export class UpiPayment {

  expense = input.required<Expense>();
  payer = input.required<AppUser>();

  paidConfirmed = output<Expense>();   // emitted when user confirms payment
  cancelled     = output<void>();

  copied   = signal(false);
  platform = signal<'android' | 'ios' | 'desktop'>('desktop');
  upiApps = [
    {
      name: 'Google Pay',
      icon: 'assets/googlepay.svg',
      scheme: 'gpay://upi/pay'
    },
    {
      name: 'PhonePe',
      icon: 'assets/phonepe.png',
      scheme: 'phonepe://pay'
    },
    {
      name: 'Paytm',
      icon: 'assets/paytm.png',
      scheme: 'paytmmp://pay'
    },
    {
      name: 'BHIM',
      icon: 'assets/bhim.png',
      scheme: 'bhim://upi/pay'
    }
  ];
  protected readonly Smartphone = Smartphone;
  protected readonly X = X;
  protected readonly Check = Check;
  protected readonly Copy = Copy;
  private upiService = inject(UpiService);

constructor() {
  if(this.upiService.isAndroid())
  {
    this.platform.set('android');
  }
  else if(this.upiService.isIos())
  {
    this.platform.set('ios');
  }
  else
  {
    this.platform.set('desktop');
  }
}

  get details(): UpiPaymentDetails {
    return this.upiService.buildPaymentDetails(this.expense(), this.payer());
  }

  get hasUpiId(): boolean {
    return !!this.payer()?.upiId;
  }

  /** Called when user taps the main Pay button */
  pay() {
    if (!this.hasUpiId) return;

    if (this.platform() === 'android') {
      this.upiService.openAndroidUpi(this.details);
      // After 3s ask if they completed payment
      setTimeout(() => this.confirmDialog(), 3000);
    }
    // iOS and desktop — modal stays open showing copy UI
  }

  copyUpiId() {
    navigator.clipboard.writeText(this.payer().upiId ?? '').then(() => {
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2000);
    });
  }

  confirmPayment() {
    this.paidConfirmed.emit(this.expense());
  }

  cancel() {
    this.cancelled.emit();
  }

  openUpiApp(app: any) {
    const d = this.details;

    const url = `${app.scheme}?pa=${this.payer().upiId}&pn=${this.payer().name}&am=${d.amount}&tn=${d.note}`;

    window.location.href = url;

    // fallback if app not installed
    setTimeout(() => {
      alert('If app did not open, please use Copy UPI ID');
    }, 2000);
  }

  private confirmDialog() {
    const done = confirm('Did you complete the UPI payment?');
    if (done) this.paidConfirmed.emit(this.expense());
  }
}
