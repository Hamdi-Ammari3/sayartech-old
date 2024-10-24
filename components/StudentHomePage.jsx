import React,{useState} from 'react'
import { Alert,StyleSheet, Text, View, TextInput,ActivityIndicator,TouchableOpacity } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import MapView, { Marker , PROVIDER_DEFAULT } from 'react-native-maps'
import MapViewDirections from 'react-native-maps-directions'
import { doc,updateDoc } from 'firebase/firestore'
import { DB } from '../firebaseConfig'
import { useStudentData } from '../app/stateManagment/StudentState'
import colors from '../constants/Colors'

const StudentHomePage = ({student}) => {

  const [isCanceling, setIsCanceling] = useState(false);
  const [cancelText, setCancelText] = useState('');

  const createAlert = (alerMessage) => {
    Alert.alert(alerMessage)
  }
 
  const {fetchingStudentsLoading,driver,fetchingdriverLoading} = useStudentData()

  const GOOGLE_MAPS_APIKEY = 'AIzaSyA-3LcUn0UzzVovibA1YZIL29n1c0GIi9M'

  // Function to handle canceling the trip
  const handleCancelTrip = async () => {
    if (cancelText.trim() === 'نعم') {
      try {
        const studentDoc = doc(DB, 'students', student.id);
        await updateDoc(studentDoc, {
          tomorrow_trip_canceled: true,
        });
        createAlert('تم إلغاء رحلة الغد بنجاح');
        setIsCanceling(false);
        setCancelText('');
      } catch (error) {
        createAlert('حدث خطأ أثناء إلغاء الرحلة. حاول مرة أخرى.');
      }
    } else {
      createAlert('لتاكيد الالغاء يرجى كتابة نعم');
    }
  };

  const handleDenyCancelTrip = () => {
    setIsCanceling(false);
    setCancelText('');
  }

// Wait untill data load
if (fetchingdriverLoading || fetchingStudentsLoading) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.spinner_error_container}>
        <ActivityIndicator size="large" color={colors.PRIMARY} />
      </View>
    </SafeAreaView>
  );
}

// If the student is not assigned to a driver
if(!student.driver_id) {
  return(
    <SafeAreaView style={styles.container}>
      <View style={styles.finding_driver_container}>
        <View style={styles.finding_driver_loading_box}>
          <ActivityIndicator size={'small'} color={colors.WHITE}/>
          <Text style={styles.finding_driver_loading_text}>جاري ربط حسابك بسائق</Text>
        </View>
      </View>
    </SafeAreaView>
  )
}

// If the student is at home
if(student.driver_id && student.student_trip_status === 'at home') {
  return(
    <SafeAreaView style={styles.container}>
      <View style={styles.student_container}>
        <View style={styles.student_box}>
          <Text style={styles.student_text}>الطالب وصل المنزل 😴</Text>
        </View>
        {!student.tomorrow_trip_canceled && (
          <View>
          <TouchableOpacity style={styles.cancel_trip_btn} onPress={() => setIsCanceling(true)}>
            <Text style={styles.cancel_trip_btn_text}>الغاء رحلة الغد</Text>
          </TouchableOpacity>
          {isCanceling && (
            <View style={styles.cancel_trip_confirmation}>
              <TextInput
                style={styles.cancel_trip_input}
                value={cancelText}
                onChangeText={setCancelText}
                placeholder="للتاكيد اكتب كلمة نعم هنا"
              />
              <View style={styles.confirm_deny_canceling_btn}>
                <TouchableOpacity style={styles.confirm_cancel_btn} onPress={handleCancelTrip}>
                  <Text style={styles.confirm_cancel_btn_text}>تأكيد</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.deny_cancel_btn} onPress={handleDenyCancelTrip}>
                 <Text style={styles.deny_cancel_btn_text}>لا</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
        )}
      </View>
    </SafeAreaView>
  )
}

// If the student is at school
if(student.driver_id && student.student_trip_status === 'at school') {
  return(
    <SafeAreaView style={styles.container}>
      <View style={styles.student_container}>
        <View style={styles.student_box}>
          <Text style={styles.student_text}>الطالب وصل المدرسة 📖</Text>
        </View>
      </View>
    </SafeAreaView>
  )
}

// If the student is going to school
if(student.driver_id && student.student_trip_status === 'going to school'){
  return(
    <SafeAreaView style={styles.container}>
      <View style={styles.student_route_status_container}>
        <View style={styles.student_route_status_box}>
          <Text style={styles.student_route_status_text}>الطالب في الطريق الى المدرسة</Text>
        </View>
      </View>
      <View style={styles.student_map_container}>
        <MapView
          provider={PROVIDER_DEFAULT}
          region={{
            latitude: driver[student.driver_id]?.current_location?.latitude,
            longitude: driver[student.driver_id]?.current_location?.longitude,
            latitudeDelta: 0.005,
            longitudeDelta: 0.005,
          }}
          showsUserLocation={true}
          followsUserLocation={true}
          style={styles.map}
          userInterfaceStyle="light"
        >

          <Marker
           key={`مدرسة ${student?.id}`}
           coordinate={student?.student_school_location}
           title={'المدرسة'}
          />

          <MapViewDirections
            origin={driver[student.driver_id]?.current_location}
            destination={student?.student_school_location}
            optimizeWaypoints={true}
            apikey={GOOGLE_MAPS_APIKEY}
            strokeWidth={4}
            strokeColor="blue"
            onError={(error) => console.log(error)}
          />

      </MapView>
      </View>
    </SafeAreaView>
  )
}

// If the student is going to school or going to home
if(student.driver_id && student.student_trip_status === 'going to home') {
  return(
    <SafeAreaView style={styles.container}>
      <View style={styles.student_route_status_container}>
        <View style={styles.student_route_status_box}>
          <Text style={styles.student_route_status_text}> الطالب في الطريق الى المنزل</Text>
        </View>
      </View>
      <View style={styles.student_map_container}>
        <MapView
          provider={PROVIDER_DEFAULT}
          region={{
            latitude: driver[student.driver_id]?.current_location?.latitude,
            longitude: driver[student.driver_id]?.current_location?.longitude,
            latitudeDelta: 0.005,
            longitudeDelta: 0.005,
          }}
          showsUserLocation={true}
          followsUserLocation={true}
          style={styles.map}
          userInterfaceStyle="light"
        >

          <Marker
            key={`منزل ${student?.id}`}
            coordinate={student.student_home_location.coords}
            title={'المنزل'}
          />

          <MapViewDirections
            origin={driver[student.driver_id]?.current_location}
            destination={student?.student_home_location.coords}
            optimizeWaypoints={true} // Optimize route for efficiency
            apikey={GOOGLE_MAPS_APIKEY}
            strokeWidth={4}
            strokeColor="blue"
           onError={(error) => console.log(error)}
          />
      </MapView>
      </View>
    </SafeAreaView>
  )
}

}

