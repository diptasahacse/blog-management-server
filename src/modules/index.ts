import { UserModule } from './user/user.module';
import { ProfileModule } from './profile/profile.module';
import { AuthModule } from './auth/auth.module';
import { NotificationModule } from './notification/notification.module';

export default [AuthModule, UserModule, ProfileModule, NotificationModule];
