import { StyleSheet, Text, View,FlatList,ActivityIndicator,TouchableOpacity } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Link,useRouter } from 'expo-router'
import colors from '../../../../constants/Colors'
import { useAuth } from '@clerk/clerk-expo'
import SimpleLineIcons from '@expo/vector-icons/SimpleLineIcons'
import { useDriverData } from '../../../stateManagment/DriverContext'

const profile = () => {

  const {userData,fetchingUserDataLoading,error} = useDriverData()

  const { signOut } = useAuth()
  const router = useRouter()

  const handleSignOut = async () => {
    try {
      await signOut();
      router.replace('/(auth)/login')
    } catch (error) {
      console.error('Error signing out: ', error)
    }
  };

  // Loading or fetching user type state
  if (fetchingUserDataLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.spinner_error_container}>
          <ActivityIndicator size="large" color={colors.PRIMARY}/>
        </View>
      </SafeAreaView>
    )
  }

   return (
    <SafeAreaView style={styles.container}>
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
    </SafeAreaView>
  )
}
export default profile

const styles = StyleSheet.create({
  container:{
    flex:1,
    alignItems:'center',
    backgroundColor: colors.WHITE,
  },  
  header:{
    justifyContent:'center',
    alignItems:'center',
    paddingTop:20,
    marginVertical:30,
    borderRadius:15,
  },
  user_info:{
    width:340,
    height:50,
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
    height:45,
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
  add_kids_link:{
    width:'80%',
    padding:15,
    backgroundColor:colors.PRIMARY,
    borderRadius:20,
    textAlign:'center',
    justifyContent:'center',
    alignItems:'center',
    fontFamily:'Cairo_700Bold',
    color:colors.WHITE
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
  }
})
