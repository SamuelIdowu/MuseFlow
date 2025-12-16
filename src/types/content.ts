export type ContentCategory =
    | 'Social Posts'
    | 'Articles & Blogs'
    | 'Scripts'
    | 'Copywriting'
    | 'Technical & Professional';

export interface ContentType {
    id: string;
    label: string;
    category: ContentCategory;
    description?: string;
}

export const CONTENT_TYPES: ContentType[] = [
    { id: 'social_post', label: 'Social Posts (Short-form updates)', category: 'Social Posts' },
    { id: 'article_blog', label: 'Articles & Blogs (Long-form educational)', category: 'Articles & Blogs' },
    { id: 'script', label: 'Scripts (Spoken content)', category: 'Scripts' },
    { id: 'copywriting', label: 'Copywriting (Sales & Persuasion)', category: 'Copywriting' },
    { id: 'technical_doc', label: 'Technical & Professional (Formal documentation)', category: 'Technical & Professional' },
];

export const CATEGORIES: ContentCategory[] = [
    'Social Posts',
    'Articles & Blogs',
    'Scripts',
    'Copywriting',
    'Technical & Professional'
];
