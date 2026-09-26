import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";

import { router } from "expo-router";
import { Colors } from "../../constants/colors";

export default function AddBooking() {
  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
      
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Text style={styles.back}>← Back</Text>
        </TouchableOpacity>

        <Text style={styles.label}>SCHEDULE</Text>

        <Text style={styles.title}>
          Add a booking
        </Text>

      
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>
            CUSTOMER
          </Text>

          <TextInput
            placeholder="e.g. Alex Rivera"
            placeholderTextColor={Colors.muted}
            style={styles.input}
          />
        </View>


        <View style={styles.field}>
          <Text style={styles.fieldLabel}>
            VEHICLE
          </Text>

          <TextInput
            placeholder="e.g. Ford Ranger"
            placeholderTextColor={Colors.muted}
            style={styles.input}
          />
        </View>

    
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>
            START DATE
          </Text>

          <TextInput
            placeholder="e.g. Sep 20, 9:00 AM"
            placeholderTextColor={Colors.muted}
            style={styles.input}
          />
        </View>

      
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>
            END DATE
          </Text>

          <TextInput
            placeholder="e.g. Sep 23, 9:00 AM"
            placeholderTextColor={Colors.muted}
            style={styles.input}
          />
        </View>

        
        <TouchableOpacity
          style={styles.button}
          onPress={() => router.back()}
        >
          <Text style={styles.buttonText}>
            Create booking
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  content: {
    paddingHorizontal: 16,
    paddingTop: 22,
    paddingBottom: 40,
  },

  backButton: {
    alignSelf: "flex-start",
    marginBottom: 40,
  },

  back: {
    color: Colors.primary,
    fontSize: 12,
  },


  label: {
    color: Colors.primary,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
    marginBottom: 10,
  },

  title: {
    color: Colors.white,
    fontSize: 29,
    fontWeight: "400",
    marginBottom: 42,
  },


  field: {
    marginBottom: 16,
  },

  fieldLabel: {
    color: "#B9C8C1",
    fontSize: 9,
    fontWeight: "800",
    marginBottom: 8,
  },

  input: {
    height: 50,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 9,
    paddingHorizontal: 14,
    color: Colors.white,
    fontSize: 13,
  },


  button: {
    height: 51,
    backgroundColor: Colors.primary,
    borderRadius: 9,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 15,
  },

  buttonText: {
    color: "#000000",
    fontSize: 12,
    fontWeight: "900",
  },
});