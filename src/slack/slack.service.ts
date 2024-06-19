import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Block, WebClient } from '@slack/web-api';
import { AnalyzerService } from './analyzer.service';
import { FeedbackService } from '../feedback/feedback.service';
import { Feedback } from '../feedback/feedback.entity';

@Injectable()
export class SlackService {
  private slackClient: WebClient;
  private channelId: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly feedbackService: FeedbackService,
    private readonly analyzerService: AnalyzerService,
  ) {
    const slackKey = configService.get<string>('SLACK_API_KEY');
    this.channelId = configService.get<string>('SLACK_CHANNEL');
    this.slackClient = new WebClient(slackKey);
  }

  private toCamelCase(str: string): string {
    return str
      .toLowerCase()
      .replace(/(?:^\w|[A-Z]|\b\w|\s+)/g, (match, index) =>
        index === 0 ? match.toLowerCase() : match.toUpperCase(),
      )
      .replace(/\s+/g, '');
  }

  private toSnakeCase(str: string): string {
    return str
      .replace(/\s+/g, ' ')
      .trim()
      .split(' ')
      .map((word) => word.toLowerCase())
      .join('_');
  }

  private toPascalCase(str: string): string {
    return str
      .replace(
        /\w\S*/g,
        (txt) => txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase(),
      )
      .replace(/\s+/g, '');
  }

  async sendErrorMessage(userId: string, message: string, threadId?: string) {
    let text = message;
    if (threadId) {
      const messageLink = `https://slack.com/archives/${
        this.channelId
      }/p${threadId.replace('.', '')}`;
      text += `  <${messageLink}|메세지 보기>`;
    }

    await this.slackClient.chat.postEphemeral({
      channel: this.channelId,
      user: userId,
      text,
    });
  }

  async processUserInput(input: string, userId: string, userName: string) {
    const translateText = await this.analyzerService.getTranslation(input);
    const title = `@${userName} '${input}'에 대한 변수명 추천 결과입니다.`;

    const responseTexts = [
      `:dromedary_camel: camelCase: ${this.toCamelCase(translateText)}`,
      `:camel: PascalCase: ${this.toPascalCase(translateText)}`,
      `:snake: snake_case: ${this.toSnakeCase(translateText)}`,
    ];

    // Send the result back to the user
    const { message } = await this.slackClient.chat.postMessage({
      channel: this.channelId,
      text: title,
      blocks: [
        {
          type: 'divider',
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: title,
          },
        },
        {
          type: 'section',
          text: {
            type: 'plain_text',
            text: responseTexts.join(`\n`),
            emoji: true,
          },
        },
        {
          type: 'actions',
          block_id: `feedback_buttons`,
          elements: [
            {
              type: 'button',
              text: {
                type: 'plain_text',
                text: '👍 Like 0',
                emoji: true,
              },
              value: `like`,
              action_id: `like_button`,
              style: 'primary',
            },
            {
              type: 'button',
              text: {
                type: 'plain_text',
                text: '👎 DisLike 0',
                emoji: true,
              },
              value: `dislike`,
              action_id: `dislike_button`,
              style: 'danger',
            },
          ],
        },
        {
          type: 'divider',
        },
      ],
    });

    // Save the result to database
    await this.feedbackService.insertNewFeedback({
      userId,
      messageId: message.ts,
      inputText: input,
      responseText: translateText,
    });
  }

  async handleFeedback(
    actionId: string,
    userId: string,
    messageId: string,
    blocks: Block[],
  ) {
    const feedback = await this.feedbackService.getFeedback(messageId);

    if (!feedback) {
      throw new NotFoundException(
        `No matching feedback with messageId '${messageId}'`,
      );
    }

    // Check if the user has already provided feedback
    const hasProvidedFeedback =
      await this.feedbackService.hasUserProvidedFeedback(feedback, userId);

    if (hasProvidedFeedback) {
      await this.sendErrorMessage(
        userId,
        ':thinking_face: 이미 이 메세지에 대한 피드백을 보내셨어요.',
        messageId,
      );
      return;
    }

    // Update feedback
    let updated: Feedback;
    if (actionId.startsWith('like')) {
      updated = await this.feedbackService.updateFeedbackCount({
        id: feedback.id,
        count: feedback.likeCount + 1,
        userId,
        column: 'likeCount',
      });
    } else if (actionId.startsWith('dislike')) {
      updated = await this.feedbackService.updateFeedbackCount({
        id: feedback.id,
        count: feedback.dislikeCount + 1,
        userId,
        column: 'dislikeCount',
      });
    }

    const updatedBlocks = blocks.map((block) => {
      if (block.type === 'actions') {
        return {
          type: 'actions',
          block_id: `feedback_buttons`,
          elements: [
            {
              type: 'button',
              text: {
                type: 'plain_text',
                text: `👍 Like ${updated.likeCount}`,
                emoji: true,
              },
              value: `like`,
              action_id: `like_button`,
              style: 'primary',
            },
            {
              type: 'button',
              text: {
                type: 'plain_text',
                text: `👎 DisLike ${updated.dislikeCount}`,
                emoji: true,
              },
              value: `dislike`,
              action_id: `dislike_button`,
              style: 'danger',
            },
          ],
        };
      }
      return block;
    });

    // Update blocks with feedback result
    await this.slackClient.chat.update({
      channel: this.channelId,
      ts: feedback.messageId,
      blocks: updatedBlocks,
    });
  }
}
