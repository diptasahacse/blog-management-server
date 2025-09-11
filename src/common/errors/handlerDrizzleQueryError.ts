import { DrizzleQueryError } from 'drizzle-orm';
import { DatabaseError } from 'pg';
import { IErrorResponse } from 'src/common/types/common';

const handlerDrizzleQueryError = (
  exception: DrizzleQueryError,
): IErrorResponse => {
  let errorBody: IErrorResponse = {
    message: 'Database query error',
    errors: [
      {
        path: '',
        message: exception.message,
      },
    ],
  };
  console.log(exception);
  const pgError = exception.cause as DatabaseError | undefined;
  const code = pgError?.code;
  // Duplicate Key Error
  if (code === '23505') {
    console.log(pgError);
    errorBody = {
      message: 'Database query error',
      errors: [
        {
          path: '',
          message: 'Duplicate entry',
        },
      ],
      stack: exception.stack,
    };
  }
  return errorBody;
};
export default handlerDrizzleQueryError;
