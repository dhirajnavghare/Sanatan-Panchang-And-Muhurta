import { PanchangData } from '@/src/core/panchang/types';

export interface DailyDevataInfo {
  dayIndex: number; // 0 = Sunday, 1 = Monday, ...
  dayName: string;
  dayNameHi: string;
  deityName: string;
  deityNameHi: string;
  mantra: string;
  mantraDevanagari: string;
  significance: string;
  significanceHi: string;
  prayerId: string;
  accentColor: string;
  bgPastel: string;
}

export const WEEKDAY_DEVATAS: Record<number, DailyDevataInfo> = {
  0: {
    dayIndex: 0,
    dayName: 'Sunday (Ravivara)',
    dayNameHi: 'रविवार (भानुवार)',
    deityName: 'Lord Surya Narayana',
    deityNameHi: 'भगवान सूर्य नारायण',
    mantra: 'Om Suryaya Namah | Om Ghrinih Suryaya Namah',
    mantraDevanagari: 'ॐ सूर्याय नमः • ॐ घृणिः सूर्याय नमः',
    significance: 'Source of life, vitality (Tejas), health, eye sight, and spiritual illumination.',
    significanceHi: 'आरोग्य, तेजस्, नेत्र ज्योति, पितृ सुख एवं प्रत्यक्ष देव की उपासना।',
    prayerId: 'aditya-hridaya-stotram',
    accentColor: '#f59e0b',
    bgPastel: '#fef3c7',
  },
  1: {
    dayIndex: 1,
    dayName: 'Monday (Somavara)',
    dayNameHi: 'सोमवार (इन्दुवार)',
    deityName: 'Lord Shiva / Mahadeva',
    deityNameHi: 'भगवान शिव / महादेव',
    mantra: 'Om Namah Shivaya | Om Tryambakam Yajamahe',
    mantraDevanagari: 'ॐ नमः शिवाय • ॐ त्र्यम्बकं यजामहे',
    significance: 'Governs mind (Chandra), tranquility, freedom from fear and inner peace.',
    significanceHi: 'मानसिक शान्ति, भय मुक्ति, कालजयी चेतना एवं औढरदानी शिव कृपा।',
    prayerId: 'shiv-tandav-stotram',
    accentColor: '#0ea5e9',
    bgPastel: '#e0f2fe',
  },
  2: {
    dayIndex: 2,
    dayName: 'Tuesday (Mangalavara)',
    dayNameHi: 'मंगलवार (भौमवार)',
    deityName: 'Sri Hanuman & Mangal Dev',
    deityNameHi: 'श्री हनुमान जी एवं मंगल देव',
    mantra: 'Om Ham Hanumate Namah | Jai Bajrang Bali',
    mantraDevanagari: 'ॐ हं हनुमते नमः • जय बजरंग बली',
    significance: 'Courage, victory over obstacles, protection from negative energies and strength.',
    significanceHi: 'शौर्य, संकट निवारण, बल, बुद्धि, विद्या एवं नकारात्मक ऊर्जा से रक्षा।',
    prayerId: 'hanuman-chalisa',
    accentColor: '#ea580c',
    bgPastel: '#ffedd5',
  },
  3: {
    dayIndex: 3,
    dayName: 'Wednesday (Budhavara)',
    dayNameHi: 'बुधवार (सौम्यवार)',
    deityName: 'Lord Ganesha & Budha Dev',
    deityNameHi: 'भगवान श्री गणेश एवं बुध देव',
    mantra: 'Om Gam Ganapataye Namah',
    mantraDevanagari: 'ॐ गं गणपतये नमः • ॐ वक्रतुण्डाय हुम्',
    significance: 'Wisdom, intellect (Buddhi), communication, business success and removing hurdles.',
    significanceHi: 'बुद्धि, विवेक, विद्या, व्यापार समृद्धि एवं विघ्न विनाशन।',
    prayerId: 'ganesh-chalisa',
    accentColor: '#10b981',
    bgPastel: '#d1fae5',
  },
  4: {
    dayIndex: 4,
    dayName: 'Thursday (Guruvara)',
    dayNameHi: 'गुरुवार (बृहस्पतिवार)',
    deityName: 'Lord Vishnu & Brihaspati Dev',
    deityNameHi: 'भगवान श्री हरि विष्णु एवं देवगुरु',
    mantra: 'Om Namo Bhagavate Vasudevaya',
    mantraDevanagari: 'ॐ नमो भगवते वासुदेवाय • ॐ बृं बृहस्पतये नमः',
    significance: 'Dharma, knowledge, prosperity, family harmony, spiritual guidance and fortune.',
    significanceHi: 'धर्म, ज्ञान, ऐश्वर्य, सद्गुरु कृपा, सन्तान सुख एवं भाग्य वृद्धि।',
    prayerId: 'om-jai-jagdish-hare',
    accentColor: '#d97706',
    bgPastel: '#fef9c3',
  },
  5: {
    dayIndex: 5,
    dayName: 'Friday (Shukravara)',
    dayNameHi: 'शुक्रवार (भृगुवार)',
    deityName: 'Maa Lakshmi & Maa Durga',
    deityNameHi: 'माता महालक्ष्मी एवं माता दुर्गा',
    mantra: 'Om Shreem Hreem Kleem Mahalakshmyai Namah',
    mantraDevanagari: 'ॐ श्रीं ह्रीं क्लीं महालक्ष्म्यै नमः',
    significance: 'Abundance, beauty, artistic talent, marital harmony and Shakti empowerment.',
    significanceHi: 'वैभव, अष्टलक्ष्मी कृपा, सौंदर्य, कला, दाम्पत्य सुख एवं शक्ति जागरण।',
    prayerId: 'shri-suktam',
    accentColor: '#ec4899',
    bgPastel: '#fce7f3',
  },
  6: {
    dayIndex: 6,
    dayName: 'Saturday (Shanivara)',
    dayNameHi: 'शनिवार (मन्दवार)',
    deityName: 'Lord Shani Dev & Hanuman Ji',
    deityNameHi: 'भगवान शनिदेव एवं संकटमोचन हनुमान',
    mantra: 'Om Sham Shanaishcharaya Namah',
    mantraDevanagari: 'ॐ शं शनैश्चराय नमः • ॐ प्रां प्रीं प्रौं सः शनये नमः',
    significance: 'Justice, discipline, endurance, relief from Sade Sati and karmic purification.',
    significanceHi: 'कर्मफल न्याय, अनुशासन, धैर्य, साढ़ेसाती शांति एवं आत्मसंयम।',
    prayerId: 'sankat-mochan-hanuman-ashtak',
    accentColor: '#6366f1',
    bgPastel: '#ede9fe',
  },
};

