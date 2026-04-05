import {Component, inject, input, output, signal} from '@angular/core';
import {Expense} from '../../models/expense';
import {AppUser} from '../../models/app-user';
import {UpiService} from '../../services/upi-service';
import {UpiPaymentDetails} from '../../models/upi-payment-details';
import {Check, Copy, LucideAngularModule, Smartphone, X} from 'lucide-angular';

@Component({
  selector: 'app-upi-payment',
  imports: [LucideAngularModule],
  templateUrl: './upi-payment.html',
  styleUrl: './upi-payment.css',
})
export class UpiPayment {

  expense = input.required<Expense>();
  payer   = input.required<AppUser>();

  paidConfirmed = output<Expense>();
  cancelled     = output<void>();

  copied   = signal(false);
  platform = signal<'android' | 'ios' | 'desktop'>('desktop');

  /**
   * iOS only — app buttons with letter avatar fallback.
   * Android uses the generic upi:// deep link — no app buttons needed.
   */
  upiApps = [
    {
      name: 'Google Pay',
      color: '#4285F4',
      letter: 'G',
      icon: 'https://upload.wikimedia.org/wikipedia/commons/f/f2/Google_Pay_Logo.svg',
      scheme: 'gpay://upi/pay'
    },
    {
      name: 'PhonePe',
      color: '#5f259f',
      letter: 'Pe',
      icon: 'https://upload.wikimedia.org/wikipedia/commons/7/71/PhonePe_Logo.svg',
      scheme: 'phonepe://pay'
    },
    {
      name: 'Paytm',
      color: '#00BAF2',
      letter: 'Pt',
      icon: 'https://upload.wikimedia.org/wikipedia/commons/4/42/Paytm_logo.png',
      scheme: 'paytmmp://pay'
    },
    {
      name: 'BHIM',
      color: '#004C8F',
      letter: 'B',
      icon: 'https://upload.wikimedia.org/wikipedia/commons/6/6f/UPI_logo.svg', // UPI logo as fallback
      scheme: 'bhim://pay'
    }
  ];
  protected readonly Smartphone = Smartphone;
  protected readonly X          = X;
  protected readonly Check      = Check;
  protected readonly Copy       = Copy;

  private upiService = inject(UpiService);

  constructor() {
    if (this.upiService.isAndroid()) {
      this.platform.set('android');
    } else if (this.upiService.isIos()) {
      this.platform.set('ios');
    } else {
      this.platform.set('desktop');
    }
  }

  get details(): UpiPaymentDetails {
    return this.upiService.buildPaymentDetails(this.expense(), this.payer());
  }

  get hasUpiId(): boolean {
    return !!this.payer()?.upiId;
  }

  /**
   * Android: fires generic upi:// deep link → system shows app chooser (GPay/PhonePe etc.)
   * No need for individual app buttons on Android.
   */
  pay() {
    if (!this.hasUpiId) return;
    this.upiService.openAndroidUpi(this.details);
    setTimeout(() => this.confirmDialog(), 3000);
  }

  /**
   * iOS only: each app has its own URL scheme since upi:// isn't supported.
   */
  openUpiApp(app: { name: string; scheme: string }) {
    const d   = this.details;
    const url = `${app.scheme}?pa=${this.payer().upiId}`
      + `&pn=${encodeURIComponent(this.payer().name ?? '')}`
      + `&am=${d.amount}`
      + `&cu=INR`
      + `&tn=${encodeURIComponent(d.note)}`;

    window.location.href = url;

    setTimeout(() => {
      alert(`If ${app.name} did not open, try another app or copy the UPI ID.`);
    }, 2500);
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

  private confirmDialog() {
    const done = confirm('Did you complete the UPI payment?');
    if (done) this.paidConfirmed.emit(this.expense());
  }
}
