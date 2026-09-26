import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import Header from "../../components/header";
import { Colors } from "../../constants/colors";

const WEEKLY_DATA = [
  { day: "Mon", height: 55 },
  { day: "Tue", height: 78 },
  { day: "Wed", height: 62 },
  { day: "Thu", height: 92 },
  { day: "Fri", height: 80 },
  { day: "Sat", height: 95 },
  { day: "Sun", height: 84 },
];

export default function Reports() {
  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <Header eyebrow="BUSINESS INTELLIGENCE" title="Reports" />

        <View style={styles.rangeRow}>
          <View style={styles.rangeBox}>
            <Text style={styles.rangeText}>Sep 1 – Sep 30</Text>
          </View>

          <TouchableOpacity style={styles.exportButton}>
            <Text style={styles.exportText}>Export</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.revenueCard}>
          <Text style={styles.revenueLabel}>TOTAL REVENUE</Text>

          <Text style={styles.revenueAmount}>₱284,500</Text>

          <Text style={styles.revenueChange}>
            +12.4% vs previous period
          </Text>

          <View style={styles.chartRow}>
            {WEEKLY_DATA.map((item) => (
              <View key={item.day} style={styles.chartCol}>
                <View
                  style={[
                    styles.chartBar,
                    { height: item.height },
                  ]}
                />
                <Text style={styles.chartDay}>{item.day}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.statsGrid}>
          <StatCard
            icon="car-outline"
            label="FLEET UTILIZATION"
            value="78%"
            change="+6.2%"
          />

          <StatCard
            icon="calendar-outline"
            label="AVG. RENTAL"
            value="3.4d"
            change="+0.3 days"
          />

          <StatCard
            icon="card-outline"
            label="AVG. BOOKING"
            value="₱8.9k"
            change="+4.8%"
          />

          <StatCard
            icon="person-outline"
            label="NEW CUSTOMERS"
            value="18"
            change="+12 this month"
          />
        </View>

        <View style={styles.topCard}>
          <Text style={styles.topLabel}>TOP PERFORMER</Text>

          <View style={styles.topRow}>
            <View style={styles.topThumb}>
              <Ionicons
                name="car-sport-outline"
                size={22}
                color={Colors.primary}
              />
            </View>

            <View style={styles.topInfo}>
              <Text style={styles.topName}>Toyota Fortuner</Text>
              <Text style={styles.topSubtext}>
                18 rentals · ₱75,600 revenue
              </Text>
            </View>

            <Text style={styles.topPercent}>92%</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function StatCard({ icon, label, value, change }) {
  return (
    <View style={styles.statCard}>
      <View style={styles.iconBox}>
        <Ionicons name={icon} size={18} color={Colors.primary} />
      </View>

      <Text style={styles.statLabel}>{label}</Text>

      <Text style={styles.statValue}>{value}</Text>

      <Text style={styles.statChange}>{change}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  content: {
    paddingHorizontal: 22,
    paddingTop: 24,
    paddingBottom: 30,
  },

  rangeRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 22,
    marginBottom: 18,
  },

  rangeBox: {
    flex: 1,
    height: 46,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },

  rangeText: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
  },

  exportButton: {
    height: 46,
    paddingHorizontal: 18,
    backgroundColor: Colors.white,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },

  exportText: {
    color: Colors.background,
    fontSize: 12,
    fontWeight: "800",
    textAlign: "center",
  },

  revenueCard: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 16,
    padding: 18,
    marginBottom: 12,
  },

  revenueLabel: {
    color: Colors.muted,
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.7,
  },

  revenueAmount: {
    color: Colors.white,
    fontSize: 32,
    fontWeight: "800",
    marginTop: 10,
  },

  revenueChange: {
    color: Colors.primary,
    fontSize: 10,
    fontWeight: "700",
    marginTop: 6,
  },

  chartRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    height: 100,
    marginTop: 24,
  },

  chartCol: {
    alignItems: "center",
    flex: 1,
  },

  chartBar: {
    width: 16,
    backgroundColor: Colors.primary,
    borderRadius: 5,
    opacity: 0.85,
  },

  chartDay: {
    color: Colors.muted,
    fontSize: 8,
    marginTop: 8,
    textAlign: "center",
  },

  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },

  statCard: {
    width: "48.5%",
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
  },

  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 9,
    backgroundColor: "#10291E",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 13,
  },

  statLabel: {
    color: Colors.muted,
    fontSize: 8,
    letterSpacing: 0.7,
    marginBottom: 5,
  },

  statValue: {
    color: Colors.white,
    fontSize: 23,
    fontWeight: "800",
  },

  statChange: {
    color: Colors.primary,
    fontSize: 9,
    fontWeight: "700",
    marginTop: 4,
  },

  topCard: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 16,
    padding: 18,
    marginTop: 4,
  },

  topLabel: {
    color: Colors.primary,
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1,
    marginBottom: 14,
  },

  topRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  topThumb: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: "#10291E",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  topInfo: {
    flex: 1,
  },

  topName: {
    color: Colors.white,
    fontSize: 15,
    fontWeight: "600",
  },

  topSubtext: {
    color: Colors.muted,
    fontSize: 11,
    marginTop: 3,
  },

  topPercent: {
    color: Colors.primary,
    fontSize: 20,
    fontWeight: "800",
  },
});