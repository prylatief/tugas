import React, { useState } from 'react';
import type { Student, Course, GeneratedGroup, Member, Group } from '../types';
import { PlusIcon, TrashIcon, ResetIcon, DownloadIcon, LogoutIcon, SortIcon, GenerateIcon } from './Icons';
import { exportCourseToCSV, exportAllToCSV } from '../services/csvExporter';
import { parseAndGenerateGroups } from '../services/groupGenerator';

const GroupGeneratorModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    courses: Course[];
    onGenerate: (text: string, courseId: string) => void;
}> = ({ isOpen, onClose, courses, onGenerate }) => {
    if (!isOpen) return null;

    const [text, setText] = useState('');
    const [targetCourseId, setTargetCourseId] = useState('');

    const handleSubmit = () => {
        if (!targetCourseId) {
            alert('Silakan pilih mata kuliah tujuan.');
            return;
        }
        if (!text.trim()) {
            alert('Silakan masukkan teks pembagian kelompok.');
            return;
        }
        onGenerate(text, targetCourseId);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 transition-opacity duration-300">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-2xl transform transition-all">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">Generate Kelompok dari Teks</h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white text-2xl font-bold">&times;</button>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    Tempel teks pembagian kelompok. Pastikan formatnya benar: Judul tugas di baris pertama, diikuti nama anggota di baris-baris berikutnya. Pisahkan setiap kelompok dengan baris kosong.
                </p>
                <div className="mb-4">
                    <label htmlFor="course-select" className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Pilih Mata Kuliah Tujuan</label>
                    <select
                        id="course-select"
                        value={targetCourseId}
                        onChange={e => setTargetCourseId(e.target.value)}
                        className="w-full p-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-primary-500 focus:border-primary-500"
                    >
                        <option value="">-- Pilih Mata Kuliah --</option>
                        {courses.map(course => (
                            <option key={course.id} value={course.id}>{course.name}</option>
                        ))}
                    </select>
                </div>
                <textarea
                    className="w-full h-64 p-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-primary-500 focus:border-primary-500 transition"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Contoh:&#10;- Materi 1 : Judul Tugas Pertama&#10;Nama Mahasiswa A&#10;Nama Mahasiswa B&#10;&#10;- Materi 2 : Judul Tugas Kedua&#10;Nama Mahasiswa C&#10;..."
                />
                <div className="flex justify-end gap-3 mt-4">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 transition">Batal</button>
                    <button onClick={handleSubmit} className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition" disabled={!targetCourseId || !text.trim()}>Generate</button>
                </div>
            </div>
        </div>
    );
};


interface AdminPanelProps {
  studentsString: string;
  setStudentsString: (value: string) => void;
  students: Student[];
  courses: Course[];
  generatedData: GeneratedGroup[];
  handleReset: () => void;
  handleLogout: () => void;
  addCourse: () => Promise<void>;
  removeCourse: (id: string) => Promise<void>;
  handleCourseChange: (id: string, field: keyof Omit<Course, 'id'>, value: string) => Promise<void>;
  updateGeneratedData: (courseId: string, updatedGroups: Group[]) => Promise<void>;
}

