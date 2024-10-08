import { Alert,StyleSheet, Text, View,FlatList,ActivityIndicator,TouchableOpacity } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Link,useRouter } from 'expo-router'
import colors from '../../../../constants/Colors'
import StudentCard from '../../../../components/StudentCard'
import { useAuth } from '@clerk/clerk-expo'
import SimpleLineIcons from '@expo/vector-icons/SimpleLineIcons'
import { useStudentData } from '../../../stateManagment/StudentState'

const profile = () => {

  const {userData,fetchingUserDataLoading,students,fetchingStudentsLoading,driver,fetchingdriverLoading} = useStudentData()

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
      createAlert('خطأ أثناء تسجيل الخروج')
    }
  };

//Loading 
  if (fetchingStudentsLoading || fetchingUserDataLoading || fetchingdriverLoading) {
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
        <FlatList
        data={students}
        renderItem={({item}) => <StudentCard item={item} drivers={driver} fetchingDriversLoading={fetchingdriverLoading}/>}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.flatList_style}
        ListEmptyComponent={() => (
          <View style={styles.no_registered_students}>
            <Text style={styles.no_student_text}>ليس لديك طلاب مسجلين بالتطبيق</Text>
            <Link href="/addData" style={styles.link_container}>
              <Text style={styles.link_text}>اضف الآن</Text>
            </Link>
          </View>
        )}
        />
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
  flatList_style:{
    marginTop:30,
    paddingBottom:40,
  },
  no_registered_students: {
    justifyContent: 'center',
    alignItems: 'center',
    marginTop:75
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
