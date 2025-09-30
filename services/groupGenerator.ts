import type { Student, Group, Member } from '../types';

// Helper to find a student by name, case-insensitively and trimming whitespace.
const findStudent = (name: string, allStudents: Student[]): Student | undefined => {
  const normalizedName = name.trim().toLowerCase();
  return allStudents.find(s => s.name.trim().toLowerCase() === normalizedName);
};

export const parseAndGenerateGroups = (text: string, allStudents: Student[]): { newGroups: Group[], notFoundNames: string[] } => {
  const newGroups: Group[] = [];
  const notFoundNames: string[] = [];

  // Split the text into blocks based on one or more empty lines.
  const blocks = text.trim().split(/\n\s*\n/);

  for (const block of blocks) {
    const lines = block.trim().split('\n').map(line => line.trim()).filter(Boolean);
    if (lines.length < 2) continue; // A block needs at least a title and one member.

    const titleLine = lines.shift()!;
    // Extract title, removing prefixes like "- Materi X :"
    const titleMatch = titleLine.match(/.*:\s*(.*)/);
    const assignmentTitle = titleMatch ? titleMatch[1].trim() : titleLine.trim();

    const members: Member[] = [];
    for (const studentName of lines) {
      const student = findStudent(studentName, allStudents);
      if (student) {
        members.push({ student, role: 'Anggota' });
      } else {
        notFoundNames.push(studentName);
      }
    }

    if (members.length > 0) {
      newGroups.push({
        id: `${Date.now()}-${newGroups.length}`,
        assignmentTitle,
        members,
        presentationTime: '',
      });
    }
  }

  return { newGroups, notFoundNames };
};
