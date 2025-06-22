export interface Teacher {
  id: string;
  user_id: string;
  school_id: string;
  full_name: string;
  is_class_teacher: boolean;
  class_assigned: string | null;
}

export interface Subject {
  id: string;
  name: string;
}

export interface School {
  id: string;
  name: string;
}

export interface UserMetadata {
  full_name: string;
  roles: string[];
  school_id: string | null;
}
