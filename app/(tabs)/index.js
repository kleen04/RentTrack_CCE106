import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

import { Colors } from "../../constants/colors";

export default function Overview() {
  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        
        <View style={styles.header}>
          <View>
            <Text style={styles.date}>WEDNESDAY, SEP 18</Text>

            <Text style={styles.title}>Fleet overview</Text>

            <Text style={styles.subtitle}>
              Here's what's happening today.
            </Text>
          </View>

          <TouchableOpacity style={styles.profileButton}>
            <Text style={styles.profileText}>JL</Text>
          </TouchableOpacity>
        </View>

        
        <View style={styles.revenueCard}>
          <Text style={styles.revenueLabel}>
            NET REVENUE • SEPTEMBER
          </Text>

          <Text style={styles.revenueAmount}>
            ₱284,500
          </Text>

          <Text style={styles.revenueChange}>
            ↗ 12.4% from last month
          </Text>

        
          <View style={styles.chart}>
            <View style={[styles.bar, { height: 12 }]} />
            <View style={[styles.bar, { height: 26 }]} />
            <View style={[styles.bar, { height: 20 }]} />
            <View style={[styles.bar, { height: 38 }]} />
            <View style={[styles.bar, { height: 30 }]} />
            <View style={[styles.bar, { height: 46 }]} />
            <View style={[styles.bar, { height: 36 }]} />
            <View style={[styles.bar, { height: 52 }]} />
            <View style={[styles.bar, { height: 42 }]} />
            <View style={[styles.bar, { height: 60 }]} />
          </View>
        </View>

        
        <View style={styles.statsGrid}>
          <StatCard
            icon="car-outline"
            label="TOTAL FLEET"
            value="24"
            subtext="18 available"
          />

          <StatCard
            icon="time-outline"
            label="ACTIVE RENTALS"
            value="06"
            subtext="2 due today"
          />

          <StatCard
            icon="calendar-outline"
            label="BOOKINGS"
            value="12"
            subtext="4 new this week"
          />

          <StatCard
            icon="people-outline"
            label="CUSTOMERS"
            value="148"
            subtext="+8 this month"
          />
        </View>

        
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionLabel}>
              TODAY
            </Text>

            <Text style={styles.sectionTitle}>
              Needs attention
            </Text>
          </View>

          <TouchableOpacity>
            <Text style={styles.viewAll}>
              VIEW ALL
            </Text>
          </TouchableOpacity>
        </View>

        
        <View style={styles.rentalCard}>
          <View style={styles.rentalTop}>
            <Text style={styles.rentalId}>
              RT-2408
            </Text>

            <View style={styles.activeBadge}>
              <Text style={styles.activeText}>
                ACTIVE
              </Text>
            </View>
          </View>

          <Text style={styles.vehicleName}>
            Ford Ranger
          </Text>

          <Text style={styles.customerInfo}>
            NCR 1912 • Alex Rivera
          </Text>

          <View style={styles.dateBox}>
            <Ionicons
              name="calendar-outline"
              size={20}
              color={Colors.muted}
            />

            <View>
              <Text style={styles.dateMain}>
                Sep 16, 9:00 AM
              </Text>

              <Text style={styles.dateSecondary}>
                to Sep 19, 9:00 AM
              </Text>
            </View>
          </View>

          <View style={styles.rentalBottom}>
            <View>
              <Text style={styles.totalLabel}>
                TOTAL
              </Text>

              <Text style={styles.totalAmount}>
                ₱13,800
              </Text>
            </View>

            <TouchableOpacity
              style={styles.checkoutButton}
              onPress={() =>
                router.push("/booking/checkout")
              }
            >
              <Text style={styles.checkoutText}>
                Checkout
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        
        <View style={styles.quickActions}>
          <QuickAction
            icon="add"
            label="Add vehicle"
            onPress={() => router.push("/vehicle/add")}
          />

          <QuickAction
            icon="calendar-outline"
            label="New booking"
            onPress={() => router.push("/booking/add")}
          />

          <QuickAction
            icon="bar-chart-outline"
            label="Run report"
            onPress={() => router.push("/(tabs)/reports")}
          />
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  );
}


