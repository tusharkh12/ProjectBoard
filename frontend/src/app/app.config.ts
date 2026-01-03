import { ApplicationConfig, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter, withComponentInputBinding, withViewTransitions } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideHttpClient, withFetch, withInterceptorsFromDi, withInterceptors } from '@angular/common/http';
import { routes } from './app.routes';
import { authInterceptor } from './interceptors/auth.interceptor';

/**
 * Angular 21 Application Configuration
 * 
 * Features:
 * - Zoneless change detection (stable in Angular 21)
 * - Modern router with view transitions and input binding
 * - Async animations for better loading performance
 * - HTTP client with fetch API
 * - Component input binding for route params
 */
export const appConfig: ApplicationConfig = {
  providers: [
    // Angular 21: Zoneless change detection (stable)
    provideZonelessChangeDetection(),
    
    // Modern router configuration with Angular 21 features
    provideRouter(
      routes,
      withComponentInputBinding(), // Automatic route param to signal input binding
      withViewTransitions() // Smooth page transitions with View Transitions API
    ),
    
    // Async animations - loads animation module only when needed
    provideAnimationsAsync(),
    
    // HTTP client with modern features
    provideHttpClient(
      withFetch(), // Use modern fetch API instead of XMLHttpRequest
      withInterceptorsFromDi(), // Support for dependency injection based interceptors
      withInterceptors([authInterceptor]) // Add JWT token to all requests
      // Note: Request timeout can be configured per-request using timeout option
    )
  ]
}; 