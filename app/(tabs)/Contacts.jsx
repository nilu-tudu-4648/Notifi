import React, { useEffect, useState } from "react";
import { PermissionsAndroid, Platform, View, Text, FlatList, StyleSheet } from "react-native";
import Contacts from "react-native-contacts";

const checkContactsPermission = async () => {
  try {
    const granted = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.READ_CONTACTS);
    if (granted) {
      console.log("Permission already granted.");
      return true;
    } else {
      console.log("Permission not granted. Requesting...");
      return false;
    }
  } catch (error) {
    console.error("Error checking permission: ", error);
    return false;
  }
};

const requestContactsPermission = async () => {
  try {
    console.log("Requesting contacts permission...");
    const res = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.READ_CONTACTS, {
      title: "Contacts",
      message: "This app would like to view your contacts.",
      buttonPositive: "Please accept bare mortal",
    });
    
    console.log("Permission result: ", res);
    
    if (res === PermissionsAndroid.RESULTS.GRANTED) {
      console.log("Permission granted!");
      return true;
    } else if (res === PermissionsAndroid.RESULTS.DENIED) {
      console.log("Permission denied.");
    } else if (res === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
      console.log("User selected 'Never ask again'.");
    }
    return false;
  } catch (error) {
    console.error("Permission error: ", error);
    return false;
  }
};

const App = () => {
  const [contactsList, setContactsList] = useState([]);

  useEffect(() => {
    const getContacts = async () => {
      const hasPermission = await checkContactsPermission();
      if (!hasPermission) {
        const granted = await requestContactsPermission();
        if (granted) {
          try {
            const contacts = await Contacts.getAll();
            setContactsList(contacts);
          } catch (err) {
            console.log(err);
          }
        }
      } else {
        try {
          const contacts = await Contacts.getAll();
          setContactsList(contacts);
        } catch (err) {
          console.log(err);
        }
      }
    };

    getContacts();
  }, []);

  const renderContact = ({ item }) => (
    <View style={styles.contactItem}>
      <Text style={styles.name}>{item.displayName || `${item.givenName} ${item.familyName}`}</Text>
      {item.phoneNumbers.map((phone, index) => (
        <Text key={index} style={styles.phone}>
          {phone.number}
        </Text>
      ))}
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={contactsList}
        renderItem={renderContact}
        keyExtractor={(item, index) => index.toString()}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  contactItem: {
    padding: 15,
    backgroundColor: 'white',
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  phone: {
    fontSize: 14,
    color: '#666',
    marginLeft: 10,
  },
  separator: {
    height: 1,
    backgroundColor: '#eee',
  }
});

export default App;