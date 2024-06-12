import { Entity, Column, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';
import { Feedback } from './feedback.entity';

@Entity()
export class FeedbackUser {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: string;

  @ManyToOne(() => Feedback, (feedback) => feedback.feedbackUsers, {
    onDelete: 'CASCADE',
  })
  feedback: Feedback;
}
