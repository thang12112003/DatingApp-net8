export interface Comment {
  id: number;
  content: string;
  createdAt: Date;
  postId: number;
  username: string;
  userPhotoUrl: string;
}
