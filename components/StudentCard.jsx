import { StyleSheet, Text, View, ActivityIndicator,Image } from 'react-native'
import React from 'react'
import colors from '../constants/Colors'
import driverImage from '../assets/images/driver.png'

const ChildCard = ({ item,drivers,fetchingDriversLoading }) => {
    
  if(fetchingDriversLoading) {
    return (
      <View style={styles.spinner_error_container}>
        <ActivityIndicator size="large" color={colors.PRIMARY} />
      </View>
    )
  }
  return (
    <View style={styles.container}>
      <View style={styles.student_info_box}>
        <Text style={styles.student_info_text}>{item.student_school}</Text>
        <Text style={styles.student_info_text}>{item.student_full_name}</Text>
      </View>
      {drivers[item.driver_id] && (
        <View style={styles.driver_car_box}>
          <View style={styles.driver_info_box}>
            <View style={styles.driver_name_box}>
              <Text style={styles.driver_name}>{drivers[item.driver_id].driver_full_name}</Text>
            </View>
            <View style={styles.driver_photo_box}>
              <Image source={driverImage} style={styles.image}/>
            </View>
          </View>
          <View style={styles.car_info_box}>
            <View style={styles.related_info_box}>
              <Text style={styles.car_seats}>{drivers[item.driver_id].driver_car_plate}</Text>
              <Text style={{ color: '#858585' }}> | </Text>
              <Text style={styles.car_name}>{drivers[item.driver_id].driver_car_model}</Text>
              <Text style={{ color: '#858585' }}> | </Text>
              <Text style={styles.car_name}>{drivers[item.driver_id].driver_car_type}</Text>
            </View>
          </View>
        </View>
      )
    }
    </View>
  )
}

export default ChildCard

const styles = StyleSheet.create({
  container:{
    margin:10,
    paddingVertical:10,
    alignItems:'center',
    backgroundColor:'#F6F8FA',
    borderRadius:15
  },
  student_info_box:{
    width:350,
    paddingVertical:10,
    flexDirection:'row',
    justifyContent:'space-around',
    alignItems:'center',
  },
  student_info_text:{ 
    fontFamily:'Cairo_400Regular',
    fontSize:14
  },
  school_name_text:{
    fontFamily:'Cairo_400Regular',
    fontSize:14
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
  image:{
    height:40,
    width:40,
    borderRadius:50
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
  delete_icon:{
    width:32,
    height:32,
    borderRadius:50,
    backgroundColor:'#D11A2A',
    justifyContent:'center',
    alignItems:'center',
    marginTop:20
  }
})
