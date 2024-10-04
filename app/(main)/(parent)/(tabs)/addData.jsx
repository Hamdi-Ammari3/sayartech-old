import { Alert, StyleSheet, Text, View,Keyboard,ActivityIndicator,TextInput } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import React,{useEffect, useState} from 'react'
import { useRouter } from 'expo-router'
import colors from '../../../../constants/Colors'
import CustomeInput from '../../../../components/CustomeInput'
import CustomeButton from '../../../../components/CustomeButton'
import {DB} from '../../../../firebaseConfig'
import { addDoc , collection } from 'firebase/firestore'
import * as Location from 'expo-location'
import haversine from 'haversine'
import { useUser } from '@clerk/clerk-expo'
import { Dropdown } from 'react-native-element-dropdown'
import { useStudentData } from '../../../stateManagment/StudentState'


const addData = () => {
  const { user } = useUser()
  const router = useRouter()

  const [studentFullName,setStudentFullName] = useState('')
  const [studentAge,setStudentAge] = useState('')
  const [studentSex,setStudentSex] = useState('')
  const [studentSchool,setStudentSchool] = useState('')
  const [location, setLocation] = useState(null)
  const [schoolLocation, setSchoolLocation] = useState(null)
  const [distance, setDistance] = useState(null)
  const [carType,setCarType] = useState('')
  const [loading,setLoading] = useState(false)
  const [addingNewStudentLoading,setAddingNewStudentLoading] = useState(false)

  const {userData} = useStudentData()

  const createAlert = (alerMessage) => {
    Alert.alert(alerMessage)
  }

  const schools = [
    { name: 'مدرسة سومر الاهلية', latitude: 31.066750323985293, longitude: 46.25135005023684 },
    {name:'المدرسة الابتدائية سوسة',latitude:35.82909167294197, longitude:10.639127250832383},
    {name:'المعهد النموذجي سوسة',latitude:35.841831899593174, longitude:10.590397475413294},
    {name:'مدرسة النخيل الاهلية للبنات',latitude:33.34158681627086, longitude:43.76347714630668}
  ]

  const sex = [
    { name: 'ذكر'},
    {name:'انثى'}
  ]

  const cars = [
    {name: 'سيارة خاصة صالون ', type: 'private car 4 places', seats: 4 },
    {name:'سيارة خاصة ٧ راكب ',type:'private car 7 places', seats:7},
    {name:'ستاركس ',type:'starex',seats:11},
    {name:'باص صغير ١٢ راكب',type:'minu-bus',seats:12},
    {name:'باص متوسط ١٤ راكب',type:'medium-bus',seats:14},
    {name:'باص كبير ٣٠ راكب',type:'large-bus',seats:30}
  ]

// Handle student sex change
const handleStudentSex = (sexType) => {
  setStudentSex(sexType)
}

// Handle the car type change
  const handleCarChange = (vehicle) => {
    setCarType(vehicle)
  }


//Get student home Location
  const getLocation = async () => {
    Keyboard.dismiss()
    setLoading(true)
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        createAlert('Permission to access location was denied');
        setLoading(false);
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      setLocation(location)

    } catch (error) {
      console.error('Error getting location: ', error);
      createAlert('Could not fetch location. Try again later.');
    } finally {
      setLoading(false);
    }
  }

// Handle school name change
  const handleSchoolChange = (schoolName) => {
    setStudentSchool(schoolName)
    setDistance(null)
  }

  // Set school location based on school name
  useEffect(() => {
    if (studentSchool) {
      const selectedSchool = schools.find((school) => school.name === studentSchool)
      if (selectedSchool) {
        setSchoolLocation({
          latitude: selectedSchool.latitude,
          longitude: selectedSchool.longitude,
        })
      } else {
        setSchoolLocation(null)
      }
    }
  }, [studentSchool])

//Calculate home - school distance
const calculateDistance = () => {
    if (location && schoolLocation) {
      const start = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      }
      const end = schoolLocation

      const dist = haversine(start, end, { unit: 'km' })
      setDistance(dist.toFixed(2))
    }
  }

// trigger distance calculation whenever the home / school location changes
  useEffect(() => {
    if (location && schoolLocation) {
      calculateDistance()
    }
  }, [schoolLocation, location])

