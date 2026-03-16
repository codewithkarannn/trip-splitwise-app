import {Component, HostListener, signal} from '@angular/core';

@Component({
  selector: 'app-theme-switcher',
  imports: [],
  templateUrl: './theme-switcher.html',
  styleUrl: './theme-switcher.css',
})
export class ThemeSwitcher {
  themes = [
    'light', 'dark', 'cupcake', 'bumblebee', 'emerald',
    'corporate', 'synthwave', 'retro', 'cyberpunk', 'valentine',
    'halloween', 'garden', 'forest', 'aqua', 'lofi', 'pastel',
    'fantasy', 'wireframe', 'black', 'luxury', 'dracula', 'cmyk',
    'autumn', 'business', 'acid', 'lemonade', 'night', 'coffee', 'winter',
    'dim', 'nord', 'sunset'
  ];
  isOpen = signal(false);


  savedTheme = localStorage.getItem('theme') ?? 'light';

  constructor() {

    this.savedTheme = localStorage.getItem('theme') ?? 'light';
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event) {
    const target = event.target as HTMLElement;
    if (!target.closest('details.dropdown')) {
      this.isOpen.set(false);
      // details element band karo
      document.querySelectorAll('details.dropdown').forEach(el => {
        (el as HTMLDetailsElement).removeAttribute('open');
      });
    }
  }

  saveTheme(theme: string) {
    localStorage.setItem('theme', theme);

    document.documentElement.setAttribute('data-theme', theme);
  }
}
