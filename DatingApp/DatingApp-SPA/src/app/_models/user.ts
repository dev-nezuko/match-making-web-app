import { Photo } from './photo';

export interface User {
  id: number;
  username: string;
  knownAs: string;
  age: number;
  gender: string;
  created: string;
  lastActive: string;
  photoUrl: string | null;
  city: string;
  country: string;
  interests?: string | null;
  introduction?: string | null;
  lookingFor?: string | null;
  photos?: Photo[];
}

export interface ProfileUpdate {
  introduction: string;
  lookingFor: string;
  interests: string;
  city: string;
  country: string;
}

export interface Registration {
  username: string;
  knownAs: string;
  gender: string;
  dateOfBirth: string;
  city: string;
  country: string;
  password: string;
}
