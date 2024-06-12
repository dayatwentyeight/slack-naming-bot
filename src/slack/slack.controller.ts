import { Controller, NotFoundException, Post, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import { SlackService } from './slack.service';

@Controller('slack')
export class SlackController {
  constructor(private readonly slackService: SlackService) {}

  @Post('commands')
  async handleSlashCommand(@Req() request: Request, @Res() response: Response) {
    const {
      user_id: userId,
      user_name: userName,
      command,
      text,
    } = request.body;

    if (command === '/변수명') {
      const userInput = text.trim();
      if (!userInput) {
        return response.status(200).json({
          response_type: 'ephemeral',
          text: '사용법: /변수명 [한글로 된 입력값]',
        });
      }

      // Send an immediate response to Slack to acknowledge the command
      response.status(200).send();

      try {
        await this.slackService.processUserInput(userInput, userId, userName);
      } catch (e) {
        console.error(e);

        // Send an error message to the user in Slack
        await this.slackService.sendErrorMessage(
          userId,
          ':slightly_frowning_face: 뭔가 문제가 발생했어요. 서버 로그를 확인해주세요.',
        );
      }
    } else {
      return response.status(200).send();
    }
  }

  @Post('interactions')
  async handleInteractions(@Req() request: Request, @Res() response: Response) {
    const payload = JSON.parse(request.body.payload);

    if (payload.type === 'block_actions') {
      const action = payload.actions[0];
      if (
        action.action_id.startsWith('like_button') ||
        action.action_id.startsWith('dislike_button')
      ) {
        try {
          await this.slackService.handleFeedback(
            action.action_id,
            payload.user.id,
            payload.message.ts,
            payload.message.blocks,
          );
        } catch (e) {
          if (e instanceof NotFoundException) {
            await this.slackService.sendErrorMessage(
              payload.user.id,
              ':slightly_frowning_face: 이 메세지에 대한 정보를 찾을 수 없습니다.',
              payload.message.ts,
            );
          }
        }

        return response.status(200).send();
      }

      return response.status(200).send();
    }

    return response.status(200).send();
  }
}
