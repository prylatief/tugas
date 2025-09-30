import React, { useState, useMemo } from 'react';
import type { GeneratedGroup, Member } from '../types';
import { SearchIcon } from './Icons';

interface StudentViewProps {
  generatedData: GeneratedGroup[];
}

interface SearchResult {
  courseName: string;
  assignmentTitle: string;
  groupNumber: number;
  studentRole: string;
  groupMembers: Member[];
  presentationTime?: string;
}

const formatDisplayDate = (isoString?: string): string => {
    if (!isoString) return 'Belum diatur';
    try {
        const date = new Date(isoString);
        if (isNaN(date.getTime())) return isoString; // Fallback ke string original jika tidak valid

        const dateOptions: Intl.DateTimeFormatOptions = {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            timeZone: 'Asia/Jakarta' // Atur zona waktu jika perlu
        };
        const timeOptions: Intl.DateTimeFormatOptions = {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
            timeZone: 'Asia/Jakarta'
        };

        const dateStr = new Intl.DateTimeFormat('id-ID', dateOptions).format(date);
        const timeStr = new Intl.DateTimeFormat('id-ID', timeOptions).format(date).replace(/\./g, ':');

        return `${dateStr}, ${timeStr}`;
    } catch (e) {
        return isoString; // Fallback jika ada error
    }
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
                
                {result.presentationTime && (
                    <div className="bg-orange-100 dark:bg-orange-900/50 border-l-4 border-orange-500 text-orange-700 dark:text-orange-300 p-4 rounded-md mb-4" role="alert">
                        <p className="font-bold text-lg">Jadwal Presentasi</p>
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