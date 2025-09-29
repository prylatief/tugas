
import React, { useState } from 'react';
import type { Student, Course, GeneratedGroup, Member, Group } from '../types';
import { PlusIcon, TrashIcon, ResetIcon, DownloadIcon, LogoutIcon } from './Icons';
import { exportCourseToCSV, exportAllToCSV } from '../services/csvExporter';

interface AdminPanelProps {
  studentsString: string;
  setStudentsString: React.Dispatch<React.SetStateAction<string>>;
  students: Student[];
  courses: Course[];
  generatedData: GeneratedGroup[];
  setGeneratedData: React.Dispatch<React.SetStateAction<GeneratedGroup[]>>;
  handleReset: () => void;
  handleLogout: () => void;
  addCourse: () => void;
  removeCourse: (id: string) => void;
  handleCourseChange: (id: string, field: keyof Omit<Course, 'id'>, value: string) => void;
}

const MemberAdder: React.FC<{
    courseIndex: number;
    groupIndex: number;
    students: Student[];
    setGeneratedData: React.Dispatch<React.SetStateAction<GeneratedGroup[]>>;
}> = ({ courseIndex, groupIndex, students, setGeneratedData }) => {
    const [selectedStudentName, setSelectedStudentName] = useState('');

    const addMember = () => {
        if (!selectedStudentName) return;
        const studentToAdd = students.find(s => s.name === selectedStudentName);
        if (!studentToAdd) return;

        setGeneratedData(prevData => {
            const newData = [...prevData];
            const newMember: Member = { student: studentToAdd, role: 'Anggota' };
            newData[courseIndex].groups[groupIndex].members.push(newMember);
            return newData;
        });
        setSelectedStudentName('');
    };

    return (
        <div className="flex gap-2 mt-2">
            <select
                value={selectedStudentName}
                onChange={e => setSelectedStudentName(e.target.value)}
                className="flex-grow p-1 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md"
            >
                <option value="">-- Pilih Anggota --</option>
                {students.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
            </select>
            <button
                onClick={addMember}
                className="px-2 py-1 text-xs bg-green-600 text-white rounded-md hover:bg-green-700 transition"
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
  setGeneratedData,
  handleReset,
  handleLogout,
  addCourse,
  removeCourse,
  handleCourseChange,
}) => {

  const handleRoleChange = (courseIndex: number, groupIndex: number, memberIndex: number, newRole: string) => {
      setGeneratedData(prevData =>
        prevData.map((courseData, cIdx) =>
          cIdx !== courseIndex
            ? courseData
            : {
                ...courseData,
                groups: courseData.groups.map((group, gIdx) =>
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
                ),
              }
        )
      );
  };
  
    const handleGroupTitleChange = (courseIndex: number, groupIndex: number, newTitle: string) => {
         setGeneratedData(prevData =>
            prevData.map((courseData, cIdx) =>
              cIdx !== courseIndex
                ? courseData
                : {
                    ...courseData,
                    groups: courseData.groups.map((group, gIdx) =>
                      gIdx !== groupIndex
                        ? group
                        : { ...group, assignmentTitle: newTitle }
                    ),
                  }
            )
         );
    };

  const addGroup = (courseIndex: number) => {
    setGeneratedData(prevData => {
        const newData = [...prevData];
        const newGroup: Group = { id: Date.now().toString(), assignmentTitle: '', members: [] };
        newData[courseIndex].groups.push(newGroup);
        return newData;
    });
  };

  const removeGroup = (courseIndex: number, groupIndex: number) => {
      if (!window.confirm(`Yakin ingin menghapus Kelompok ${groupIndex + 1}?`)) return;
      setGeneratedData(prevData => {
          const newData = [...prevData];
          newData[courseIndex].groups.splice(groupIndex, 1);
          return newData;
      });
  };
  
  const removeMember = (courseIndex: number, groupIndex: number, memberIndex: number) => {
       setGeneratedData(prevData => {
          const newData = [...prevData];
          newData[courseIndex].groups[groupIndex].members.splice(memberIndex, 1);
          return newData;
      });
  }


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
        
        {/* Student Input */}
        <div className="mb-6">
          <label className="block text-xl font-semibold text-gray-700 dark:text-gray-200 mb-2">Daftar Mahasiswa</label>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Daftar mahasiswa dimuat otomatis. Anda dapat mengedit jika diperlukan. Format: `Nama,NIM`.</p>
          <textarea
            className="w-full h-40 p-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-primary-500 focus:border-primary-500 transition"
            value={studentsString}
            onChange={(e) => setStudentsString(e.target.value)}
          />
        </div>
      </div>
      
      {/* Scrollable Content */}
      <div className="flex-grow overflow-y-auto -mr-4 pr-4">
        {/* Course Management */}
        <div className="mb-6">
          <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-3">Daftar Mata Kuliah</h3>
          <div className="space-y-4">
            {courses.map((course) => (
              <div key={course.id} className="grid grid-cols-1 md:grid-cols-12 gap-2 items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
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
            ))}
          </div>
          <button onClick={addCourse} className="mt-4 flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition">
            <PlusIcon /> Tambah Matkul
          </button>
        </div>

        {/* Group Editor */}
        {generatedData.length > 0 && (
          <div>
            <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4">Pengaturan Kelompok</h3>
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
              {generatedData.map((data, courseIndex) => {
                if (!courses.find(c => c.id === data.course.id)) return null;

                const assignedStudentNames = new Set(data.groups.flatMap(g => g.members).map(m => m.student.name));
                const availableStudents = students.filter(s => !assignedStudentNames.has(s.name));

                return (
                <div key={data.course.id} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <div className="flex justify-between items-center mb-3">
                      <h4 className="text-xl font-semibold">{data.course.name}</h4>
                      <button onClick={() => addGroup(courseIndex)} className="flex items-center px-3 py-1 bg-gray-200 dark:bg-gray-600 text-sm rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 transition">
                          <PlusIcon/> Kelompok
                      </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {data.groups.map((group, groupIndex) => (
                      <div key={group.id} className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        <div className="flex justify-between items-center mb-2">
                          <h5 className="font-bold">Kelompok {groupIndex + 1}</h5>
                          <button onClick={() => removeGroup(courseIndex, groupIndex)} className="text-red-500 hover:text-red-700 text-xs">
                              <TrashIcon/>
                          </button>
                        </div>
                         <input
                            type="text"
                            placeholder="Judul Tugas Kelompok"
                            value={group.assignmentTitle}
                            onChange={(e) => handleGroupTitleChange(courseIndex, groupIndex, e.target.value)}
                            className="w-full p-1.5 mb-3 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md"
                        />
                        <ul className="space-y-2 mb-3">
                          {group.members.map((member, memberIndex) => (
                            <li key={`${member.student.name}-${memberIndex}`} className="flex items-center justify-between gap-2 text-sm">
                              <span className="flex-grow truncate">{member.student.name}</span>
                              <input
                                type="text"
                                value={member.role}
                                onChange={(e) => handleRoleChange(courseIndex, groupIndex, memberIndex, e.target.value)}
                                className="p-1 w-24 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md"
                              />
                              <button onClick={() => removeMember(courseIndex, groupIndex, memberIndex)} className="text-gray-400 hover:text-red-500">
                                  &#x2715;
                              </button>
                            </li>
                          ))}
                        </ul>
                        <MemberAdder courseIndex={courseIndex} groupIndex={groupIndex} students={availableStudents} setGeneratedData={setGeneratedData} />
                      </div>
                    ))}
                  </div>
                </div>
              )})}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;