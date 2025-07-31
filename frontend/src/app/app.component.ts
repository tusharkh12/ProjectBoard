import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { TaskEditorComponent, TaskEditorData } from './components/task-editor/task-editor.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  // Angular 20 - Use inject() instead of constructor DI
  private readonly router = inject(Router)
  private readonly dialog = inject(MatDialog);
  
  // Signals for reactive state management
  readonly isLoading = signal(false);
  readonly sidebarCollapsed = signal(false);
  readonly isDarkMode = signal(false);
  readonly taskCount = signal(15); // Will be updated from service
  
  readonly currentPageTitle = signal('Dashboard');

  constructor() {
    // Monitor route changes to update page title
    this.router.events.subscribe(() => {
      this.updatePageTitle();
    });

    // Initialize theme from localStorage
    this.initializeTheme();
  }

  createNewIssue(): void {
    const data: TaskEditorData = {
      mode: 'create'
    };

    const dialogRef = this.dialog.open(TaskEditorComponent, {
      width: '700px',
      maxWidth: '90vw',
      maxHeight: '90vh',
      data,
      disableClose: false,
      panelClass: 'task-editor-dialog'
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        // Refresh current view after creation
        this.refreshData();
      }
    });
  }

  refreshData(): void {
    this.isLoading.set(true);
    // Simulate refresh
    setTimeout(() => {
      this.isLoading.set(false);
    }, 1000);
  }

  toggleSidebar(): void {
    this.sidebarCollapsed.set(!this.sidebarCollapsed());
  }

  toggleTheme(): void {
    const newTheme = !this.isDarkMode();
    this.isDarkMode.set(newTheme);
    
    // Apply theme to document
    if (newTheme) {
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
      localStorage.setItem('theme', 'light');
    }
  }

  private initializeTheme(): void {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    const shouldUseDark = savedTheme === 'dark' || (!savedTheme && prefersDark);
    
    if (shouldUseDark) {
      this.isDarkMode.set(true);
      document.documentElement.setAttribute('data-theme', 'dark');
    }

    // Listen for system theme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (!localStorage.getItem('theme')) {
        this.isDarkMode.set(e.matches);
        if (e.matches) {
          document.documentElement.setAttribute('data-theme', 'dark');
        } else {
          document.documentElement.removeAttribute('data-theme');
        }
      }
    });
  }

  private updatePageTitle(): void {
    const url = this.router.url;
    if (url.startsWith('/dashboard')) {
      this.currentPageTitle.set('Dashboard');
    } else if (url.startsWith('/tasks/new')) {
      this.currentPageTitle.set('New Task');
    } else if (url.startsWith('/tasks') && url.includes('/edit')) {
      this.currentPageTitle.set('Edit Task');
    } else if (url.startsWith('/tasks')) {
      this.currentPageTitle.set('Tasks');
    } else if (url.startsWith('/board')) {
      this.currentPageTitle.set('Agile Board');
    } else {
      this.currentPageTitle.set('ProjectBoard');
    }
  }
}