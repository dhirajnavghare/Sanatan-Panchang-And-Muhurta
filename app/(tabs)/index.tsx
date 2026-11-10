import React, { useState, useMemo, useEffect } from 'react';
import {
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  FlatList,
} from 'react-native';
import { Text, View } from '@/components/Themed';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { calculatePanchang, PRESET_CITIES, GeoLocation, PanchangData } from '@/src/core/panchang';
import { useLanguage } from '@/src/core/i18n/LanguageContext';
import { cleanPlanetLord, cleanDeityName } from '@/src/core/i18n/formatters';
import { LoadingIndicator } from '@/components/LoadingIndicator';

export default function PanchangScreen() {
  const { language, calendarSystem } = useLanguage();
  const isHi = language === 'hi';

  const [currentDate, setCurrentDate] = useState<Date>(() => new Date());
  const [location, setLocation] = useState<GeoLocation>(PRESET_CITIES[0]);
  const [isLocating, setIsLocating] = useState(false);
  const [isCityModalVisible, setIsCityModalVisible] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);

  const handlePrevDay = () => {
    setIsCalculating(true);
    setTimeout(() => {
      setCurrentDate((prev) => new Date(prev.getTime() - 86400000));
      setIsCalculating(false);
    }, 120);
  };

  const handleNextDay = () => {
    setIsCalculating(true);
    setTimeout(() => {
      setCurrentDate((prev) => new Date(prev.getTime() + 86400000));
      setIsCalculating(false);
    }, 120);
  };

  const handleToday = () => {
    setIsCalculating(true);
    setTimeout(() => {
      setCurrentDate(new Date());
      setIsCalculating(false);
    }, 120);
  };

  const handleSelectCity = (city: GeoLocation) => {
    setIsCityModalVisible(false);
    setIsCalculating(true);
    setTimeout(() => {
      setLocation(city);
      setIsCalculating(false);
    }, 120);
  };

  // 100% On-Device Offline Calculation (< 1ms execution time)
  const panchang: PanchangData = useMemo(() => {
    return calculatePanchang(currentDate, location, 'Lahiri', currentDate);
  }, [currentDate, location]);

  const activeMasa = calendarSystem === 'amanta'
    ? (isHi ? `${panchang.masa.amantaNameDevanagari} मास` : `${panchang.masa.amantaName} Masa`)
    : (isHi ? `${panchang.masa.purnimantaNameDevanagari} मास` : `${panchang.masa.purnimantaName} Masa`);

  const activeChoghadiya = useMemo(() => {
    const all = [...panchang.choghadiya.day, ...panchang.choghadiya.night];
    return all.find((c) => c.isCurrent) || all[0];
  }, [panchang]);

  const formatTime = (d: Date | string | null): string => {
    if (!d) return '—';
    const date = typeof d === 'string' ? new Date(d) : d;
    try {
      return new Intl.DateTimeFormat('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
        timeZone: location.timezone,
      }).format(date);
    } catch {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
  };

  const handleGpsDetect = async () => {
    try {
      setIsLocating(true);
      setIsCalculating(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          isHi ? 'अनुमति अस्वीकृत' : 'Permission Denied',
          isHi
            ? 'सटीक सूर्योदय व पञ्चाङ्ग गणना हेतु कृपया स्थान अनुमति प्रदान करें।'
            : 'Location permission is required to detect coordinates for astronomical sunrise.'
        );
        setIsLocating(false);
        setIsCalculating(false);
        return;
      }

      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const { latitude, longitude, altitude } = loc.coords;
      const detectedTz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata';

      setLocation({
        name: isHi ? 'वर्तमान जीपीएस स्थान' : 'GPS Current Location',
        latitude,
        longitude,
        altitude: altitude ?? 0,
        timezone: detectedTz,
      });
      setIsLocating(false);
      setIsCalculating(false);
    } catch {
      setIsLocating(false);
      setIsCalculating(false);
      Alert.alert(
        isHi ? 'स्थान त्रुटि' : 'Location Error',
        isHi ? 'जीपीएस स्थान प्राप्त नहीं हो सका।' : 'Could not detect GPS location.'
      );
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Top Location Bar */}
      <View style={styles.locationBar}>
        <TouchableOpacity
          style={styles.locationChip}
          onPress={() => setIsCityModalVisible(true)}
        >
          <Ionicons name="location-sharp" size={16} color="#d97706" />
          <Text style={styles.locationText} numberOfLines={1}>
            {location.name}
          </Text>
          <Ionicons name="chevron-down" size={14} color="#71717a" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.gpsButton}
          onPress={handleGpsDetect}
          disabled={isLocating}
        >
          {isLocating ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <>
              <Ionicons name="navigate" size={14} color="#ffffff" />
              <Text style={styles.gpsButtonText}>{isHi ? 'जीपीएस' : 'GPS'}</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Date Navigation Bar */}
      <View style={styles.dateNavBar}>
        <TouchableOpacity
          style={styles.dateNavBtn}
          onPress={handlePrevDay}
          disabled={isCalculating}
        >
          <Ionicons name="chevron-back" size={16} color="#d97706" />
          <Text style={styles.dateNavBtnText}>{isHi ? 'पूर्व दिन' : 'Prev Day'}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.dateNavCenter}
          onPress={handleToday}
          disabled={isCalculating}
        >
          <Ionicons name="calendar-outline" size={14} color="#d97706" />
          <Text style={styles.dateNavCenterText}>
            {currentDate.toLocaleDateString(isHi ? 'hi-IN' : 'en-US', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.dateNavBtn}
          onPress={handleNextDay}
          disabled={isCalculating}
        >
          <Text style={styles.dateNavBtnText}>{isHi ? 'पर दिन' : 'Next Day'}</Text>
          <Ionicons name="chevron-forward" size={16} color="#d97706" />
        </TouchableOpacity>
      </View>

      {isCalculating ? (
        <LoadingIndicator
          message={isHi ? 'पञ्चाङ्ग गणना जारी है...' : 'Calculating Daily Panchang...'}
        />
      ) : (
        <>
          {/* Hero Cosmic Card */}
          <View style={styles.heroCard}>
        <View style={styles.heroHeader}>
          <Text style={styles.heroSub}>
            {activeMasa} • {isHi ? `${panchang.tithi.current.pakshaDevanagari} पक्ष` : `${panchang.tithi.current.paksha} Paksha`}
          </Text>
          <Text style={styles.heroSamvat}>
            {isHi ? `विक्रम संवत् ${panchang.samvat.vikramSamvat}` : `Vikram ${panchang.samvat.vikramSamvat}`}
          </Text>
        </View>

        <Text style={styles.heroTitle}>
          {isHi ? panchang.tithi.current.nameDevanagari : panchang.tithi.current.name}
        </Text>

        <Text style={styles.heroVara}>
          {isHi ? `${panchang.vara.nameDevanagari}वार` : panchang.vara.name} • {panchang.isoDate}
        </Text>

        {/* Live Choghadiya Banner */}
        {activeChoghadiya && (
          <View style={styles.choghadiyaPill}>
            <Ionicons name="time" size={14} color="#f59e0b" />
            <Text style={styles.choghadiyaPillText}>
              {isHi
                ? `वर्तमान: ${activeChoghadiya.nameDevanagari} (${activeChoghadiya.quality === 'Amrit' ? 'अमृत' : activeChoghadiya.quality === 'Shubh' ? 'शुभ' : activeChoghadiya.quality === 'Labh' ? 'लाभ' : 'सामान्य'})`
                : `Active: ${activeChoghadiya.name} (${activeChoghadiya.quality})`}
              {' • '}
              {formatTime(activeChoghadiya.endTime)} {isHi ? 'तक' : 'till'}
            </Text>
          </View>
        )}
      </View>

      {/* Sun & Moon Times Row */}
      <View style={styles.sunMoonGrid}>
        <View style={styles.sunTimeCard}>
          <Text style={styles.sunLabel}>{isHi ? '🌅 सूर्योदय' : '🌅 Sunrise'}</Text>
          <Text style={styles.sunVal}>{formatTime(panchang.sunTimes.sunrise)}</Text>
        </View>
        <View style={styles.sunTimeCard}>
          <Text style={styles.sunLabel}>{isHi ? '🌇 सूर्यास्त' : '🌇 Sunset'}</Text>
          <Text style={styles.sunVal}>{formatTime(panchang.sunTimes.sunset)}</Text>
        </View>
        <View style={styles.sunTimeCard}>
          <Text style={styles.sunLabel}>{isHi ? '🌟 अभिजित' : '🌟 Abhijit'}</Text>
          <Text style={styles.sunVal}>
            {panchang.muhurtas.abhijitMuhurta
              ? formatTime(panchang.muhurtas.abhijitMuhurta.startTime)
              : (isHi ? 'आज नहीं' : 'None')}
          </Text>
        </View>
        <View style={styles.sunTimeCard}>
          <Text style={[styles.sunLabel, { color: '#ef4444' }]}>{isHi ? '⏱ राहु काल' : '⏱ Rahu Kaal'}</Text>
          <Text style={[styles.sunVal, { color: '#ef4444' }]}>
            {formatTime(panchang.muhurtas.rahuKaal.startTime)}
          </Text>
        </View>
      </View>

      {/* 5 Sacred Limbs Section */}
      <Text style={styles.sectionHeading}>
        {isHi ? 'पञ्चाङ्ग के ५ पवित्र अंग' : 'The 5 Sacred Limbs (Pancha-Anga)'}
      </Text>

      {/* 1. Tithi */}
      <View style={styles.limbCard}>
        <View style={styles.limbTop}>
          <Text style={styles.limbIndex}>{isHi ? '१. तिथि' : '1. Tithi'}</Text>
          <Text style={styles.limbStatus}>
            {isHi ? `${panchang.tithi.current.pakshaDevanagari} पक्ष` : `${panchang.tithi.current.paksha} Paksha`}
          </Text>
        </View>
        <Text style={styles.limbName}>
          {isHi ? panchang.tithi.current.nameDevanagari : panchang.tithi.current.name}
        </Text>
        <Text style={styles.limbSubtitle}>
          {isHi
            ? 'चन्द्र कला एवं दैनिक तिथि (उपवास, पूजा व व्रत निर्धारक)'
            : 'Lunar phase day determining fasts, festivals, and vows'}
        </Text>
        <View style={styles.limbFooter}>
          <Text style={styles.limbEnd}>
            {isHi ? 'समाप्ति:' : 'Till'} {formatTime(panchang.tithi.endTime)}
          </Text>
          <Text style={styles.limbDeity}>
            {isHi ? 'देवता:' : 'Deity:'} {cleanDeityName(panchang.tithi.current.deity, isHi)}
          </Text>
        </View>
      </View>

      {/* 2. Nakshatra */}
      <View style={styles.limbCard}>
        <View style={styles.limbTop}>
          <Text style={styles.limbIndex}>{isHi ? '२. नक्षत्र' : '2. Nakshatra'}</Text>
          <Text style={styles.limbStatus}>
            {isHi ? `चरण ${panchang.nakshatra.current.pada}` : `Pada ${panchang.nakshatra.current.pada}`}
          </Text>
        </View>
        <Text style={styles.limbName}>
          {isHi ? panchang.nakshatra.current.nameDevanagari : panchang.nakshatra.current.name}
        </Text>
        <Text style={styles.limbSubtitle}>
          {isHi
            ? 'चन्द्र नक्षत्र मण्डल (मन, चेतना एवं जन्म नक्षत्र ऊर्जा)'
            : 'Lunar constellation governing mind, consciousness & energy'}
        </Text>
        <View style={styles.limbFooter}>
          <Text style={styles.limbEnd}>
            {isHi ? 'समाप्ति:' : 'Till'} {formatTime(panchang.nakshatra.endTime)}
          </Text>
          <Text style={styles.limbDeity}>
            {isHi ? 'स्वामी:' : 'Lord:'} {cleanPlanetLord(panchang.nakshatra.current.lord, isHi)}
          </Text>
        </View>
      </View>

      {/* 3. Yoga */}
      <View style={styles.limbCard}>
        <View style={styles.limbTop}>
          <Text style={styles.limbIndex}>{isHi ? '३. योग' : '3. Yoga'}</Text>
          <Text
            style={[
              styles.limbStatus,
              panchang.yoga.current.nature === 'Auspicious'
                ? { color: '#10b981', backgroundColor: '#ecfdf5' }
                : { color: '#ef4444', backgroundColor: '#fef2f2' },
            ]}
          >
            {isHi
              ? panchang.yoga.current.nature === 'Auspicious' ? 'शुभ' : 'अशुभ'
              : panchang.yoga.current.nature}
          </Text>
        </View>
        <Text style={styles.limbName}>
          {isHi ? panchang.yoga.current.nameDevanagari : panchang.yoga.current.name}
        </Text>
        <Text style={styles.limbSubtitle}>
          {isHi
            ? 'सूर्य-चन्द्र का संयुक्त कोण (दिन की सामान्य शुभता)'
            : 'Solilunar angular harmony measuring auspiciousness of the day'}
        </Text>
        <View style={styles.limbFooter}>
          <Text style={styles.limbEnd}>
            {isHi ? 'समाप्ति:' : 'Till'} {formatTime(panchang.yoga.endTime)}
          </Text>
          <Text style={styles.limbDeity}>
            {isHi ? `संख्या ${panchang.yoga.current.index}` : `Index ${panchang.yoga.current.index} / 27`}
          </Text>
        </View>
      </View>

      {/* 4. Karana */}
      <View style={styles.limbCard}>
        <View style={styles.limbTop}>
          <Text style={styles.limbIndex}>{isHi ? '४. करण' : '4. Karana'}</Text>
          <Text style={styles.limbStatus}>
            {isHi
              ? panchang.karana.current.type === 'Chara' ? 'चर' : 'स्थिर'
              : panchang.karana.current.type}
          </Text>
        </View>
        <Text style={styles.limbName}>
          {isHi ? panchang.karana.current.nameDevanagari : panchang.karana.current.name}
        </Text>
        <Text style={styles.limbSubtitle}>
          {isHi
            ? 'तिथि का आधा भाग (तात्कालिक सांसारिक कार्यों का फल)'
            : 'Half-tithi governing immediate action outcomes'}
        </Text>
        <View style={styles.limbFooter}>
          <Text style={styles.limbEnd}>
            {isHi ? 'समाप्ति:' : 'Till'} {formatTime(panchang.karana.endTime)}
          </Text>
          <Text style={styles.limbDeity}>
            {isHi ? 'देवता:' : 'Deity:'} {cleanDeityName(panchang.karana.current.deity, isHi)}
          </Text>
        </View>
      </View>

      {/* 5. Vara */}
      <View style={styles.limbCard}>
        <View style={styles.limbTop}>
          <Text style={styles.limbIndex}>{isHi ? '५. वार' : '5. Solar Day'}</Text>
          <Text style={styles.limbStatus}>
            {isHi ? 'सूर्योदय आधारित' : 'Sunrise-based'}
          </Text>
        </View>
        <Text style={styles.limbName}>
          {isHi ? panchang.vara.nameDevanagari : panchang.vara.name}
        </Text>
        <Text style={styles.limbSubtitle}>
          {isHi
            ? 'सौर दिवस (सूर्योदय से आरम्भ होने वाला प्रधान ग्रह वार)'
            : 'Solar weekday commencing at sunrise with governing planet'}
        </Text>
        <View style={styles.limbFooter}>
          <Text style={styles.limbEnd}>
            {isHi ? 'अधिपति:' : 'Lord:'} {cleanPlanetLord(panchang.vara.lordPlanet, isHi)}
          </Text>
          <Text style={styles.limbDeity}>
            {isHi ? '१००% ऑफलाइन गणना' : '100% Offline Computed'}
          </Text>
        </View>
      </View>
        </>
      )}

      {/* City Selection Modal */}
      <Modal visible={isCityModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{isHi ? 'तीर्थ अथवा नगर चुनें' : 'Select City or Tirtha'}</Text>
              <TouchableOpacity onPress={() => setIsCityModalVisible(false)}>
                <Ionicons name="close" size={24} color="#71717a" />
              </TouchableOpacity>
            </View>

            <FlatList
              data={PRESET_CITIES}
              keyExtractor={(item) => item.name}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.cityRow,
                    item.name === location.name && styles.cityRowSelected,
                  ]}
                  onPress={() => handleSelectCity(item)}
                >
                  <Text
                    style={[
                      styles.cityName,
                      item.name === location.name && styles.cityNameSelected,
                    ]}
                  >
                    {item.name}
                  </Text>
                  <Text style={styles.cityCoords}>
                    {item.latitude.toFixed(2)}°, {item.longitude.toFixed(2)}°
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  locationBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 8,
  },
  locationChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  locationText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#92400e',
    flex: 1,
  },
  gpsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#d97706',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 4,
  },
  gpsButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  dateNavBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f4f4f5',
    padding: 6,
    borderRadius: 14,
    marginBottom: 16,
  },
  dateNavBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    gap: 4,
  },
  dateNavBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#d97706',
  },
  dateNavCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    elevation: 1,
  },
  dateNavCenterText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#18181b',
  },
  heroCard: {
    backgroundColor: '#16173d',
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'transparent',
    marginBottom: 6,
  },
  heroSub: {
    color: '#fbbf24',
    fontSize: 12,
    fontWeight: '600',
  },
  heroSamvat: {
    color: '#a5b4fc',
    fontSize: 11,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginVertical: 4,
  },
  heroVara: {
    fontSize: 13,
    color: '#c7d2fe',
    marginBottom: 12,
  },
  choghadiyaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  choghadiyaPillText: {
    color: '#fef3c7',
    fontSize: 11,
    fontWeight: '600',
  },
  sunMoonGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 6,
  },
  sunTimeCard: {
    flex: 1,
    backgroundColor: '#f4f4f5',
    padding: 10,
    borderRadius: 14,
    alignItems: 'center',
  },
  sunLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#71717a',
    marginBottom: 2,
  },
  sunVal: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#18181b',
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#18181b',
    marginBottom: 12,
  },
  limbCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e4e4e7',
    borderRadius: 18,
    padding: 14,
    marginBottom: 10,
  },
  limbTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
    backgroundColor: 'transparent',
  },
  limbIndex: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#d97706',
    textTransform: 'uppercase',
  },
  limbStatus: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#6366f1',
    backgroundColor: '#eef2ff',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  limbName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#18181b',
  },
  limbSubtitle: {
    fontSize: 11,
    color: '#71717a',
    marginTop: 2,
    marginBottom: 8,
  },
  limbFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#f4f4f5',
    paddingTop: 8,
    backgroundColor: 'transparent',
  },
  limbEnd: {
    fontSize: 11,
    color: '#52525b',
    fontWeight: '500',
  },
  limbDeity: {
    fontSize: 11,
    color: '#71717a',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: 'transparent',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#18181b',
  },
  cityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f4f4f5',
    backgroundColor: 'transparent',
  },
  cityRowSelected: {
    backgroundColor: '#fef3c7',
  },
  cityName: {
    fontSize: 14,
    color: '#18181b',
  },
  cityNameSelected: {
    fontWeight: 'bold',
    color: '#92400e',
  },
  cityCoords: {
    fontSize: 12,
    color: '#a1a1aa',
  },
});
