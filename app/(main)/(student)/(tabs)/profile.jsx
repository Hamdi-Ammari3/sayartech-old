import { StyleSheet, Text, View,ActivityIndicator,TouchableOpacity,Alert,Image } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Link,useRouter } from 'expo-router'
import colors from '../../../../constants/Colors'
import { useAuth } from '@clerk/clerk-expo'
import SimpleLineIcons from '@expo/vector-icons/SimpleLineIcons'
import { useStudentData } from '../../../stateManagment/StudentState'
import driverImage from '../../../../assets/images/driver.png'

const profile = () => {
  const {userData,fetchingUserDataLoading,students,fetchingStudentsLoading,assignedToDriver,fetchingAssignedToDriversLoading} = useStudentData()
console.log(assignedToDriver[students[0].driver_id])
  const createAlert = (alerMessage) => {
    Alert.alert(alerMessage)
  }

  const { signOut } = useAuth()
  const router = useRouter()

  const handleSignOut = async () => {
    try {
      await signOut();
      router.replace('/(auth)/login')
    } catch (error) {
      createAlert('Error signing out')
    }
  };

//Loading user data
  if (fetchingStudentsLoading || fetchingUserDataLoading || fetchingAssignedToDriversLoading) {
    return (
      <View style={styles.spinner_error_container}>
        <ActivityIndicator size="large" color={colors.PRIMARY}/>
      </View>
    );
  }

   return (
    <SafeAreaView style={styles.container}>
      {students.length > 0 ? (
        <>
          <View style={styles.header}>
            <View style={styles.user_info}>
              <Text style={styles.user_info_text}>{userData.user_full_name}</Text>
              <Text style={styles.user_info_text}>{userData.phone_number}</Text>
            </View>
            <TouchableOpacity style={styles.button} onPress={handleSignOut}>
              <Text style={styles.logout_text}>خروج</Text>
                <SimpleLineIcons name="logout" size={24} color="white" />
            </TouchableOpacity>
          </View>
          {students[0].driver_id && (
          <View style={styles.driver_car_box}>
            <View style={styles.driver_info_box}>
              <View style={styles.driver_name_box}>
                <Text style={styles.driver_name}>{assignedToDriver[students[0].driver_id].driver_full_name}</Text>
              </View>
              <View style={styles.driver_photo_box}>
                <Image source={driverImage} style={styles.image}/>
              </View>
            </View>
            <View style={styles.car_info_box}>
              <View style={styles.related_info_box}>
                <Text style={styles.car_seats}>{assignedToDriver[students[0].driver_id].driver_car_plate}</Text>
                <Text style={{ color: '#858585' }}> | </Text>
                <Text style={styles.car_name}>{assignedToDriver[students[0].driver_id].driver_car_model}</Text>
                <Text style={{ color: '#858585' }}> | </Text>
                <Text style={styles.car_name}>{assignedToDriver[students[0].driver_id].driver_car_type}</Text>
              </View>
            </View>
          </View>
          )}
        </>
      ) : (
        <View style={styles.no_data_box}>
          <Text style={styles.no_data_text}>الرجاء اضافة بياناتك الخاصة</Text>
          <Link href="/addData" style={styles.link_container}>
            <Text style={styles.link_text}>اضف الآن</Text>
          </Link>
        </View>
      )}
    </SafeAreaView>
  )
}
export default profile

