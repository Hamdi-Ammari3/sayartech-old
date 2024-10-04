import React,{useState,useEffect} from 'react'
import { StyleSheet, Text, View, ActivityIndicator } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import MapView, { Marker, Polyline, PROVIDER_DEFAULT } from 'react-native-maps'
import axios from 'axios'
import { useStudentData } from '../app/stateManagment/StudentState'
import colors from '../constants/Colors'

const StudentHomePage = ({student,selectedStudent}) => {

  const [driverLocation, setDriverLocation] = useState(null)
  const [routeCoordinates, setRouteCoordinates] = useState([])
  const [loadingRoutes,setLoadingRoutes] = useState(false)
 
  const {fetchingStudentsLoading,assignedToDriver,fetchingAssignedToDriversLoading} = useStudentData()

  const GOOGLE_MAPS_APIKEY = 'AIzaSyA-3LcUn0UzzVovibA1YZIL29n1c0GIi9M'

  useEffect(() => {
    if(!student?.driver_id || !student?.picked_up || fetchingAssignedToDriversLoading || fetchingStudentsLoading || student?.student_trip_status === 'at home' ||  student?.student_trip_status === 'at school') {
      return;
    }

    const trackDriver = async () => {
      setLoadingRoutes(true)
      try {
        if (assignedToDriver[student.driver_id].current_location) {
          setDriverLocation(assignedToDriver[student.driver_id].current_location);
  
          // Determine the destination based on the student's trip status
          let destinationCoords;
          if (student.student_trip_status === 'going to school') {
            destinationCoords = student?.student_school_location;
          } else if (student.student_trip_status === 'going to home') {
            destinationCoords = student?.student_home_location?.coords;
          }
  
          // Fetch route if there's a valid destination and driver location
          if (destinationCoords && assignedToDriver[student.driver_id].current_location) {
          fetchRoute(assignedToDriver[student.driver_id].current_location, destinationCoords);
          }
  
        }
      } catch (error) {
        console.log('Error fetching students:', err)
        setLoadingRoutes(false)
      }finally{
        setLoadingRoutes(false)
      }
    }
    trackDriver();
  }, [assignedToDriver[student.driver_id]?.current_location,assignedToDriver[student.driver_id]?.first_trip_status,selectedStudent]);

  // Function to get route between driver and student
  const fetchRoute = async (startingPoint, nextDestinationCoords) => {
    try {
      const response = await axios.get(
        `https://maps.googleapis.com/maps/api/directions/json?origin=${startingPoint.latitude},${startingPoint.longitude}&destination=${nextDestinationCoords.latitude},${nextDestinationCoords.longitude}&key=${GOOGLE_MAPS_APIKEY}`
      );

      if (response.data.routes.length) {
        const points = decodePolyline(response.data.routes[0].overview_polyline.points);
        setRouteCoordinates(points);
      }
    } catch (error) {
      console.log('Error fetching route:', error);
    }
  };

  // Function to decode the polyline points from Google Directions API
  const decodePolyline = (encoded) => {
    let points = [];
    let index = 0;
    let len = encoded.length;
    let lat = 0;
    let lng = 0;

    while (index < len) {
      let b, shift = 0, result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      let dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
      lat += dlat;

      shift = 0;
      result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      let dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
      lng += dlng;

      points.push({
        latitude: lat / 1e5,
        longitude: lng / 1e5
      });
    }

    return points;
  };

// Wait untill data load
if (loadingRoutes) {
  return (
    <View style={styles.spinner_error_container}>
      <ActivityIndicator size="large" color={colors.PRIMARY} />
    </View>
  );
}

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

if(student.driver_id && student.student_trip_status === 'at home') {
  return(
    <SafeAreaView style={styles.container}>
      <View style={styles.student_container}>
        <View style={styles.student_box}>
          <Text style={styles.student_text}>الطالب في المنزل 😴</Text>
        </View>
      </View>
    </SafeAreaView>
  )
}

if(student.driver_id && student.student_trip_status === 'at school') {
  return(
    <SafeAreaView style={styles.container}>
      <View style={styles.student_container}>
        <View style={styles.student_box}>
          <Text style={styles.student_text}>الطالب في المدرسة 📖</Text>
        </View>
      </View>
    </SafeAreaView>
  )
}

if(student.driver_id && (student.student_trip_status === 'going to school' || student.student_trip_status === 'going to home')) {
  return(
    <SafeAreaView style={styles.container}>
      <View style={styles.student_route_status_container}>
        <View style={styles.student_route_status_box}>
          <Text style={styles.student_route_status_text}>{student.student_trip_status === 'going to school' ? 'الطالب في الطريق الى المدرسة' : 'الطالب في الطريق الى المنزل'}</Text>
        </View>
      </View>
      <View style={styles.student_map_container}>
      <MapView
      provider={PROVIDER_DEFAULT}
      initialRegion={{
        latitude: assignedToDriver[student.driver_id].current_location.latitude || 0,
        longitude: assignedToDriver[student.driver_id].current_location.longitude || 0,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      }}
      style={styles.map}
      userInterfaceStyle="light"
      showsUserLocation
      >

      {student.student_school_location && student.student_trip_status === 'going to school' && (
        <Marker
          key={`مدرسة ${student?.id}`}
          coordinate={student?.student_school_location}
          title={'المدرسة'}
        />
      )}

      {student.student_home_location?.coords && student.student_trip_status === 'going to home' && (
        <Marker
          key={`منزل ${student?.id}`}
          coordinate={student.student_home_location.coords}
          title={'المنزل'}
        />
      )}

      {routeCoordinates.length > 0 && (
        <Polyline
          coordinates={routeCoordinates}
          strokeColor="blue"
          strokeWidth={4}
        />
      )}

      </MapView>
      </View>
    </SafeAreaView>
  )
}
}

export default StudentHomePage

const styles = StyleSheet.create({
  container:{
    width:'100%',
    height:'100%',
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
    backgroundColor:'#16B1FF',
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
    backgroundColor:'#16B1FF',
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
    width:'100%',
    height:'100%',
    position:'relative',
  },
  student_route_status_container:{
    width:'100%',
    position:'absolute',
    top:90,
    left:0,
    zIndex:100,
    alignItems:'center',
    justifyContent:'center'
  },
  student_route_status_box:{
    backgroundColor:colors.WHITE,
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

