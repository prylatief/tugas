import React, { useState, useCallback, useMemo, useEffect } from 'react';
import type { Student, Course, GeneratedGroup, Group } from './types';
import LoginForm from './components/LoginForm';
import AdminPanel from './components/AdminPanel';
import StudentView from './components/StudentView';
import { CloseIcon } from './components/Icons';
import { supabase } from './supabase';

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
    })
    .filter(student => student.name); // Filter out students with empty names
};

const useDebounce = (value: string, delay: number) => {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);
        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);
    return debouncedValue;
};


function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const [studentsString, setStudentsString] = useState('');
  const [courses, setCourses] = useState<Course[]>([]);
  const [generatedData, setGeneratedData] = useState<GeneratedGroup[]>([]);
  
  const debouncedStudentsString = useDebounce(studentsString, 1000);
  const students = useMemo(() => parseStudents(studentsString), [studentsString]);

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      // Fetch students
      const { data: studentData, error: studentError } = await supabase
        .from('students')
        .select('content')
        .eq('id', 1)
        .single();

      if (studentData?.content) {
        setStudentsString(studentData.content);
      } else {
        // If no student data, populate with default and save
        setStudentsString(PREPOPULATED_STUDENTS_STRING);
        await supabase.from('students').upsert({ id: 1, content: PREPOPULATED_STUDENTS_STRING });
      }

      // Fetch course groups
      const { data: groupData, error: groupError } = await supabase.from('course_groups').select('*');

      if (groupData) {
        const reconstructedCourses: Course[] = groupData.map(d => d.course_data);
        const reconstructedGeneratedData: GeneratedGroup[] = groupData.map(d => ({
          course: d.course_data,
          groups: d.groups_data || [],
        }));
        setCourses(reconstructedCourses);
        setGeneratedData(reconstructedGeneratedData);
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  // Save student string to DB on change (debounced)
  useEffect(() => {
    if (debouncedStudentsString) {
        const updateStudents = async () => {
            await supabase.from('students').update({ content: debouncedStudentsString }).eq('id', 1);
        };
        updateStudents();
    }
  }, [debouncedStudentsString]);


  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
    setIsLoginModalOpen(false);
  };
  
  const handleLogout = useCallback(() => {
    if (window.confirm("Apakah Anda yakin ingin logout?")) {
      setIsLoggedIn(false);
    }
  }, []);

  const handleReset = useCallback(async () => {
    if(window.confirm("Apakah Anda yakin ingin mereset semua data? Aksi ini tidak dapat diurungkan.")){
        setLoading(true);
        // Delete all courses from DB
        const { data: coursesToDelete } = await supabase.from('course_groups').select('id');
        if (coursesToDelete) {
          const ids = coursesToDelete.map(c => c.id);
          await supabase.from('course_groups').delete().in('id', ids);
        }
        
        // Reset students string in DB
        await supabase.from('students').update({ content: PREPOPULATED_STUDENTS_STRING }).eq('id', 1);

        // Reset local state
        setStudentsString(PREPOPULATED_STUDENTS_STRING);
        setCourses([]);
        setGeneratedData([]);
        setLoading(false);
    }
  }, []);
  
  const addCourse = async () => {
    const newCourse = { id: Date.now().toString(), name: '' };
    
    // Add to DB
    const { error } = await supabase.from('course_groups').insert({
        id: newCourse.id,
        course_data: newCourse,
        groups_data: []
    });

    if(!error) {
       // Add to local state
        setCourses(prev => [...prev, newCourse]);
        setGeneratedData(prev => [...prev, { course: newCourse, groups: [] }]);
    }
  };

  const removeCourse = async (id: string) => {
    // Remove from DB
    const { error } = await supabase.from('course_groups').delete().eq('id', id);

    if(!error) {
      // Remove from local state
      setCourses(prev => prev.filter(course => course.id !== id));
      setGeneratedData(prev => prev.filter(data => data.course.id !== id));
    }
  };

  const handleCourseChange = async (id: string, field: keyof Omit<Course, 'id'>, value: string) => {
    const updatedCourses = courses.map(course => (course.id === id ? { ...course, [field]: value } : course));
    const updatedCourse = updatedCourses.find(c => c.id === id);

    if (updatedCourse) {
        // Update DB
        const { error } = await supabase.from('course_groups').update({ course_data: updatedCourse }).eq('id', id);

        if (!error) {
            // Update local state
            setCourses(updatedCourses);
            setGeneratedData(prev => prev.map(data => (data.course.id === id ? { ...data, course: updatedCourse } : data)));
        }
    }
  };

  const updateGeneratedData = async (courseId: string, updatedGroups: Group[]) => {
      // Update DB
      const { error } = await supabase.from('course_groups').update({ groups_data: updatedGroups }).eq('id', courseId);
      
      if (!error) {
          // Update local state
          setGeneratedData(prev => prev.map(data => 
              data.course.id === courseId 
              ? { ...data, groups: updatedGroups } 
              : data
          ));
      }
  };


  if (loading) {
    return (
        <div className="flex items-center justify-center min-h-screen">
            <div className="text-xl font-semibold">Memuat data...</div>
        </div>
    )
  }

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
              handleReset={handleReset}
              handleLogout={handleLogout}
              addCourse={addCourse}
              removeCourse={removeCourse}
              handleCourseChange={handleCourseChange}
              updateGeneratedData={updateGeneratedData}
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