import React, { createContext, useState, useEffect, useContext } from 'react';
import { collection, onSnapshot, getDocs, query, where } from 'firebase/firestore';
import {DB} from '../../firebaseConfig'
import { useUser } from '@clerk/clerk-expo';

// Create the context
const StudentContext = createContext()

// Provider component
export const StudentProvider = ({ children }) => {
  const { user,isLoaded } = useUser()
  const [allStudents,setAllStudents] = useState([])
  const [students, setStudents] = useState([])
  const [assignedToDriver, setAssignedToDriver] = useState([{}])
  const [userData, setUserData] = useState(null)
  const [fetchingAllStudentsLoading,setFetchingAllStudentsLoading] = useState(true)
  const [fetchingUserDataLoading, setFetchingUserDataLoading] = useState(true)
  const [fetchingStudentsLoading,setFetchingStudentsLoading] = useState(true)
  const [fetchingAssignedToDriversLoading, setFetchingAssignedToDriversLoading] = useState(true)
  const [error, setError] = useState(null)

  //Fetching All students
  useEffect(() => {
    const studentInfoCollectionRef = collection(DB, 'students')
    const unsubscribe = onSnapshot(
      studentInfoCollectionRef,
      async(querySnapshot) => {
        const studentList = querySnapshot.docs
          .map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))
          setAllStudents(studentList)
          setFetchingAllStudentsLoading(false)
        }
    )
    return () => unsubscribe();
  },[])


// Fetch students registered with the logged-in user ID
  useEffect(() => {
    if (!user) {
      setError('User is not defined');
      setFetchingStudentsLoading(false);
      return;
    }

    const studentInfoCollectionRef = collection(DB, 'students');
    const unsubscribe = onSnapshot(
      studentInfoCollectionRef,
      async (querySnapshot) => {
        const studentList = querySnapshot.docs
          .map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))
          .filter((student) => student.student_user_id === user.id);

        setStudents(studentList);
        setFetchingStudentsLoading(false);

        // Fetch the driver data based on driver_id after loading students
        const driverIds = studentList
          .map((student) => student.driver_id)
          .filter((id) => id); // Filter out any undefined or null driver IDs
          const driverData = {};

        await Promise.all(
          driverIds.map(async (driverId) => {
            try {
              const driverCollectionRef  = collection(DB, 'drivers')
              const q = query(driverCollectionRef , where('driver_user_id', '==', driverId))
              const driverSnapshot = await getDocs(q)

              if (!driverSnapshot.empty) {
                const driverInfo = driverSnapshot.docs[0].data()
                driverData[driverId] = driverInfo
              }
            } catch (err) {
              setError(`Failed to fetch driver data for ID: ${driverId}`, err);
            }
          })
        );
        setAssignedToDriver(driverData);
        setFetchingAssignedToDriversLoading(false);
      },
      (error) => {
        setError('Failed to load students. Please try again.');
        setFetchingStudentsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);


// Fetch user data once
useEffect(() => {
    const fetchUserData = async () => {
      if (user) {
        try {
          const userInfoCollectionRef = collection(DB, `users/${user.id}/info`);
          const userInfoSnapshot = await getDocs(userInfoCollectionRef);

          if (!userInfoSnapshot.empty) {
            const userData = userInfoSnapshot.docs[0].data();
            setUserData(userData);
          } else {
            setError('No user data found');
          }
        } catch (error) {
          setError('Failed to load user data. Please try again.');
        } finally {
            setFetchingUserDataLoading(false);
        }
      }
    };

    fetchUserData()
  }, [user])

  return (
    <StudentContext.Provider 
      value={{ 
        userData,
        fetchingUserDataLoading,

        allStudents,
        fetchingAllStudentsLoading,
        
        students,
        fetchingStudentsLoading,

        assignedToDriver,
        fetchingAssignedToDriversLoading,

        error 
      }}>
      {children}
    </StudentContext.Provider>
  );
};

// Custom hook to use driver context
export const useStudentData = () => {
  return useContext(StudentContext);
};