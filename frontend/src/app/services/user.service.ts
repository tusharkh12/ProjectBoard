import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface RegisterRequest {
  username: string;
  password: string;
  email: string;
}

/**
 * User Service for registration
 */
@Injectable({
  providedIn: 'root'
})
export class UserService {
  private readonly http = inject(HttpClient);
  private readonly API_BASE = 'http://localhost:8080/api/auth';
  
  /**
   * Register a new user
   */
  register(username: string, password: string, email: string): Observable<{ message?: string }> {
    const request: RegisterRequest = { username, password, email };
    return this.http.post<{ message?: string }>(`${this.API_BASE}/register`, request);
  }
}

