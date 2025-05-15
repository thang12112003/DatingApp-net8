import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AccountService } from '../_services/account.service';
import { map } from 'rxjs/operators';

export const redirectIfAuthenticatedGuard: CanActivateFn = () => {
  const accountService = inject(AccountService);
  const router = inject(Router);

  const user = accountService.currentUser();
  if (user) {
    router.navigate(['/posts']);
    return false;
  }
  return true;
};