const styles = StyleSheet.create({
  container:{
    height:'100%',
    alignItems:'center',
    backgroundColor: colors.WHITE,
  },  
  header:{
    justifyContent:'space-around',
    alignItems:'center',
    paddingTop:20,
    marginVertical:30,
    borderRadius:15,
  },
  user_info:{
    width:340,
    height:60,
    flexDirection:'row-reverse',
    alignItems:'center',
    justifyContent:'space-around',
    backgroundColor:colors.PRIMARY,
    borderRadius:15,
    marginBottom:10
  },
  user_info_text:{
    fontFamily:'Cairo_700Bold',
    fontSize:14,
    color:colors.WHITE
  },
  button:{
    width:120,
    height:50,
    backgroundColor:colors.PRIMARY,
    borderRadius:15,
    flexDirection:'row',
    alignItems:'center',
    justifyContent:'center'
  },
  logout_text:{
    fontFamily:'Cairo_700Bold',
    fontSize:16,
    color:colors.WHITE,
    marginRight:10
  },
  image:{
    height:40,
    width:40,
    borderRadius:50
  },
  flatList_style:{
    marginTop:40,
    paddingVertical:20,
  },
  no_data_box:{
    height:100,
    width:350,
    justifyContent:'space-between',
    alignItems:'center',
  },
  no_data_text:{
    fontFamily:'Cairo_400Regular',
  },
  spinner_error_container:{
    flex:1,
    justifyContent:'center',
    alignItems:'center'
  },
  error_text:{
    fontFamily:'Cairo_400Regular',
    fontSize:16,
    color:'darkred'
  },
  driver_car_box:{
    width:350,
    marginTop:100,
    paddingVertical:15,
    alignItems:'center',
    backgroundColor:'#F6F8FA',
    borderRadius:15
  },
  student_school_text:{
    fontFamily:'Cairo_400Regular',
    fontSize:15,
  },
  driver_car_boxx:{
    width:350,
    paddingHorizontal:10,
    marginTop:15,
    justifyContent:'space-between',
    alignItems:'center',
    backgroundColor:'#F6F8FA',
},
driver_info_box:{
    width:350,
    paddingVertical:2,
    flexDirection:'row',
    justifyContent:'center',
    alignItems:'center',
},
car_info_box:{
    width:350,
    paddingVertical:8,
    justifyContent:'space-between',
},
driver_name_box:{
    marginRight:30,
},
driver_name:{
    fontFamily:'Cairo_400Regular',
    fontSize:14,
    color:'#858585'
},
related_info_box:{
    flexDirection:'row',
    justifyContent:'space-between',
    paddingHorizontal:20
},
car_name:{
    fontFamily:'Cairo_400Regular',
    fontSize:13,
    color:'#858585'
},
car_seats:{
    fontFamily:'Cairo_400Regular',
    fontSize:12,
    color:'#858585'
},
driver_photo_box:{
    width:35,
    height:35,
    borderRadius:50,
    borderWidth:1,
    borderColor:'#3333',
    justifyContent:'center',
    alignItems:'center'
},
link_container: {
  backgroundColor: colors.PRIMARY,
  padding: 15,
  marginTop:10,
  borderRadius: 20,
},
link_text: {
  color: colors.WHITE,
  fontFamily: 'Cairo_700Bold',
  fontSize: 14,
}
})

