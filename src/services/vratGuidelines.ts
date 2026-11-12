import { PanchangData, GeoLocation } from '../core/panchang/types';
import { RASHI_NAMES, RASHI_DEVANAGARI } from '../core/panchang/constants';
import { calculateEkadashiParana, VratParanaDetails } from './vratParana';

export interface VratGuidance {
  vratId: 'sankashti' | 'vinayaka' | 'ekadashi' | 'pradosh' | 'purnima' | 'amavasya' | 'festival';
  titleHi: string;
  titleEn: string;
  badgeHi: string;
  badgeEn: string;
  deityHi: string;
  deityEn: string;
  significanceHi: string;
  significanceEn: string;
  moonriseTime?: string | null;
  moonriseCountdown?: string | null;
  hasMoonRisen?: boolean;
  arghyaMantraSanskrit?: string;
  arghyaMantraMeaningHi?: string;
  arghyaMantraMeaningEn?: string;
  arghyaVidhiHi?: string[];
  arghyaVidhiEn?: string[];
  permissibleFoodsHi: string[];
  permissibleFoodsEn: string[];
  prohibitedFoodsHi: string[];
  prohibitedFoodsEn: string[];
  fastingRulesHi: string[];
  fastingRulesEn: string[];
  ekadashiParana?: VratParanaDetails | null;
}

/**
 * Determines whether today is an active Vrat day in Sanatan Hindu practice,
 * and compiles authoritative Shastric guidance for moonrise, Arghya, and dietary discipline.
 */
