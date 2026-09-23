import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from "react-native";

import { Colors } from "../../constants/colors";

export default function Scan() {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>
        VEHICLE HANDOFF
      </Text>

      <Text style={styles.title}>QR scanner</Text>

      <View style={styles.switch}>
        <View style={styles.active}>
          <Text style={styles.activeText}>
            CHECK-OUT
          </Text>
        </View>

        <Text style={styles.inactiveText}>
          CHECK-IN
        </Text>
      </View>

      <View style={styles.scanner}>
        <View style={styles.cornerTopLeft} />
        <View style={styles.cornerTopRight} />
        <View style={styles.cornerBottomLeft} />
        <View style={styles.cornerBottomRight} />

        <View style={styles.cameraIcon}>
          <Text style={styles.cameraText}>▣</Text>
        </View>

        <Text style={styles.cameraTitle}>
          Camera access needed
        </Text>

        <Text style={styles.cameraDescription}>
          Allow camera access to scan vehicle QR code.
        </Text>

        <TouchableOpacity style={styles.button}>
          <Text style={styles.buttonText}>
            Allow camera
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.instruction}>
        <View style={styles.number}>
          <Text style={styles.numberText}>01</Text>
        </View>

        <View>
          <Text style={styles.instructionTitle}>
            Scan vehicle QR code
          </Text>

          <Text style={styles.instructionText}>
            Point the camera at the code placed on the
            vehicle windshield.
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: 16,
  },

  label: {
    color: Colors.lime,
    fontWeight: "800",
    fontSize: 10,
    letterSpacing: 1,
  },

  title: {
    color: Colors.white,
    fontSize: 29,
    marginTop: 4,
    marginBottom: 22,
  },

  switch: {
    height: 48,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },

  active: {
    flex: 1,
    height: 40,
    backgroundColor: Colors.lime,
    borderRadius: 8,
    marginLeft: 4,
    justifyContent: "center",
    alignItems: "center",
  },

  activeText: {
    color: Colors.black,
    fontSize: 10,
    fontWeight: "800",
  },

  inactiveText: {
    flex: 1,
    textAlign: "center",
    color: Colors.muted,
    fontSize: 10,
  },

  scanner: {
    height: 420,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  cameraIcon: {
    backgroundColor: Colors.lime,
    width: 44,
    height: 44,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },

  cameraText: {
    color: Colors.black,
    fontSize: 22,
  },

  cameraTitle: {
    color: Colors.white,
    fontSize: 18,
    marginTop: 14,
  },

  cameraDescription: {
    color: Colors.muted,
    fontSize: 11,
    marginTop: 8,
  },

  button: {
    backgroundColor: Colors.lime,
    paddingHorizontal: 22,
    paddingVertical: 13,
    borderRadius: 9,
    marginTop: 18,
  },

  buttonText: {
    color: Colors.black,
    fontWeight: "800",
    fontSize: 11,
  },

  instruction: {
    backgroundColor: "#091D15",
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
  },

  number: {
    width: 32,
    height: 32,
    borderRadius: 7,
    backgroundColor: Colors.lime,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },

  numberText: {
    color: Colors.black,
    fontWeight: "900",
    fontSize: 9,
  },

  instructionTitle: {
    color: Colors.white,
    fontSize: 11,
    fontWeight: "800",
  },

  instructionText: {
    color: Colors.muted,
    fontSize: 9,
    marginTop: 3,
  },

  cornerTopLeft: {
    position: "absolute",
    top: 24,
    left: 24,
    width: 38,
    height: 38,
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderColor: Colors.lime,
  },

  cornerTopRight: {
    position: "absolute",
    top: 24,
    right: 24,
    width: 38,
    height: 38,
    borderTopWidth: 2,
    borderRightWidth: 2,
    borderColor: Colors.lime,
  },

  cornerBottomLeft: {
    position: "absolute",
    bottom: 24,
    left: 24,
    width: 38,
    height: 38,
    borderBottomWidth: 2,
    borderLeftWidth: 2,
    borderColor: Colors.lime,
  },

  cornerBottomRight: {
    position: "absolute",
    bottom: 24,
    right: 24,
    width: 38,
    height: 38,
    borderBottomWidth: 2,
    borderRightWidth: 2,
    borderColor: Colors.lime,
  },
});