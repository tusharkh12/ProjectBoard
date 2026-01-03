import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, catchError, throwError } from 'rxjs';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  username: string;
  expiresAt: string;
  type: string;
}

/**
 * Authentication Service
 * Handles login, logout, and token management
 */
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly API_BASE = 'http://localhost:8080/api/auth';
  
  private readonly TOKEN_KEY = 'auth_token';
  private readonly USERNAME_KEY = 'auth_username';
  
  // Signals for reactive state
  private readonly _isAuthenticated = signal<boolean>(this.hasToken());
  private readonly _username = signal<string | null>(this.getStoredUsername());
  
  // Public readonly signals
  readonly isAuthenticated = this._isAuthenticated.asReadonly();
  readonly username = this._username.asReadonly();
  
  /**
   * Login with username and password
   */
  login(username: string, password: string): Observable<LoginResponse> {
    const request: LoginRequest = { username, password };
    
    return this.http.post<LoginResponse>(`${this.API_BASE}/login`, request).pipe(
      tap(response => {
        this.setToken(response.token);
        this.setUsername(response.username);
        this._isAuthenticated.set(true);
        this._username.set(response.username);
      }),
      catchError(error => {
        this._isAuthenticated.set(false);
        return throwError(() => error);
      })
    );
  }
  
  /**
   * Logout current user
   */
  logout(): void {
    this.clearToken();
    this._isAuthenticated.set(false);
    this._username.set(null);
    this.router.navigate(['/login']);
  }
  
  /**
   * Get current JWT token
   */
  getToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(this.TOKEN_KEY);
    }
    return null;
  }
  
  /**
   * Check if user has a valid token (not expired)
   */
  hasToken(): boolean {
    const token = this.getToken();
    if (!token) return false;
    
    try {
      // Decode JWT payload (second part of token)
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expiration = payload.exp * 1000; // Convert to milliseconds
      return Date.now() < expiration;
    } catch {
      // If token is malformed, consider it invalid
      return false;
    }
  }
  
  /**
   * Set authentication token
   */
  private setToken(token: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.TOKEN_KEY, token);
    }
  }
  
  /**
   * Set username
   */
  private setUsername(username: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.USERNAME_KEY, username);
    }
  }
  
  /**
   * Get stored username
   */
  private getStoredUsername(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(this.USERNAME_KEY);
    }
    return null;
  }
  
  /**
   * Clear authentication data
   */
  private clearToken(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.TOKEN_KEY);
      localStorage.removeItem(this.USERNAME_KEY);
    }
  }
}

