export interface Teacher {
  id: string;
  user_id: string;
  school_id: string;
  subject_id: string;
  subject_name: string;
  full_name: string;
}

export interface Subject {
  id: string;
  name: string;
}
