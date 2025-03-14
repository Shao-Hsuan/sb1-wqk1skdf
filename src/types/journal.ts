export interface JournalEntry {
  id: string;
  title: string;
  content: string;
  media_urls: string[];
  text_collects?: Array<{
    type: 'text' | 'link';
    content: string;
    title?: string;
    preview_image?: string;
  }>;
  created_at: string;
  goal_id: string;
  user_id: string;
  collect_id?: string;
  letter_id?: string;
  letter?: {
    id: string;
    title: string;
    content: string;
    reflection_question: string;
  } | null;
}

export interface CreateJournalEntry {
  title: string;
  content: string;
  media_urls: string[];
  text_collects?: Array<{
    type: 'text' | 'link';
    content: string;
    title?: string;
    preview_image?: string;
  }>;
  goal_id: string;
  collect_id?: string;
  letter_id?: string;
}