function StatCard({
  icon,
  label,
  value,
  subtext,
}) {
  return (
    <View style={styles.statCard}>
      <View style={styles.iconBox}>
        <Ionicons
          name={icon}
          size={20}
          color={Colors.primary}
        />
      </View>

      <Text style={styles.statLabel}>
        {label}
      </Text>

      <Text style={styles.statValue}>
        {value}
      </Text>

      <Text style={styles.statSubtext}>
        {subtext}
      </Text>
    </View>
  );
}


function QuickAction({
  icon,
  label,
  onPress,
}) {
  return (
    <TouchableOpacity
      style={styles.quickAction}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Ionicons
        name={icon}
        size={23}
        color={Colors.primary}
      />

      <Text style={styles.quickActionText}>
        {label}
      </Text>
    </TouchableOpacity>
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


  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 26,
  },

  date: {
    color: Colors.primary,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.3,
    marginBottom: 7,
  },

  title: {
    color: Colors.white,
    fontSize: 28,
    fontWeight: "500",
  },

  subtitle: {
    color: Colors.muted,
    fontSize: 12,
    marginTop: 5,
  },

  profileButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },

  profileText: {
    color: "#000000",
    fontSize: 12,
    fontWeight: "800",
  },


  revenueCard: {
    backgroundColor: Colors.primary,
    borderRadius: 18,
    padding: 20,
    height: 170,
    marginBottom: 12,
    overflow: "hidden",
  },

  revenueLabel: {
    color: "#172000",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1,
  },

  revenueAmount: {
    color: "#000000",
    fontSize: 29,
    fontWeight: "800",
    marginTop: 14,
  },

  revenueChange: {
    color: "#344A00",
    fontSize: 9,
    marginTop: 5,
  },

  chart: {
    position: "absolute",
    bottom: 8,
    left: 16,
    right: 16,
    height: 65,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },

  bar: {
    width: "8%",
    backgroundColor: "#79A51F",
    borderRadius: 4,
  },


  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },

  statCard: {
    width: "48.5%",
    minHeight: 136,
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

  statSubtext: {
    color: "#50665D",
    fontSize: 8,
    marginTop: 4,
  },


  sectionHeader: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    marginTop: 17,
    marginBottom: 14,
  },

  sectionLabel: {
    color: Colors.primary,
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1.2,
    marginBottom: 7,
  },

  sectionTitle: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: "500",
  },

  viewAll: {
    color: Colors.muted,
    fontSize: 8,
    letterSpacing: 0.7,
    marginBottom: 2,
  },


  rentalCard: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 16,
    padding: 16,
  },

  rentalTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  rentalId: {
    color: Colors.muted,
    fontSize: 9,
    letterSpacing: 1,
  },

  activeBadge: {
    borderWidth: 1,
    borderColor: "#167DA2",
    backgroundColor: "#092A35",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },

  activeText: {
    color: "#45BDE8",
    fontSize: 8,
    fontWeight: "800",
  },

  vehicleName: {
    color: Colors.white,
    fontSize: 18,
    marginTop: 16,
  },

  customerInfo: {
    color: Colors.muted,
    fontSize: 10,
    marginTop: 5,
  },

  dateBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#081A13",
    borderRadius: 10,
    padding: 12,
    marginTop: 16,
  },

  dateMain: {
    color: "#8BABA0",
    fontSize: 9,
  },

  dateSecondary: {
    color: "#536D63",
    fontSize: 9,
    marginTop: 3,
  },

  rentalBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginTop: 16,
  },

  totalLabel: {
    color: Colors.muted,
    fontSize: 8,
    marginBottom: 3,
  },

  totalAmount: {
    color: Colors.primary,
    fontSize: 18,
    fontWeight: "800",
  },

  checkoutButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 10,
  },

  checkoutText: {
    color: "#000000",
    fontSize: 10,
    fontWeight: "800",
  },

  quickActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
  },

  quickAction: {
    width: "31.5%",
    height: 78,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  quickActionText: {
    color: "#9AADA5",
    fontSize: 8,
    marginTop: 8,
  },
});