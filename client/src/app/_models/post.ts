import { PostPhoto } from './post-photo';

export interface Post {
  id: number;
  content: string;
  createdAt: Date;
  updatedAt?: Date;
  username: string;
  userPhotoUrl: string;
  likeCount?: number; 
  isLiked?: boolean;
  photos?: PostPhoto[];
  commentCount?: number;
}