//Adding new student
  const addNewStudentHandler = async () => {
    if (!user) {
      createAlert('المستخدم غير معرف')
      return
    }

    if (!location || !schoolLocation) {
      createAlert('يرجى تحديد موقعك اولا')
      return
    }

    setLoading(true)
    setAddingNewStudentLoading(true)

    try {
      const studentsCollectionRef = collection(DB,'students')
      const studentData = {
        student_full_name: studentFullName,
        student_user_id:userData.user_id,
        student_phone_number:userData.phone_number,
        student_age:studentAge,
        student_sex:studentSex,
        student_home_location:location,
        student_school:studentSchool,
        student_school_location:schoolLocation,
        distance_to_school: distance,
        student_car_type:carType,
        driver_id:null,
        picked_up:false,
        dropped_off:true,
        student_trip_status:'at home'
      }

      const docRef = await addDoc(studentsCollectionRef,studentData)

      createAlert('تم تسجيل المعلومات بنجاح')
      
      // Clear the form fields
      setStudentFullName('')
      setStudentAge('')
      setStudentSex('')
      setLocation(null)
      setStudentSchool('')
      setSchoolLocation(null)
      setDistance(null)
      setCarType('')

    } catch (error) {
       createAlert('. يرجى المحاولة مرة أخرى')
    } finally{
      setLoading(false)
      setAddingNewStudentLoading(false)
      router.replace('/home')      
    }
  }

  // Clear the form fields
  const clearFormHandler = () => {
    setStudentFullName('')
    setStudentAge('')
    setStudentSex('')
    setLocation(null)
    setStudentSchool('')
    setSchoolLocation(null)
    setDistance(null)
    setCarType('')
  }

  if (addingNewStudentLoading) {
    return (
      <View style={styles.spinner_error_container}>
        <ActivityIndicator size="large" color={colors.PRIMARY}/>
      </View>
    )
  }

  return(
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>اضافة طالب</Text>
        <View style={styles.form}>
            <CustomeInput 
              placeholder={'الاسم الكامل'}
              value={studentFullName}
              onChangeText={(text) => setStudentFullName(text)}
            />
            <View style={styles.age_sex_input_container}>
              <TextInput 
              style={styles.age_input}
              placeholder={'العمر'}
              value={studentAge}
              onChangeText={(text) => setStudentAge(text)}
              keyboardType='numeric'
              />
              <Dropdown
              style={styles.sex_dropdown}
              placeholderStyle={styles.dropdownStyle}
              selectedTextStyle={styles.dropdownStyle}
              data={sex}
              labelField="name"
              valueField="name"
              placeholder= 'الجنس'
              value={studentSex}
              onChange={item => {
              handleStudentSex(item.name)
              }}
              />
            </View>
            <Dropdown
              style={styles.dropdown}
              placeholderStyle={styles.dropdownStyle}
              selectedTextStyle={styles.dropdownStyle}
              data={cars}
              labelField="name"
              valueField="name"
              placeholder= 'نوع السيارة'
              value={carType}
              onChange={item => {
                handleCarChange(item.name)
              }}
            />
            <Dropdown
              style={styles.dropdown}
              placeholderStyle={styles.dropdownStyle}
              selectedTextStyle={styles.dropdownStyle}
              data={schools}
              labelField="name"
              valueField="name"
              placeholder= 'المدرسة'
              value={studentSchool}
              onChange={item => {
              handleSchoolChange(item.name)
              }}
            />
            <CustomeButton
              title={location ? 'تم تحديد موقعك' : 'عنوان المنزل'}
              icon={true}
              iconType={location ? 'done' : 'location'}
              onPressHandler={getLocation}
              disabledStatus={location}
            />
            <View style={styles.location_msg_view}>
                {location && schoolLocation ? (
                    <>
                        <Text style={styles.location_warning_text}>المسافة بين منزل الطالب و المدرسة: {distance} كلم</Text>
                    </>
                ) : (
                    <Text style={styles.location_warning_text}>بالنقر على "عنوان المنزل" التطبيق يسجل موقعك الحالي كعنوان للمنزل لذا يرجى التواجد في المنزل عند التسجيل</Text>
                )}
            </View>
            <CustomeButton 
              title={'أضف'}
              onPressHandler={addNewStudentHandler}
              disabledStatus={!studentFullName || !location || !studentSchool || !studentAge || !studentSex || !carType}
            />
          <Text style={styles.location_warning_text}>* يرجى التأكد من ادخال جميع البيانات</Text>
          <CustomeButton 
            title={'الغاء'}
            onPressHandler={clearFormHandler}
          />
        </View>          
    </SafeAreaView>
  )
}

export default addData

const styles = StyleSheet.create({
  container:{
    height:'100%',
    alignItems:'center',
    paddingVertical:40,
    backgroundColor:colors.WHITE
  },
  title:{
    height:60,
    marginBottom:40,
    fontFamily:'Cairo_400Regular',
    fontSize:24,
  },
  form:{
    width:'100%',
    justifyContent:'space-between',
    alignItems:'center',
  },
  dropdown:{
    width:280,
    height:50,
    borderWidth:1,
    marginBottom:10,
    borderColor:colors.PRIMARY,
    borderRadius:15,
  },
  dropdownStyle:{
    fontFamily:'Cairo_400Regular',
    textAlign:'center',
    fontSize:14
  },
  age_sex_input_container:{
    flexDirection:'row',
    width:280,
    alignItems:'center',
    justifyContent:'space-between'
  },
  age_input:{
    width:135,
    height:50,
    marginBottom:10,
    borderWidth:1,
    borderColor:colors.PRIMARY,
    borderRadius:15,
    textAlign:'center',
    fontFamily:'Cairo_400Regular'
  },
  sex_dropdown:{
    width:135,
    height:50,
    borderWidth:1,
    marginBottom:10,
    borderColor:colors.PRIMARY,
    borderRadius:15,
  },
  location_msg_view:{
    width:280,
    paddingHorizontal:10,
    marginBottom:20,
  },
  location_warning_text:{
    fontFamily:'Cairo_700Bold',
    fontSize:11,
    textAlign:'center',
    marginBottom:10,
  },
  map: {
    width: '95%',
    height: 270,
    marginVertical: 10,
  },
  distanceText: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 12,
  },
  spinner_error_container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  already_added_style:{
    fontFamily: 'Cairo_400Regular',
    fontSize:16
  }
})