const MemberAdder: React.FC<{
    courseId: string;
    groupIndex: number;
    students: Student[];
    assignedStudentNames: Set<string>;
    groups: Group[];
    updateGeneratedData: (courseId: string, updatedGroups: Group[]) => Promise<void>;
}> = ({ courseId, groupIndex, students, assignedStudentNames, groups, updateGeneratedData }) => {
    const [selectedStudentName, setSelectedStudentName] = useState('');

    const addMember = async () => {
        if (!selectedStudentName) {
            alert("Silakan pilih anggota untuk ditambahkan.");
            return;
        }

        const studentToAdd = students.find(s => s.name === selectedStudentName);

        if (!studentToAdd || assignedStudentNames.has(studentToAdd.name)) {
            alert("Mahasiswa ini sudah ada di kelompok lain atau tidak valid.");
            setSelectedStudentName(''); // Reset selection on error
            return;
        }

        const updatedGroups = [...groups];
        const newMember: Member = { student: studentToAdd, role: 'Anggota' };
        updatedGroups[groupIndex].members.push(newMember);

        await updateGeneratedData(courseId, updatedGroups);
        setSelectedStudentName(''); // Reset selection after adding
    };

    const availableStudents = students.filter(s => !assignedStudentNames.has(s.name));
    const assignedStudents = students.filter(s => assignedStudentNames.has(s.name));

    return (
        <div className="flex gap-2 mt-2">
            <select
                value={selectedStudentName}
                onChange={e => setSelectedStudentName(e.target.value)}
                className="flex-grow p-1 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md"
            >
                <option value="">-- Pilih Anggota --</option>
                
                {availableStudents.length > 0 && (
                    <optgroup label="Tersedia">
                        {availableStudents.map(student => (
                            <option key={student.name} value={student.name}>
                                {student.name}
                            </option>
                        ))}
                    </optgroup>
                )}
                
                {assignedStudents.length > 0 && (
                    <optgroup label="Sudah Ditugaskan">
                        {assignedStudents.map(student => (
                            <option key={student.name} value={student.name} disabled>
                                {student.name}
                            </option>
                        ))}
                    </optgroup>
                )}
            </select>
            <button
                onClick={addMember}
                disabled={!selectedStudentName}
                className="px-2 py-1 text-xs bg-green-600 text-white rounded-md hover:bg-green-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
                Tambah
            </button>
        </div>
    );
};


