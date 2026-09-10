export interface ScheduledPost {
  id: string;
  content_blocks: Array<{ content: string; type: string }>;
  channel: string;
  scheduled_time: string;
  status: string;
  created_at: string;
}

export type ViewMode = 'list' | 'calendar';

export interface NewPostFormState {
  content: string;
  channel: string;
  date: Date;
  time: string;
  optimize_time: boolean;
  reminder: boolean;
}

export const CHANNEL_COLORS: Record<string, string> = {
  linkedin: 'bg-blue-500',
  x: 'bg-gray-800 dark:bg-gray-200',
  twitter: 'bg-sky-400',
  blog: 'bg-orange-500',
  facebook: 'bg-blue-700',
  instagram: 'bg-pink-500',
};

export const getChannelLabel = (channel: string) => {
  const map: Record<string, string> = {
    linkedin: 'LinkedIn',
    x: 'X (Twitter)',
    blog: 'Blog',
    twitter: 'Twitter',
    facebook: 'Facebook',
    instagram: 'Instagram',
  };
  return map[channel] ?? channel;
};

export const getContentPreview = (post: ScheduledPost) =>
  Array.isArray(post.content_blocks) && post.content_blocks.length > 0
    ? post.content_blocks[0].content || 'No content'
    : 'No content';
