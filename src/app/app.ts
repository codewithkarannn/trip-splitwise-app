import {Component, inject, signal} from '@angular/core';
import firebase from 'firebase/compat/app';
import firestore = firebase.firestore;
import {FireStoreService} from '../services/fire-store';
import {RouterOutlet} from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
 fs = inject(FireStoreService);

 add(){
   this.fs.addTestData();
 }
}
