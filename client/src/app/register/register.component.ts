import { Component, OnInit, Input, Output, EventEmitter, inject } from '@angular/core';
import { AccountService } from '../_services/account.service';
import { FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
@Component({
  selector: 'app-register',
  imports:[FormsModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent implements OnInit {
  @Output() cancelRegister = new EventEmitter();
  private toastr = inject(ToastrService);
  model: any = {};
  constructor(private accountService: AccountService) { }
  ngOnInit(): void {
  }
  register() {
    this.accountService.register(this.model).subscribe( {
      next: response => {
        console.log(response);
        this.cancel()
      },
      error: error => this.toastr.error(error.error)
    })
  }
  cancel() {
    this.cancelRegister.emit(false);
  }
}
