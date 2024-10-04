import { StyleSheet, Text, View, ActivityIndicator } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useUser } from '@clerk/clerk-expo'
import { useState, useEffect } from 'react'
import { Link } from 'expo-router'
import MapView, { Marker, Polyline, PROVIDER_DEFAULT } from 'react-native-maps'
import axios from 'axios';
import school_location from '../../../../assets/images/school2.png'
import colors from '../../../../constants/Colors'
import { useStudentData } from '../../../stateManagment/StudentState'

const GOOGLE_MAPS_APIKEY = 'AIzaSyA-3LcUn0UzzVovibA1YZIL29n1c0GIi9M'

const home = () => {
  const { isLoaded } = useUser()
  const [routes, setRoutes] = useState({})
  const [loadingRoutes,setLoadingRoutes] = useState(true)
  const [error, setError] = useState('')

  const {students,fetchingStudentsLoading,drivers,fetchingDriversLoading} = useStudentData()



//Fetch Route from Google API, two seprate routes [driver -> student home] - [student home -> school]
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


  // Wait untill data load
  if (loadingRoutes||fetchingStudentsLoading || fetchingDriversLoading || !isLoaded) {
    return (
      <View style={styles.spinner_error_container}>
        <ActivityIndicator size="large" color={colors.PRIMARY} />
      </View>
    );
  }

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
            <Text style={styles.no_student_text}>ليس لديك طلاب مسجلين بالتطبيق</Text>
            <Link href="/addData" style={styles.link_container}>
              <Text style={styles.link_text}>اضف الآن</Text>
            </Link>
          </View>
        </View>
        
      )}
    </SafeAreaView>
  )
};

export default home;

const styles = StyleSheet.create({
  container: {
    flex:1,
    backgroundColor: colors.WHITE,
  },
  student_map_container:{
    flex:1,
    width:'100%',
    position:'relative'
  },
  map_student_name_container:{
    width:'100%',
    position:'absolute',
    top:20,
    left:0,
    zIndex:5,
    alignItems:'center',
    justifyContent:'center',
  },
  map_student_name:{
    backgroundColor:colors.WHITE,
    width:250,
    padding:10,
    borderRadius:15,
    textAlign:'center',
    fontFamily: 'Cairo_400Regular',
    fontSize:13,
  },
  finding_driver_loading:{
    width:'100%',
    position:'absolute',
    top:70,
    left:0,
    zIndex:5,
    alignItems:'center',
    justifyContent:'center',
  },
  finding_driver_loading_box:{
    width:250,
    padding:10,
    backgroundColor:colors.WHITE,
    flexDirection:'row',
    alignItems:'center',
    justifyContent:'space-between',
    borderRadius:15,
  },
  finding_driver_loading_text:{
    textAlign:'center',
    fontFamily: 'Cairo_400Regular',
    fontSize:13,
  },
  map: {
    flex:1,
  },
  no_registered_students_container:{
    height:400,
    paddingTop:25,
    alignItems:'center',
    justifyContent:'space-between',
  },
  logo:{
    width:'100%',
    height:150,
    justifyContent:'center',
    alignItems:'center',
  },
  logo_image:{
    height:120,
    width:120,
    resizeMode:'contain',
  },
  no_registered_students: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  no_student_text: {
    fontFamily: 'Cairo_400Regular',
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
  },
  spinner_error_container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  }
})