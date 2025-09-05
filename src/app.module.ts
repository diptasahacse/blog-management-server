import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DrizzleModule } from './drizzle/drizzle.module';
import { UserModule } from './user/user.module';
import { ProfileModule } from './profile/profile.module';
import { PostModule } from './post/post.module';
import { CategoryModule } from './category/category.module';
import { PostCategoryModule } from './post-category/post-category.module';

@Module({
  imports: [
    DrizzleModule,
    UserModule,
    ProfileModule,
    PostModule,
    CategoryModule,
    PostCategoryModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
