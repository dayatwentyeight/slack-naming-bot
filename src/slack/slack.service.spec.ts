import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { SlackService } from './slack.service';
import { AnalyzerService } from './analyzer.service';
import { FeedbackService } from '../feedback/feedback.service';
import { WebClient } from '@slack/web-api';
import { NotFoundException } from '@nestjs/common';

// Mock Slack WebClient
jest.mock('@slack/web-api', () => {
  return {
    WebClient: jest.fn().mockImplementation(() => {
      return {
        chat: {
          postEphemeral: jest.fn(),
          postMessage: jest.fn(),
          update: jest.fn(),
        },
      };
    }),
  };
});

describe('SlackService', () => {
  let slackService: SlackService;
  let configService: ConfigService;
  let feedbackService: FeedbackService;
  let analyzerService: AnalyzerService;
  let slackClientMock: jest.Mocked<WebClient>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SlackService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              switch (key) {
                case 'SLACK_API_KEY':
                  return 'test-slack-api-key';
                case 'SLACK_CHANNEL':
                  return 'test-slack-channel';
                default:
                  return;
              }
            }),
          },
        },
        {
          provide: FeedbackService,
          useValue: {
            getFeedback: jest.fn(),
            hasUserProvidedFeedback: jest.fn(),
            updateFeedbackCount: jest.fn(),
            insertNewFeedback: jest.fn(),
          },
        },
        {
          provide: AnalyzerService,
          useValue: {
            getTranslation: jest.fn(),
          },
        },
      ],
    }).compile();

    slackService = module.get<SlackService>(SlackService);
    configService = module.get<ConfigService>(ConfigService);
    feedbackService = module.get<FeedbackService>(FeedbackService);
    analyzerService = module.get<AnalyzerService>(AnalyzerService);
    slackClientMock = new WebClient() as jest.Mocked<WebClient>;

    // Mocking chat methods separately to avoid type errors
    slackClientMock.chat.postEphemeral = jest
      .fn()
      .mockResolvedValue({ ok: true });
    slackClientMock.chat.postMessage = jest
      .fn()
      .mockResolvedValue({ message: { ts: '1718769644.269369' } });
    slackClientMock.chat.update = jest.fn().mockResolvedValue({ ok: true });

    // Inject mock client
    slackService['slackClient'] = slackClientMock;
  });

  describe('toCamelCase', () => {
    it('should convert a string to camelCase', () => {
      const result = slackService['toCamelCase']('Hello World');
      expect(result).toBe('helloWorld');
    });
  });

  describe('toSnakeCase', () => {
    it('should convert a string to snake_case', () => {
      const result = slackService['toSnakeCase']('Hello World');
      expect(result).toBe('hello_world');
    });
  });

  describe('toPascalCase', () => {
    it('should convert a string to PascalCase', () => {
      const result = slackService['toPascalCase']('hello world');
      expect(result).toBe('HelloWorld');
    });
  });

  describe('sendErrorMessage', () => {
    it('should send an ephemeral message with the given text', async () => {
      await slackService.sendErrorMessage(
        'test-user',
        'Test Error message',
        '1718769644.269369',
      );

      expect(slackClientMock.chat.postEphemeral).toHaveBeenCalledWith({
        channel: 'test-slack-channel',
        user: 'test-user',
        text: 'Test Error message  <https://slack.com/archives/test-slack-channel/p1718769644269369|메세지 보기>',
      });
    });
  });

  describe('processUserInput', () => {
    it('should process user input and send a message', async () => {
      const inputText = '사용자 권한 변경';
      const responseText = 'Change User Permission';

      // Mock analyzer result
      (analyzerService.getTranslation as jest.Mock).mockResolvedValue(
        responseText,
      );

      await slackService.processUserInput(
        inputText,
        'test-user-id',
        'test-user-name',
      );

      expect(analyzerService.getTranslation).toHaveBeenCalledWith(inputText);
      expect(slackClientMock.chat.postMessage).toHaveBeenCalledWith({
        channel: 'test-slack-channel',
        text: `@test-user-name '${inputText}'에 대한 변수명 추천 결과입니다.`,
        blocks: expect.any(Array),
      });
      expect(feedbackService.insertNewFeedback).toHaveBeenCalledWith({
        userId: 'test-user-id',
        messageId: '1718769644.269369',
        inputText,
        responseText,
      });
    });
  });

  describe('handleFeedback', () => {
    it('should handle feedback and update the message', async () => {
      const feedback = {
        id: 1,
        messageId: '1718769644.269369',
        likeCount: 0,
        dislikeCount: 0,
      };

      // Mock Feedback Service methods
      (feedbackService.getFeedback as jest.Mock).mockResolvedValue(feedback);
      (feedbackService.hasUserProvidedFeedback as jest.Mock).mockResolvedValue(
        false,
      );
      (feedbackService.updateFeedbackCount as jest.Mock).mockResolvedValue({
        ...feedback,
        likeCount: 1,
      });

      await slackService.handleFeedback(
        'like_button',
        'test-user-id',
        '1718769644.269369',
        [],
      );

      expect(feedbackService.getFeedback).toHaveBeenCalledWith(
        feedback.messageId,
      );
      expect(feedbackService.hasUserProvidedFeedback).toHaveBeenCalledWith(
        feedback,
        'test-user-id',
      );
      expect(feedbackService.updateFeedbackCount).toHaveBeenCalledWith({
        id: 1,
        count: 1,
        userId: 'test-user-id',
        column: 'likeCount',
      });
      expect(slackClientMock.chat.update).toHaveBeenCalledWith({
        channel: 'test-slack-channel',
        ts: '1718769644.269369',
        blocks: expect.any(Array),
      });
    });

    it('should throw NotFoundException if feedback is not found', async () => {
      (feedbackService.getFeedback as jest.Mock).mockResolvedValue(null);

      await expect(
        slackService.handleFeedback(
          'like_button',
          'test-user-id',
          '123.456',
          [],
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should send an error message if user has already provided feedback', async () => {
      const feedback = {
        id: 1,
        messageId: '123.456',
        likeCount: 0,
        dislikeCount: 0,
      };
      (feedbackService.getFeedback as jest.Mock).mockResolvedValue(feedback);
      (feedbackService.hasUserProvidedFeedback as jest.Mock).mockResolvedValue(
        true,
      );

      await slackService.handleFeedback(
        'like_button',
        'test-user-id',
        '1718769644.269369',
        [],
      );

      expect(slackClientMock.chat.postEphemeral).toHaveBeenCalledWith({
        channel: 'test-slack-channel',
        user: 'test-user-id',
        text: ':thinking_face: 이미 이 메세지에 대한 피드백을 보내셨어요.  <https://slack.com/archives/test-slack-channel/p1718769644269369|메세지 보기>',
      });
    });
  });
});
