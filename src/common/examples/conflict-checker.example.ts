import { Injectable } from '@nestjs/common';
import {
  ConflictChecker,
  UniqueField,
} from '../../common/utils/conflict-checker.util';

// Example DTO with multiple unique fields
interface CreateUserDto {
  email: string;
  username: string;
  phone?: string;
  socialSecurityNumber?: string;
}

@Injectable()
export class UserRegistrationService {
  constructor() {
    // private userService: UserService, // Inject your user service here
  }

  async registerUser(createUserDto: CreateUserDto) {
    const { email, username, phone, socialSecurityNumber } = createUserDto;

    // Example 1: Simple approach with individual checks
    await this.checkEmailConflict(email);
    await this.checkUsernameConflict(username);

    // Example 2: Advanced approach with multiple fields at once
    await this.checkMultipleUniqueFields({
      email,
      username,
      phone,
      socialSecurityNumber,
    });

    // Continue with user creation...
    console.log('User registration would continue here...');
  }

  /**
   * Example 1: Simple single field checking
   */
  private async checkEmailConflict(email: string) {
    const emailExists = await this.checkEmailExists(email);
    ConflictChecker.checkSingleField(
      'email',
      email,
      emailExists,
      'Email address is already registered',
    );
  }

  private async checkUsernameConflict(username: string) {
    const usernameExists = await this.checkUsernameExists(username);
    ConflictChecker.checkSingleField(
      'username',
      username,
      usernameExists,
      'Username is already taken',
    );
  }

  /**
   * Example 2: Advanced multiple field checking
   */
  private async checkMultipleUniqueFields(data: CreateUserDto) {
    // Define all unique fields with their values and custom messages
    const uniqueFields: UniqueField[] = [];

    // Always check required unique fields
    uniqueFields.push(
      {
        field: 'email',
        value: data.email,
        message: 'Email address is already registered',
      },
      {
        field: 'username',
        value: data.username,
        message: 'Username is already taken',
      },
    );

    // Conditionally add optional unique fields
    if (data.phone) {
      uniqueFields.push({
        field: 'phone',
        value: data.phone,
        message: 'Phone number is already registered',
      });
    }

    if (data.socialSecurityNumber) {
      uniqueFields.push({
        field: 'socialSecurityNumber',
        value: data.socialSecurityNumber,
        message: 'Social Security Number is already registered',
      });
    }

    // Define corresponding check functions
    const checkFunctions = [
      // Email check function
      (emailValue: string) => this.checkEmailExists(emailValue),
      // Username check function
      (usernameValue: string) => this.checkUsernameExists(usernameValue),
      // Phone check function (only if phone was provided)
      ...(data.phone
        ? [(phoneValue: string) => this.checkPhoneExists(phoneValue)]
        : []),
      // SSN check function (only if SSN was provided)
      ...(data.socialSecurityNumber
        ? [(ssnValue: string) => this.checkSocialSecurityNumberExists(ssnValue)]
        : []),
    ];

    // Check all conflicts at once
    await ConflictChecker.checkAndThrowConflicts(uniqueFields, checkFunctions);
  }

  /**
   * Mock database check functions
   * Replace these with actual database calls
   */
  private async checkEmailExists(email: string): Promise<boolean> {
    // Simulate database call delay
    await new Promise((resolve) => setTimeout(resolve, 10));
    // Replace with: return !!(await this.userService.findByEmail(email));
    return email === 'test@example.com'; // Mock: simulate existing email
  }

  private async checkUsernameExists(username: string): Promise<boolean> {
    // Simulate database call delay
    await new Promise((resolve) => setTimeout(resolve, 10));
    // Replace with: return !!(await this.userService.findByUsername(username));
    return username === 'admin'; // Mock: simulate existing username
  }

  private async checkPhoneExists(phone: string): Promise<boolean> {
    // Simulate database call delay
    await new Promise((resolve) => setTimeout(resolve, 10));
    // Replace with: return !!(await this.userService.findByPhone(phone));
    return phone === '+1234567890'; // Mock: simulate existing phone
  }

  private async checkSocialSecurityNumberExists(ssn: string): Promise<boolean> {
    // Simulate database call delay
    await new Promise((resolve) => setTimeout(resolve, 10));
    // Replace with: return !!(await this.userService.findBySSN(ssn));
    return ssn === '123-45-6789'; // Mock: simulate existing SSN
  }
}

/**
 * Usage Examples:
 *
 * 1. Single field conflict:
 *    - Input: { email: "test@example.com", username: "newuser" }
 *    - Result: Throws ConflictException with email field specified
 *
 * 2. Multiple field conflicts:
 *    - Input: { email: "test@example.com", username: "admin" }
 *    - Result: Throws ConflictException with both email and username fields
 *
 * 3. Optional field conflict:
 *    - Input: { email: "new@example.com", username: "newuser", phone: "+1234567890" }
 *    - Result: Throws ConflictException with phone field specified
 *
 * The error response will look like:
 * {
 *   "statusCode": 409,
 *   "message": "Resource already exists (2 conflicts)",
 *   "errors": [
 *     {
 *       "property": "email",
 *       "value": "test@example.com",
 *       "message": "Email address is already registered",
 *       "code": "DUPLICATE_ENTRY"
 *     },
 *     {
 *       "property": "username",
 *       "value": "admin",
 *       "message": "Username is already taken",
 *       "code": "DUPLICATE_ENTRY"
 *     }
 *   ]
 * }
 */