export interface ShastricVerse {
  id: string;
  title: string;
  titleHi: string;
  timeContext: string;
  timeContextHi: string;
  shloka: string;
  transliteration: string;
  meaning: string;
  meaningHi: string;
}

export const SACRED_DAILY_VERSES: ShastricVerse[] = [
  {
    id: 'pratah-smaran',
    title: 'Morning Palm Viewing (Kara Darshanam)',
    titleHi: 'प्रातः कर दर्शन मन्त्र',
    timeContext: 'Immediately upon waking up before touching feet to ground',
    timeContextHi: 'प्रातः जागरण के समय शैया पर बैठते ही दोनों हथेलियों का दर्शन करते हुए',
    shloka: 'कराग्रे वसते लक्ष्मीः करमध्ये सरस्वती ।\nकरमूले तु गोविन्दः प्रभाते करदर्शनम् ॥',
    transliteration: 'karāgre vasate lakṣmīḥ karamadhye sarasvatī |\nkaramūle tu govindaḥ prabhāte karadarśanam ||',
    meaning: 'At the tip of the hand resides Goddess Lakshmi; in the center resides Goddess Saraswati; at the base resides Lord Govinda. Therefore, in the morning, one should behold one\'s palms.',
    meaningHi: 'हथेलियों के अग्रभाग में लक्ष्मी, मध्य में सरस्वती और मूल में भगवान गोविन्द का वास है। प्रातःकाल अपनी हथेलियों का दर्शन कर दिन को शुभ बनाएं।',
  },
  {
    id: 'bhumi-prarthana',
    title: 'Earth Forgiveness Prayer (Bhumi Vandana)',
    titleHi: 'माता पृथ्वी क्षमा प्रार्थना',
    timeContext: 'Before stepping foot on the ground from bed',
    timeContextHi: 'शैया त्याग कर भूमि पर प्रथम चरण रखने से पूर्व',
    shloka: 'समुद्रवसने देवि पर्वतस्तनमण्डले ।\nविष्णुपत्नि नमस्तुभ्यं पादस्पर्शं क्षमस्व मे ॥',
    transliteration: 'samudravasane devi parvatastanamaṇḍale |\nviṣṇupatni namastubhyaṃ pādasparśaṃ kṣamasva me ||',
    meaning: 'O Mother Earth, who is draped by the oceans and adorned by the mountains, consort of Lord Vishnu, I bow to you. Please forgive me for stepping upon you with my feet.',
    meaningHi: 'समुद्ररूपी वस्त्र धारण करने वाली, पर्वतरूपी वक्षस्थल वाली हे विष्णुपत्नी पृथ्वी देवी! आपको नमस्कार है। मेरे चरणों के स्पर्श के लिए मुझे क्षमा करें।',
  },
  {
    id: 'surya-arghya',
    title: 'Surya Arghya & Gayatri Invocation',
    titleHi: 'सूर्य अर्घ्य व गायत्री मन्त्र',
    timeContext: 'At sunrise (Pratah Sandhya) with a copper vessel filled with water',
    timeContextHi: 'सूर्योदय वेला में ताम्बे के पात्र में जल, रोली, अक्षत व लाल पुष्प लेकर',
    shloka: 'ॐ एहि सूर्य सहस्त्रांशो तेजोराशे जगत्पते ।\nअनुकम्पय मां भक्त्या गृहाणार्घ्यं दिवाकर ॥\n\nॐ भूर्भुवः स्वः तत्सवितुर्वरेण्यं\nभर्गो देवस्य धीमहि धियो यो नः प्रचोदयात् ॥',
    transliteration: 'oṃ ehi sūrya sahastrāṃśo tejorāśe jagatpate |\nanukampaya māṃ bhaktyā gṛhāṇārghyaṃ divākara ||\n\noṃ bhūrbhuvaḥ svaḥ tatsaviturvareṇyaṃ\nbhargo devasya dhīmahi dhiyo yo naḥ pracodayāt ||',
    meaning: 'O Thousand-Rayed Surya, embodiment of pure brilliance, Lord of the cosmos! Have grace on this devotee and accept my water offering. We meditate upon the supreme divine brilliance of Savita; may that Divine Light inspire and illuminate our intellects.',
    meaningHi: 'हे सहस्र किरणों वाले तेज के पुंज जगत्पति सूर्यदेव! मुझ पर कृपा कर इस अर्घ्य को स्वीकार करें। हम उस परम दिव्य सविता का ध्यान करते हैं जो हमारी बुद्धियों को सत्य मार्ग पर प्रेरित करे।',
  },
  {
    id: 'deepa-darshana',
    title: 'Evening Lamp Lighting (Deepa Jyoti)',
    titleHi: 'सायं दीप प्रज्वलन मन्त्र',
    timeContext: 'At sunset (Godhuli Vela) at home temple and Tulsi plant',
    timeContextHi: 'सायंकाल गोधूलि वेला में घर के मन्दिर व तुलसी के समीप घी/तेल का दीप जलाते समय',
    shloka: 'शुभं करोति कल्याणम् आरोग्यं धनसंपदा ।\nशत्रुबुद्धिविनाशाय दीपज्योतिर्नमोऽस्तु ते ॥\n\nदीपो ज्योतिः परं ब्रह्म दीपो ज्योतिर्जनार्दनः ।\nदीपो हरतु मे पापं दीपज्योतिर्नमोऽस्तु ते ॥',
    transliteration: 'śubhaṃ karoti kalyāṇam ārogyaṃ dhanasaṃpadā |\nśatrubuddhivināśāya dīpajyotirnamo\'stu te ||\n\ndīpo jyotiḥ paraṃ brahma dīpo jyotirjanārdanaḥ |\ndīpo haratu me pāpaṃ dīpajyotirnamo\'stu te ||',
    meaning: 'I bow to the light of the sacred lamp which brings auspiciousness, well-being, good health and wealth, and destroys malicious thoughts. Light is the Supreme Brahman and Janardana; may the light remove our transgressions.',
    meaningHi: 'कल्याण, शुभ फल, आरोग्य और धन-संपदा प्रदान करने वाली तथा तामसिक विचारों का नाश करने वाली दीप ज्योति को नमस्कार है।',
  },
  {
    id: 'ratri-smaran',
    title: 'Night Forgiveness & Surrender (Ratri Smaranam)',
    titleHi: 'शयन पूर्व आत्म-समर्पण व क्षमा प्रार्थना',
    timeContext: 'Before sleeping at night, surrendering all deeds of the day',
    timeContextHi: 'रात्रि में शयन से पूर्व दिनभर के समस्त कृत्यों को परमेश्वर को समर्पित करते हुए',
    shloka: 'करचरणकृतं वाक्कायजं कर्मजं वा\nश्रवणनयनजं वा मानसं वापराधम् ।\nविहितमविहितं वा सर्वमेतत्क्षमस्व\nजय जय करुणाब्धे श्रीमहादेव शम्भो ॥',
    transliteration: 'karacaraṇakṛtaṃ vākkāyajaṃ karmajaṃ vā\nśravaṇanayanajaṃ vā mānasaṃ vāparādham |\nvihitamavihitaṃ vā sarvametatkṣamasva\njaya jaya karuṇābdhe śrīmahādeva śambho ||',
    meaning: 'Whatever errors or transgressions I have committed with my hands, feet, voice, body, actions, ears, eyes, or in my thoughts, whether known or unknown, forgive all of them, O Mahadeva Shambho, ocean of infinite compassion!',
    meaningHi: 'हाथों, पैरों, वाणी, शरीर, कर्मों, कानों, नेत्रों अथवा मन से जो भी अपराध या भूलें आज मुझसे हुईं, हे करुणा के सागर महादेव शम्भू! उन सबको क्षमा करें।',
  },
];

