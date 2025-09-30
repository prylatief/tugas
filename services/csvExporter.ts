import type { GeneratedGroup } from '../types';

const downloadCSV = (csvContent: string, filename: string) => {
  const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const escapeCsvCell = (cell: string | undefined): string => {
  if (cell === undefined || cell === null) {
    return '""';
  }
  const str = String(cell);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return `"${str}"`;
};

const formatDisplayDate = (dateString?: string): string => {
    if (!dateString) return '';
    try {
        const parts = dateString.split('-');
        if (parts.length !== 3) return dateString;
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1; // Month is 0-indexed in JS
        const day = parseInt(parts[2], 10);

        const date = new Date(year, month, day);
        if (isNaN(date.getTime())) return dateString;

        const dateOptions: Intl.DateTimeFormatOptions = {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        };

        return new Intl.DateTimeFormat('id-ID', dateOptions).format(date);
    } catch (e) {
        return dateString;
    }
};

export const exportCourseToCSV = (generated: GeneratedGroup) => {
  if (!generated) return;
  const { course, groups } = generated;
  const headers = ['Mata Kuliah', 'Judul Tugas', 'Catatan Tugas', 'Tanggal Presentasi', 'No. Kelompok', 'Nama', 'Email', 'Role'];
  let csvContent = headers.join(',') + '\r\n';

  groups.forEach((group, groupIndex) => {
    group.members.forEach(member => {
      const row = [
        course.name,
        group.assignmentTitle,
        course.assignmentNotes || '',
        formatDisplayDate(group.presentationTime),
        groupIndex + 1,
        member.student.name,
        member.student.email || '',
        member.role
      ].map(escapeCsvCell);
      csvContent += row.join(',') + '\r\n';
    });
  });

  const filename = `kelompok-${course.name.replace(/ /g, '_')}.csv`;
  downloadCSV(csvContent, filename);
};


export const exportAllToCSV = (allGenerated: GeneratedGroup[]) => {
  if (!allGenerated || allGenerated.length === 0) return;

  const headers = ['Nama', 'Email', 'Mata Kuliah', 'Judul Tugas', 'Catatan Tugas', 'Tanggal Presentasi', 'Kelompok', 'Role'];
  let csvContent = headers.join(',') + '\r\n';

  const studentMap = new Map<string, { student: any; assignments: any[] }>();

  allGenerated.forEach(generated => {
    generated.groups.forEach((group, groupIndex) => {
      group.members.forEach(member => {
        const studentKey = member.student.email || member.student.name;
        if (!studentMap.has(studentKey)) {
          studentMap.set(studentKey, { student: member.student, assignments: [] });
        }
        studentMap.get(studentKey)?.assignments.push({
          courseName: generated.course.name,
          assignmentTitle: group.assignmentTitle,
          assignmentNotes: generated.course.assignmentNotes,
          presentationTime: group.presentationTime,
          groupNumber: groupIndex + 1,
          role: member.role,
        });
      });
    });
  });

  studentMap.forEach(({ student, assignments }) => {
    assignments.forEach(assignment => {
       const row = [
          student.name,
          student.email || '',
          assignment.courseName,
          assignment.assignmentTitle,
          assignment.assignmentNotes || '',
          formatDisplayDate(assignment.presentationTime),
          assignment.groupNumber,
          assignment.role,
       ].map(escapeCsvCell);
       csvContent += row.join(',') + '\r\n';
    });
  });

  const filename = `rekap_semua_mahasiswa.csv`;
  downloadCSV(csvContent, filename);
};