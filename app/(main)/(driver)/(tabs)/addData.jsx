import { Alert, StyleSheet, Text, View,Keyboard,ActivityIndicator,Image,Button } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import React,{useEffect, useState} from 'react'
import { useRouter } from 'expo-router'
import colors from '../../../../constants/Colors'
import CustomeButton from '../../../../components/CustomeButton'
import CustomeInput from '../../../../components/CustomeInput'
import {DB} from '../../../../firebaseConfig'
import { addDoc , collection} from 'firebase/firestore'
import * as Location from 'expo-location'
import { useUser } from '@clerk/clerk-expo'
import { Dropdown } from 'react-native-element-dropdown'
import DateTimePicker from '@react-native-community/datetimepicker';
import { useDriverData } from '../../../stateManagment/DriverContext'
import miniVan from '../../../../assets/images/minivan.png'

const addData = () => {
  const { user } = useUser()
  const router = useRouter()

  const [location, setLocation] = useState(null)
  const [locationLloading,setLocationLoading] = useState(false)
  const [carType,setCarType] = useState('')
  const [carPlate,setCarPlate] = useState('')
  const [carSeats,setCarSeats] = useState('')
  const [carModel,setCarModel] = useState('')
  const [driverBirthDate,setDriverBirthDate] = useState(new Date())
  const [dateSelected, setDateSelected] = useState(false);
  const [showPicker,setShowPicker] = useState(false);
  const [addingDriverDataLoading,setAddingDriverDataLoading] = useState(false)

  const {userData,driverData,fetchingUserDataLoading,error} = useDriverData()

  const createAlert = (alerMessage) => {
    Alert.alert(alerMessage)
  }

//Cars type array
  const cars = [
    {name: 'سيارة خاصة صالون ', type: 'private car 4 places', seats: 4 },
    {name:'سيارة خاصة ٧ راكب ',type:'private car 7 places', seats:7},
    {name:'ستاركس ',type:'starex',seats:11},
    {name:'باص صغير ١٢ راكب',type:'minu-bus',seats:12},
    {name:'باص متوسط ١٤ راكب',type:'medium-bus',seats:14},
    {name:'باص كبير ٣٠ راكب',type:'large-bus',seats:30}
  ]

// Handle the car type change
  const handleCarChange = (vehicle) => {
    setCarType(vehicle)
    setCarSeats('')
  }

// Change car seat number whenever the car type changes
  useEffect(() => {
    if (carType) {
      const selectedCar = cars.find((car) => car.name === carType)
      if (selectedCar) {
        setCarSeats(selectedCar.seats)
      } else {
        setCarSeats('')
      }
    }
  }, [carType])

//Get Driver home Location
  const getLocation = async () => {
    Keyboard.dismiss()
    setLocationLoading(true)
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        createAlert('Permission to access location was denied');
        setLocationLoading(false);
        return;
      }
      let location = await Location.getCurrentPositionAsync({});
      setLocation(location)

    } catch (error) {
      createAlert('Could not fetch location. Try again later.');
    } finally {
      setLocationLoading(false)
    }
  }

//Get the driver birth date
const showDatePicker = () => {
  setShowPicker(true);
};

// Handle the Date Change
 const handleDateChange = (event, selectedDate) => {
  if (event.type === "set") {
    const currentDate = selectedDate || driverBirthDate;
    setDriverBirthDate(currentDate);
    setDateSelected(true);
  }
  setShowPicker(false);
};

//Add New Driver
  const addNewDriverHandler = async () => {
  if (!user) {
    createAlert('المستخدم غير معرف')
    return
  }

  if (!location) {
    createAlert('يرجى تحديد موقعك اولا')
    return
  }

  setLocationLoading(true)
  setAddingDriverDataLoading(true)
  
  try {
    const driversCollectionRef = collection(DB,'drivers')
    const driverData = {
      driver_full_name: userData.user_full_name,
      driver_user_id:userData.user_id,
      driver_phone_number:userData.phone_number,
      driver_home_location:location,
      driver_birth_date:driverBirthDate,
      driver_car_type:carType,
      driver_car_model:carModel,
      driver_car_plate:carPlate,
      driver_car_seats: carSeats,
      students_picked:[],
      first_trip_status:'not started',
      first_trip_start:null,
      first_trip_end:null,
      second_trip_status:'finished',
      second_trip_start:null,
      second_trip_end:null,
      rating:null
    }

    const docRef = await addDoc(driversCollectionRef,driverData)

    createAlert('تم تسجيل المعلومات بنجاح')
    
    // Clear the form fields
    setLocation(null)
    setCarType('')
    setCarModel('')
    setCarPlate('')
    setCarSeats('')
    setDateSelected(false)

  } catch (error) {
     createAlert('. يرجى المحاولة مرة أخرى')
  } finally{
    setLocationLoading(false)
    setAddingDriverDataLoading(false)
    router.replace('/home')      
  }
}

