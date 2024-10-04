import React,{useState} from 'react'
import { Text, View,StyleSheet,Image, Alert } from 'react-native'
import { SafeAreaView } from "react-native-safe-area-context"
import { useSignUp } from '@clerk/clerk-expo'
import { useRouter } from 'expo-router'
import colors from '../../constants/Colors'
import { Link } from 'expo-router'
import { addDoc, collection } from 'firebase/firestore'
import { DB } from '../../firebaseConfig'
import { Dropdown } from 'react-native-element-dropdown'
import CustomeButton from '../../components/CustomeButton'
import CustomeInput from '../../components/CustomeInput'
import logo from '../../assets/images/logo.jpeg'

export default function SignUpScreen() {
  const { isLoaded, signUp, setActive } = useSignUp()
  const router = useRouter()

  const [compteOwner,setCompteOwner] = useState('')
  const [userName,setUserName] = useState('')
  const [verifying, setVerifying] = useState(false)
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [isSigningUp, setIsSigningUp] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)

  const compte_owner = [
    {label:'ولي أمر',value:'parent'},
    {label:'طالب',value:'student'},
    {label:'سائق',value:'driver'}
  ]

  const createAlert = (alerMessage) => {
    Alert.alert(alerMessage)
  }

  const handleCompteOwner = (owner) => {
    setCompteOwner(owner)
  }

  const onSignUpPress = async () => {
    if (!isLoaded || isSigningUp) return // Prevent double-click

    setIsSigningUp(true); // Start loading

    try {
      await signUp.create({
        phoneNumber:`+216${phone}`,
      });

      await signUp.preparePhoneNumberVerification();
      setVerifying(true);
    } catch (err) {
      console.log(err)
      if(err.errors[0].longMessage === 'phone_number must be a valid phone number according to E.164 international standard.') {
        createAlert('يرجى ادخال رقم هاتف صحيح')
      } else if (err.errors[0].longMessage === 'That phone number is taken. Please try another.') {
        createAlert('يوجد حساب مسجل بهذا الرقم! الرجاء استعمال رقم آخر')
      } else {
        createAlert('يوجد خلل الرجاء المحاولة مرة ثانية')
      }
    } finally{
      setIsSigningUp(false) // End Loading
    }
  }

  // Save user data to Firestore
  const saveUserDataToFirestore = async (userId) => {
    try {
      const userInfoCollectionRef = collection(DB,`users/${userId}/info`)
      const userData = {
        user_id: userId,
        user_full_name: userName,
        compte_owner_type:compteOwner,
        phone_number:`+216${phone}`,
      }

      const docRef = await addDoc(userInfoCollectionRef,userData)

    } catch (error) {
      console.log('Error adding user data to Firestore:', error);
      createAlert('يوجد خلل الرجاء المحاولة مرة ثانية')
    }
  }

  const onPressVerify = async () => {
    if (!isLoaded || isVerifying) return // Prevent double-click

    setIsVerifying(true) // Start loading

    try {
      // Attempt to verify the SMS code
      const completeSignUp = await signUp.attemptPhoneNumberVerification({
        code,
      });

      if (completeSignUp.status === 'complete') {
        await setActive({ session: completeSignUp.createdSessionId })

        //save user data to firestore
        await saveUserDataToFirestore(completeSignUp.createdUserId)
        
        if(compteOwner === 'parent') {
          router.replace('(main)/(parent)/(tabs)/home')
        } else if (compteOwner === 'student') {
          router.replace('(main)/(student)/(tabs)/home')
        } else if (compteOwner === 'driver') {
          router.replace('(main)/(driver)/(tabs)/home')
        }
      } else {
        console.log('Verification failed:', JSON.stringify(completeSignUp, null, 2))
        createAlert('يوجد خلل الرجاء المحاولة مرة ثانية')
      }
    } catch (err) {
      console.log('Verification error:', JSON.stringify(err, null, 2))
      if(err.errors[0].longMessage === 'Incorrect code') {
        createAlert('الرجاء التثبت من رمز التاكيد')
      }
    } finally {
      setIsVerifying(false)
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.logo}>
        <Image source={logo} style={styles.logo_image}/>
      </View>
      <View style={styles.form}>
      {!verifying ? (
        <>
          <Dropdown
            style={styles.dropdown}
            placeholderStyle={styles.dropdownStyle}
            selectedTextStyle={styles.dropdownStyle}
            data={compte_owner}
            labelField="label"
            valueField="value"
            placeholder= 'صاحب الحساب'
            value={compteOwner}
            onChange={item => {
              handleCompteOwner(item.value)
              }}
          />
          <CustomeInput
            value={userName}
            placeholder="الاسم الكامل"
            onChangeText={(text) => setUserName(text)}
          />
          <CustomeInput
            value={phone}
            placeholder="رقم الهاتف"
            keyboardType='numeric'
            onChangeText={(text) => setPhone(text)}
          />
          <CustomeButton 
            title="تسجيل" 
            onPressHandler={onSignUpPress} 
            disabledStatus={!userName || !phone || isSigningUp}
            loading={isSigningUp}
          />
          <Link href={'/login'}>
            <Text style={styles.link_text}>لديك حساب بالفعل؟ ادخل الان</Text>
          </Link>
        </>
      ) : (
        <>
          <CustomeInput
           keyboardType='numeric'
           value={code} 
           placeholder="رمز التاكيد" 
           onChangeText={(code) => setCode(code)} 
          />
          <CustomeButton
            title="تاكيد" 
            onPressHandler={onPressVerify}
            disabledStatus={!code || isVerifying}
            loading={isVerifying}
           />
        </>
      )}
      </View>
    </SafeAreaView>
)}


const styles = StyleSheet.create({
  container:{
    height:'100%',
    backgroundColor: colors.WHITE,
    alignItems:'center'
  },
  logo:{
    width:'100%',
    height:150,
    marginTop:25,
    justifyContent:'center',
    alignItems:'center',
  },
  logo_image:{
    height:120,
    width:120,
    resizeMode:'contain',
  },
  form:{
    width:'100%',
    paddingVertical:20,
    marginTop:20,
    justifyContent:'space-between',
    alignItems:'center',
  },
  dropdown:{
    width:280,
    height:50,
    borderWidth:1,
    marginBottom:10,
    borderColor:colors.PRIMARY,
    borderRadius:20,
  },
  dropdownStyle:{
    fontFamily:'Cairo_400Regular',
    textAlign:'center',
    fontSize:14
  },
  link_text:{
    fontFamily:'Cairo_700Bold',
    fontSize:13,
    color:'#295F98'
  }
})
