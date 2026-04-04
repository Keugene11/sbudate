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
  residence_hall: string | null;
  ethnicity: string | null;
  ethnicity_preference: string[] | null;
  religion: string | null;
  drinking: string | null;
  smoking: string | null;
  is_paused: boolean;
  is_premium: boolean;
  stripe_customer_id: string | null;
  status: "pending" | "approved" | "rejected";
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

export const RESIDENCE_HALLS = {
  "Eleanor Roosevelt": ["Greeley Hall", "Keller Hall", "Stimson Hall", "Wagner Hall"],
  "H Community": ["Benedict North", "Benedict South", "James Hall", "Langmuir Hall"],
  "Mendelsohn": ["Ammann Hall", "Gray Hall", "Irving Hall", "O'Neill Hall"],
  "Kelly": ["Baruch Hall", "Dewey Hall", "Eisenhower Hall", "Hamilton Hall", "Schick Hall"],
  "Roth": ["Cardozo Hall", "Gershwin Hall", "Hendrix Hall", "Mount Hall", "Whitman Hall"],
  "Tabler": ["Chinn Hall", "Douglass Hall", "Dreiser Hall", "Hand Hall", "Toscanini Hall"],
  "Apartments": ["West Apartments", "Chapin Apartments", "Schomburg Apartments"],
  "Other": ["Off Campus"],
};

export const SBU_MAJORS = [
  "Accounting",
  "Africana Studies",
  "Anthropology",
  "Applied Mathematics & Statistics",
  "Art History & Criticism",
  "Art, Studio",
  "Asian & Asian American Studies",
  "Astronomy/Planetary Sciences",
  "Atmospheric and Oceanic Sciences",
  "Biochemistry",
  "Biology",
  "Biomedical Engineering",
  "Black Heritage Studies",
  "Business Management",
  "Chemical & Molecular Engineering",
  "Chemistry",
  "China Studies",
  "Civil Engineering",
  "Classics",
  "Climate Science",
  "Climate Solutions",
  "Clinical Laboratory Sciences",
  "Coastal Environmental Studies",
  "Communication",
  "Computer Engineering",
  "Computer Science",
  "Creative Writing",
  "Data Science",
  "Digital Arts",
  "Earth & Space Sciences",
  "Economics",
  "Education",
  "Electrical Engineering",
  "Engineering Chemistry",
  "Engineering Science",
  "English",
  "Environmental Design, Policy & Planning",
  "Environmental Engineering",
  "Environmental Studies",
  "Ethnomusicology",
  "Film and Screen Studies",
  "Filmmaking",
  "French Language and Literature",
  "Geology",
  "Geospatial Science",
  "Globalization Studies & International Relations",
  "Health Science",
  "Health, Medicine & Society",
  "Hellenic Studies",
  "History",
  "History of Health, Science & the Environment",
  "Human Evolutionary Biology",
  "Information Systems",
  "Italian American Studies",
  "Italian Studies",
  "Japanese Studies",
  "Jazz",
  "Journalism",
  "Judaic Studies",
  "Korean Studies",
  "Latin American & Caribbean Studies",
  "Linguistics",
  "Manufacturing Engineering",
  "Marine Sciences",
  "Marine Vertebrate Biology",
  "Mass Communication",
  "Materials Science",
  "Mathematics",
  "Mechanical Engineering",
  "Media/Art/Culture",
  "Middle Eastern Studies",
  "Multidisciplinary Studies",
  "Music",
  "Music and Technology",
  "Music Theory",
  "Nanotechnology Studies",
  "Nursing",
  "Optics",
  "Philosophy",
  "Physics",
  "Political Science",
  "Professional Writing",
  "Psychology",
  "Religious Studies",
  "Respiratory Care",
  "Rhetoric and Writing",
  "Russian Studies",
  "Social Work",
  "Sociology",
  "South Asian Studies",
  "Spanish Language and Literature",
  "Sustainability Studies",
  "Technological Systems Management",
  "Theatre Arts",
  "Women's and Gender Studies",
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

export const RELIGION_OPTIONS = [
  "Agnostic",
  "Atheist",
  "Buddhist",
  "Catholic",
  "Christian",
  "Hindu",
  "Jewish",
  "Muslim",
  "Spiritual",
  "Other",
  "Prefer not to say",
];

export const DRINKING_OPTIONS = [
  "Yes",
  "Sometimes",
  "No",
];

export const SMOKING_OPTIONS = [
  "Yes",
  "Sometimes",
  "No",
];

export const ETHNICITY_OPTIONS = [
  "Black/African American",
  "East Asian",
  "Hispanic/Latino",
  "Middle Eastern",
  "Native American",
  "Pacific Islander",
  "South Asian",
  "Southeast Asian",
  "White/Caucasian",
  "Other",
  "Prefer not to say",
];

export const REPORT_REASONS = [
  "Inappropriate photos",
  "Inappropriate messages",
  "Spam or fake profile",
  "Underage user",
  "Harassment or bullying",
  "Impersonation",
  "Other",
];

export interface Report {
  id: string;
  reporter_profile_id: string;
  reported_profile_id: string;
  reason: string;
  details: string | null;
  created_at: string;
}
