import React, { useState, useMemo } from 'react';
import type { GeneratedGroup, Member } from '../types';
import { SearchIcon } from './Icons';

interface StudentViewProps {
  generatedData: GeneratedGroup[];
}

interface SearchResult {
  courseName: string;
  assignmentTitle: string;
  assignmentNotes?: string;
  groupNumber: number;
  studentRole: string;
  groupMembers: Member[];
  presentationTime?: string;
}

interface UpcomingPresentation {
    date: string;
    courseName: string;
    assignmentTitle: string;
    groupNumber: number;
    groupMembers: Member[];
}

const formatDisplayDate = (dateString?: string): string => {
    if (!dateString) return 'Belum diatur';
    try {
        // Input is 'YYYY-MM-DD'. To avoid timezone issues where `new Date()` might
        // interpret this as UTC midnight (and thus roll back a day in some timezones),
        // we parse the components manually to construct a local date.
        const parts = dateString.split('-');
        if (parts.length !== 3) return dateString;
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1; // Month is 0-indexed in JS
        const day = parseInt(parts[2], 10);
        
        const date = new Date(year, month, day);

        if (isNaN(date.getTime())) return dateString; // Fallback

        const dateOptions: Intl.DateTimeFormatOptions = {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        };
        return new Intl.DateTimeFormat('id-ID', dateOptions).format(date);
    } catch (e) {
        return dateString; // Fallback
    }
};

type FilterRange = 'today' | '3days' | '7days' | 'all';

