import { Module } from '@nestjs/common';
import * as schema from './schemas/index';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
export const DrizzleProvider = 'DrizzleProvider';
@Module({
  providers: [
    {
      provide: DrizzleProvider,
      useFactory: () => {
        const pool = new Pool({
          connectionString: process.env.DATABASE_URL!,
        });
        const db = drizzle({ client: pool, schema });
        return db;
      },
    },
  ],
  exports: [DrizzleProvider],
})
export class DrizzleModule {}