const AdminPanel: React.FC<AdminPanelProps> = ({
  studentsString,
  setStudentsString,
  students,
  courses,
  generatedData,
  handleReset,
  handleLogout,
  addCourse,
  removeCourse,
  handleCourseChange,
  updateGeneratedData,
}) => {
  const [isGeneratorModalOpen, setIsGeneratorModalOpen] = useState(false);

  const handleGenerateFromText = (text: string, courseId: string) => {
    const { newGroups, notFoundNames } = parseAndGenerateGroups(text, students);

    if (notFoundNames.length > 0) {
        alert(`Peringatan: Mahasiswa berikut tidak ditemukan dan dilewati:\n\n- ${notFoundNames.join('\n- ')}\n\nSilakan periksa ejaan nama di Daftar Mahasiswa.`);
    }

    if (newGroups.length === 0) {
        alert("Tidak ada kelompok valid yang bisa dibuat dari teks yang diberikan. Periksa format Anda.");
        return;
    }

    const courseName = courses.find(c => c.id === courseId)?.name || 'Mata Kuliah';
    
    if (window.confirm(`Anda akan membuat ${newGroups.length} kelompok untuk mata kuliah "${courseName}". Ini akan MENGGANTI semua kelompok yang sudah ada. Lanjutkan?`)) {
        updateGeneratedData(courseId, newGroups);
        setIsGeneratorModalOpen(false);
        alert('Kelompok berhasil dibuat!');
    }
  };

  const handleRoleChange = (courseId: string, groups: Group[], groupIndex: number, memberIndex: number, newRole: string) => {
      const updatedGroups = groups.map((group, gIdx) =>
          gIdx !== groupIndex
            ? group
            : {
                ...group,
                members: group.members.map((member, mIdx) =>
                    mIdx !== memberIndex
                    ? member
                    : { ...member, role: newRole }
                )
              }
      );
      updateGeneratedData(courseId, updatedGroups);
  };
  
  const handleGroupTitleChange = (courseId: string, groups: Group[], groupIndex: number, newTitle: string) => {
      const updatedGroups = groups.map((group, gIdx) =>
          gIdx !== groupIndex
            ? group
            : { ...group, assignmentTitle: newTitle }
      );
      updateGeneratedData(courseId, updatedGroups);
  };

  const handleGroupPresentationTimeChange = (courseId: string, groups: Group[], groupIndex: number, newTime: string) => {
      const updatedGroups = groups.map((group, gIdx) =>
          gIdx !== groupIndex
            ? group
            : { ...group, presentationTime: newTime }
      );
      updateGeneratedData(courseId, updatedGroups);
  };

  const addGroup = (courseId: string, groups: Group[]) => {
    const newGroup: Group = { id: Date.now().toString(), assignmentTitle: '', presentationTime: '', members: [] };
    const updatedGroups = [...groups, newGroup];
    updateGeneratedData(courseId, updatedGroups);
  };

  const removeGroup = (courseId: string, groups: Group[], groupIndex: number) => {
      if (!window.confirm(`Yakin ingin menghapus Kelompok ${groupIndex + 1}?`)) return;
      const updatedGroups = groups.filter((_, idx) => idx !== groupIndex);
      updateGeneratedData(courseId, updatedGroups);
  };
  
  const removeMember = (courseId: string, groups: Group[], groupIndex: number, memberIndex: number) => {
       const updatedGroups = [...groups];
       updatedGroups[groupIndex].members.splice(memberIndex, 1);
       updateGeneratedData(courseId, updatedGroups);
  }

  const parsePresentationTime = (timeStr: string | undefined): Date | null => {
    if (!timeStr) return null;
    const date = new Date(timeStr);
    return isNaN(date.getTime()) ? null : date;
  };

  const handleSortGroups = (courseId: string, groups: Group[]) => {
      const sortedGroups = [...groups].sort((a, b) => {
          const timeA = parsePresentationTime(a.presentationTime);
          const timeB = parsePresentationTime(b.presentationTime);

          if (!timeA && !timeB) return 0;
          if (!timeA) return 1;
          if (!timeB) return -1;

          return timeA.getTime() - timeB.getTime();
      });
      updateGeneratedData(courseId, sortedGroups);
  };


  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-2xl h-full flex flex-col">
      {/* Sticky Header */}
      <div>
        <div className="flex justify-between items-start mb-6">
          <h2 className="text-3xl font-bold text-primary-600 dark:text-primary-400">Admin Dashboard</h2>
          <div className="flex items-center gap-2">
            <button onClick={handleReset} title="Reset Semua Data" className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition">
              <ResetIcon /> Reset
            </button>
             <button onClick={handleLogout} title="Logout" className="flex items-center px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition">
              <LogoutIcon /> Logout
            </button>
          </div>
        </div>
        
        <div className="mb-6">
          <label className="block text-xl font-semibold text-gray-700 dark:text-gray-200 mb-2">Daftar Mahasiswa</label>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Daftar mahasiswa disimpan otomatis. Format: `Nama,NIM`.</p>
          <textarea
            className="w-full h-40 p-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-primary-500 focus:border-primary-500 transition"
            value={studentsString}
            onChange={(e) => setStudentsString(e.target.value)}
          />
        </div>
      </div>
      
      <div className="flex-grow overflow-y-auto -mr-4 pr-4">
        <div className="mb-6">
          <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-3">Daftar Mata Kuliah</h3>
          <div className="space-y-4">
            {courses.map((course) => (
              <div key={course.id} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-2 items-center">
                    <input
                      type="text"
                      placeholder="Nama Mata Kuliah"
                      value={course.name}
                      onChange={(e) => handleCourseChange(course.id, 'name', e.target.value)}
                      className="col-span-12 md:col-span-11 p-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md"
                    />
                    <button onClick={() => removeCourse(course.id)} className="col-span-12 md:col-span-1 flex justify-center items-center text-red-500 hover:text-red-700 dark:hover:text-red-400 transition">
                      <TrashIcon />
                    </button>
                </div>
                <textarea
                    placeholder="Catatan khusus untuk tugas mata kuliah ini..."
                    value={course.assignmentNotes || ''}
                    onChange={(e) => handleCourseChange(course.id, 'assignmentNotes', e.target.value)}
                    className="w-full h-20 p-2 mt-2 text-sm bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md"
                />
              </div>
            ))}
          </div>
          <button onClick={addCourse} className="mt-4 flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition">
            <PlusIcon /> Tambah Matkul
          </button>
        </div>

        {generatedData.length > 0 && (
          <div>
             <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4 flex justify-between items-center">
                <span>Pengaturan Kelompok</span>
                <button 
                  onClick={() => setIsGeneratorModalOpen(true)} 
                  className="flex items-center text-sm px-3 py-1.5 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 rounded-full hover:bg-green-200 dark:hover:bg-green-800 transition"
                >
                  <GenerateIcon /> Generate Otomatis
                </button>
              </h3>
            <div className="flex flex-wrap gap-2 mb-4">
              {generatedData.map((data) => (
                  <button key={data.course.id} onClick={() => exportCourseToCSV(data)} className="flex items-center text-sm px-3 py-1.5 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 rounded-full hover:bg-blue-200 dark:hover:bg-blue-800 transition">
                      <DownloadIcon /> Export {data.course.name}
                  </button>
              ))}
              <button onClick={() => exportAllToCSV(generatedData)} className="flex items-center text-sm px-3 py-1.5 bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300 rounded-full hover:bg-purple-200 dark:hover:bg-purple-800 transition">
                  <DownloadIcon /> Export Rekap Semua
              </button>
            </div>
            <div className="space-y-6">
              {generatedData.map((data) => {
                if (!courses.find(c => c.id === data.course.id)) return null;

                const assignedStudentNames = new Set(data.groups.flatMap(g => g.members).map(m => m.student.name));
                
                return (
                <div key={data.course.id} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <div className="flex justify-between items-center mb-3">
                      <h4 className="text-xl font-semibold">{data.course.name}</h4>
                      <div className="flex items-center gap-2">
                          <button onClick={() => handleSortGroups(data.course.id, data.groups)} className="flex items-center px-3 py-1 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 text-sm rounded-md hover:bg-indigo-200 dark:hover:bg-indigo-900 transition">
                              <SortIcon /> Urutkan
                          </button>
                          <button onClick={() => addGroup(data.course.id, data.groups)} className="flex items-center px-3 py-1 bg-gray-200 dark:bg-gray-600 text-sm rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 transition">
                              <PlusIcon/> Kelompok
                          </button>
                      </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {data.groups.map((group, groupIndex) => (
                      <div key={group.id} className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        <div className="flex justify-between items-center mb-2">
                          <h5 className="font-bold">Kelompok {groupIndex + 1}</h5>
                          <button onClick={() => removeGroup(data.course.id, data.groups, groupIndex)} className="text-red-500 hover:text-red-700 text-xs">
                              <TrashIcon/>
                          </button>
                        </div>
                         <input
                            type="text"
                            placeholder="Judul Tugas Kelompok"
                            value={group.assignmentTitle}
                            onChange={(e) => handleGroupTitleChange(data.course.id, data.groups, groupIndex, e.target.value)}
                            className="w-full p-1.5 mb-2 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md"
                        />
                        <input
                            type="date"
                            value={group.presentationTime || ''}
                            onChange={(e) => handleGroupPresentationTimeChange(data.course.id, data.groups, groupIndex, e.target.value)}
                            className="w-full p-1.5 mb-3 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md"
                        />
                        <ul className="space-y-2 mb-3">
                          {group.members.map((member, memberIndex) => (
                            <li key={`${member.student.name}-${memberIndex}`} className="flex items-center justify-between gap-2 text-sm">
                              <span className="flex-grow truncate">{member.student.name}</span>
                              <input
                                type="text"
                                value={member.role}
                                onChange={(e) => handleRoleChange(data.course.id, data.groups, groupIndex, memberIndex, e.target.value)}
                                className="p-1 w-24 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md"
                              />
                              <button onClick={() => removeMember(data.course.id, data.groups, groupIndex, memberIndex)} className="text-gray-400 hover:text-red-500">
                                  &#x2715;
                              </button>
                            </li>
                          ))}
                        </ul>
                        <MemberAdder 
                            courseId={data.course.id} 
                            groupIndex={groupIndex} 
                            students={students} 
                            assignedStudentNames={assignedStudentNames}
                            groups={data.groups} 
                            updateGeneratedData={updateGeneratedData} 
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )})}
            </div>
          </div>
        )}
      </div>
      <GroupGeneratorModal
          isOpen={isGeneratorModalOpen}
          onClose={() => setIsGeneratorModalOpen(false)}
          courses={courses}
          onGenerate={handleGenerateFromText}
      />
    </div>
  );
};

export default AdminPanel;