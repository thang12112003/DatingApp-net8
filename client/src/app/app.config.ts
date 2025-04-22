import { ApplicationConfig, importProvidersFrom, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideHttpClient, withInterceptorsFromDi, withInterceptors, HTTP_INTERCEPTORS } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideToastr } from 'ngx-toastr';
import { ErrorInterceptor } from './_interceptors/error.interceptor';
import { jwtInterceptor } from './_interceptors/jwt.interceptor';
import { NgxSpinnerModule } from 'ngx-spinner'; // Sửa thành NgxSpinnerModule
import { loadingInterceptor } from './_interceptors/loading.interceptor';
import { TimeagoModule } from 'ngx-timeago';
import { ModalModule } from 'ngx-bootstrap/modal'; // Thêm ModalModule
import { TabsModule } from 'ngx-bootstrap/tabs';   // Thêm TabsModule

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(
      withInterceptorsFromDi(), // Hỗ trợ interceptors dạng class (ErrorInterceptor)
      withInterceptors([jwtInterceptor, loadingInterceptor]) // Function-based interceptors
    ),
    importProvidersFrom(
      NgxSpinnerModule, // Sửa từ NgxSpinner thành NgxSpinnerModule
      TimeagoModule.forRoot(),
      ModalModule.forRoot(), // Cung cấp ModalModule
      TabsModule.forRoot()   // Cung cấp TabsModule
    ),
    provideAnimations(),
    provideToastr({
      positionClass: 'toast-bottom-right'
    }),
    { provide: HTTP_INTERCEPTORS, useClass: ErrorInterceptor, multi: true } // Interceptor lỗi
  ]
};