export default StudentHomePage

const styles = StyleSheet.create({
  container:{
    flex:1,
    backgroundColor: colors.WHITE,
  },
  finding_driver_container:{
    width:'100%',
    height:'100%',
    alignItems:'center',
    justifyContent:'center'
  }, 
  finding_driver_loading_box:{
    width:250,
    padding:10,
    backgroundColor:colors.PRIMARY,
    borderRadius:15,
    flexDirection:'row',
    alignItems:'center',
    justifyContent:'space-around'
  },
  finding_driver_loading_text:{
    textAlign:'center',
    fontFamily: 'Cairo_400Regular',
    fontSize:15,
    color:colors.WHITE,
  }, 
  student_container:{
    width:'100%',
    height:'100%',
    alignItems:'center',
    justifyContent:'center'
  },
  student_box:{
    backgroundColor:colors.PRIMARY,
    width:250,
    padding:10,
    borderRadius:15,
    alignItems:'center',
    justifyContent:'center'
  },
  student_text:{
    textAlign:'center',
    fontFamily: 'Cairo_400Regular',
    fontSize:15,
    color:colors.WHITE,
  },
  cancel_trip_btn:{
    backgroundColor:colors.BLUE,
    width:250,
    padding:10,
    borderRadius:15,
    marginTop:10
  },
  cancel_trip_btn_text:{
    textAlign:'center',
    fontFamily: 'Cairo_400Regular',
    fontSize:15,
    color:colors.WHITE,
  },
  cancel_trip_input:{
    width:250,
    padding:10,
    borderRadius:15,
    borderColor:'#ddd',
    borderWidth:1,
    marginTop:10,
    textAlign:'center',
    fontFamily: 'Cairo_400Regular',
    fontSize:13,
  },
  confirm_deny_canceling_btn:{
    flexDirection:'row-reverse',
    alignItems:'center',
    justifyContent:'space-around',
  },
  confirm_cancel_btn:{
    backgroundColor:'#16B1FF',
    width:100,
    padding:10,
    borderRadius:15,
    marginTop:10
  },
  deny_cancel_btn:{
    borderWidth:1,
    borderColor:'#16B1FF',
    width:100,
    padding:10,
    borderRadius:15,
    marginTop:10
  },
  confirm_cancel_btn_text:{
    textAlign:'center',
    fontFamily: 'Cairo_400Regular',
    fontSize:15,
    color:colors.WHITE
  },
  deny_cancel_btn_text:{
    textAlign:'center',
    fontFamily: 'Cairo_400Regular',
    fontSize:15,
    color:'#16B1FF'
  },
  student_name_container:{
    backgroundColor:'#16B1FF',
    width:250,
    padding:10,
    borderRadius:15,
    alignItems:'center',
    justifyContent:'center'
  },
  student_name:{
    textAlign:'center',
    fontFamily: 'Cairo_400Regular',
    fontSize:13,
    color:colors.WHITE,
  },
  student_map_container:{
    width:500,
    height:800,
    position:'relative',
  },
  student_route_status_container:{
    width:500,
    position:'absolute',
    top:100,
    left:0,
    zIndex:100,
    alignItems:'center',
    justifyContent:'center',
  },
  student_route_status_box:{
    backgroundColor:colors.BLUE,
    width:250,
    padding:10,
    borderRadius:15,
    alignItems:'center',
    justifyContent:'center'
  },
  student_route_status_text:{
    textAlign:'center',
    fontFamily: 'Cairo_400Regular',
    fontSize:15,
    color:colors.WHITE,
  },
  map: {
    flex:1,
  },
  spinner_error_container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  }
})

