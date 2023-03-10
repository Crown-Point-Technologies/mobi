/*-
 * #%L
 * com.mobi.web
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2023 iNovex Information Systems, Inc.
 * %%
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 * #L%
 */
import { find } from 'lodash';
import { OnInit, Component } from '@angular/core';
import { FormBuilder, Validators, FormGroup } from '@angular/forms';

import { UserManagerService } from '../../../shared/services/userManager.service';
import { User } from '../../../shared/models/user.interface';
import { UtilService } from '../../../shared/services/util.service';
import { LoginManagerService } from '../../../shared/services/loginManager.service';

/**
 * @name settings.PasswordTabComponent
 *
 * `passwordTab` is a component that creates a Bootstrap `row` with a form allowing the current user to change their
 * password. The user must enter their current password in order to make a change. The new password is entered in an
 * {@link shared.component:unmaskPassword Unmask Password Component}.
 */
@Component({
    selector: 'password-tab',
    templateUrl: './passwordTab.component.html'
})
export class PasswordTabComponent implements OnInit {
    currentUser: User = undefined;
    errorMessage: string;
    passwordForm = this.fb.group({
        currentPassword: ['', [Validators.required]],
        unmaskPassword: ['', [Validators.required]]
    });
    currentPasswordErrorMessage: string;
   
    constructor(private um: UserManagerService, private lm: LoginManagerService,
        private util: UtilService, private fb: FormBuilder) {}

    ngOnInit(): void {
        this.currentUser = find(this.um.users, { username: this.lm.currentUser });
        if (!this.currentUser || this.currentUser.external) {
            this.disableAllFields(this.passwordForm);
        }
    }

    reset(): void {
        this.passwordForm.reset();
    }

    save(): void {
        this.um.changePassword(this.lm.currentUser, this.passwordForm.controls.currentPassword.value, this.passwordForm.controls.unmaskPassword.value)
            .subscribe(() => {
                this.errorMessage = '';
                this.currentPasswordErrorMessage = '';
                this.util.createSuccessToast('Password successfully saved');
                this.reset();
            }, errorObj => {
                this.errorMessage = '';
                this.currentPasswordErrorMessage = '';
                if (errorObj.errorMessage.includes('Current password')) {
                    this.currentPasswordErrorMessage = errorObj.errorMessage;
                    this.passwordForm.controls['currentPassword'].setErrors({'currentPasswordInvalid': true});
                } else {
                    this.errorMessage = errorObj.errorMessage;
                }
            });
    }

    disableAllFields(formGroup: FormGroup): void {
        Object.keys(formGroup.controls).forEach(controlName => {
            const temp = formGroup.get(controlName);
            if (temp instanceof FormGroup) {
                this.disableAllFields(temp);
            } else {
                temp.disable();
            }
        });
    }
}