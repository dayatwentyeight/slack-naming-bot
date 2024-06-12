import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FeedbackService } from './feedback.service';
import { Feedback } from './feedback.entity';
import { FeedbackUser } from './feedback-user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Feedback, FeedbackUser])],
  providers: [FeedbackService],
  exports: [FeedbackService],
})
export class FeedbackModule {}
