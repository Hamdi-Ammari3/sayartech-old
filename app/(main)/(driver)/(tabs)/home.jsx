import { StyleSheet, Text, View, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUser } from '@clerk/clerk-expo';
import { useState,useEffect } from 'react';
import MapView, { Marker, Polyline, PROVIDER_DEFAULT } from 'react-native-maps'
import haversine from 'haversine'
import axios from 'axios'
import { doc,updateDoc } from 'firebase/firestore'
import { DB } from '../../../../firebaseConfig';
import { Link } from 'expo-router';
import colors from '../../../../constants/Colors'
import { useDriverData } from '../../../stateManagment/DriverContext'

const GOOGLE_MAPS_APIKEY = 'AIzaSyA-3LcUn0UzzVovibA1YZIL29n1c0GIi9M'

const Home = () => {
  const {fetchingUserDataLoading,driverData,fetchingDriverDataLoading,fetchingAllStudents,assignedStudents,fetchingAssignedStudetns} = useDriverData()

  const { isLoaded,user } = useUser()
  const [sortedStudents, setSortedStudents] = useState([])
  const [currentStudentIndex, setCurrentStudentIndex] = useState(0)
  const [driverLocation, setDriverLocation] = useState(null)
  const [routeCoordinates, setRouteCoordinates] = useState([])
  const [displayFinalStation,setDisplayFinalStation] = useState(false)
  const [currentTrip, setCurrentTrip] = useState('first')
  const [fetchingNextLocationLoading,setFetchingNextLocationLoading] = useState(false)
  const [fetchingDriverCurrentLocationLoading,setFetchingDriverCurrentLocationLoading] = useState(true)

// Fetch the driver curent location before start calculating
  useEffect(() => {
    const getDriverLocation = async () => {
      try {
        // Request permission to access location
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          console.log('Permission to access location was denied');
          return;
        }

        // Get the driver's current location
        let location = await Location.getCurrentPositionAsync({});
        console.log(location)

        try {
          const driverDoc = doc(DB, 'drivers', driverData[0].id);
          
          await updateDoc(driverDoc, {
            current_location: location,
          });
        } catch (error) {
          console.log('Error updating driver location:', error);
        }

        setFetchingDriverCurrentLocationLoading(false); // Stop loading once the location is fetched
      } catch (error) {
        console.log('Error getting driver location:', error.message);
        setFetchingDriverCurrentLocationLoading(false);
      }
    };

    getDriverLocation();
  }, []);

// when the driver click the start trip button
useEffect(() => {
  const sortStudentsByDistance = async () => {
    if (!user || !driverData[0] || !assignedStudents.length) {
      return;
    }

    try {
      let startingPoint;
      let sorted = [];

      if (currentTrip === 'first') {  
        startingPoint = driverData[0].current_location || driverData[0]?.driver_home_location?.coords

        sorted = assignedStudents
          .map((student) => ({
            ...student,
            distance: calculateDistance(startingPoint, student?.student_home_location?.coords),
          }))
          .sort((a, b) => a.distance - b.distance);

        sorted.push({
          id: 'school',
          school_name: assignedStudents[0]?.student_school,
          school_coords: assignedStudents[0]?.student_school_location,
        });
      } else if (currentTrip === 'second') {
        startingPoint = driverData[0].current_location || assignedStudents[0]?.student_school_location

        sorted = assignedStudents.filter(student => student.picked_up === true)
          .map((student) => ({
            ...student,
            distance: calculateDistance(startingPoint, student?.student_home_location?.coords),
          }))
          .sort((a, b) => a.distance - b.distance);

        sorted.push({
          id: 'driver_home',
          driver_home_coords: driverData[0]?.driver_home_location?.coords,
        });
      }

      setSortedStudents(sorted);
      setDriverLocation(startingPoint);

      const nextDestinationCoords =
        sorted[0]?.student_home_location?.coords ||
        sorted[0]?.school_coords ||
        sorted[0]?.driver_home_coords;

      if (startingPoint && nextDestinationCoords) {
        fetchRoute(startingPoint, nextDestinationCoords);
      }
    } catch (err) {
      console.log('Error fetching students:', err);
    }
  };

  sortStudentsByDistance();
}, [user, assignedStudents, currentTrip]);

  // Function to calculate distance between two coordinates
  const calculateDistance = (coord1, coord2) => {
    return haversine(coord1, coord2, { unit: 'meter' });
  };

const getCoordinates = (location) => {
  return {
    latitude: location.latitude,
    longitude: location.longitude
  };
};