/**
 * Generates the authentic Vedic Daily Sankalpa based on astronomical Panchang coordinates.
 */
export function generateDailySankalpa(
  panchang: PanchangData,
  cityName: string,
  userName?: string,
  gotra?: string
): {
  sanskrit: string;
  hindi: string;
  english: string;
} {
  const samvat = panchang.samvat.vikramSamvat;
  const tithiName = panchang.tithi.current.nameDevanagari;
  const paksha = panchang.tithi.current.pakshaDevanagari;
  const masa = panchang.masa.purnimantaNameDevanagari;
  const vara = panchang.vara.nameDevanagari;
  const nakshatra = panchang.nakshatra.current.nameDevanagari;
  const ritu = panchang.samvat.rituDevanagari || 'शरद्/हेमन्त';
  const ayana = panchang.samvat.ayanaDevanagari || 'उत्तरायण';

  const cleanGotra = gotra ? gotra.replace(/\s*\(.*?\)/, '').trim() : '';
  const cleanName = userName ? userName.trim() : '';

  const personalSanskrit = `${cleanGotra ? cleanGotra + ' गोत्रोत्पन्नः ' : ''}${cleanName ? cleanName + ' नामधेयः ' : ''}`;
  const personalHindi = `${cleanGotra ? cleanGotra + ' गोत्र में उत्पन्न ' : ''}${cleanName ? cleanName + ' नाम ' : ''}`;
  const personalEnglish = `${cleanGotra ? 'of ' + cleanGotra + ' Gotra, ' : ''}${cleanName ? 'I, ' + cleanName + ', ' : 'I '}`;

  const sanskrit = `ॐ विष्णुर्विष्णुर्विष्णुः। श्रीमद्भगवतो महापुरुषस्य विष्णोराज्ञया प्रवर्तमानस्य अद्य श्रीब्रह्मणो द्वितीये परार्धे श्रीश्वेतवाराहकल्पे वैवस्वतमन्वन्तरे अष्टाविंशतितमे कलियुगे कलिप्रथमचरणे जम्बूद्वीपे भरतखण्डे भारतवर्षे ${cityName} क्षेत्रे, श्रीविक्रमादित्य संवत्सरे ${samvat}, श्रीसूर्य ${ayana}े, ${ritu} ऋतौ, ${masa} मासे, ${paksha} पक्षे, ${tithiName} तिथौ, ${vara} वासरे, ${nakshatra} नक्षत्रे, ${personalSanskrit}मम आत्मनः श्रुतिस्मृतिपुराणोक्त पुण्यफलप्राप्त्यर्थं, सकल पापक्षयपूर्वकं धर्मार्थकाममोक्ष चतुर्विध पुरुषार्थ सिद्ध्यर्थं, श्रीपरमेश्वर प्रीत्यर्थं प्रातः/दैनिक नित्यकर्म सङ्कल्पम् अहं करिष्ये।`;

  const hindi = `परमेश्वर श्रीविष्णु की आज्ञा से, श्वेतवाराह कल्प, वैवस्वत मन्वन्तर, कलियुग के प्रथम चरण में, भारतवर्ष के '${cityName}' पावन क्षेत्र में, विक्रम संवत् ${samvat}, ${ayana}, ${ritu} ऋतु, ${masa} मास, ${paksha} पक्ष, ${tithiName} तिथि, ${vara}वार तथा ${nakshatra} नक्षत्र में — ${personalHindi}मैं अपने समस्त पापों के क्षय तथा धर्म, अर्थ, काम, मोक्ष की सिद्धि एवं परमेश्वर की प्रसन्नता हेतु आज का दैनिक नित्यकर्म संकल्प करता हूँ।`;

  const english = `By the sanction of Supreme Being Sri Vishnu, in the Svetavaraha Kalpa, Vaivaswata Manvantara, 28th Kaliyuga, in Bharatavarsha at '${cityName}', during Vikram Samvat ${samvat}, ${panchang.samvat.ayana || 'Uttarayana'}, ${panchang.masa.purnimantaName} Masa, ${panchang.tithi.current.paksha} Paksha, ${panchang.tithi.current.name} Tithi, on ${panchang.vara.name} under ${panchang.nakshatra.current.name} Nakshatra — ${personalEnglish}undertake this sacred daily Nitya Karma for spiritual purity and cosmic harmony.`;

  return { sanskrit, hindi, english };
}

