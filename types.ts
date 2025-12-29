
export interface CreatorLead {
  id: string;
  name: string;
  username: string;
  profileUrl: string;
  followers: string;
  bio: string;
  email: string;
  phone: string;
  category: string;
  industry: string;
  city: string;
}

export interface SearchQuery {
  role: string;
  industry: string;
  city: string;
  platform: string;
}
