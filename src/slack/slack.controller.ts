import { Controller, Post, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import { SlackService } from './slack.service';

@Controller('slack')
export class SlackController {
  constructor(private readonly slackService: SlackService) {}

  @Post('commands')
  async handleSlashCommand(@Req() request: Request, @Res() response: Response) {
    const { trigger_id, command } = request.body;

    if (command === '/naming') {
      await this.slackService.sendInteractiveMessage(trigger_id);
    }

    response.status(200).send(); // Respond immediately to Slack
  }

  @Post('interactions')
  async handleInteractions(@Req() request: Request, @Res() response: Response) {
    const payload = JSON.parse(request.body.payload);
    console.log(payload);

    if (payload.type === 'view_submission') {
      const username = payload.user.username;
      const inputValue =
        payload.view.state.values.input_block.input_value.value;

      await this.slackService.processUserInput(inputValue, username);
      return response.json({ response_action: 'clear' });
    } else if (payload.type === 'block_actions') {
      // handle feedback button

      return response.send(200).send();
    }

    return response.status(200).send(); // Default response
  }
}
