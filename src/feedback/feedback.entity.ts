import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { FeedbackUser } from './feedback-user.entity';

@Entity()
export class Feedback {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: string;

  @Column()
  messageId: string;

  @Column({ type: 'text', name: 'input_text', comment: '사용자 입력 텍스트' })
  inputText: string;

  @Column({ type: 'text', name: 'response_text', comment: '모델 출력 결과' })
  responseText: string;

  @CreateDateColumn({
    type: 'timestamp',
    name: 'created_at',
    comment: '생성시간',
  })
  createdAt: Date;

  @Column({ name: 'like_count', default: 0, comment: '좋아요 수' })
  likeCount: number;

  @Column({ name: 'dislike_count', default: 0, comment: '싫어요 수' })
  dislikeCount: number;

  @OneToMany(() => FeedbackUser, (feedbackUser) => feedbackUser.feedback)
  feedbackUsers: FeedbackUser[];
}
