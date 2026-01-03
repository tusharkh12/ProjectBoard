import { Component, signal, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthService } from '../../services/auth.service';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly userService = inject(UserService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  
  registerForm: FormGroup;
  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);
  readonly success = signal(false);
  
  constructor() {
    this.registerForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
      password: ['', [Validators.required, Validators.minLength(4)]],
      email: ['', [Validators.required, Validators.email, Validators.maxLength(100)]]
    });
    
    // Redirect if already authenticated
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/dashboard']);
    }
  }
  
  onSubmit(): void {
    if (this.registerForm.invalid) {
      return;
    }
    
    this.isLoading.set(true);
    this.error.set(null);
    
    const { username, password, email } = this.registerForm.value;
    
    this.userService.register(username, password, email)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.isLoading.set(false);
          this.success.set(true);
          // Auto-login after registration
          setTimeout(() => {
            this.authService.login(username, password)
              .pipe(takeUntilDestroyed(this.destroyRef))
              .subscribe({
                next: () => {
                  this.router.navigate(['/dashboard']);
                },
                error: () => {
                  this.router.navigate(['/login']);
                }
              });
          }, 1500);
        },
        error: (err) => {
          this.isLoading.set(false);
          const errorMessage = err.error?.message || err.message || 'Registration failed. Please try again.';
          this.error.set(errorMessage);
        }
      });
  }
  
  goToLogin(): void {
    this.router.navigate(['/login']);
  }
}

