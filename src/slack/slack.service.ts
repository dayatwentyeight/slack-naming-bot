import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WebClient } from '@slack/web-api';

@Injectable()
export class SlackService {
  private slackClient: WebClient;
  private channelId: string;

  constructor(private readonly configService: ConfigService) {
    const slackKey = configService.get<string>('SLACK_API_KEY');
    this.channelId = configService.get<string>('SLACK_CHANNEL');
    this.slackClient = new WebClient(slackKey);
  }

  async sendInteractiveMessage(triggerId: string) {
    await this.slackClient.views.open({
      trigger_id: triggerId,
      view: {
        type: 'modal',
        callback_id: 'input_modal',
        title: {
          type: 'plain_text',
          text: '변수명 추천 받기',
        },
        blocks: [
          {
            type: 'input',
            block_id: 'input_block',
            label: {
              type: 'plain_text',
              text: '어떤 상황에서 쓰일 변수인가요?',
            },
            element: {
              type: 'plain_text_input',
              action_id: 'input_value',
            },
          },
        ],
        submit: {
          type: 'plain_text',
          text: '제출',
        },
      },
    });
  }

  async processUserInput(input: string, user: string) {
    // Here send api with input and get result

    const result = `@${user} '${input}'에 대한 변수명 추천 결과입니다.`;

    // Send the result back to the user
    await this.slackClient.chat.postMessage({
      channel: this.channelId,
      text: result,
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: result,
          },
          accessory: {
            type: 'button',
            text: {
              type: 'plain_text',
              text: 'Provide Feedback',
            },
            action_id: 'feedback_button',
          },
        },
      ],
    });
  }

  async handleFeedback(actionId: string, userId: string) {
    // Handle the feedback
  }
}