/**
 * Calculates current period of the day for dynamic spiritual context.
 */
export function getCurrentSpiritualPeriod(now: Date = new Date(), sunrise?: Date, sunset?: Date): {
  periodKey: 'brahma' | 'pratah' | 'madhyahna' | 'sayam' | 'ratri';
  greetingHi: string;
  greetingEn: string;
  focusTitleHi: string;
  focusTitleEn: string;
  suggestedActionHi: string;
  suggestedActionEn: string;
} {
  const currentHour = now.getHours();
  const currentMin = now.getMinutes();
  const timeInMins = currentHour * 60 + currentMin;

  // Approx sunrise ~ 06:00 (360m), sunset ~ 18:00 (1080m) if not provided
  const sunriseMins = sunrise ? sunrise.getHours() * 60 + sunrise.getMinutes() : 360;
  const sunsetMins = sunset ? sunset.getHours() * 60 + sunset.getMinutes() : 1080;

  // Brahma Muhurta is 96m to 48m before sunrise
  const brahmaStart = Math.max(0, sunriseMins - 96);
  const brahmaEnd = Math.max(0, sunriseMins - 48);

  if (timeInMins >= brahmaStart && timeInMins < brahmaEnd) {
    return {
      periodKey: 'brahma',
      greetingHi: 'शुभ ब्रह्म मुहूर्त',
      greetingEn: 'Auspicious Brahma Muhurta',
      focusTitleHi: 'ब्रह्म मुहूर्त ध्यान व जागरण',
      focusTitleEn: 'Brahma Muhurta Meditation',
      suggestedActionHi: 'आत्म-चिंतन, प्राणायाम व कराग्रे वसते लक्ष्मीः कर दर्शन करें।',
      suggestedActionEn: 'Awaken, contemplate the Divine and view palms with Kara Darshanam.',
    };
  }

  if (timeInMins < 720) { // Before 12:00 PM
    return {
      periodKey: 'pratah',
      greetingHi: 'शुभ प्रभात, साधक',
      greetingEn: 'Good Morning, Sadhak',
      focusTitleHi: 'प्रातः संध्या व सूर्य अर्घ्य',
      focusTitleEn: 'Surya Arghya & Pratah Sadhana',
      suggestedActionHi: 'ताम्बे के लोटे से सूर्य देव को अर्घ्य दें और १०८ बार गायत्री जप करें।',
      suggestedActionEn: 'Offer Arghya to Surya Dev and chant Gayatri Mantra.',
    };
  }

  if (timeInMins < 960) { // 12:00 PM to 4:00 PM
    return {
      periodKey: 'madhyahna',
      greetingHi: 'शुभ मध्याह्न',
      greetingEn: 'Good Afternoon',
      focusTitleHi: 'अभिजित मुहूर्त व सात्विक कर्म',
      focusTitleEn: 'Abhijit Muhurta & Righteous Duty',
      suggestedActionHi: 'अन्नपूर्णा श्लोक स्मरण कर भोजन ग्रहण करें व शुभ कार्य आरम्भ करें।',
      suggestedActionEn: 'Honor Annapurna before meals and execute vital tasks in Abhijit.',
    };
  }

  if (timeInMins <= sunsetMins + 90) { // Sunset to ~7:30 PM
    return {
      periodKey: 'sayam',
      greetingHi: 'शुभ सांध्य वेला',
      greetingEn: 'Auspicious Twilight',
      focusTitleHi: 'संध्या दीप प्रज्वलन व चालीसा',
      focusTitleEn: 'Evening Lamp & Chalisa',
      suggestedActionHi: 'तुलसी व मन्दिर में दीप जलाएं तथा हनुमान चालीसा का पाठ करें।',
      suggestedActionEn: 'Light lamp at Tulsi/Altar and chant Hanuman Chalisa.',
    };
  }

  return {
    periodKey: 'ratri',
    greetingHi: 'शुभ रात्रि',
    greetingEn: 'Peaceful Night',
    focusTitleHi: 'रात्रि स्मरण व आत्म-समर्पण',
    focusTitleEn: 'Night Contemplation & Rest',
    suggestedActionHi: 'दिनभर के कर्म भगवान को अर्पित कर क्षमा मन्त्र (करचरण कृतं...) जपें।',
    suggestedActionEn: 'Offer the day to the Divine and chant the forgiveness shloka before rest.',
  };
}
