export type UpdateFeedbackCountDto = {
  id: number;
  count: number;
  userId: string;
  column: 'likeCount' | 'dislikeCount';
};