/*
/Fetch Route from Google API, two seprate routes [driver -> student home] - [student home -> school]
  const fetchRoute = async (driverLoc,studentLoc,schoolLoc) => {
  try {
    // Route from driver location to student home
    const driverToStudentResponse = await axios.get(
      `https://maps.googleapis.com/maps/api/directions/json?origin=${driverLoc.latitude},${driverLoc.longitude}&destination=${studentLoc.latitude},${studentLoc.longitude}&key=${GOOGLE_MAPS_APIKEY}`
    )
    const driverToStudentPoints = decodePolyline(driverToStudentResponse.data.routes[0].overview_polyline.points)

    // Route from student home to school location
    const studentToSchoolResponse = await axios.get(
      `https://maps.googleapis.com/maps/api/directions/json?origin=${studentLoc.latitude},${studentLoc.longitude}&destination=${schoolLoc.latitude},${schoolLoc.longitude}&key=${GOOGLE_MAPS_APIKEY}`
    )
    const studentToSchoolPoints = decodePolyline(studentToSchoolResponse.data.routes[0].overview_polyline.points)

    return {driverToStudentPoints,studentToSchoolPoints}

  } catch (error) {
    setError(`Error fetching directions: ${error.message}`)
    return { driverToStudentPoints: [], studentToSchoolPoints: [] }
  }
  }

//Route Points
  const decodePolyline = (t, e = 5) => {
    let points = [];
    let index = 0,
      lat = 0,
      lng = 0;

    while (index < t.length) {
      let b,
        shift = 0,
        result = 0;
      do {
        b = t.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      let dlat = result & 1 ? ~(result >> 1) : result >> 1;
      lat += dlat;

      shift = 0;
      result = 0;
      do {
        b = t.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      let dlng = result & 1 ? ~(result >> 1) : result >> 1;
      lng += dlng;

      points.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
    }

    return points;
  }

// Fetch the routes once the student and driver data is loaded
useEffect(() => {
  if (students.length > 0 && !fetchingDriversLoading) {
    setLoadingRoutes(true);
    const fetchAllRoutes = async () => {
      const allRoutes = {};
      await Promise.all(
        students.map(async (student) => {
          const studentHomeLocation = student.student_home_location?.coords;
          const schoolLocation = student.student_school_location;
          const driverId = student.driver_id;
          const driverHomeLocation = drivers[driverId]?.driver_home_location?.coords;

          if (studentHomeLocation && schoolLocation && driverHomeLocation) {
            try {
              const route = await fetchRoute(driverHomeLocation, studentHomeLocation, schoolLocation);
              allRoutes[student.id] = route;
            } catch (err) {
              setError(`Failed to fetch route for student ${student.id}: ${err.message}`);
            }
          } else {
            // Handle cases where any of the locations are missing
            setError(`Missing location data for student ${student.id}`)
          }
        })
      );
      setRoutes(allRoutes);
      setLoadingRoutes(false);
    };

    fetchAllRoutes();
  }
  setLoadingRoutes(false)
}, [students, drivers, fetchingDriversLoading]);



/*
  return(
    <SafeAreaView style={styles.container}>
      {students.length > 0 ? (
        <>
        {students.map(student => (
          <View key={student.id} style={styles.student_map_container}>
            <View style={styles.map_student_name_container}>
              <Text style={styles.map_student_name}>{student.student_full_name}</Text>
            </View>
            {!student.driver_id && (
              <View style={styles.finding_driver_loading}>
                <View style={styles.finding_driver_loading_box}>
                  <ActivityIndicator size={'small'} color={colors.PRIMARY}/>
                  <Text style={styles.finding_driver_loading_text}>جاري البحث عن سائق مناسب لك </Text>
                </View>
              </View> 
            )}
          
          <MapView
          provider={PROVIDER_DEFAULT}
          initialRegion={{
            latitude: student.student_home_location?.coords.latitude || 0,
            longitude: student.student_home_location?.coords.longitude || 0,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          }}
          
          style={styles.map}
          userInterfaceStyle="light"
        >
          {student.student_home_location?.coords && (
            <Marker
              key={`منزل ${student.id}`}
              coordinate={student.student_home_location.coords}
              title={'المنزل'}
            />
          )}

          {student.student_school_location && (
            <Marker
              key={`مدرسة ${student.id}`}
              coordinate={student.student_school_location}
              title={'المدرسة'}
              image={school_location}
            />
          )}

          {drivers[student.driver_id]?.driver_home_location && (
            <Marker
              key={`سائق ${student.student_full_name}`}
              coordinate={drivers[student.driver_id].driver_home_location.coords}
              title={'السائق'}
              image={driver_location}
            />
          )}

          {routes[student.id]?.driverToStudentPoints && (
            <Polyline
              key={`driver_to_student ${student.id}`}
              coordinates={routes[student.id].driverToStudentPoints}
              strokeColor="blue"
              strokeWidth={4}
            />
          )}

          {routes[student.id]?.studentToSchoolPoints && (
            <Polyline
              key={`student_to_school ${student.id}`}
              coordinates={routes[student.id].studentToSchoolPoints}
              strokeColor="blue"
              strokeWidth={4}
            />
          )}

        </MapView>
        </View>
        ))}
      </>
      ) : (
        <View style={styles.no_registered_students_container}>
          <View style={styles.logo}>
            <Image source={logo} style={styles.logo_image}/>
          </View>
          <View style={styles.no_registered_students}>
          <Text style={styles.no_student_text}>الرجاء اضافة بياناتك الخاصة</Text>
            <Link href="/addData" style={styles.link_container}>
              <Text style={styles.link_text}>اضف الآن</Text>
            </Link>
          </View>
        </View>
        
      )}
    </SafeAreaView>
  )
};
*/
