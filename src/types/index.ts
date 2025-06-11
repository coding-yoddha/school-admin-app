export interface Teacher {
  id: string;
  user_id: string;
  school_id: string;
  subject_id: string;
  full_name: string;
  subject_name: string;
  is_class_teacher: boolean;
  class_assigned: string | null;
}

export interface Subject {
  id: string;
  name: string;
}
