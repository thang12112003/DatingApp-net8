import { User } from './user';

 export class UserParams {
     gender: string;
     minAge = 18;
     maxAge = 99;
     pageNumber = 1;
     pageSize = 8;
     orderBy = 'lastActive';
     searchTerm: string = '';

     constructor(user: User | null) {
         this.gender = user && user.gender === 'female' ? 'male' : 'female';
     }
 }
