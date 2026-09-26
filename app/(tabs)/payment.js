import { View, Text, ScrollView, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import Header from "../../components/header";
import { transactions } from "../../data/transactions";
import { Colors } from "../../constants/colors";

export default function Payments() {
  const totalProcessed = transactions.reduce(
    (sum, tx) => sum + tx.amount,
    0
  );

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <Header eyebrow="PAYMENT LEDGER" title="Transactions" />

        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>PROCESSED THIS MONTH</Text>

          <Text style={styles.summaryAmount}>
            ₱{totalProcessed.toLocaleString()}
          </Text>

          <Text style={styles.summarySubtext}>
            {transactions.length} successful transactions
          </Text>
        </View>

        <Text style={styles.sectionLabel}>RECENT</Text>
        <Text style={styles.sectionTitle}>Transaction history</Text>

        <View style={styles.list}>
          {transactions.map((tx, index) => (
            <View
              key={tx.id}
              style={[
                styles.row,
                index !== transactions.length - 1 && styles.rowDivider,
              ]}
            >
              <View style={styles.iconBox}>
                <Ionicons
                  name="wallet-outline"
                  size={18}
                  color={Colors.primary}
                />
              </View>

              <View style={styles.rowInfo}>
                <Text style={styles.customer}>{tx.customer}</Text>
                <Text style={styles.subInfo}>
                  {tx.id} · {tx.method}
                </Text>
              </View>

              <View style={styles.rowRight}>
                <Text style={styles.amount}>
                  ₱{tx.amount.toLocaleString()}
                </Text>

                <View style={styles.statusBadge}>
                  <Text style={styles.statusText}>{tx.status}</Text>
                </View>
              </View>
            </View>
          ))}
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
    paddingHorizontal: 22,
    paddingTop: 24,
    paddingBottom: 30,
  },

  summaryCard: {
    backgroundColor: Colors.primary,
    borderRadius: 18,
    padding: 20,
    marginTop: 6,
    marginBottom: 26,
  },

  summaryLabel: {
    color: "#172000",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1,
  },

  summaryAmount: {
    color: "#000000",
    fontSize: 34,
    fontWeight: "800",
    marginTop: 14,
  },

  summarySubtext: {
    color: "#344A00",
    fontSize: 10,
    marginTop: 8,
  },

  sectionLabel: {
    color: Colors.primary,
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1.2,
    marginBottom: 6,
  },

  sectionTitle: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: "500",
    marginBottom: 18,
  },

  list: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 14,
    paddingHorizontal: 16,
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
  },

  rowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },

  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 9,
    backgroundColor: "#10291E",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  rowInfo: {
    flex: 1,
  },

  customer: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: "600",
  },

  subInfo: {
    color: Colors.muted,
    fontSize: 11,
    marginTop: 3,
  },

  rowRight: {
    alignItems: "flex-end",
  },

  amount: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: "700",
  },

  statusBadge: {
    borderWidth: 1,
    borderColor: Colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginTop: 6,
  },

  statusText: {
    color: Colors.primary,
    fontSize: 8,
    fontWeight: "800",
    textAlign: "center",
  },
});