// Clear the form fields
  const clearFormHandler = () => {
    setLocation(null)
    setCarType('')
    setCarModel('')
    setCarPlate('')
    setCarSeats('')
    setDateSelected(false)
  }

// Loading or fetching user data from DB
  if (fetchingUserDataLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.spinner_error_container}>
          <ActivityIndicator size="large" color={colors.PRIMARY}/>
        </View>
      </SafeAreaView>
    )
  }

// Loading till adding driver data
  if (addingDriverDataLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.spinner_error_container}>
          <ActivityIndicator size="large" color={colors.PRIMARY}/>
        </View>
      </SafeAreaView>
    )
  }

// Check whether the user add data or no
  if(driverData.length > 0 && addingDriverDataLoading === false) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.already_added_container}>
          <View>
            <Image source={miniVan} style={{width:150,height:150,resizeMode:'contain'}}/>
          </View>
          <View style={styles.car_info_box}>
            <Text style={styles.car_info_text}>{driverData[0]?.driver_car_type}</Text> 
            <Text style={{ color: '#858585' }}> | </Text>
            <Text style={styles.car_info_text}>{driverData[0]?.driver_car_model}</Text>
            <Text style={{ color: '#858585' }}> | </Text>
             <Text style={styles.car_info_text}>{driverData[0]?.driver_car_plate}</Text>
          </View>
        </View>
      </SafeAreaView>
    )
  }

  return(
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>اضافة بيانات</Text>
        <View style={styles.form}>
          <CustomeButton
            title={dateSelected ? driverBirthDate.toLocaleDateString() : 'تاريخ الميلاد'}
            onPressHandler={showDatePicker} 
          />
          {showPicker && (
            <DateTimePicker
              value={driverBirthDate}
              mode="date"
              display="default"
              onChange={handleDateChange}
              maximumDate={new Date()} // Optional: Prevent selecting future dates
            />
          )}
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
          <CustomeInput
            placeholder={'موديل السيارة'}
            value={carModel}
            onChangeText={(text) => setCarModel(text)}
          />
          <CustomeInput
            placeholder={'رقم اللوحة'}
            value={carPlate}
            onChangeText={(text) => setCarPlate(text)}
          />
          <CustomeButton
            title={location ? 'تم تحديد موقعك' : 'عنوان المنزل'}
            icon={true}
            iconType={location ? 'done' : 'location'}
            onPressHandler={getLocation}
            disabledStatus={location}
          />
          <View style={styles.location_msg_view}>
            <Text style={styles.location_warning_text}>بالنقر على "عنوان المنزل" التطبيق يسجل موقعك الحالي كعنوان للمنزل لذا يرجى التواجد في المنزل عند التسجيل</Text>
          </View>
          <CustomeButton 
            title={'أضف'}
            onPressHandler={addNewDriverHandler}
            disabledStatus={!userData || !location || !carModel || !carPlate}
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
    flex:1,
    alignItems:'center',
    paddingVertical:10,
    backgroundColor:colors.WHITE
  },
  title:{
    marginVertical:20,
    fontFamily:'Cairo_400Regular',
    fontSize:24,
  },
  form:{
    marginTop:30,
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
    borderRadius:20,
  },
  dropdownStyle:{
    fontFamily:'Cairo_400Regular',
    textAlign:'center',
    fontSize:14
  },
  location_msg_view:{
    width:280,
    paddingHorizontal:10,
    marginBottom:40,
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
  already_added_container:{
    flex:1,
    justifyContent:'center',
    alignItems:'center',
    backgroundColor:colors.WHITE,
    paddingVertical:30,
    borderRadius:15,
  },
  car_info_box:{
    width:300,
    height:100,
    backgroundColor:'#F6F8FA',
    flexDirection:'row-reverse',
    justifyContent:'space-around',
    alignItems:'center',
    borderRadius:15,
    marginTop:10
  },
  car_info_text:{
    fontFamily:'Cairo_400Regular',
    fontSize:14,
    color:'#858585'
  }
})