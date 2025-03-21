import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AccountService } from '../_services/account.service';
import { catchError, tap, throwError } from 'rxjs';

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {// tự động gửi token cho mọi req
  const accountService = inject(AccountService);

  if(accountService.currentUser()){
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${accountService.currentUser()?.token}`
      }
    })
  }
  console.log('Intercepting request:', req.url);

  console.log('Current User:', accountService.currentUser());

  return next(req).pipe(
    tap(event => console.log('Intercepted Response:', event)), // Log response từ Interceptor
    catchError(error => {
      console.error('Interceptor Lỗi:', error);
      return throwError(() => error);
    })
  );
};
