import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from "react-native";

import { Colors } from "../../constants/colors";

const TAB_DATA = [
  {
    name: "garage",
    label: "Garage",
    icon: "car-outline",
  },
  {
    name: "bookings",
    label: "Bookings",
    icon: "calendar-outline",
  },
  {
    name: "scan",
    label: "Scan",
    icon: "scan-outline",
  },
  {
    name: "customers",
    label: "Customers",
    icon: "people-outline",
  },
  {
    name: "reports",
    label: "Reports",
    icon: "bar-chart-outline",
  },
];

function CustomTabBar({ state, descriptors, navigation }) {
  return (
    <View style={styles.navbar}>
      {state.routes.map((route, index) => {
        const isFocused = state.index === index;

        const { options } = descriptors[route.key];

        const label =
          options.tabBarLabel !== undefined
            ? options.tabBarLabel
            : options.title !== undefined
            ? options.title
            : route.name;

        const tabInfo = TAB_DATA.find(
          (tab) => tab.name === route.name
        );

        const iconName = tabInfo
          ? tabInfo.icon
          : "ellipse-outline";

        const onPress = () => {
          const event = navigation.emit({
            type: "tabPress",
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        return (
          <TouchableOpacity
            key={route.key}
            activeOpacity={0.8}
            onPress={onPress}
            style={[
              styles.tab,
              isFocused && styles.activeTab,
            ]}
          >
            <Ionicons
              name={iconName}
              size={21}
              color={
                isFocused
                  ? Colors.primary
                  : Colors.muted
              }
            />

            <Text
              style={[
                styles.tabText,
                isFocused && styles.activeText,
              ]}
            >
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => (
        <CustomTabBar {...props} />
      )}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="garage"
        options={{
          title: "Garage",
        }}
      />

      <Tabs.Screen
        name="bookings"
        options={{
          title: "Bookings",
        }}
      />

      <Tabs.Screen
        name="scan"
        options={{
          title: "Scan",
        }}
      />

      <Tabs.Screen
        name="customers"
        options={{
          title: "Customers",
        }}
      />

      <Tabs.Screen
        name="reports"
        options={{
          title: "Reports",
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  navbar: {
    height: 72,

    backgroundColor: "#071711",

    borderTopWidth: 1,
    borderTopColor: Colors.border,

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",

    paddingHorizontal: 8,
    paddingTop: 6,
    paddingBottom: 6,
  },

  tab: {
    width: 68,
    height: 54,

    borderRadius: 10,

    alignItems: "center",
    justifyContent: "center",
  },

  activeTab: {
    backgroundColor: "#0D2A20",
  },

  tabText: {
    color: Colors.muted,

    fontSize: 9,

    fontWeight: "600",

    marginTop: 4,

    textAlign: "center",
  },

  activeText: {
    color: Colors.primary,

    fontWeight: "700",
  },
});
