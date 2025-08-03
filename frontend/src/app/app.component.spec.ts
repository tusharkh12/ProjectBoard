import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, ActivatedRoute } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { of } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';

import { AppComponent } from './app.component';

describe('AppComponent', () => {
  let component: AppComponent;
  let fixture: ComponentFixture<AppComponent>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockDialog: jasmine.SpyObj<MatDialog>;

  beforeEach(async () => {
    const dialogSpy = jasmine.createSpyObj('MatDialog', ['open']);

    await TestBed.configureTestingModule({
      imports: [AppComponent, NoopAnimationsModule, RouterTestingModule],
      providers: [
        { provide: MatDialog, useValue: dialogSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AppComponent);
    component = fixture.componentInstance;
    mockRouter = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    mockDialog = TestBed.inject(MatDialog) as jasmine.SpyObj<MatDialog>;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have initial state', () => {
    expect(component.isLoading()).toBe(false);
    expect(component.sidebarCollapsed()).toBe(false);
    expect(component.isDarkMode()).toBeDefined(); // Theme depends on system/localStorage
    expect(component.taskCount()).toBe(15);
    expect(component.currentPageTitle()).toBe('Dashboard');
  });

  it('should toggle sidebar', () => {
    expect(component.sidebarCollapsed()).toBe(false);
    component.toggleSidebar();
    expect(component.sidebarCollapsed()).toBe(true);
    component.toggleSidebar();
    expect(component.sidebarCollapsed()).toBe(false);
  });

  it('should toggle dark mode', () => {
    const initialTheme = component.isDarkMode();
    component.toggleTheme();
    expect(component.isDarkMode()).toBe(!initialTheme);
    component.toggleTheme();
    expect(component.isDarkMode()).toBe(initialTheme);
  });

  it('should have createNewIssue method', () => {
    expect(component.createNewIssue).toBeDefined();
    expect(typeof component.createNewIssue).toBe('function');
  });

  it('should have refreshData method', () => {
    expect(component.refreshData).toBeDefined();
    expect(typeof component.refreshData).toBe('function');
  });

  it('should have correct task count', () => {
    expect(component.taskCount()).toBe(15);
  });
});