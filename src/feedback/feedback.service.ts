import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Feedback } from './feedback.entity';
import { FeedbackUser } from './feedback-user.entity';
import { InsertNewFeedbackDto } from './dto/insert-new-feedback.dto';
import { UpdateFeedbackCountDto } from './dto/update-feedback-count.dto';

@Injectable()
export class FeedbackService {
  constructor(
    @InjectRepository(Feedback)
    private readonly feedbackRepo: Repository<Feedback>,
    @InjectRepository(FeedbackUser)
    private feedbackUserRepository: Repository<FeedbackUser>,
  ) {}

  async insertNewFeedback(dto: InsertNewFeedbackDto) {
    const { userId, messageId, inputText, responseText } = dto;
    const inserted = await this.feedbackRepo
      .createQueryBuilder()
      .insert()
      .into(Feedback)
      .values([{ userId, messageId, inputText, responseText }])
      .execute();
    return inserted.identifiers.length > 0;
  }

  async getFeedback(messageId: string) {
    return await this.feedbackRepo
      .createQueryBuilder()
      .select('feedback')
      .from(Feedback, 'feedback')
      .where('feedback.messageId = :messageId', { messageId })
      .getOne();
  }

  async updateFeedbackCount(dto: UpdateFeedbackCountDto) {
    const { id, count, userId, column } = dto;
    let updatedFeedback: Feedback;

    await this.feedbackRepo.manager.transaction(async (manager) => {
      await manager
        .createQueryBuilder()
        .update(Feedback)
        .set({ [column]: count })
        .where('id =:id', { id })
        .execute();

      updatedFeedback = await manager
        .createQueryBuilder(Feedback, 'feedback')
        .where('feedback.id = :id', { id })
        .getOne();

      await manager
        .createQueryBuilder()
        .insert()
        .into(FeedbackUser)
        .values({
          userId,
          feedback: updatedFeedback,
        })
        .execute();
    });

    return updatedFeedback;
  }

  async hasUserProvidedFeedback(feedback: Feedback, userId: string) {
    const count = await this.feedbackUserRepository
      .createQueryBuilder('feedbackUser')
      .where('feedbackUser.feedbackId = :feedbackId', {
        feedbackId: feedback.id,
      })
      .andWhere('feedbackUser.userId = :userId', { userId })
      .getCount();

    return count > 0;
  }
}
