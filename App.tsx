
import React, { useState, useCallback, useMemo } from 'react';
import type { Student, Course, GeneratedGroup } from './types';
import LoginForm from './components/LoginForm';
import AdminPanel from './components/AdminPanel';
import StudentView from './components/StudentView';
import { CloseIcon } from './components/Icons';

const PREPOPULATED_STUDENTS_STRING = `ACHMAD ALI RIDHO,1924250001
AHMAD DZIKRI,1924250002
AHMAD MUNTHAHA,1924250003
ANDRE PARSIAN,1924250004
ANNISA TAQIYYA,1924250005
ARDHI NUGRAHA,1924250006
DEDE YASIN,1924250007
DEDENG WIRAHA,1924250008
FEBRIYANI,1924250009
FITRI YADI,1924250010
FUAD RIFQI,1924250011
HADI SETIAWAN,1924250012
HANIF,1924250013
HASANUDDIN,1924250014
HUFAF MUFTI ALI YUSUP,1924250015
HUSNA KARIMAH,1924250016
IRFAN FAQIHUDIN,1924250017
KHATIM MUFQI ALI,1924250018
KHOFIFAH AYU KARTIKA,1924250019
LABIBAH ALFI,1924250020
M RAFLI FARID AL FARISI,1924250021
M. ALFI FAKHRI,1924250022
M. FAHMI HANIEF,1924250023
M. HIDAYATULLAH,1924250024
M. IQBAL BADRUDIN,1924250025
M. KHOERUL ANAM,1924250026
M. LUTHFI SULAEMAN,1924250027
M. NORA BURHANUDDIN,1924250028
MABRURI,1924250029
MOH YASIN,1924250030
MOHAMMAD RASYID RIDHO,1924250031
MUHAMAD FAIKI,1924250032
MUHAMMAD ALI YAFI,1924250033
MUHAMMAD ARIS,1924250034
MUHAMMAD ZAKARIYA,1924250035
MUTAMMIMAH,1924250036
MUZAKKIR,1924250037
NIZAR BAHALWAN,1924250038
NURIL MAURIDA,1924250039
PRIYANTO,1924250040
QUSYAERI AZIZ,1924250041
SITI HERLINA,1924250042
SOLAHUDDIN AL AYYUBI,1924250043
SYAHID MAKDUM IBROHIM,1924250044
SYARIPUDIN,1924250045
TAUFAN AZHARI,1924250046
TSULASY FADHIL,1924250047
ULYA QISTINA,1924250048
YOKHA LATIEF RAMADHAN,1924250049
ZAINAB AL - KUBRA,1924250050`;

const parseStudents = (text: string): Student[] => {
  return text
    .split('\n')
    .map(line => line.trim())
    .filter(line => line)
    .map(line => {
      const parts = line.split(',').map(part => part.trim());
      return {
        name: parts[0],
        email: parts[1] || undefined,
      };
    });
};


function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [studentsString, setStudentsString] = useState(PREPOPULATED_STUDENTS_STRING);
  const [courses, setCourses] = useState<Course[]>([]);
  const [generatedData, setGeneratedData] = useState<GeneratedGroup[]>([]);
  
  const students = useMemo(() => parseStudents(studentsString), [studentsString]);

  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
    setIsLoginModalOpen(false);
  };
  
  const handleLogout = useCallback(() => {
    if (window.confirm("Apakah Anda yakin ingin logout?")) {
      setIsLoggedIn(false);
    }
  }, []);

  const handleReset = useCallback(() => {
    if(window.confirm("Apakah Anda yakin ingin mereset semua data? Aksi ini tidak dapat diurungkan.")){
        setStudentsString(PREPOPULATED_STUDENTS_STRING);
        setCourses([]);
        setGeneratedData([]);
    }
  }, []);
  
  const addCourse = () => {
    const newCourse = { id: Date.now().toString(), name: '' };
    setCourses(prev => [...prev, newCourse]);
    setGeneratedData(prev => [...prev, { course: newCourse, groups: [] }]);
  };

  const removeCourse = (id: string) => {
    setCourses(prev => prev.filter(course => course.id !== id));
    setGeneratedData(prev => prev.filter(data => data.course.id !== id));
  };

  const handleCourseChange = (id: string, field: keyof Omit<Course, 'id'>, value: string) => {
    setCourses(prev => prev.map(course => (course.id === id ? { ...course, [field]: value } : course)));
    setGeneratedData(prev => prev.map(data => (data.course.id === id ? { ...data, course: { ...data.course, [field]: value } } : data)));
  };


  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8">
       <header className="container mx-auto mb-8 flex justify-between items-center">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-primary-700 dark:text-primary-300">
          KELOMPOK TUGAS MAHASISWA PKU MUI 19
        </h1>
        {!isLoggedIn && (
          <button 
            onClick={() => setIsLoginModalOpen(true)}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition font-semibold"
          >
            Login Admin
          </button>
        )}
      </header>
      
      <div className={`container mx-auto grid gap-8 h-full items-stretch ${isLoggedIn ? 'lg:grid-cols-2' : 'grid-cols-1'}`}>
        {isLoggedIn && (
          <div className="admin-panel">
            <AdminPanel
              studentsString={studentsString}
              setStudentsString={setStudentsString}
              students={students}
              courses={courses}
              generatedData={generatedData}
              setGeneratedData={setGeneratedData}
              handleReset={handleReset}
              handleLogout={handleLogout}
              addCourse={addCourse}
              removeCourse={removeCourse}
              handleCourseChange={handleCourseChange}
            />
          </div>
        )}

        <div className="student-view">
          <StudentView generatedData={generatedData} />
        </div>
      </div>

      {isLoginModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 transition-opacity duration-300">
           <div className="relative">
                <LoginForm onLoginSuccess={handleLoginSuccess} />
                <button 
                    onClick={() => setIsLoginModalOpen(false)}
                    className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white transition"
                    aria-label="Tutup"
                >
                    <CloseIcon />
                </button>
           </div>
        </div>
      )}
    </div>
  );
}

export default App;