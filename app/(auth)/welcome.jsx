import { StyleSheet, Text, View,Image } from 'react-native'
import { SafeAreaView } from "react-native-safe-area-context"
import React from 'react'
import landing_page from '../../assets/images/landing.png'
import CustomeButton from '../../components/CustomeButton'
import colors from '../../constants/Colors'
import { router } from 'expo-router'

const welcome = () => {

  const onPressHandler = () => {
    router.push('(auth)/login')
  }
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.logo}>
        <Text style={styles.logo_text}>SayarTech</Text>
        <Text style={styles.logo_text}>سيارتك</Text>
      </View>
      <View style={styles.image_button_container}>
        <View style={styles.image_container}>
          <Image style={styles.image} source={landing_page}/>
        </View>
        <CustomeButton title='ابدأ الآن' onPressHandler={onPressHandler}/>
      </View>
    </SafeAreaView>
  )
}

export default welcome

const styles = StyleSheet.create({
  container:{
    width:'100%',
    height:'100%',
    alignItems:'center',
    backgroundColor:colors.WHITE
  },
  logo:{
    width:'80%',
    flexDirection:'row',
    justifyContent:'center',
    marginVertical:25
  },
  logo_text:{
    marginHorizontal:10,
    fontFamily:'Cairo_700Bold',
    fontSize:30,
    color:colors.PRIMARY
  },
  image_button_container:{
    width:'100%',
    height:'80%',
    alignItems:'center',
    justifyContent:'center',
  },
  image_container:{
    width:'100%',
    height:500,
    alignItems:'center',
    justifyContent:'flex-end',
    borderRadius:15
  },
  image:{
    width:600,
    height:600,
    resizeMode:'contain',
    borderRadius:15
  },
})
