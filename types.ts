
export interface Student {
  name: string;
  email?: string;
}

export interface Course {
  id: string;
  name: string;
}

export interface Member {
  student: Student;
  role: string;
}

export interface Group {
  id: string;
  assignmentTitle: string;
  presentationTime?: string;
  members: Member[];
}

export interface GeneratedGroup {
  course: Course;
  groups: Group[];
}