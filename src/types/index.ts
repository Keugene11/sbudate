export interface Profile {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  age: number;
  gender: string;
  gender_preference: string;
  height_inches: number | null;
  major: string | null;
  graduation_year: number | null;
  hometown: string | null;
  dating_intention: string | null;
  religion: string | null;
  drinking: string | null;
  smoking: string | null;
  created_at: string;
  updated_at: string;
}

export interface Photo {
  id: string;
  profile_id: string;
  url: string;
  position: number;
  caption: string | null;
}

export interface Prompt {
  id: string;
  profile_id: string;
  question: string;
  answer: string;
  position: number;
}

export interface Like {
  id: string;
  from_profile_id: string;
  to_profile_id: string;
  content_type: "photo" | "prompt";
  content_id: string;
  comment: string | null;
  created_at: string;
}

export interface Match {
  id: string;
  profile1_id: string;
  profile2_id: string;
  created_at: string;
}

export interface Message {
  id: string;
  match_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  read: boolean;
}

export interface ProfileWithContent extends Profile {
  photos: Photo[];
  prompts: Prompt[];
}

export const PROMPT_OPTIONS = [
  "A life goal of mine",
  "My simple pleasures",
  "I'm looking for",
  "Typical Sunday",
  "I go crazy for",
  "My most irrational fear",
  "Two truths and a lie",
  "Change my mind about",
  "Let's debate this topic",
  "I'm weirdly attracted to",
  "The way to win me over is",
  "We'll get along if",
  "I recently discovered that",
  "I bet you can't",
  "My love language is",
  "Dating me is like",
  "You should leave a comment if",
  "Together we could",
  "The one thing I'd love to know about you is",
  "My biggest date fail",
  "Green flags I look for",
  "I want someone who",
  "My most controversial opinion",
  "I'm convinced that",
  "Believe it or not, I",
];

export const GENDER_OPTIONS = ["Man", "Woman", "Non-binary"];
export const DATING_INTENTIONS = [
  "Life partner",
  "Long-term relationship",
  "Long-term, open to short",
  "Short-term, open to long",
  "Short-term fun",
  "Figuring out my dating goals",
];
