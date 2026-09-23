import {
  View,
  Text,
  ScrollView,
  StyleSheet,
} from "react-native";

import Header from "../../components/header";
import { Colors } from "../../constants/colors";

export default function Reports() {
  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
      >
        <Header
          label="PERFORMANCE"
          title="Reports"
        />

        <View style={styles.revenue}>
          <Text style={styles.small}>
            ESTIMATED REVENUE
          </Text>

          <Text style={styles.revenueValue}>
            PHP 24,300
          </Text>

          <Text style={styles.change}>
            ↗ 12.4% from last month
          </Text>
        </View>

        <View style={styles.grid}>
          <View style={styles.stat}>
            <Text style={styles.label}>
              FLEET UTILIZATION
            </Text>

            <Text style={styles.value}>68%</Text>

            <Text style={styles.muted}>
              5 of 8 vehicles active
            </Text>
          </View>

          <View style={styles.stat}>
            <Text style={styles.label}>
              AVAILABLE NOW
            </Text>

            <Text style={styles.value}>05</Text>

            <Text style={styles.muted}>
              Across 4 vehicle classes
            </Text>
          </View>
        </View>

        <View style={styles.stat}>
          <Text style={styles.label}>
            OPEN BOOKINGS
          </Text>

          <Text style={styles.value}>02</Text>

          <Text style={styles.muted}>
            1 pickup scheduled today
          </Text>
        </View>

        <View style={styles.chart}>
          <Text style={styles.label}>
            FLEET UTILIZATION
          </Text>

          <Text style={styles.chartValue}>68%</Text>

          {[
            ["Toyota", "63%"],
            ["Ford", "91%"],
            ["Honda", "68%"],
            ["Mitsubishi", "42%"],
            ["Nissan", "55%"],
          ].map(([name, percentage]) => (
            <View
              style={styles.barRow}
              key={name}
            >
              <Text style={styles.carName}>
                {name}
              </Text>

              <View style={styles.barBackground}>
                <View
                  style={[
                    styles.bar,
                    {
                      width: percentage,
                    },
                  ]}
                />
              </View>

              <Text style={styles.percent}>
                {percentage}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.activity}>
          <Text style={styles.label}>
            RENTAL ACTIVITY
          </Text>

          <Text style={styles.activityText}>
            Ford Ranger checked out
          </Text>

          <Text style={styles.muted}>
            Today · 10:20 AM
          </Text>
        </View>
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
    padding: 14,
    paddingBottom: 30,
  },

  revenue: {
    backgroundColor: Colors.lime,
    padding: 18,
    borderRadius: 12,
    marginBottom: 10,
  },

  small: {
    color: Colors.black,
    fontSize: 9,
    letterSpacing: 1,
    fontWeight: "700",
  },

  revenueValue: {
    color: Colors.black,
    fontSize: 27,
    fontWeight: "900",
    marginTop: 16,
  },

  change: {
    color: "#355500",
    fontSize: 9,
    marginTop: 8,
  },

  grid: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 10,
  },

  stat: {
    flex: 1,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
  },

  label: {
    color: Colors.lime,
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1,
  },

  value: {
    color: Colors.white,
    fontSize: 27,
    fontWeight: "900",
    marginTop: 15,
  },

  muted: {
    color: Colors.muted,
    fontSize: 9,
    marginTop: 5,
  },

  chart: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 20,
    marginTop: 8,
  },

  chartValue: {
    color: Colors.white,
    fontSize: 29,
    fontWeight: "900",
    marginVertical: 20,
  },

  barRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },

  carName: {
    color: Colors.white,
    fontSize: 9,
    width: 70,
  },

  barBackground: {
    flex: 1,
    height: 5,
    backgroundColor: "#22382E",
    borderRadius: 10,
    overflow: "hidden",
  },

  bar: {
    height: "100%",
    backgroundColor: Colors.lime,
    borderRadius: 10,
  },

  percent: {
    color: Colors.muted,
    fontSize: 8,
    width: 35,
    textAlign: "right",
  },

  activity: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 20,
    marginTop: 2,
  },

  activityText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: "700",
    marginTop: 20,
  },
});