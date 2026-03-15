import {computed, DestroyRef, inject, Injectable} from '@angular/core';
import {Auth, authState} from '@angular/fire/auth';
import {GoogleAuthProvider, signInWithPopup, signOut, User} from 'firebase/auth';
import {collection, doc, onSnapshot, query, setDoc, where} from 'firebase/firestore';
import {Observable, of} from 'rxjs';
import {AppUser} from '../models/app-user';
import {Router} from '@angular/router';
import {takeUntilDestroyed, toSignal} from '@angular/core/rxjs-interop';
import {map} from 'rxjs/operators';
import {Firestore} from '@angular/fire/firestore';

@Injectable({ providedIn: 'root' })
export class AuthService {

  isLoggedIn = computed(() => !!this._user());
  isLoaded = computed(() => this._user() !== undefined);
  private auth = inject(Auth);
  private router = inject(Router);
  private fireStore = inject(Firestore);
  private destroyRef = inject(DestroyRef);
  private authState$ = authState(this.auth);
  // undefined = loading, null = logged out, AppUser = logged in
  _user = toSignal<AppUser | null | undefined>(
    this.authState$.pipe(
      map(firebaseUser => {
        if (!firebaseUser) return null;
        return {
          uid: firebaseUser.uid,
          name: firebaseUser.displayName ?? 'Anonymous',
          email: firebaseUser.email ?? '',
          photoURL: firebaseUser.photoURL ?? ''
        } satisfies AppUser;
      })
    ),
    { initialValue: undefined }
  );

  constructor() {
    this.authState$.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(firebaseUser => {
      if (firebaseUser) {
        if (this.router.url === '/login') {
          this.router.navigate(['/dashboard']);
        }
      } else {
        this.router.navigate(['/login']);
      }
    });
  }

  async loginWithGoogle(): Promise<void> {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(this.auth, provider);
      if (result.user) {
        await this.saveUser(result.user);
      }
    } catch (error) {
      console.error('Google login failed:', error);
      throw error;
    }
  }

  async logout(): Promise<void> {
    await signOut(this.auth);
    this.router.navigate(['/login']);
  }

  getUsersByIds(ids: string[]): Observable<AppUser[]> {
    // Guard: empty array se Firestore crash hota hai
    if (!ids.length) return of([]);

    return new Observable(observer => {
      const usersRef = collection(this.fireStore, 'users');
      const q = query(usersRef, where('__name__', 'in', ids));
      const unsub = onSnapshot(
        q,
        snapshot => {
          const users = snapshot.docs.map(d => ({ uid: d.id, ...d.data() } as AppUser));
          observer.next(users);
        },
        error => observer.error(error)
      );
      return () => unsub();
    });
  }

  private async saveUser(user: User): Promise<void> {
    const userRef = doc(this.fireStore, `users/${user.uid}`);
    await setDoc(userRef, {
      name: user.displayName,
      email: user.email,
      photoURL: user.photoURL,
      updatedAt: new Date()
    }, { merge: true });
  }
}
