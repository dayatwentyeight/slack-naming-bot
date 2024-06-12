import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { join } from 'path';
import { SlackModule } from './slack/slack.module';
import { FeedbackModule } from './feedback/feedback.module';
import { Feedback } from './feedback/feedback.entity';
import { FeedbackUser } from './feedback/feedback-user.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: [join(__dirname, '..', '.env')],
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get('DB_USER'),
        password: configService.get('DB_PASS'),
        database: configService.get('DB_NAME'),
        entities: [Feedback, FeedbackUser],
        synchronize: configService.get('NODE_ENV') === 'development',
      }),
    }),
    SlackModule,
    FeedbackModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
