import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideHttpClient, withInterceptorsFromDi, withInterceptors, HTTP_INTERCEPTORS } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideToastr } from 'ngx-toastr';
import { ErrorInterceptor } from './_interceptors/error.interceptor';
import { jwtInterceptor } from './_interceptors/jwt.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(
      withInterceptorsFromDi(),  // Hỗ trợ interceptors dạng class (ErrorInterceptor)
      withInterceptors([jwtInterceptor]) // Thêm function-based interceptor đúng cách
    ),
    provideAnimations(),
    provideToastr({
      positionClass: 'toast-bottom-right'
    }),
    { provide: HTTP_INTERCEPTORS, useClass: ErrorInterceptor, multi: true } // Giữ lại interceptor lỗi
  ]
};
