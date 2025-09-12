import { ConflictException } from '@nestjs/common';

export interface UniqueField<T = string | number> {
  field: string;
  value: T;
  message?: string;
}

export interface ConflictCheckResult<T = string | number> {
  hasConflict: boolean;
  conflictFields: UniqueField<T>[];
}

export class ConflictChecker {
  /**
   * Creates a dynamic conflict exception with multiple field support
   * @param conflictFields Array of fields that have conflicts
   * @param defaultMessage Default message when no specific message is provided
   */
  static createConflictException<T = string | number>(
    conflictFields: UniqueField<T>[],
    defaultMessage = 'Resource already exists',
  ): ConflictException {
    const errors = conflictFields.map((field) => ({
      property: field.field,
      value: field.value,
      message: field.message || `${field.field} already exists`,
    }));

    const message =
      conflictFields.length === 1
        ? errors[0].message
        : `${defaultMessage} (${conflictFields.length} conflicts)`;

    return new ConflictException({
      message,
      errors,
    });
  }

  /**
   * Helper method to check multiple unique fields and throw if conflicts exist
   * @param uniqueFields Array of unique fields to check
   * @param checkFunctions Array of async functions that return true if field exists
   */
  static async checkAndThrowConflicts<T = string | number>(
    uniqueFields: UniqueField<T>[],
    checkFunctions: Array<(value: T) => Promise<boolean>>,
  ): Promise<void> {
    const conflicts: UniqueField<T>[] = [];

    for (let i = 0; i < uniqueFields.length; i++) {
      const field = uniqueFields[i];
      const checkFunction = checkFunctions[i];

      if (checkFunction && (await checkFunction(field.value))) {
        conflicts.push(field);
      }
    }

    if (conflicts.length > 0) {
      throw this.createConflictException(conflicts);
    }
  }

  /**
   * Simple method for single field conflict checking
   * @param field Field name
   * @param value Field value
   * @param exists Whether the field value already exists
   * @param message Custom error message
   */
  static checkSingleField<T = string | number>(
    field: string,
    value: T,
    exists: boolean,
    message?: string,
  ): void {
    if (exists) {
      throw this.createConflictException([{ field, value, message }]);
    }
  }
}