// Function to get route between driver and student
  const fetchRoute = async (startingPoint, nextDestinationCoords) => {
    setFetchingNextLocationLoading(true)
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
    }finally{
      setFetchingNextLocationLoading(false)
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

// Click the button to start the first trip
  const handleFirstTripStart = async () => {
    // Save the trip start time and status to the database
    try {
      const driverDoc = doc(DB,'drivers', driverData[0].id)
      await updateDoc(driverDoc, { 
        first_trip_status: 'started',
        first_trip_start: new Date(),
        second_trip_status:'not started'
      })
  
    } catch (error) {
      console.log('Error starting the trip:', error)
    }
  }

  // Click the button to finish the first trip
  const handleFirstTripFinish = async () => {
    // Save the trip start time and status to the database
    try {
      const driverDoc = doc(DB,'drivers', driverData[0].id)
      await updateDoc(driverDoc, { 
        first_trip_status: 'finished', 
        first_trip_end: new Date(),
       })

      // Filter students who are marked as picked_up: true
      const pickedUpStudents = assignedStudents.filter(student => student.picked_up);
      // Update student statuses
      for (const student of pickedUpStudents) {
        const studentDoc = doc(DB, 'students', student.id);
        await updateDoc(studentDoc, {
          student_trip_status: 'at school',
        });
      }


      // Reset state variables
      setCurrentTrip('second');
      setCurrentStudentIndex(0);
      setDisplayFinalStation(false);
      setSortedStudents([]);

    } catch (error) {
      console.log('Error finishing the trip:', error)
    }
  }

// Click the button to start the second trip
const handlesecondTripStart = async () => {
  try {
    const driverDoc = doc(DB, 'drivers', driverData[0].id);
    await updateDoc(driverDoc, { 
      second_trip_status: 'started', 
      second_trip_start: new Date(),
      first_trip_status: 'not started' 
    });

    // Update student statuses
    const pickedUpStudents = assignedStudents.filter(student => student.picked_up);
    for (const student of pickedUpStudents) {
      const studentDoc = doc(DB, 'students', student.id);
      await updateDoc(studentDoc, {
        student_trip_status: 'going to home',
      });
    }

    // Fetch students and sort for the second trip
  } catch (error) {
    console.log('Error starting the second trip:', error);
  }
};


// Click the button to start the second trip
const handlesecondTripFinish = async () => {
  // Save the trip start time and status to the database
  try {
    const driverDoc = doc(DB,'drivers', driverData[0].id)
    await updateDoc(driverDoc, { 
      second_trip_status: 'finished', 
      second_trip_end: new Date()
    })

    // Reset state variables
    setCurrentTrip('first');
    setCurrentStudentIndex(0);
    setDisplayFinalStation(false);
    setSortedStudents([]);
    
  } catch (error) {
    console.log('Error starting the trip:', error)
  }
}

// move to the next student location
const markStudent = async (status) => {
  const currentStudent = sortedStudents[currentStudentIndex];

  if (currentStudent) {
    try {
      if (currentStudent.id !== 'school' && currentStudent.id !== 'driver_home') {
        const studentDoc = doc(DB, 'students', currentStudent.id);
        const updateField = currentTrip === 'first' ? { picked_up: status,student_trip_status:'going to school' } : { dropped_off: status, student_trip_status:'at home' };
        await updateDoc(studentDoc, updateField);
      }

      if (currentStudentIndex < sortedStudents.length - 1) {
        setCurrentStudentIndex((prevIndex) => prevIndex + 1);

        const nextStudent = sortedStudents[currentStudentIndex + 1];
        let nextCoords = nextStudent.student_home_location?.coords || nextStudent.school_coords || nextStudent.driver_home_coords;

        if (nextStudent.id === 'school' || nextStudent.id === 'driver_home') {
          setDisplayFinalStation(true);
        }

        if (driverLocation && nextCoords) {
          await fetchRoute(driverLocation, nextCoords);
        } else {
          console.log("All students are picked up or dropped off.");
        }
      }
    } catch (error) {
      console.log('Error updating student status:', error);
    }
  }
};

// Track driver’s location change
const onDriverLocationChange = async(event) => {
  const newDriverLocation = event.nativeEvent.coordinate;
  const distance = calculateDistance(driverLocation, newDriverLocation);

  // Only update if the driver has moved a significant distance (e.g., 100 meters)
  if (distance > 100) {
    setDriverLocation(newDriverLocation);

    try {
      const driverDoc = doc(DB, 'drivers', driverData[0].id);
      await updateDoc(driverDoc, {
        current_location: newDriverLocation,
      });
    } catch (error) {
      console.log('Error updating driver location:', error);
    }

    const nextDestination = sortedStudents[currentStudentIndex]?.student_home_location?.coords || 
                            sortedStudents[currentStudentIndex]?.school_coords || 
                            sortedStudents[currentStudentIndex]?.driver_home_coords;

    if (nextDestination) {
      fetchRoute(newDriverLocation, nextDestination);
    }
  }
};


//Loading State
if(fetchingUserDataLoading || fetchingDriverDataLoading || fetchingAllStudents || fetchingAssignedStudetns || !isLoaded || fetchingDriverCurrentLocationLoading){
  return (
    <View style={styles.spinner_error_container}>
      <ActivityIndicator size="large" color={colors.PRIMARY} />
    </View>
  )
}

// if the driver haven't yet registered his info
  if(!driverData[0]){
    <View style={styles.no_registered_students}>
      <Text style={styles.no_student_text}>الرجاء اضافة بياناتك الخاصة</Text>
      <Link href="/addData" style={styles.link_container}>
        <Text style={styles.link_text}>اضف الآن</Text>
      </Link>
    </View>
  }


//if the driver have no assigned students
  if(!assignedStudents.length) {
    return (
      <View style={styles.student_map_container}>
        <View style={styles.finding_driver_loading}>
          <View style={styles.finding_driver_loading_box}>
            <ActivityIndicator size={'small'} color={colors.PRIMARY}/>
            <Text style={styles.finding_driver_loading_text}>نحن بصدد ربط حسابك بطلاب</Text>
          </View>
        </View> 
        <MapView
          provider={PROVIDER_DEFAULT}
          initialRegion={{
            latitude: driverData[0]?.driver_home_location?.coords?.latitude,
            longitude: driverData[0]?.driver_home_location?.coords?.longitude,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          }}
          style={styles.map}
          userInterfaceStyle="light"
          showsUserLocation
          onUserLocationChange={onDriverLocationChange}
          >
          {driverData[0]?.driver_home_location?.coords && (
            <Marker
              coordinate={driverData[0].driver_home_location.coords}
              title="Driver Location"
            />
          )}
        </MapView>
      </View>
    )
  }
 
//if the driver didnt start the first trip yet
if(driverData[0].first_trip_status === "not started" && driverData[0].second_trip_status === "finished") {
  return(
    <SafeAreaView style={styles.start_trip_container}>
      <TouchableOpacity style={styles.done_trip_button} onPress={() => handleFirstTripStart()}>
          <Text style={styles.pick_button_text}>إبدأ رحلة الذهاب</Text>
      </TouchableOpacity>
    </SafeAreaView>
  )
}

//if the driver didnt start the second trip yet
if(driverData[0].first_trip_status === "finished" && driverData[0].second_trip_status === "not started") {
  return(
    <SafeAreaView style={styles.start_trip_container}>
      <TouchableOpacity style={styles.done_trip_button} onPress={() => 
      {
        handlesecondTripStart()
        setCurrentTrip('second')
        setCurrentStudentIndex(0)
        setDisplayFinalStation(false)
      }}>
        <Text style={styles.pick_button_text}>إبدأ رحلة العودة</Text>
      </TouchableOpacity>
    </SafeAreaView>
  )
}

const currentStudent = sortedStudents[currentStudentIndex]

if(driverData[0].first_trip_status === "started" && driverData[0].second_trip_status === "not started") {
  return(
    <SafeAreaView style={styles.student_map_container}>
      <>
        {!displayFinalStation ? (
          <>
            <View style={styles.map_student_name_container}>
              <Text style={styles.map_student_name}>{currentStudent?.student_full_name}</Text>
            </View>
            <View style={styles.map_picked_button_container}>
              <View style={styles.map_picked_button_container2}>
                <TouchableOpacity style={styles.pick_button_accepted} onPress={() => markStudent(true)} disabled={fetchingNextLocationLoading}>
                  <Text style={styles.pick_button_text}>صعد</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.pick_button_denied} onPress={() => markStudent(false)}>
                  <Text style={styles.pick_button_text}>لم يصعد</Text>
                </TouchableOpacity>
              </View>
            </View>
          </>
        ) : (
          <>
            <View style={styles.map_student_name_container}>
              <Text style={styles.map_student_name}>{currentStudent?.school_name}</Text>
            </View>
            <View style={styles.map_picked_button_container}>
              <View style={styles.done_trip_button_container}>
                <TouchableOpacity style={styles.done_trip_button} onPress={() => handleFirstTripFinish()}>
                  <Text style={styles.pick_button_text}>تاكيد وصول الطلاب الى المدرسة</Text>
                </TouchableOpacity>
              </View>
            </View>
          </>
        )}
      </>

      <MapView
        provider={PROVIDER_DEFAULT}
        initialRegion={{
          latitude:  driverLocation?.latitude || driverData[0]?.driver_home_location?.coords?.latitude,
          longitude: driverLocation?.longitude || driverData[0]?.driver_home_location?.coords?.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
        style={styles.map}
        userInterfaceStyle="light"
        showsUserLocation
        onUserLocationChange={onDriverLocationChange}
        >
        

        {currentStudent?.student_home_location?.coords && !displayFinalStation && (
          <Marker
            coordinate={getCoordinates(currentStudent.student_home_location.coords)}
            title={currentStudent.student_full_name}
            pinColor="red"
          />
        )}


        {currentStudent?.school_coords && displayFinalStation && (
          <Marker
            coordinate={getCoordinates(currentStudent.school_coords)}
            title={currentStudent.school_name}
            pinColor="red"
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
    </SafeAreaView>
  )}
 
if(driverData[0].second_trip_status === "started" && driverData[0].first_trip_status === "not started") {
  return(
    <SafeAreaView style={styles.student_map_container}>
      <>
        {!displayFinalStation ? (
          <>
            <View style={styles.map_student_name_container}>
              <Text style={styles.map_student_name}>{currentStudent?.student_full_name}</Text>
             </View>
            <View style={styles.map_picked_button_container}>
              <View style={styles.map_picked_button_container2}>
                <TouchableOpacity style={styles.pick_button_accepted} onPress={() => markStudent(true)}>
                  <Text style={styles.pick_button_text}>نزل</Text>
                </TouchableOpacity>
              </View>
            </View>
          </>
        ) : (
          <>
            <View style={styles.map_picked_button_container_back_home}>
              <View style={styles.done_trip_button_container}>
                 <TouchableOpacity style={styles.done_trip_button} onPress={() => handlesecondTripFinish()}>
                   <Text style={styles.pick_button_text}>تاكيد عودة الطلاب الى منازلهم</Text>
                </TouchableOpacity>
              </View>
            </View>
          </>
        )}
      </>
  
       <MapView
        provider={PROVIDER_DEFAULT}
        initialRegion={{
          latitude: driverLocation?.latitude || driverData[0]?.driver_home_location?.coords?.latitude,
          longitude: driverLocation?.longitude || driverData[0]?.driver_home_location?.coords?.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
        style={styles.map}
        userInterfaceStyle="light"
        showsUserLocation
        onUserLocationChange={onDriverLocationChange}
        >
       
        {currentStudent?.student_home_location?.coords && !displayFinalStation && (
          <Marker
            coordinate={getCoordinates(currentStudent.student_home_location.coords)}
            title={currentStudent.student_full_name}
            pinColor="red"
          />
        )}
  
         {driverData[0]?.driver_home_location?.coords && displayFinalStation && (
          <Marker
            coordinate={driverData[0].driver_home_location.coords}
            title="Driver Location"
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
    </SafeAreaView>
    )}
}

export default Home;

const styles = StyleSheet.create({
  container: {
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.WHITE,
  },
  student_map_container:{
    flex:1,
    width:'100%',
    position:'relative',
  },
  map_student_name_container:{
    width:'100%',
    position:'absolute',
    top:30,
    left:0,
    zIndex:5,
    alignItems:'center',
    justifyContent:'center',
  },
  map_student_name:{
    backgroundColor:colors.WHITE,
    width:250,
    padding:9,
    borderRadius:15,
    textAlign:'center',
    fontFamily: 'Cairo_400Regular',
    fontSize:15,
  },
  map_picked_button_container:{
    width:'100%',
    position:'absolute',
    top:85,
    left:0,
    zIndex:5,
    alignItems:'center',
    justifyContent:'center',
  },
  map_picked_button_container2:{
    width:300,
    flexDirection:'row-reverse',
    alignItems:'center',
    justifyContent:'space-evenly'
  },
  map_picked_button_container_back_home:{
    width:'100%',
    position:'absolute',
    top:30,
    left:0,
    zIndex:5,
    alignItems:'center',
    justifyContent:'center',
  },
  pick_button_accepted:{
    width:120,
    padding:10,
    borderRadius:15,
    alignItems:'center',
    justifyContent:'center',
    backgroundColor:'#56CA00'
  },
  pick_button_denied:{
    width:110,
    padding:10,
    borderRadius:15,
    alignItems:'center',
    justifyContent:'center',
    backgroundColor:'#FF4C51'
  },
  pick_button_text:{
    fontFamily: 'Cairo_700Bold',
    color:colors.WHITE
  },
  start_trip_container:{
    flex:1,
    justifyContent:'center',
    alignItems:'center'
  },
  done_trip_button:{
    width:280,
    padding:10,
    borderRadius:15,
    alignItems:'center',
    justifyContent:'center',
    backgroundColor:'#16B1FF'
  },
  spinner_error_container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  map: {
    flex:1,
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
  finding_driver_loading:{
    width:'100%',
    position:'absolute',
    top:20,
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
  }
});