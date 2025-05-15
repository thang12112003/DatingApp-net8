import { Component, OnInit, inject } from '@angular/core';
import { AdminService } from '../../_services/admin.service';
import { User } from '../../_models/user';
import { BsModalRef, BsModalService, ModalOptions } from 'ngx-bootstrap/modal';
import { RolesModalComponent } from '../../modals/roles-modal/roles-modal.component';
import { ConfirmDialogComponent } from '../../modals/confirm-dialog/confirm-dialog.component';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [],
  templateUrl: './user-management.component.html',
  styleUrl: './user-management.component.css'
})
export class UserManagementComponent implements OnInit {
  private adminService = inject(AdminService);
  private modalService = inject(BsModalService);
  private toastr = inject(ToastrService);
  users: User[] = [];
  bsModalRef: BsModalRef<RolesModalComponent | ConfirmDialogComponent> = new BsModalRef();

  ngOnInit(): void {
    this.getUsersWithRoles();
  }

  getUsersWithRoles() {
    this.adminService.getUserWithRoles().subscribe({
      next: users => {
        this.users = users;
      },
      error: err => {
        console.error('Failed to load users:', err);
        this.toastr.error('Không thể tải danh sách người dùng. Vui lòng thử lại.');
      }
    });
  }

  openRolesModal(user: User) {
    const initialState: ModalOptions = {
      class: 'modal-lg',
      initialState: {
        title: 'User roles',
        username: user.username,
        selectedRoles: [...user.roles],
        availableRoles: ['Admin', 'Moderator', 'Member'],
        users: this.users,
        rolesUpdated: false
      }
    };
    this.bsModalRef = this.modalService.show(RolesModalComponent, initialState);
    this.bsModalRef.onHide?.subscribe({
      next: () => {
        const content = this.bsModalRef.content;
        if (content && 'rolesUpdated' in content && content.rolesUpdated) {
          const selectedRoles = (content as RolesModalComponent).selectedRoles;
          this.adminService.updateUserRoles(user.username, selectedRoles).subscribe({
            next: roles => {
              user.roles = roles;
              this.toastr.success(`Cập nhật vai trò cho ${user.username} thành công`);
            },
            error: err => {
              console.error('Failed to update roles:', err);
              this.toastr.error('Không thể cập nhật vai trò. Vui lòng thử lại.');
            }
          });
        }
      }
    });
  }

  lockUser(user: User) {
    const initialState: ModalOptions = {
      initialState: {
        title: 'Xác nhận khóa tài khoản',
        message: `Bạn có chắc muốn khóa tài khoản ${user.username}?`,
        btnOkText: 'Khóa',
        btnCancelText: 'Hủy'
      }
    };
    this.bsModalRef = this.modalService.show(ConfirmDialogComponent, initialState);
    (this.bsModalRef.content as ConfirmDialogComponent).onClose.subscribe((result: boolean) => {
      if (result) {
        this.adminService.lockUser(user.username).subscribe({
          next: (response) => {
            console.log('Lock user response:', response); // Debug response
            this.getUsersWithRoles();
            this.toastr.success(`Khóa tài khoản ${user.username} thành công`);
          },
          error: err => {
            console.error('Lock user failed:', err);
            this.toastr.error(err.error || 'Không thể khóa tài khoản. Vui lòng thử lại.');
          }
        });
      }
    });
  }

  unlockUser(user: User) {
    const initialState: ModalOptions = {
      initialState: {
        title: 'Xác nhận mở khóa tài khoản',
        message: `Bạn có chắc muốn mở khóa tài khoản ${user.username}?`,
        btnOkText: 'Mở khóa',
        btnCancelText: 'Hủy'
      }
    };
    this.bsModalRef = this.modalService.show(ConfirmDialogComponent, initialState);
    (this.bsModalRef.content as ConfirmDialogComponent).onClose.subscribe((result: boolean) => {
      if (result) {
        this.adminService.unlockUser(user.username).subscribe({
          next: (response) => {
            console.log('Unlock user response:', response); // Debug response
            this.getUsersWithRoles();
            this.toastr.success(`Mở khóa tài khoản ${user.username} thành công`);
          },
          error: err => {
            console.error('Unlock user failed:', err);
            this.toastr.error(err.error || 'Không thể mở khóa tài khoản. Vui lòng thử lại.');
          }
        });
      }
    });
  }
}
