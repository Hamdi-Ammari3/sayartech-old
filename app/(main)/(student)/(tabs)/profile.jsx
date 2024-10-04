import { StyleSheet, Text, View,ActivityIndicator,TouchableOpacity,Alert,Image } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Link,useRouter } from 'expo-router'
import colors from '../../../../constants/Colors'
import { useAuth } from '@clerk/clerk-expo'
import SimpleLineIcons from '@expo/vector-icons/SimpleLineIcons'
import { useStudentData } from '../../../stateManagment/StudentState'
import driverImage from '../../../../assets/images/driver.png'

const profile = () => {
  const {userData,fetchingUserDataLoading,students,fetchingStudentsLoading} = useStudentData()

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
  if (fetchingStudentsLoading || fetchingUserDataLoading) {
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
                <Text style={styles.driver_name}>{driver.driver_full_name}</Text>
              </View>
              <View style={styles.driver_photo_box}>
                <Image source={driverImage} style={styles.image}/>
              </View>
            </View>
            <View style={styles.car_info_box}>
              <View style={styles.related_info_box}>
                <Text style={styles.car_seats}>{driver.driver_car_plate}</Text>
                <Text style={{ color: '#858585' }}> | </Text>
                <Text style={styles.car_name}>{driver.driver_car_model}</Text>
                <Text style={{ color: '#858585' }}> | </Text>
                <Text style={styles.car_name}>{driver.driver_car_type}</Text>
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
  student_school_container:{
    width:300,
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
  driver_car_box:{
    width:350,
    paddingHorizontal:10,
    marginTop:15,
    justifyContent:'space-between',
    alignItems:'center',
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