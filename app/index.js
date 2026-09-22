import { useMemo, useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from './_layout';

/* ──────────────────────────────────────────────────────────────────────
   This file recreates the visual language of the RenTrack app:
   dark background, lime accent, rounded "panel" cards, an eyebrow +
   big title header, a search bar, horizontal filter chips, a card
   grid, and a bottom tab bar. Swap SAMPLE_ITEMS / TABS / the JSX below
   for your own content — the styles at the bottom are what carry the
   look, so keep those mostly as-is.
   ────────────────────────────────────────────────────────────────── */

const TABS = [
  { key: 'home', label: 'Home', icon: 'H' },
  { key: 'activity', label: 'Activity', icon: 'A' },
  { key: 'profile', label: 'Profile', icon: 'P' },
];

const SAMPLE_ITEMS = [
  {
    id: '1',
    title: 'Item One',
    subtitle: 'Short description',
    status: 'Active',
    value: 'PHP 1,200',
    image: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: '2',
    title: 'Item Two',
    subtitle: 'Short description',
    status: 'Pending',
    value: 'PHP 850',
    image: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: '3',
    title: 'Item Three',
    subtitle: 'Short description',
    status: 'Inactive',
    value: 'PHP 500',
    image: 'https://images.unsplash.com/photo-1502877338535-766e1452684a?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: '4',
    title: 'Item Four',
    subtitle: 'Short description',
    status: 'Active',
    value: 'PHP 2,000',
    image: 'https://images.unsplash.com/photo-1494905998402-395d579af36f?auto=format&fit=crop&w=800&q=80',
  },
];

const ACTIVITY = [
  { id: 'h1', text: 'Item Two marked pending', time: '2h ago' },
  { id: 'h2', text: 'Item One updated', time: '5h ago' },
  { id: 'h3', text: 'Item Four added', time: 'Yesterday' },
];

function statusColor(status) {
  if (status === 'Active') return colors.lime;
  if (status === 'Pending') return colors.orange;
  if (status === 'Inactive') return colors.red;
  return colors.blue;
}

function Header({ eyebrow, title, action }) {
  return (
    <View style={s.header}>
      <View style={{ flexShrink: 1, paddingRight: 16 }}>
        <Text style={s.eyebrow}>{eyebrow}</Text>
        <Text style={s.title}>{title}</Text>
      </View>
      {action || (
        <View style={s.avatar}>
          <Text style={s.avatarText}>YOU</Text>
        </View>
      )}
    </View>
  );
}

function StatusPill({ status }) {
  const color = statusColor(status);
  return (
    <View style={[s.pill, { borderColor: color + 'AA' }]}>
      <Text style={[s.pillText, { color }]}>{status.toUpperCase()}</Text>
    </View>
  );
}

function SectionTitle({ children, right }) {
  return (
    <View style={s.section}>
      <Text style={s.sectionText}>{children}</Text>
      {!!right && <Text style={s.sectionRight}>{right}</Text>}
    </View>
  );
}

function AddButton({ onPress }) {
  return (
    <Pressable onPress={onPress} style={s.add}>
      <Text style={s.addText}>+</Text>
    </Pressable>
  );
}

function HomeTab({ query, setQuery, filter, setFilter, items }) {
  const activeCount = SAMPLE_ITEMS.filter((i) => i.status === 'Active').length;
  return (
    <>
      <Header eyebrow="YOUR APP / OVERVIEW" title="Dashboard" action={<AddButton onPress={() => {}} />} />

      <View style={s.pulse}>
        <View>
          <Text style={s.pulseKicker}>SUMMARY / LIVE</Text>
          <Text style={s.pulseValue}>
            {activeCount} active <Text style={s.pulseMuted}>/ {SAMPLE_ITEMS.length} total</Text>
          </Text>
        </View>
        <Text style={s.pulseMark}>LIVE</Text>
      </View>

      <View style={s.search}>
        <Text style={s.searchMark}>Q</Text>
        <TextInput
          style={s.searchInput}
          value={query}
          onChangeText={setQuery}
          placeholder="Search"
          placeholderTextColor="#6F8979"
        />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filters}>
        {['All', 'Active', 'Pending', 'Inactive'].map((item) => (
          <Pressable
            key={item}
            onPress={() => setFilter(item)}
            style={[s.filter, filter === item && s.filterActive]}
          >
            <Text style={[s.filterText, filter === item && s.filterTextActive]}>{item}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <SectionTitle right={items.length + ' ITEMS'}>ALL ITEMS</SectionTitle>

      <View style={s.grid}>
        {items.map((item) => (
          <Pressable key={item.id} style={s.card}>
            <Image source={{ uri: item.image }} style={s.cardImage} />
            <View style={s.cardBody}>
              <StatusPill status={item.status} />
              <Text style={s.cardTitle}>{item.title.toUpperCase()}</Text>
              <Text numberOfLines={1} style={s.cardSubtitle}>{item.subtitle}</Text>
              <Text style={s.cardValue}>{item.value}</Text>
            </View>
          </Pressable>
        ))}
      </View>
      {!items.length && <Text style={s.empty}>Nothing matches that search.</Text>}

      <Pressable style={s.primaryButton}>
        <Text style={s.primaryButtonText}>+  ADD NEW ITEM</Text>
      </Pressable>
    </>
  );
}

function ActivityTab() {
  return (
    <>
      <Header eyebrow="YOUR APP / HISTORY" title="Activity" />
      <SectionTitle right={ACTIVITY.length + ' EVENTS'}>RECENT ACTIVITY</SectionTitle>
      {ACTIVITY.map((event) => (
        <View key={event.id} style={s.activityRow}>
          <View style={s.activityDot} />
          <View style={{ flex: 1 }}>
            <Text style={s.activityText}>{event.text}</Text>
            <Text style={s.activityTime}>{event.time}</Text>
          </View>
        </View>
      ))}
    </>
  );
}

function ProfileTab() {
  return (
    <>
      <Header eyebrow="YOUR APP / ACCOUNT" title="Profile" />
      <View style={s.profileCard}>
        <View style={s.avatarLarge}>
          <Text style={s.avatarLargeText}>YOU</Text>
        </View>
        <Text style={s.profileName}>Your Name</Text>
        <Text style={s.profileMeta}>you@example.com</Text>
      </View>
      <Pressable style={[s.primaryButton, { marginTop: 20 }]}>
        <Text style={s.primaryButtonText}>EDIT PROFILE</Text>
      </Pressable>
      <Pressable style={s.outlineButton}>
        <Text style={s.outlineButtonText}>SIGN OUT</Text>
      </Pressable>
    </>
  );
}

function BottomNav({ current, onChange }) {
  return (
    <View style={s.nav}>
      {TABS.map((tab) => {
        const active = current === tab.key;
        return (
          <Pressable key={tab.key} onPress={() => onChange(tab.key)} style={s.navItem}>
            <View style={[s.navIcon, active && s.navIconActive]}>
              <Text style={[s.navIconText, active && s.navIconTextActive]}>{tab.icon}</Text>
            </View>
            <Text numberOfLines={1} style={[s.navLabel, active && s.navLabelActive]}>
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function Index() {
  const [tab, setTab] = useState('home');
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('All');

  const items = useMemo(
    () =>
      SAMPLE_ITEMS.filter(
        (item) =>
          (filter === 'All' || item.status === filter) &&
          item.title.toLowerCase().includes(query.toLowerCase())
      ),
    [query, filter]
  );

  return (
    <SafeAreaView style={s.safe} edges={['top', 'left', 'right']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.page}>
        {tab === 'home' && (
          <HomeTab query={query} setQuery={setQuery} filter={filter} setFilter={setFilter} items={items} />
        )}
        {tab === 'activity' && <ActivityTab />}
        {tab === 'profile' && <ProfileTab />}
      </ScrollView>
      <BottomNav current={tab} onChange={setTab} />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  page: { padding: 20, paddingBottom: 110 },

  header: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginTop: 8, marginBottom: 18 },
  eyebrow: { color: colors.lime, fontSize: 9, fontWeight: '900', letterSpacing: 1.3 },
  title: { color: colors.paper, fontSize: 32, lineHeight: 38, fontWeight: '900', letterSpacing: -0.8, marginTop: 3 },
  avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.orange, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: colors.dark, fontSize: 9, fontWeight: '900' },

  pulse: { backgroundColor: colors.panel2, borderWidth: 1, borderColor: colors.line, borderRadius: 15, padding: 15, marginBottom: 15, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pulseKicker: { color: colors.lime, fontSize: 9, letterSpacing: 1, fontWeight: '900' },
  pulseValue: { color: colors.paper, fontSize: 22, fontWeight: '900', marginTop: 5 },
  pulseMuted: { color: colors.muted },
  pulseMark: { color: colors.dark, backgroundColor: colors.lime, overflow: 'hidden', borderRadius: 5, paddingVertical: 5, paddingHorizontal: 7, fontSize: 8, letterSpacing: 0.6, fontWeight: '900' },

  search: { height: 48, backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.line, borderRadius: 13, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, marginBottom: 14 },
  searchMark: { color: colors.muted, fontSize: 12, fontWeight: '900', marginRight: 10 },
  searchInput: { flex: 1, color: colors.paper, fontSize: 14, height: '100%' },

  filters: { gap: 8, paddingBottom: 22 },
  filter: { borderRadius: 18, borderWidth: 1, borderColor: colors.line, paddingVertical: 9, paddingHorizontal: 14 },
  filterActive: { backgroundColor: colors.lime, borderColor: colors.lime },
  filterText: { color: colors.muted, fontSize: 11, fontWeight: '800' },
  filterTextActive: { color: colors.dark },

  section: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 11 },
  sectionText: { color: colors.paper, fontSize: 10, letterSpacing: 1.05, fontWeight: '900' },
  sectionRight: { color: colors.muted, fontSize: 9, letterSpacing: 0.55, fontWeight: '800' },
  add: { height: 36, width: 36, borderRadius: 18, backgroundColor: colors.lime, alignItems: 'center', justifyContent: 'center' },
  addText: { color: colors.dark, fontSize: 22, lineHeight: 25, fontWeight: '400' },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 11 },
  card: { width: '48.4%', backgroundColor: colors.panel, borderColor: colors.line, borderWidth: 1, borderRadius: 14, overflow: 'hidden' },
  cardImage: { width: '100%', height: 82, resizeMode: 'cover' },
  cardBody: { padding: 10 },
  cardTitle: { color: colors.paper, fontSize: 15, lineHeight: 18, fontWeight: '900', marginTop: 8 },
  cardSubtitle: { color: colors.muted, fontSize: 10, marginTop: 2 },
  cardValue: { color: colors.lime, fontSize: 12, fontWeight: '900', marginTop: 7 },
  empty: { color: colors.muted, textAlign: 'center', marginTop: 25 },

  pill: { alignSelf: 'flex-start', backgroundColor: 'rgba(4,16,9,.86)', borderWidth: 1, paddingHorizontal: 7, paddingVertical: 4, borderRadius: 5 },
  pillText: { fontSize: 8, fontWeight: '900', letterSpacing: 0.55 },

  primaryButton: { height: 49, borderRadius: 10, backgroundColor: colors.lime, alignItems: 'center', justifyContent: 'center', marginTop: 20 },
  primaryButtonText: { color: colors.dark, fontSize: 10, letterSpacing: 1, fontWeight: '900' },
  outlineButton: { height: 49, borderRadius: 10, borderWidth: 1, borderColor: colors.lime, alignItems: 'center', justifyContent: 'center', marginTop: 10 },
  outlineButtonText: { color: colors.lime, fontSize: 10, letterSpacing: 1, fontWeight: '900' },

  activityRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.line, borderRadius: 14, padding: 14, marginBottom: 9 },
  activityDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.lime, marginTop: 5 },
  activityText: { color: colors.paper, fontSize: 13, fontWeight: '700' },
  activityTime: { color: colors.muted, fontSize: 10, marginTop: 3 },

  profileCard: { alignItems: 'center', backgroundColor: colors.panel2, borderWidth: 1, borderColor: colors.line, borderRadius: 15, padding: 24, marginTop: 8 },
  avatarLarge: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.orange, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  avatarLargeText: { color: colors.dark, fontSize: 14, fontWeight: '900' },
  profileName: { color: colors.paper, fontSize: 18, fontWeight: '900' },
  profileMeta: { color: colors.muted, fontSize: 11, marginTop: 4 },

  nav: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 80, paddingHorizontal: 5, paddingTop: 7, backgroundColor: '#0B1B13', borderTopWidth: 1, borderColor: colors.line, flexDirection: 'row' },
  navItem: { flex: 1, minWidth: 0, alignItems: 'center' },
  navIcon: { height: 27, width: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginBottom: 3 },
  navIconActive: { backgroundColor: colors.lime },
  navIconText: { color: colors.muted, fontSize: 11, fontWeight: '900' },
  navIconTextActive: { color: colors.dark },
  navLabel: { color: colors.muted, fontSize: 8, fontWeight: '700' },
  navLabelActive: { color: colors.lime },
});