export function getTodayVratGuidance(
  panchang: PanchangData,
  date: Date = new Date(),
  timezone: string = 'Asia/Kolkata'
): VratGuidance | null {
  const tithi = panchang.tithi.current;
  const pakshaIdx = tithi.pakshaIndex; // 1..15
  const isKrishna = tithi.paksha === 'Krishna';
  const dayOfWeek = date.getDay(); // 0 = Sun, 2 = Tue

  const formatTime = (d: Date | string | null): string => {
    if (!d) return '—';
    const dateObj = typeof d === 'string' ? new Date(d) : d;
    try {
      return new Intl.DateTimeFormat('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
        timeZone: timezone,
      }).format(dateObj);
    } catch {
      return dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
  };

  // 1. SANKASHTI CHATURTHI (Krishna Paksha 4th Tithi) & ANGARKI CHATURTHI
  if (isKrishna && pakshaIdx === 4) {
    const isAngarki = dayOfWeek === 2; // Falls on Tuesday
    const moonrise = panchang.moonTimes.moonrise;
    const nowMs = date.getTime();
    let moonriseCountdown: string | null = null;
    let hasMoonRisen = false;

    if (moonrise) {
      const moonriseMs = new Date(moonrise).getTime();
      if (nowMs >= moonriseMs) {
        hasMoonRisen = true;
        moonriseCountdown = 'चन्द्रोदय हो चुका है • चन्द्र अर्घ्य देकर व्रत पूर्ण करें';
      } else {
        const diffMins = Math.floor((moonriseMs - nowMs) / 60000);
        const hours = Math.floor(diffMins / 60);
        const mins = diffMins % 60;
        moonriseCountdown = hours > 0
          ? `चन्द्र दर्शन में लगभग ${hours} घण्टे ${mins} मिनट शेष`
          : `चन्द्र दर्शन में लगभग ${mins} मिनट शेष`;
      }
    }

    return {
      vratId: 'sankashti',
      titleHi: isAngarki ? 'अङ्गारकी संकष्टी चतुर्थी (महापुण्य फलदायी)' : 'संकष्टी चतुर्थी (श्री गणेश संकट हरण व्रत)',
      titleEn: isAngarki ? 'Angarki Sankashti Chaturthi (Supreme Ganesh Vrat)' : 'Sankashti Chaturthi (Ganesh Fasting)',
      badgeHi: isAngarki ? '🔥 अङ्गारकी योग (मंगलवार)' : '🌕 चन्द्र दर्शन व्रत',
      badgeEn: isAngarki ? '🔥 Angarki Yoga (Tuesday)' : '🌕 Moon Sight Fasting',
      deityHi: 'भगवान श्री गणेश एवं चन्द्र देव',
      deityEn: 'Lord Sri Ganesha & Chandra Deva',
      significanceHi: isAngarki
        ? 'मंगलवार को पड़ने वाली संकष्टी चतुर्थी को अङ्गारकी कहते हैं। इसका फल करोड़ों सूर्यों के ग्रहण काल में किए गए दान-तप के समान माना गया है।'
        : 'संकट नाशन गणेश स्तोत्र का पाठ एवं चन्द्रोदय के उपरान्त अर्घ्य देने से समस्त विघ्न व ऋण बाधाएं दूर होती हैं।',
      significanceEn: 'Dedicated to Lord Ganesha for removing impediments and debts. The fast is sanctified only after sighting the Moon and offering Arghya.',
      moonriseTime: moonrise ? formatTime(moonrise) : null,
      moonriseCountdown,
      hasMoonRisen,
      arghyaMantraSanskrit: 'क्षीरोदार्णव सम्भूत अत्रिनेत्र समुद्भव। गृहाणार्घ्यं शशाङ्केश रोहिणीसहितो मम॥',
      arghyaMantraMeaningHi: 'हे क्षीरसागर से प्रकट और महर्षि अत्रि के नेत्रों से उत्पन्न चन्द्रमा! रोहिणी देवी के साथ पधारकर मेरा यह पवित्र अर्घ्य स्वीकार करें।',
      arghyaMantraMeaningEn: 'O Moon born of the celestial ocean and sage Atri, with Goddess Rohini, graciously accept my sacred water offering.',
      arghyaVidhiHi: [
        'तांबे या पीतल के पात्र में शुद्ध जल, कच्चा दूध, अक्षत (अखण्डित चावल), लाल चन्दन व दूर्वा लें।',
        'चन्द्रमा के सम्मुख खड़े होकर दोनों हाथों से पात्र ऊपर उठाकर मन्त्रोच्चार सहित अर्घ्य दें।',
        'भगवान श्री गणेश को 21 दूर्वा, गुड़ व तिल के मोदक अथवा तिल-लड्डू का भोग लगाएं।',
        'आरती व सङ्कल्प के बाद सात्विक फलाहार ग्रहण कर उपवास पूर्ण करें।'
      ],
      arghyaVidhiEn: [
        'Fill a copper or brass vessel with clean water, raw milk, unpolished rice (akshat), red sandalwood, and durva grass.',
        'Face the risen Moon, raise vessel with both hands, and offer water slowly while chanting the mantra.',
        'Offer 21 blades of Durva and sesame-jaggery modaks/laddus to Lord Ganesha.',
        'Conclude with Ganesha Aarti, prayer, and satvik meal.'
      ],
      permissibleFoodsHi: ['साबूदाना खिचड़ी/खीर', 'तिल-गुड़ लड्डू', 'सिंघाड़ा व कुट्टू का आटा', 'मौसमी फल व नारियल', 'गाय का दूध व दही', 'सेंधा नमक'],
      permissibleFoodsEn: ['Sabudana khichdi / kheer', 'Til-jaggery laddus', 'Water chestnut / Kuttu flour', 'Seasonal fruits & coconut', 'Milk and curd', 'Sendha rock salt'],
      prohibitedFoodsHi: ['अन्न (चावल, गेहूँ, दालें - चन्द्रोदय से पूर्व)', 'लहसुन व प्याज़', 'सरसों तेल', 'मांसाहार व मदिरा', 'नमक (दिन के समय)'],
      prohibitedFoodsEn: ['Grains (Rice, wheat, lentils before moonrise)', 'Onion and garlic', 'Mustard oil', 'Non-vegetarian food & alcohol', 'Common table salt during the day'],
      fastingRulesHi: [
        'प्रातःकाल स्नान कर हाथ में जल लेकर संकट नाशन व्रत का सङ्कल्प करें।',
        'दिन भर निराहार अथवा केवल जलाहार व फलाहार का पालन करें।',
        'जब तक आकाश में चन्द्रमा के दर्शन न हों, अन्न ग्रहण न करें।'
      ],
      fastingRulesEn: [
        'Take a morning bath and resolve the sacred Sankashti vow.',
        'Maintain a strict fast with water/fruits only during the day.',
        'Do not consume food until the Moon has risen and Arghya is offered.'
      ],
    };
  }

  // 2. VINAYAKA CHATURTHI (Shukla Paksha 4th Tithi)
  if (!isKrishna && pakshaIdx === 4) {
    return {
      vratId: 'vinayaka',
      titleHi: 'विनायक चतुर्थी (मध्याह्न गणेश पूजन)',
      titleEn: 'Vinayaka Chaturthi (Midday Ganesha Puja)',
      badgeHi: '🌺 शुक्ल चतुर्थी',
      badgeEn: '🌺 Shukla Chaturthi',
      deityHi: 'भगवान श्री सिद्धि विनायक',
      deityEn: 'Lord Sri Siddhi Vinayaka',
      significanceHi: 'शुक्ल पक्ष की चतुर्थी को विनायक चतुर्थी कहते हैं। इसमें मध्याह्न (दोपहर) काल में गणेश जी का षोडशोपचार पूजन सर्वश्रेष्ठ माना गया है।',
      significanceEn: 'Celebrates Lord Ganesha with midday puja (Madhyahna Kaal). It is customary to avoid direct moon-gazing on Shukla Chaturthi to prevent Mithya Kalanka.',
      arghyaMantraSanskrit: 'वक्रतुण्ड महाकाय सूर्यकोटि समप्रभ। निर्विघ्नं कुरु मे देव सर्वकार्येषु सर्वदा॥',
      arghyaMantraMeaningHi: 'हे टेढ़ी सूंड वाले, विशालकाय, करोड़ों सूर्यों के समान तेजस्वी प्रभु! मेरे सभी कार्यों को सदा निर्विघ्न पूरा करें।',
      arghyaMantraMeaningEn: 'O Lord with the curved trunk and immense form, radiant as millions of suns, make all my undertakings free of obstacles.',
      arghyaVidhiHi: [
        'मध्याह्न काल (दोपहर 11:30 से 1:30) में गणेश प्रतिमा की स्थापना करें।',
        'लाल सिन्दूर, जनेऊ, 21 दूर्वा दल और मोदक अर्पित करें।',
        'गणेश अथर्वशीर्ष अथवा संकट नाशन स्तोत्र का पाठ करें।'
      ],
      arghyaVidhiEn: [
        'Set up Ganesha shrine during midday (11:30 AM to 1:30 PM).',
        'Offer red vermilion (sindoor), sacred thread, 21 blades of Durva, and sweet modaks.',
        'Recite Sri Ganapati Atharvashirsha or Sankata Nashana Stotram.'
      ],
      permissibleFoodsHi: ['मोदक व बेसन लड्डू (भोग उपरान्त)', 'फल व पंचामृत', 'साबूदाना', 'दूध-मखाना खीर'],
      permissibleFoodsEn: ['Modaks & laddus (after bhog)', 'Fruits & Panchamrit', 'Tapioca sabudana', 'Milk & foxnut kheer'],
      prohibitedFoodsHi: ['तामसिक भोजन (प्याज़, लहसुन)', 'मदिरा व मांसाहार', 'अपवित्र अन्न'],
      prohibitedFoodsEn: ['Tamasic foods (onion, garlic)', 'Alcohol & meat', 'Impure or stale food'],
      fastingRulesHi: [
        'शुक्ल चतुर्थी की रात्रि में चन्द्रमा के सीधे दर्शन करने से बचें (भाद्रपद में मिथ्या कलंक दोष)।',
        'मध्याह्न गणेश आरती के बाद प्रसाद ग्रहण करें।'
      ],
      fastingRulesEn: [
        'Avoid gazing directly at the Moon on Shukla Chaturthi night.',
        'Consume prasad after midday Ganesha aarti.'
      ],
    };
  }

  // 3. EKADASHI VRAT (Paksha Index 11)
  if (pakshaIdx === 11) {
    const location: GeoLocation = panchang.location;
    const parana = calculateEkadashiParana(panchang, location, date);

    return {
      vratId: 'ekadashi',
      titleHi: 'पवित्र एकादशी महाव्रत (श्री हरि विष्णु आराधना)',
      titleEn: 'Sacred Ekadashi Mahavrat (Vishnu Worship)',
      badgeHi: '🌸 सर्वपाप हरणी एकादशी',
      badgeEn: '🌸 Supreme Fast of Lord Vishnu',
      deityHi: 'भगवान श्री हरि विष्णु एवं माता महालक्ष्मी',
      deityEn: 'Lord Sri Hari Vishnu & Goddess Mahalakshmi',
      significanceHi: 'पद्म पुराण के अनुसार एकादशी के दिन समस्त पाप अन्न में वास करते हैं। इस दिन अन्न त्याग कर विष्णु स्मरण करने से अश्वमेध यज्ञ के समान पुण्य प्राप्त होता है।',
      significanceEn: 'Per Padma Purana, all cosmic sins reside in grains on Ekadashi. Abstaining from grains and chanting Vishnu Sahasranama cleanses ancestral karma.',
      ekadashiParana: parana,
      arghyaMantraSanskrit: 'नमो नमस्ते गोविन्द बुधश्रवणसंज्ञक। अघौघसंक्षयं कृत्वा सर्वसौख्यप्रदो भव॥',
      arghyaMantraMeaningHi: 'हे गोविन्द! आपको बारम्बार नमस्कार है। मेरे समस्त पापों का क्षय कर मुझे शाश्वत सुख व शान्ति प्रदान करें।',
      arghyaMantraMeaningEn: 'Salutations to Lord Govinda! Please dissolve all worldly sins and bestow lasting spiritual peace and happiness.',
      arghyaVidhiHi: [
        'तुलसीदल, पीले पुष्प, पीला चन्दन व पंचामृत से भगवान विष्णु का अभिषेक करें।',
        'तुलसी जी के समक्ष घी का दीपक जलाएं (एकादशी पर तुलसी में जल न चढ़ाएं, केवल दीपदान करें)।',
        'विष्णु सहस्रनाम, भगवद्गीता के 11वें/12वें अध्याय अथवा "ॐ नमो भगवते वासुदेवाय" का 108 जप करें।'
      ],
      arghyaVidhiEn: [
        'Worship Lord Vishnu with Tulsi leaves, yellow flowers, and sandalwood paste.',
        'Light a pure ghee deepam at the Tulsi shrine (custom says do not water Tulsi on Ekadashi, only offer lamp).',
        'Chant Vishnu Sahasranama or "Om Namo Bhagavate Vasudevaya" 108 times.'
      ],
      permissibleFoodsHi: [
        'फल: केला, सेब, अनार, पपीता, संतरा',
        'साबूदाना, मखाना, मूंगफली व काजू-बादाम',
        'सिंघाड़ा व कुट्टू का आटा',
        'गाय का दूध, ताजा दही व शुद्ध देशी घी',
        'सेंधा नमक, काली मिर्च, अदरक व जीरा'
      ],
      permissibleFoodsEn: [
        'Fruits: Banana, apple, pomegranate, papaya',
        'Tapioca sabudana, foxnuts, peanuts, cashews',
        'Water chestnut (Singhadha) & Buckwheat (Kuttu)',
        'Cow milk, fresh yogurt, and pure desi ghee',
        'Sendha rock salt, black pepper, ginger, cumin'
      ],
      prohibitedFoodsHi: [
        'अन्न: चावल (अति वर्जित), गेहूँ, आटा, मैदा, सूजी',
        'दालें: चना, मूंग, उड़द, मसूर, राजमा, छोले',
        'सरसों तेल व तिल तेल',
        'प्याज़, लहसुन, बैंगन, फूलगोभी, हींग',
        'बाजार की तली-भुनी वस्तुएं व सामान्य नमक'
      ],
      prohibitedFoodsEn: [
        'Strictly prohibited: Rice, wheat, flour, semolina',
        'All pulses: Chana, moong, urad, masoor, beans',
        'Mustard oil & sesame cooking oil',
        'Onion, garlic, eggplant, cauliflower, asafoetida',
        'Market packaged fried snacks & regular table salt'
      ],
      fastingRulesHi: [
        'दशमी की रात्रि से ही हल्का सात्विक भोजन लें व ब्रह्मचर्य का पालन करें।',
        'एकादशी के दिन अन्न का एक भी कण मुख में न डालें। केवल फलाहार करें।',
        'द्वादशी के सूर्योदय के बाद और हरि वासर समाप्त होने पर ही पारणा करें।'
      ],
      fastingRulesEn: [
        'Maintain sattvic discipline from the eve of Dashami.',
        'Do not consume any grain or cereal throughout Ekadashi.',
        'Break the fast strictly within the Dwadashi Parana window after sunrise.'
      ],
    };
  }

  // 4. PRADOSH VRAT (Paksha Index 13)
  if (pakshaIdx === 13) {
    const sunset = panchang.sunTimes.sunset ? new Date(panchang.sunTimes.sunset) : null;
    const pradoshWindow = sunset
      ? `${formatTime(new Date(sunset.getTime() - 45 * 60000))} - ${formatTime(new Date(sunset.getTime() + 45 * 60000))}`
      : 'सायं 05:30 - 07:00';

    return {
      vratId: 'pradosh',
      titleHi: 'प्रदोष व्रत (महादेव शिव कृपा काल)',
      titleEn: 'Pradosha Vrat (Lord Shiva Twilight Vrat)',
      badgeHi: '🔱 प्रदोष काल पूजा',
      badgeEn: '🔱 Shiva Twilight Fast',
      deityHi: 'भगवान सदाशिव एवं माता पार्वती',
      deityEn: 'Lord Sadashiva & Mother Parvati',
      significanceHi: 'सूर्यास्त के समय प्रदोष काल में भगवान शिव नन्दी पर सवार होकर ब्रह्माण्ड में विचरते हैं। इस समय शिव आराधना से आरोग्य, आयु व ऐश्वर्य की प्राप्ति होती है।',
      significanceEn: 'During sunset twilight (Pradosha Kala), Lord Shiva performs the cosmic Ananda Tandava. Worshipping Shiva Lingam during this window grants health and peace.',
      arghyaMantraSanskrit: 'ॐ तत्पुरुषाय विद्महे महादेवाय धीमहि। तन्नो रुद्रः प्रचोदयात्॥',
      arghyaMantraMeaningHi: 'हम उन परम पुरुष महादेव को जानते हैं और उनका ध्यान करते हैं। वे रुद्र देव हमारी बुद्धि को सत्य मार्ग पर प्रेरित करें।',
      arghyaMantraMeaningEn: 'We meditate upon that Supreme Being Mahadeva. May that benevolent Rudra inspire and guide our intellect.',
      arghyaVidhiHi: [
        `सायं प्रदोष काल (${pradoshWindow}) में पुनः स्नान कर श्वेत वस्त्र धारण करें।`,
        'शिवलिंग पर गंगाजल, कच्चा दूध, शहद, चन्दन, भस्म व बेलपत्र अर्पित करें।',
        'महामृत्युंजय मन्त्र अथवा "ॐ नमः शिवाय" का 108 जप करें व प्रदोष स्तोत्र पढ़ें।'
      ],
      arghyaVidhiEn: [
        `Bathe and wear clean white clothes during Pradosha time (${pradoshWindow}).`,
        'Abhishekam on Shiva Lingam with holy water, raw milk, honey, sandalwood, sacred ash, and Bilva leaves.',
        'Chant Maha Mrityunjaya Mantra or "Om Namah Shivaya" 108 times.'
      ],
      permissibleFoodsHi: ['सायं पूजा उपरान्त सात्विक भोजन', 'दूध, फल, मखाना', 'साबूदाना व सूखे मेवे'],
      permissibleFoodsEn: ['Sattvic meal after evening puja', 'Milk, fruits, foxnuts', 'Sabudana & dry fruits'],
      prohibitedFoodsHi: ['दिन के समय भारी अन्न', 'मांसाहार, मदिरा, तंबाकू', 'प्याज़ व लहसुन'],
      prohibitedFoodsEn: ['Heavy food during daytime', 'Non-veg, alcohol, tobacco', 'Onion and garlic'],
      fastingRulesHi: [
        'दिन भर भगवान शिव का स्मरण करें व मन को शान्त रखें।',
        'सायं प्रदोष काल में विधिवत पूजन के उपरान्त ही भोजन ग्रहण करें।'
      ],
      fastingRulesEn: [
        'Keep the mind centered on Lord Shiva throughout the day.',
        'Break fast with sattvic food only after the evening Pradosha puja.'
      ],
    };
  }

  // 5. PURNIMA (Full Moon - Shukla Paksha 15)
  if (!isKrishna && pakshaIdx === 15) {
    return {
      vratId: 'purnima',
      titleHi: 'पूर्णिमा व्रत एवं श्री सत्यनारायण पूजन',
      titleEn: 'Purnima Vrat & Sri Satyanarayan Puja',
      badgeHi: '🌕 पूर्णिमा महायोग',
      badgeEn: '🌕 Full Moon Fast',
      deityHi: 'भगवान श्री सत्यनारायण एवं चन्द्र देव',
      deityEn: 'Lord Sri Satyanarayana & Chandra Deva',
      significanceHi: 'पूर्णिमा के दिन श्री सत्यनारायण भगवान की कथा श्रवण करने व चन्द्र दर्शन करने से घर में सुख, समृद्धि व पारिवारिक शान्ति का वास होता है।',
      significanceEn: 'Full Moon day dedicated to Satyanarayan Katha recitation, evening charity, and offering Arghya to the bright full moon.',
      arghyaMantraSanskrit: 'ॐ नमो भगवते सत्यनारायणाय। सर्वसिद्धिप्रदायिने नमः॥',
      arghyaMantraMeaningHi: 'सर्वसिद्धि प्रदान करने वाले भगवान सत्यनारायण को नमन है।',
      arghyaMantraMeaningEn: 'Salutations to Lord Satyanarayana, the bestower of all success and spiritual fulfillment.',
      arghyaVidhiHi: [
        'घर में सत्यनारायण भगवान की चौकी सजाएं, केले के पत्तों का मण्डप बनाएं।',
        'पंजीरी प्रसाद, पंचामृत, केला व तुलसी पत्र अर्पित करें।',
        'संध्या काल में पूर्ण चन्द्रमा को जल का अर्घ्य दें।'
      ],
      arghyaVidhiEn: [
        'Decorate shrine for Satyanarayana with banana leaves and yellow cloth.',
        'Offer wheat panjiri prasad, panchamrit, bananas, and Tulsi leaves.',
        'Offer Arghya to the Full Moon in the evening.'
      ],
      permissibleFoodsHi: ['सत्यनारायण पंजीरी व पंचामृत प्रसाद', 'सात्विक भोजन', 'दूध, खीर, फल'],
      permissibleFoodsEn: ['Satyanarayan panjiri & panchamrit prasad', 'Sattvic meals', 'Milk, kheer, fruits'],
      prohibitedFoodsHi: ['मांसाहार, मदिरा', 'कलह व कटु वचन', 'अशुद्ध भोजन'],
      prohibitedFoodsEn: ['Non-veg, alcohol', 'Arguments and harsh speech', 'Impure food'],
      fastingRulesHi: ['कथा श्रवण के बाद प्रसाद लेकर सात्विक भोजन करें।'],
      fastingRulesEn: ['Consume prasad after hearing Satyanarayan Katha.'],
    };
  }

  // 6. AMAVASYA (New Moon - Krishna Paksha 15)
  if (isKrishna && pakshaIdx === 15) {
    return {
      vratId: 'amavasya',
      titleHi: 'अमावस्या (पितृ तर्पण, स्नान व दान महापुण्य)',
      titleEn: 'Amavasya (Pitru Tarpan, Holy Dip & Charity)',
      badgeHi: '🌑 पितृ शान्ति काल',
      badgeEn: '🌑 Ancestral Peace Day',
      deityHi: 'पितृ देव एवं भगवान सूर्य',
      deityEn: 'Pitru Devatas & Lord Surya',
      significanceHi: 'अमावस्या तिथि पितरों को समर्पित है। इस दिन तर्पण, अन्नदान, गौसेवा एवं दीपदान करने से पितृदोष की शान्ति होती है और कुल में समृद्धि आती है।',
      significanceEn: 'Dedicated to remembering ancestors (Pitrus). Offering water tarpan, feeding cows, and donating food/clothes dissolves ancestral distress.',
      arghyaMantraSanskrit: 'ॐ पितृभ्यः स्वधायिभ्यः स्वधा नमः। पितामहेश्यः स्वधायिभ्यः स्वधा नमः॥',
      arghyaMantraMeaningHi: 'हमारे सभी पितरों व पूर्वजों को हमारी स्वधा और प्रणाम स्वीकार हो।',
      arghyaMantraMeaningEn: 'Reverent salutations and offerings to our departed ancestors and forefathers.',
      arghyaVidhiHi: [
        'दक्षिण दिशा की ओर मुख करके जल, तिल व कुश से पितरों का तर्पण करें।',
        'गाय, कौवे, कुत्ते व चींटियों को भोजन (पंचबलि) अर्पित करें।',
        'सायंकाल दक्षिण दिशा में सरसों के तेल का दीपक प्रज्वलित करें।'
      ],
      arghyaVidhiEn: [
        'Face South and offer water with black sesame and Kusha grass for ancestors.',
        'Offer food portions to cows, crows, dogs, and ants (Panchabali).',
        'Light a mustard oil lamp facing South in the evening.'
      ],
      permissibleFoodsHi: ['सात्विक भोजन (पितरों को भोग लगाने के बाद)', 'दाल-भात, खीर, पूड़ी'],
      permissibleFoodsEn: ['Sattvic meals after offering to ancestors', 'Rice, kheer, puris'],
      prohibitedFoodsHi: ['मांसाहार, मदिरा, लहसुन, प्याज़', 'शुभ कार्य का आरम्भ (नया घर, नया व्यापार)'],
      prohibitedFoodsEn: ['Meat, alcohol, onion, garlic', 'Initiating brand-new ventures / griha pravesh'],
      fastingRulesHi: ['पितृ तर्पण के बाद भोजन ग्रहण करें। घर में शान्ति व सन्तुलन बनाए रखें।'],
      fastingRulesEn: ['Honor ancestors before meals. Maintain harmony in the home.'],
    };
  }

  return null;
}
