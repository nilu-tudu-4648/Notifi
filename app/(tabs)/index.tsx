import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import LocationTracker from '../LocationTracker'
import CallDetaction from '../CallDetaction'
import CallLogsScreen from '../CallLogsScreen'
import Contacts from '../Contacts'
import CallRecordingScreen from '../CallRecordingScreen'
import IconToggle from '../IconToggle'
// import UninstallProtectionSetup from '../UninstallProtectionSetup'
const index = () => {
  return (
    <View style={{ flex: 1 }}>
     {/* <LocationTracker /> */}
     {/* <CallDetaction /> */}
     {/* <CallRecordingScreen /> */}
     {/* <CallLogsScreen /> working */}
     {/* <Contacts />  working */}
     <IconToggle />
     {/* <UninstallProtectionSetup /> */}
    </View>
  )
}

export default index

const styles = StyleSheet.create({})