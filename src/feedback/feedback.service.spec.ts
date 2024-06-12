import { Test, TestingModule } from '@nestjs/testing';
import { FeedbackService } from './feedback.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { Feedback } from './feedback.entity';
import { FeedbackUser } from './feedback-user.entity';
import { UpdateFeedbackCountDto } from './dto/update-feedback-count.dto';

const mockQueryBuilder = {
  insert: jest.fn().mockReturnThis(),
  into: jest.fn().mockReturnThis(),
  values: jest.fn().mockReturnThis(),
  execute: jest.fn(),
  select: jest.fn().mockReturnThis(),
  from: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  andWhere: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  set: jest.fn().mockReturnThis(),
  getOne: jest.fn(),
  getCount: jest.fn(),
};

const mockRepository = () => ({
  createQueryBuilder: jest.fn(() => mockQueryBuilder),
  manager: {
    transaction: jest.fn(),
  },
});

describe('FeedbackService', () => {
  let service: FeedbackService;
  let feedbackRepo;
  let feedbackUserRepo;
  let manager: EntityManager;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FeedbackService,
        {
          provide: getRepositoryToken(Feedback),
          useFactory: mockRepository,
        },
        {
          provide: getRepositoryToken(FeedbackUser),
          useFactory: mockRepository,
        },
        {
          provide: EntityManager,
          useValue: {
            transaction: jest.fn(),
            createQueryBuilder: jest.fn(() => mockQueryBuilder),
          },
        },
      ],
    }).compile();

    service = module.get<FeedbackService>(FeedbackService);
    feedbackRepo = module.get<Repository<Feedback>>(
      getRepositoryToken(Feedback),
    );
    feedbackUserRepo = module.get<Repository<FeedbackUser>>(
      getRepositoryToken(FeedbackUser),
    );
    manager = module.get<EntityManager>(EntityManager);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('insertNewFeedback', () => {
    it('should insert a new feedback', async () => {
      const dto = {
        userId: 'USERID0001',
        messageId: '1718769644.269369',
        inputText: '사용자 권한 변경',
        responseText: 'Change user permission',
      };
      mockQueryBuilder.execute.mockResolvedValueOnce({
        identifiers: [{ id: 1 }],
      });

      const result = await service.insertNewFeedback(dto);

      expect(feedbackRepo.createQueryBuilder).toHaveBeenCalled();
      expect(result).toBe(true);
    });
  });

  describe('getFeedback', () => {
    it('should return feedback for a given messageId', async () => {
      const feedback = {
        id: 1,
        messageId: '1718769644.269369',
        inputText: '사용자 권한 변경',
        responseText: 'Change user permission',
      };
      mockQueryBuilder.getOne.mockResolvedValueOnce(feedback);

      const result = await service.getFeedback('message1');

      expect(feedbackRepo.createQueryBuilder).toHaveBeenCalled();
      expect(result).toEqual(feedback);
    });
  });

  describe('updateFeedbackCount', () => {
    it('should update feedback count and return updated feedback', async () => {
      const dto: UpdateFeedbackCountDto = {
        id: 1,
        count: 10,
        userId: 'USERID0001',
        column: 'likeCount',
      };
      const feedback = {
        id: 1,
        messageId: '1718769644.269369',
        inputText: '사용자 권한 변경',
        responseText: 'Change user permission',
        likeCount: 10,
      };

      feedbackRepo.manager.transaction.mockImplementationOnce(
        async (cb: any) => {
          await cb(manager);
        },
      );

      mockQueryBuilder.getOne.mockResolvedValueOnce(feedback);

      const result = await service.updateFeedbackCount(dto);

      expect(feedbackRepo.manager.transaction).toHaveBeenCalled();
      expect(result).toEqual(feedback);
    });
  });

  describe('hasUserProvidedFeedback', () => {
    // Mock a feedback in database
    const feedback: Feedback = {
      id: 1,
      messageId: '1718769644.269369',
      inputText: '사용자 권한 변경',
      responseText: 'Change user permission',
      likeCount: 1,
      dislikeCount: 0,
      userId: 'USERID0001',
      createdAt: new Date(),
      feedbackUsers: [],
    };

    it('should return true if user has provided feedback', async () => {
      mockQueryBuilder.getCount.mockResolvedValueOnce(1);

      const result = await service.hasUserProvidedFeedback(
        feedback,
        'USERID0001',
      );

      expect(feedbackUserRepo.createQueryBuilder).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should return false if user has not provided feedback', async () => {
      mockQueryBuilder.getCount.mockResolvedValueOnce(0);

      const result = await service.hasUserProvidedFeedback(
        feedback,
        'USERID0001',
      );

      expect(feedbackUserRepo.createQueryBuilder).toHaveBeenCalled();
      expect(result).toBe(false);
    });
  });
});