const UpcomingPresentations: React.FC<{ generatedData: GeneratedGroup[] }> = ({ generatedData }) => {
    const [filterRange, setFilterRange] = useState<FilterRange>('7days');

    const groupedPresentations = useMemo(() => {
        const now = new Date();
        now.setHours(0, 0, 0, 0); // Start of today

        let endDate: Date | null = new Date(now);

        switch (filterRange) {
            case 'today':
                endDate.setHours(23, 59, 59, 999);
                break;
            case '3days':
                endDate.setDate(now.getDate() + 3);
                endDate.setHours(23, 59, 59, 999);
                break;
            case '7days':
                endDate.setDate(now.getDate() + 7);
                endDate.setHours(23, 59, 59, 999);
                break;
            case 'all':
                endDate = null; // No upper date limit
                break;
        }

        const allPresentations: UpcomingPresentation[] = [];

        generatedData.forEach(courseData => {
            courseData.groups.forEach((group, index) => {
                if (group.presentationTime) {
                    const parts = group.presentationTime.split('-');
                    if (parts.length !== 3) return;
                    const presentationDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
                    
                    const isUpcoming = presentationDate >= now;
                    const isInRange = endDate ? presentationDate <= endDate : true;

                    if (!isNaN(presentationDate.getTime()) && isUpcoming && isInRange) {
                        allPresentations.push({
                            date: group.presentationTime,
                            courseName: courseData.course.name,
                            assignmentTitle: group.assignmentTitle,
                            groupNumber: index + 1,
                            groupMembers: group.members,
                        });
                    }
                }
            });
        });
        
        allPresentations.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        const groups: { [key: string]: UpcomingPresentation[] } = {};
        allPresentations.forEach(p => {
            const dateKey = formatDisplayDate(p.date);
            if (!groups[dateKey]) {
                groups[dateKey] = [];
            }
            groups[dateKey].push(p);
        });
        return groups;
    }, [generatedData, filterRange]);
    
    const filterOptions: { key: FilterRange; label: string }[] = [
        { key: 'today', label: 'Hari Ini' },
        { key: '3days', label: '3 Hari' },
        { key: '7days', label: 'Minggu Ini' },
        { key: 'all', label: 'Semua' },
    ];

    return (
        <div className="mb-8">
            <h2 className="text-2xl font-bold text-center text-primary-600 dark:text-primary-400 mb-4">
                Jadwal Presentasi Terdekat
            </h2>
            
            <div className="flex justify-center mb-4">
                <div className="inline-flex rounded-lg shadow-sm bg-gray-100 dark:bg-gray-900 p-1">
                    {filterOptions.map(opt => (
                        <button
                            key={opt.key}
                            onClick={() => setFilterRange(opt.key)}
                            className={`px-3 py-1 text-sm font-semibold rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-opacity-50
                                ${filterRange === opt.key 
                                    ? 'bg-white dark:bg-gray-700 text-primary-600 dark:text-primary-300 shadow' 
                                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800'}`
                                }
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>
            </div>

            {Object.keys(groupedPresentations).length === 0 ? (
                <div className="text-center text-gray-500 py-4 bg-gray-50 dark:bg-gray-900/50 p-4 border dark:border-gray-700 rounded-lg">
                    <p>Tidak ada jadwal presentasi pada rentang waktu ini.</p>
                </div>
            ) : (
                <div className="max-h-96 overflow-y-auto pr-2 -mr-2 rounded-lg bg-gray-50 dark:bg-gray-900/50 p-4 border dark:border-gray-700 relative">
                    <div className="space-y-6">
                        {Object.entries(groupedPresentations).map(([date, presentations]) => (
                            <div key={date}>
                                <h3 className="font-bold text-lg text-primary-600 dark:text-primary-300 mb-3 sticky top-0 bg-gray-50 dark:bg-gray-900/50 py-2 -mx-4 px-4 border-b dark:border-gray-700 z-10">{date}</h3>
                                <div className="space-y-3">
                                    {presentations.map((p, index) => (
                                        <div key={`${p.courseName}-${p.groupNumber}-${index}`} className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow">
                                             <p className="font-semibold">{p.courseName} - Kelompok {p.groupNumber}</p>
                                             <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">"{p.assignmentTitle}"</p>
                                             <ul className="text-sm list-disc list-inside text-gray-600 dark:text-gray-300">
                                                {p.groupMembers.map(m => <li key={m.student.name}>{m.student.name}</li>)}
                                             </ul>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};


const StudentView: React.FC<StudentViewProps> = ({ generatedData }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const searchResults = useMemo(() => {
    if (!searchTerm.trim()) {
      return [];
    }

    const results: SearchResult[] = [];
    const lowerCaseSearchTerm = searchTerm.toLowerCase();

    generatedData.forEach(data => {
      data.groups.forEach((group, groupIndex) => {
        const foundMember = group.members.find(member => 
          member.student.name.toLowerCase().includes(lowerCaseSearchTerm)
        );
        
        if (foundMember) {
          results.push({
            courseName: data.course.name,
            assignmentTitle: group.assignmentTitle,
            assignmentNotes: data.course.assignmentNotes,
            groupNumber: groupIndex + 1,
            studentRole: foundMember.role,
            groupMembers: group.members,
            presentationTime: group.presentationTime,
          });
        }
      });
    });

    return results;
  }, [searchTerm, generatedData]);

  return (
    <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-2xl w-full h-full flex flex-col">
       <UpcomingPresentations generatedData={generatedData} />

      <h2 className="text-3xl font-bold text-center text-primary-600 dark:text-primary-400 mb-2">
        Cari Kelompok Anda
      </h2>
      <p className="text-center text-gray-600 dark:text-gray-400 mb-8">
        Ketik nama lengkap Anda untuk melihat detail kelompok.
      </p>

      <div className="relative mb-6">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <SearchIcon />
        </div>
        <input
          type="text"
          placeholder="🔎 Cari Nama Saya..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full p-4 pl-10 text-lg bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-full focus:ring-primary-500 focus:border-primary-500 transition"
        />
      </div>

      <div className="flex-grow overflow-y-auto pr-2 -mr-2">
        {searchTerm && searchResults.length === 0 && (
          <div className="text-center py-10">
            <p className="text-gray-500">Nama tidak ditemukan. Pastikan nama yang Anda masukkan benar.</p>
          </div>
        )}
        {searchTerm && searchResults.length > 0 && (
          <div className="space-y-6">
            {searchResults.map((result, index) => (
              <div key={`${result.courseName}-${result.groupNumber}`} className="bg-gray-100 dark:bg-gray-900/50 p-6 rounded-xl shadow-lg transition-transform hover:scale-105 duration-300">
                <div className="border-b-2 border-primary-500 pb-3 mb-4">
                  <h3 className="text-2xl font-bold text-primary-700 dark:text-primary-300">{result.courseName}</h3>
                  <p className="text-gray-500 dark:text-gray-400">"{result.assignmentTitle}"</p>
                </div>

                {result.assignmentNotes && (
                    <div className="bg-blue-100 dark:bg-blue-900/50 border-l-4 border-blue-500 text-blue-800 dark:text-blue-300 p-4 rounded-md my-4" role="alert">
                        <p className="font-bold">Catatan Tugas:</p>
                        <p className="whitespace-pre-wrap text-sm">{result.assignmentNotes}</p>
                    </div>
                )}
                
                {result.presentationTime && (
                    <div className="bg-orange-100 dark:bg-orange-900/50 border-l-4 border-orange-500 text-orange-700 dark:text-orange-300 p-4 rounded-md mb-4" role="alert">
                        <p className="font-bold text-lg">Tanggal Presentasi</p>
                        <p className="text-2xl">{formatDisplayDate(result.presentationTime)}</p>
                    </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    <div>
                        <p className="text-sm text-gray-500">Kelompok</p>
                        <p className="text-3xl font-bold">{result.groupNumber}</p>
                    </div>
                     <div>
                        <p className="text-sm text-gray-500">Bagian / Role Anda</p>
                        <p className="text-3xl font-bold text-green-600 dark:text-green-400">{result.studentRole}</p>
                    </div>
                </div>

                <div>
                    <h4 className="font-semibold mb-2">Anggota Kelompok:</h4>
                    <ul className="space-y-1">
                      {result.groupMembers.map((member, i) => (
                        <li key={`${member.student.name}-${i}`} className="flex justify-between items-center p-2 rounded-md even:bg-white dark:even:bg-gray-800/50">
                          <span>{member.student.name}</span>
                          <span className="text-sm font-medium text-gray-600 dark:text-gray-400 bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded-full">{member.role}</span>
                        </li>
                      ))}
                    </ul>
                </div>
              </div>
            ))}
          </div>
        )}
        {!searchTerm && (
            <div className="text-center py-20 text-gray-400 dark:text-gray-500">
                <p>Hasil pencarian akan muncul di sini.</p>
            </div>
        )}
      </div>
    </div>
  );
};

export default StudentView;