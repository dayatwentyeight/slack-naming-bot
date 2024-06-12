import { Test, TestingModule } from '@nestjs/testing';
import { SlackController } from './slack.controller';
import { SlackService } from './slack.service';
import { NotFoundException } from '@nestjs/common';
import { Request, Response } from 'express';

jest.mock('./slack.service');

describe('SlackController', () => {
  let slackController: SlackController;
  let slackService: jest.Mocked<SlackService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SlackController],
      providers: [
        {
          provide: SlackService,
          useValue: {
            processUserInput: jest.fn(),
            sendErrorMessage: jest.fn(),
            handleFeedback: jest.fn(),
          },
        },
      ],
    }).compile();

    slackController = module.get<SlackController>(SlackController);
    slackService = module.get<SlackService>(
      SlackService,
    ) as jest.Mocked<SlackService>;
  });

  describe('handleSlashCommand', () => {
    it('should return usage information if no input is provided', async () => {
      const request = {
        body: {
          user_id: 'test-user-id',
          user_name: 'test-user-name',
          command: '/변수명',
          text: '',
        },
      } as Request;

      const response = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        send: jest.fn(),
      } as unknown as Response;

      await slackController.handleSlashCommand(request, response);

      expect(response.status).toHaveBeenCalledWith(200);
      expect(response.json).toHaveBeenCalledWith({
        response_type: 'ephemeral',
        text: '사용법: /변수명 [한글로 된 입력값]',
      });
    });

    it('should process user input and send a response', async () => {
      const request = {
        body: {
          user_id: 'test-user-id',
          user_name: 'test-user-name',
          command: '/변수명',
          text: '사용자 권한 변경',
        },
      } as Request;

      const response = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        send: jest.fn(),
      } as unknown as Response;

      (slackService.processUserInput as jest.Mock).mockResolvedValue(undefined);

      await slackController.handleSlashCommand(request, response);

      expect(response.status).toHaveBeenCalledWith(200);
      expect(response.send).toHaveBeenCalled();

      expect(slackService.processUserInput).toHaveBeenCalledWith(
        '사용자 권한 변경',
        'test-user-id',
        'test-user-name',
      );
    });

    it('should handle errors during user input processing', async () => {
      const error = new Error('Test error');
      (slackService.processUserInput as jest.Mock).mockRejectedValue(error);

      const request = {
        body: {
          user_id: 'test-user-id',
          user_name: 'test-user-name',
          command: '/변수명',
          text: '사용자 권한 변경',
        },
      } as Request;

      const response = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        send: jest.fn(),
      } as unknown as Response;

      await slackController.handleSlashCommand(request, response);

      expect(response.status).toHaveBeenCalledWith(200);
      expect(response.send).toHaveBeenCalled();

      expect(slackService.sendErrorMessage).toHaveBeenCalledWith(
        'test-user-id',
        ':slightly_frowning_face: 뭔가 문제가 발생했어요. 서버 로그를 확인해주세요.',
      );
    });
  });

  describe('handleInteractions', () => {
    it('should handle block actions', async () => {
      const request = {
        body: {
          payload: JSON.stringify({
            type: 'block_actions',
            user: { id: 'test-user-id' },
            message: { ts: '1718769644.269369', blocks: [] },
            actions: [{ action_id: 'like_button' }],
          }),
        },
      } as Request;

      const response = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
      } as unknown as Response;

      (slackService.handleFeedback as jest.Mock).mockResolvedValue(undefined);

      await slackController.handleInteractions(request, response);

      expect(slackService.handleFeedback).toHaveBeenCalledWith(
        'like_button',
        'test-user-id',
        '1718769644.269369',
        [],
      );

      expect(response.status).toHaveBeenCalledWith(200);
      expect(response.send).toHaveBeenCalled();
    });

    it('should send an error message if feedback is not found', async () => {
      (slackService.handleFeedback as jest.Mock).mockRejectedValue(
        new NotFoundException(),
      );

      const request = {
        body: {
          payload: JSON.stringify({
            type: 'block_actions',
            user: { id: 'test-user-id' },
            message: { ts: '1718769644.269369', blocks: [] },
            actions: [{ action_id: 'like_button' }],
          }),
        },
      } as Request;

      const response = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
      } as unknown as Response;

      await slackController.handleInteractions(request, response);

      expect(slackService.handleFeedback).toHaveBeenCalledWith(
        'like_button',
        'test-user-id',
        '1718769644.269369',
        [],
      );

      expect(slackService.sendErrorMessage).toHaveBeenCalledWith(
        'test-user-id',
        ':slightly_frowning_face: 이 메세지에 대한 정보를 찾을 수 없습니다.',
        '1718769644.269369',
      );

      expect(response.status).toHaveBeenCalledWith(200);
      expect(response.send).toHaveBeenCalled();
    });
  });
});
