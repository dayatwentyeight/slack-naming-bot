import { Module } from '@nestjs/common';
import { SlackService } from './slack.service';
import { SlackController } from './slack.controller';
import { FeedbackModule } from 'src/feedback/feedback.module';
import { HttpModule } from '@nestjs/axios';
import { AnalyzerService } from './analyzer.service';

@Module({
  imports: [
    FeedbackModule,
    HttpModule.register({ timeout: 60000, maxRedirects: 3 }),
  ],
  providers: [SlackService, AnalyzerService],
  controllers: [SlackController],
})
export class SlackModule {}
