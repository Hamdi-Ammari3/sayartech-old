import { Alert,StyleSheet, Text, View,ActivityIndicator,TouchableOpacity } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import colors from '../../../../constants/Colors'
import { useAuth } from '@clerk/clerk-expo'
import SimpleLineIcons from '@expo/vector-icons/SimpleLineIcons'
import { useStudentData } from '../../../stateManagment/StudentState'

const profile = () => {
  const {userData,fetchingUserDataLoading,fetchingStudentsLoading,fetchingAssignedToDriversLoading} = useStudentData()

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
      <SafeAreaView style={styles.container}>
        <View style={styles.spinner_error_container}>
          <ActivityIndicator size="large" color={colors.PRIMARY}/>
        </View>
      </SafeAreaView>
    );
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
  spinner_error_container:{
    flex:1,
    justifyContent:'center',
    alignItems:'center'
  },
})
