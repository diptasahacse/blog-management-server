import { CategoryModule } from './category/category.module';
import { PostCategoryModule } from './post-category/post-category.module';
import { PostModule } from './post/post.module';
import { UserModule } from './user/user.module';
import { ProfileModule } from './profile/profile.module';
import { AuthModule } from './auth/auth.module';

export default [
  AuthModule,
  CategoryModule,
  PostCategoryModule,
  PostModule,
  UserModule,
  ProfileModule,
];
