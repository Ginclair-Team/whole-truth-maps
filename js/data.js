/* Whole Truth Map — places and copy.
   truth  = the checkable part (dates, names, numbers). Keep it verifiable.
   whole  = the lived part: what people do there, what is changing, how under-25s talk about it. Editorial voice.
   at     = [i, j] cell on the map, z = pin height in px above ground.
   meters = always the same three, 1..5: Nostalgia, Chaos, Reel-worthy. */
(function (root) {
  'use strict';
  const PK = (root.PK = root.PK || {});
  const N = 'North Kolkata', H = 'Heritage core', M = 'Maidan and central', S = 'South Kolkata', E = 'East';
  const m = (a, b, c) => [['Nostalgia', a], ['Chaos', b], ['Reel-worthy', c]];

  PK.places = [
    {
      id: 'howrah-bridge', name: 'Howrah Bridge', bn: 'রবীন্দ্র সেতু', area: H, at: [18, 36], z: 46, zoom: 3.2,
      keywords: 'rabindra setu hooghly cantilever river ferry',
      truth: {
        line: 'A steel cantilever bridge opened in 1943 and officially renamed Rabindra Setu in 1965. It was riveted together, so there is not a single nut or bolt in the main structure.',
        facts: [['1943', 'opened to traffic'], ['26,500 t', 'of steel'], ['0', 'nuts and bolts']],
      },
      whole: {
        line: 'Nobody here calls it Rabindra Setu. Photography on the bridge has long been restricted, so the city worked out the better angles: the ferry deck at sunset, or Mullick Ghat at dawn with a cha in hand. At night it glows in whatever colours the occasion calls for.',
        genz: 'The ferry is the cheapest cruise in India and I will not be taking questions.',
        meters: m(5, 5, 5), tags: ['ferry at golden hour', 'dawn shoots', 'main character bridge'],
      },
    },
    {
      id: 'mullick-ghat', name: 'Mullick Ghat flower market', bn: 'মল্লিক ঘাট ফুল বাজার', area: H, at: [20.5, 42], z: 4, zoom: 4,
      keywords: 'flowers marigold genda garland phool bazaar',
      truth: {
        line: 'A wholesale flower market under the eastern end of Howrah Bridge, trading since the 1850s and counted among the largest in Asia.',
        facts: [['1855', 'trading since'], ['4 am', 'when it wakes up']],
      },
      whole: {
        line: 'The marigolds arrive before the sun does. By six it is ankle-deep in petals, porters balancing garlands like orange pythons, and at least three photographers apologising for being in the way. Wear shoes you do not love.',
        genz: 'Woke up at 4 for this. Worth it. Never again. See you next month.',
        meters: m(4, 5, 5), tags: ['genda everything', 'photo walk', 'wear old shoes'],
      },
    },
    {
      id: 'howrah-station', name: 'Howrah Station', bn: 'হাওড়া স্টেশন', area: H, at: [6.5, 30], z: 20, zoom: 3.5,
      keywords: 'railway train junction metro underwater',
      truth: {
        line: 'The first train out of Howrah ran in 1854. The red-brick terminus you see was designed by Halsey Ricardo and opened in 1905, and with 23 platforms it has more than any other station in India.',
        facts: [['1854', 'first train'], ['1905', 'present building'], ['23', 'platforms']],
      },
      whole: {
        line: 'Since March 2024 the metro runs under the Hooghly from here, the first under-river metro in India. People rode it just to say they had been under the river. In August 2025 the last gap closed, so the same train now carries on to Sealdah and Salt Lake, and the novelty has become a commute. Upstairs it is still coolies in red, cha in clay cups and somebody sprinting for the 8:15.',
        genz: 'Took the underwater metro for the plot. The plot lasted about 45 seconds.',
        meters: m(4, 5, 3), tags: ['underwater metro', 'bhaar-er cha', 'platform sprint'],
      },
    },
    {
      id: 'yellow-taxi', name: 'The yellow taxi', bn: 'হলুদ ট্যাক্সি', area: H, at: [11.5, 30.5], z: 6, zoom: 5,
      keywords: 'ambassador cab taxi stand no refusal',
      truth: {
        line: 'The classic Kolkata cab is a Hindustan Ambassador, built upriver at Uttarpara until the factory stopped production in 2014.',
        facts: [['2014', 'last Ambassador built'], ['15 yrs', 'age limit for cabs']],
      },
      whole: {
        line: 'No new Ambassadors and a 15-year age limit means the fleet thins out every year. Everyone books an app cab and then posts a tribute to the yellow one. The meter was always more of a suggestion anyway, and "No Refusal" on the door remains the city\'s finest work of fiction.',
        genz: 'I have never once taken one. I will cry when they are gone.',
        meters: m(5, 3, 4), tags: ['no refusal (lol)', 'endangered', 'meter-e jabe?'],
      },
    },
    {
      id: 'bbd-bagh', name: 'BBD Bagh and Writers\' Building', bn: 'বিবাদী বাগ', area: H, at: [60, 28.5], z: 18, zoom: 3.2,
      keywords: 'dalhousie square lal dighi gpo office para writers',
      truth: {
        line: 'Named for Benoy, Badal and Dinesh, the three revolutionaries who stormed Writers\' Building in 1930. The building itself dates to 1777 and housed the state secretariat until 2013. In May 2026 a new government said it would move back once the building is restored.',
        facts: [['1777', 'Writers\' Building'], ['1868', 'General Post Office'], ['1930', 'the corridor battle']],
      },
      whole: {
        line: 'Locals call it office para. The real institution is lunch: stew, toast and chowmein eaten standing up on Dacres Lane, in the shadow of buildings that once ran half a subcontinent. On Sunday mornings it empties out and the heritage-walk crowd takes over.',
        genz: 'My dad worked here for 30 years. I come here for the stew and the colonial facades.',
        meters: m(4, 3, 3), tags: ['office para', 'Dacres Lane lunch', 'Sunday heritage walk'],
      },
    },
    {
      id: 'new-market', name: 'New Market and Esplanade', bn: 'নিউ মার্কেট', area: H, at: [88, 33], z: 26, zoom: 3.2,
      keywords: 'hogg market esplanade dharmatala nahoum shopping kathi roll nizam',
      truth: {
        line: 'Sir Stuart Hogg Market opened in 1874 and has been called New Market ever since. Nahoum and Sons has been baking inside it since 1902.',
        facts: [['1874', 'market opened'], ['1902', 'Nahoum\'s bakery']],
      },
      whole: {
        line: 'You do not shop here, you negotiate. Quote half, walk away, get called back. The queue for Nahoum\'s plum cake in December is its own festival, and the kathi roll, born a few steps away at Nizam\'s, is still the correct post-haggle reward.',
        genz: 'Thrift haul, but the thrift store is 150 years old and shouts back.',
        meters: m(4, 5, 3), tags: ['dor-daam', 'plum cake queue', 'roll break'],
      },
    },
    {
      id: 'shaheed-minar', name: 'Shaheed Minar', bn: 'শহীদ মিনার', area: H, at: [76, 42], z: 58, zoom: 3.5,
      keywords: 'ochterlony monument tower esplanade',
      truth: {
        line: 'Raised in 1828 as the Ochterlony Monument and rededicated in 1969 to the martyrs of the freedom movement. It stands 48 metres tall.',
        facts: [['1828', 'built'], ['48 m', 'tall'], ['1969', 'renamed']],
      },
      whole: {
        line: 'Every rally in the city either starts here or ends here. The rest of the time it is a meeting point: "under the Minar" needs no pin drop. Climbing it takes permission, so most people only know the view from the bottom looking up.',
        genz: 'Meeting point for protests, bus stand runs and every plan that starts with "let\'s just meet at Esplanade".',
        meters: m(3, 4, 2), tags: ['meet under the Minar', 'rally season'],
      },
    },
    {
      id: 'tram', name: 'The tram', bn: 'ট্রাম', area: H, at: [80, 47.6], z: 8, zoom: 4.5,
      keywords: 'tramways ctc heritage esplanade gariahat',
      truth: {
        line: 'Horse-drawn trams first ran here in 1873 and electric ones in 1902, the first in Asia. In 2024 the state said it would withdraw them. In September 2026 a new state government ordered a study on reviving and extending the network.',
        facts: [['1873', 'first horse tram'], ['1902', 'went electric'], ['2026', 'revival study ordered']],
      },
      whole: {
        line: 'The 2024 announcement turned the tram from the slow option into a cause: farewell rides, petitions, a long court case, tram lovers counting every working car. Now there is talk of bringing it back, and nobody is celebrating until a bell rings. It was never about getting anywhere fast. It was about the bell, the wooden seats and a city that agreed to move at 15 km an hour.',
        genz: 'We already said goodbye twice. If it comes back I am not getting off.',
        meters: m(5, 2, 5), tags: ['comeback?', 'ting ting', 'window seat'],
      },
    },
    {
      id: 'park-street', name: 'Park Street', bn: 'পার্ক স্ট্রিট', area: H, at: [106, 40.5], z: 34, zoom: 3.2,
      keywords: 'christmas boro din flurys trincas peter cat mother teresa sarani',
      truth: {
        line: 'Officially Mother Teresa Sarani. Flurys tea room has stood here since 1927, and the city has run a Christmas festival along the street every December since 2011.',
        facts: [['1927', 'Flurys opens'], ['2011', 'Christmas festival begins']],
      },
      whole: {
        line: 'On the 24th and 25th the road shuts to cars and the whole city turns up in Santa hats, whatever god they answer to the rest of the year. It is called Boro Din, the big day. The queue outside Peter Cat does not move and nobody leaves it.',
        genz: 'Christmas on Park Street is our Coachella. Reindeer headband mandatory.',
        meters: m(4, 5, 5), tags: ['Boro Din', 'fairy lights', 'chelo kebab queue'],
      },
    },
    {
      id: 'kumartuli', name: 'Kumartuli', bn: 'কুমোরটুলি', area: N, at: [16.5, 10], z: 6, zoom: 3.5,
      keywords: 'potters idols durga clay ahiritola ghat artisans',
      truth: {
        line: 'The potters\' quarter, settled in the 18th century. Its workshops build Durga idols from bamboo, straw and Hooghly clay, and ship them to pujas around the world.',
        facts: [['300 yrs', 'of idol making'], ['2021', 'Durga Puja on UNESCO list']],
      },
      whole: {
        line: 'In the weeks before the Puja there are more cameras than clay. Photo walks, pre-wedding shoots and art students all squeeze past half-built goddesses, while the artisans work through it with heroic patience. The eyes are painted last, on Mahalaya, and that still silences the lane.',
        genz: 'Free art school, as long as you stay out of the way.',
        meters: m(5, 4, 5), tags: ['chokkhu daan', 'photo walk rite of passage', 'clay everywhere'],
      },
    },
    {
      id: 'jorasanko', name: 'Jorasanko Thakur Bari', bn: 'জোড়াসাঁকো ঠাকুরবাড়ি', area: N, at: [36, 11], z: 18, zoom: 3.5,
      keywords: 'tagore rabindranath rabindra bharati museum chitpur',
      truth: {
        line: 'The Tagore family home, built in 1784. Rabindranath Tagore was born here in 1861 and died here in 1941. It is now a museum inside Rabindra Bharati University.',
        facts: [['1784', 'house built'], ['1861', 'Tagore born here'], ['1913', 'his Nobel Prize']],
      },
      whole: {
        line: 'On Pochishe Boishakh, his birthday, the courtyard fills from dawn with songs everyone already knows. The rest of the year Tagore lives on in caption form. Whether an indie cover of a Rabindrasangeet is tribute or sacrilege is an argument that will outlive us all.',
        genz: 'Used a Tagore line as a caption. My grandmother replied with the full poem.',
        meters: m(5, 2, 3), tags: ['Pochishe Boishakh', 'Rabindrasangeet discourse'],
      },
    },
    {
      id: 'college-street', name: 'College Street', bn: 'বইপাড়া', area: N, at: [58.5, 14], z: 6, zoom: 3.5,
      keywords: 'boi para books presidency university second hand bookshop',
      truth: {
        line: 'Known as Boi Para, the book neighbourhood. It is widely described as the largest second-hand book market in the world, and it runs past Presidency, founded as Hindu College in 1817.',
        facts: [['1817', 'Hindu College founded'], ['1.5 km', 'of book stalls']],
      },
      whole: {
        line: 'Name any book and a stall owner will say "wait" and return in four minutes with it, or with something better. Exam guides pay the rent, out-of-print poetry is the treasure, and haggling is half the fun. The book haul gets posted before the reading starts.',
        genz: 'Went for one textbook. Left with nine books and no textbook.',
        meters: m(5, 4, 4), tags: ['book haul', 'haggle politely', 'little magazines'],
      },
    },
    {
      id: 'coffee-house', name: 'Indian Coffee House', bn: 'কফি হাউস', area: N, at: [55, 13.5], z: 20, zoom: 4.5,
      keywords: 'albert hall adda infusion coffee',
      truth: {
        line: 'Upstairs in Albert Hall, a building from 1876. It became a coffee house in the 1940s and has been run by a workers\' co-operative since the 1950s.',
        facts: [['1876', 'Albert Hall built'], ['1942', 'coffee first served']],
      },
      whole: {
        line: 'The unit of time here is the adda: one infusion, four friends, three hours, zero conclusions. Poets, professors and revolutionaries all overstayed at these tables. The waiters in white turbans have seen your kind before and will bring the bill when they are ready.',
        genz: 'Rent is one black coffee. The table is yours till the arguments run out.',
        meters: m(5, 3, 4), tags: ['adda', 'one infusion, three hours', 'ceiling fans'],
      },
    },
    {
      id: 'sealdah', name: 'Sealdah Station', bn: 'শিয়ালদহ', area: N, at: [83, 11.5], z: 16, zoom: 3.2,
      keywords: 'railway local train suburban boubazar',
      truth: {
        line: 'Opened in 1869 and now one of the busiest railway stations in India, carrying well over a million suburban commuters a day.',
        facts: [['1869', 'opened'], ['1M+', 'commuters a day']],
      },
      whole: {
        line: 'The local train is a society with its own rules. Regulars on the same coach become family, hawkers sell everything from jhalmuri to safety pins, and a window seat is inherited, not found. Being a "daily passenger" is less a commute than an identity.',
        genz: 'Window seat on the 8:12 is the real luxury travel.',
        meters: m(4, 5, 2), tags: ['daily passenger', 'jhalmuri', 'window seat politics'],
      },
    },
    {
      id: 'bagbazar', name: 'Bagbazar Durga Puja', bn: 'বাগবাজার সর্বজনীন', area: N, at: [108, 9.5], z: 34, zoom: 3.2,
      keywords: 'durga puja pandal pujo festival sarbojanin dhak',
      truth: {
        line: 'One of the oldest community pujas in the city, held since 1919 and loyal to the traditional single-frame idol. Durga Puja in Kolkata joined the UNESCO list of intangible heritage in 2021.',
        facts: [['1919', 'first held'], ['2021', 'UNESCO recognition'], ['5 days', 'officially']],
      },
      whole: {
        line: 'Officially five days, in practice a season: outfits planned from July, routes drawn up like campaigns, anjali at eight on no sleep. This year carries a weight. On 17 October 2026, nineteen people died in a crush at the Chorbagan pandal, not far from here. The city still loves this more than anything, and is asking out loud how many people one lane should hold. Bagbazar does it the old way, on open ground, with one frame and one idol.',
        genz: 'We will always come back for Ma. We just want everyone to get home.',
        meters: m(5, 5, 5), tags: ['pujo asche', 'one frame, one idol', 'go early, go slow'],
      },
    },
    {
      id: 'nakhoda', name: 'Nakhoda Masjid', bn: 'নাখোদা মসজিদ', area: N, at: [38.5, 28.5], z: 26, zoom: 3.8,
      keywords: 'mosque zakaria street ramzan iftar chitpur',
      truth: {
        line: 'The city\'s principal mosque, begun in 1926 in red sandstone and modelled on Akbar\'s tomb at Sikandra. It can hold about 10,000 worshippers.',
        facts: [['1926', 'foundation laid'], ['10,000', 'capacity']],
      },
      whole: {
        line: 'During Ramzan the lane outside, Zakaria Street, becomes the best food walk in eastern India: haleem, kebabs, sewai, queues at midnight. Half the crowd is there for iftar and half for the reel, and the stall owners feed both without judgment.',
        genz: 'Zakaria Street in Ramzan. Come hungry, leave unable to walk.',
        meters: m(4, 5, 4), tags: ['Zakaria food walk', 'haleem season'],
      },
    },
    {
      id: 'victoria', name: 'Victoria Memorial', bn: 'ভিক্টোরিয়া মেমোরিয়াল', area: M, at: [60, 56], z: 52, zoom: 3,
      keywords: 'marble maidan museum angel of victory garden',
      truth: {
        line: 'Built between 1906 and 1921 in white Makrana marble, the same stone as the Taj Mahal, to a design by William Emerson. A bronze Angel of Victory turns on top of the dome when the wind is strong enough.',
        facts: [['1921', 'opened'], ['64 acres', 'of gardens'], ['16 ft', 'bronze angel']],
      },
      whole: {
        line: 'A monument to an empress who never visited, now run entirely by Kolkata for its own purposes: morning walkers with season passes, winter picnics, and couples who have turned the umbrella into architecture. The horse carriages outside are an old postcard and a live argument about animal welfare.',
        genz: 'Colonial hangover, yes. Best lawn in the city, also yes.',
        meters: m(5, 2, 5), tags: ['umbrella couples', 'winter picnic', 'morning walk mafia'],
      },
    },
    {
      id: 'eden', name: 'Eden Gardens', bn: 'ইডেন গার্ডেন্স', area: M, at: [36, 61.5], z: 16, zoom: 3,
      keywords: 'cricket stadium kkr knight riders ipl high court',
      truth: {
        line: 'India\'s oldest cricket ground, established in 1864, with room for around 68,000. It hosted its first Test in 1934 and the World Cup final in 1987.',
        facts: [['1864', 'established'], ['68,000', 'seats'], ['2001', 'that follow-on Test']],
      },
      whole: {
        line: 'On an IPL night the whole stadium turns purple and gold and sings Korbo Lorbo Jeetbo. The Knight Riders won in 2012, 2014 and 2024, and the city behaves as if it batted personally. The Eden roar is a real thing: visiting players say you feel it in the chest.',
        genz: 'Eden is not a stadium, it is a mood swing with floodlights.',
        meters: m(4, 5, 5), tags: ['Korbo Lorbo Jeetbo', 'purple and gold', 'ticket hunt'],
      },
    },
    {
      id: 'maidan', name: 'The Maidan', bn: 'ময়দান', area: M, at: [78, 65.5], z: 4, zoom: 3,
      keywords: 'football mohun bagan east bengal derby ground park lungs',
      truth: {
        line: 'About 400 hectares of open ground, cleared in the 18th century as a field of fire for Fort William and still owned by the army. It is home to the city\'s great football clubs.',
        facts: [['400 ha', 'of open ground'], ['1889', 'Mohun Bagan founded'], ['1911', 'the barefoot Shield win']],
      },
      whole: {
        line: 'The army keeping it means nobody could build on it, so the city got its lungs by accident. Every patch has a claim on it: a cricket coaching camp, a goat, a rally. And the Mohun Bagan against East Bengal derby still divides families along the oldest line there is, prawn or hilsa.',
        genz: 'Ghoti or Bangal. Chingri or ilish. Choose carefully, this is permanent.',
        meters: m(5, 3, 3), tags: ['derby day', 'chingri vs ilish', 'the lungs'],
      },
    },
    {
      id: 'fort-william', name: 'Fort William', bn: 'ফোর্ট উইলিয়াম', area: M, at: [17.5, 59.5], z: 8, zoom: 3,
      keywords: 'army eastern command strand vijay durg star fort',
      truth: {
        line: 'A bastioned star fort completed in 1781 after the original fell in 1756. It is the headquarters of the Indian Army\'s Eastern Command, and was renamed Vijay Durg in 2025.',
        facts: [['1781', 'completed'], ['1756', 'the old fort fell']],
      },
      whole: {
        line: 'The most famous place in Kolkata that almost nobody has been inside. You know it from above, on maps, or from the wall you drive past. Its real gift is next door: the breeze along the Strand, which the city has been calling Ganga-r hawa and prescribing for everything since forever.',
        genz: 'Never been in. Nobody has. Great star shape on Google Maps though.',
        meters: m(3, 1, 2), tags: ['no entry', 'Ganga-r hawa', 'Strand evenings'],
      },
    },
    {
      id: 'st-pauls', name: 'St Paul\'s, Nandan and the Planetarium', bn: 'নন্দন চত্বর', area: M, at: [77, 56], z: 38, zoom: 3,
      keywords: 'cathedral film cinema academy of fine arts rabindra sadan birla planetarium kiff',
      truth: {
        line: 'St Paul\'s Cathedral was completed in 1847. Next door, Birla Planetarium opened in 1963 and Nandan, the state film centre, in 1985, with a logo drawn by Satyajit Ray.',
        facts: [['1847', 'cathedral'], ['1963', 'planetarium'], ['1985', 'Nandan']],
      },
      whole: {
        line: 'Locals call it Nandan chottor, and it is the city\'s culture courtyard: cheap tickets for Bengali films, theatre people outside the Academy, lebu cha, little-magazine sellers. A Bengali indie film running houseful at Nandan is treated as a civic victory.',
        genz: 'Got a Nandan ticket for less than a coffee. Peak culture, minimum budget.',
        meters: m(4, 2, 3), tags: ['Nandan chottor', 'lebu cha', 'film fest queue'],
      },
    },
    {
      id: 'park-circus', name: 'Park Circus', bn: 'পার্ক সার্কাস', area: M, at: [107, 61], z: 6, zoom: 3,
      keywords: 'biryani arsalan zeeshan seven point crossing aloo potato',
      truth: {
        line: 'A seven-point crossing at the heart of the city\'s biryani belt. Kolkata biryani descends from the kitchens of Wajid Ali Shah, the Nawab of Awadh, exiled here in 1856, and it famously includes a potato.',
        facts: [['7', 'roads meet here'], ['1856', 'the Nawab arrives'], ['1', 'potato per plate, minimum']],
      },
      whole: {
        line: 'Ask three friends which biryani is best and you lose three friends. Arsalan, Aminia, Zeeshan, Royal: each has a congregation. The only shared belief is the aloo, and suggesting biryani without it is the fastest way to get uninvited from everything.',
        genz: 'The aloo is not a filler. The aloo is the point.',
        meters: m(4, 4, 4), tags: ['aloo supremacy', 'biryani wars', 'midnight plate'],
      },
    },
    {
      id: 'prinsep', name: 'Prinsep Ghat and Vidyasagar Setu', bn: 'প্রিন্সেপ ঘাট', area: S, at: [16, 77], z: 14, zoom: 3,
      keywords: 'second hooghly bridge river boat cable stayed sunset',
      truth: {
        line: 'A Palladian riverside pavilion built in 1841 in memory of James Prinsep, the scholar who deciphered the Brahmi script. Behind it runs Vidyasagar Setu, the cable-stayed bridge opened in 1992.',
        facts: [['1841', 'the ghat'], ['1992', 'the bridge'], ['823 m', 'bridge length']],
      },
      whole: {
        line: 'At sunset the country boats push off for slow rides under the lit bridge, and every third person on the bank is in a pre-wedding shoot. It is the city\'s default location for a first date, a music video, and the conversation you were putting off.',
        genz: 'Every Kolkata situationship has a Prinsep Ghat chapter.',
        meters: m(4, 2, 5), tags: ['boat ride', 'pre-wedding shoot central', 'sunset'],
      },
    },
    {
      id: 'kalighat', name: 'Kalighat', bn: 'কালীঘাট', area: S, at: [35.5, 78.5], z: 26, zoom: 3.5,
      keywords: 'kali temple shakti peeth pat painting hibiscus',
      truth: {
        line: 'One of the 51 Shakti Peethas. The present temple was completed in 1809, and the lanes around it gave their name to Kalighat painting, the bold 19th-century style sold to pilgrims.',
        facts: [['1809', 'present temple'], ['51', 'Shakti Peethas']],
      },
      whole: {
        line: 'The Kalighat pat line, those fat confident brush strokes, is everywhere again: on tote bags, tattoos and indie illustrators\' feeds. The lanes still smell of hibiscus and sweets, and a new skywalk now floats over the old hawker stretch, which people are still deciding how they feel about.',
        genz: 'Got a Kalighat-pat cat as a tattoo. My mother approves of the cat only.',
        meters: m(5, 5, 3), tags: ['pat revival', 'joba garlands', 'skywalk debate'],
      },
    },
    {
      id: 'sarobar', name: 'Rabindra Sarobar', bn: 'রবীন্দ্র সরোবর', area: S, at: [60, 85.5], z: 4, zoom: 3,
      keywords: 'lake dhakuria rowing southern avenue jogging',
      truth: {
        line: 'A man-made lake dug in the 1920s, first called Dhakuria Lake and renamed after Tagore in 1958. It has national lake status and is home to some of the oldest rowing clubs in the country.',
        facts: [['1920s', 'excavated'], ['73 acres', 'of water'], ['1958', 'renamed']],
      },
      whole: {
        line: 'It runs in shifts. Five in the morning belongs to walkers and laughing clubs, six to the run clubs, evenings to couples and birders. Whether rituals should be held in the water is argued in court most years. Kochuri on Southern Avenue afterwards is not optional.',
        genz: 'Run club at 6, kochuri at 7. Net calories: do not ask.',
        meters: m(4, 2, 4), tags: ['run club', 'rowing at dawn', 'Southern Avenue cafes'],
      },
    },
    {
      id: 'gariahat', name: 'Gariahat', bn: 'গড়িয়াহাট', area: S, at: [83, 84], z: 12, zoom: 3.2,
      keywords: 'market saree shopping flyover chess tram depot dhakuria',
      truth: {
        line: 'South Kolkata\'s busiest shopping crossing, lined with saree shops and pavement stalls. The flyover above it opened in 2002, and there is a tram depot just down the road.',
        facts: [['2002', 'flyover opened']],
      },
      whole: {
        line: 'Under the flyover there is a chess club, boards out every evening, traffic roaring past on both sides. Above ground, Puja shopping here is a contact sport: three generations, one saree, forty minutes of "last price". Nobody has ever paid the first price and lived it down.',
        genz: 'Chess under a flyover is the most Kolkata sentence ever written.',
        meters: m(4, 5, 3), tags: ['flyover chess', 'last price', 'pujo shopping'],
      },
    },
    {
      id: 'science-city', name: 'Science City', bn: 'সায়েন্স সিটি', area: E, at: [103, 79], z: 26, zoom: 3,
      keywords: 'museum em bypass dome space theatre ropeway dinosaur metro',
      truth: {
        line: 'Opened in 1997 on the EM Bypass, and the largest science centre in the Indian subcontinent.',
        facts: [['1997', 'opened'], ['50 acres', 'campus']],
      },
      whole: {
        line: 'Every child raised here has the same core memory: the school bus, the ropeway, the dinosaur that moved. Adults go back claiming it is for a niece. Outside, the Bypass has grown malls, rooftop bars and a metro viaduct, and it is now where the city goes to feel new.',
        genz: 'School excursion nostalgia unlocked. The dinosaur is still there. So am I.',
        meters: m(5, 2, 3), tags: ['school trip core', 'ropeway', 'Bypass nights'],
      },
    },
    {
      id: 'wetlands', name: 'East Kolkata Wetlands', bn: 'পূর্ব কলকাতা জলাভূমি', area: E, at: [106, 91.5], z: 4, zoom: 3,
      keywords: 'bheri fish ponds ramsar sewage ecology',
      truth: {
        line: 'About 12,500 hectares of fish ponds and marsh, protected as a Ramsar site since 2002. They treat much of the city\'s sewage naturally and send back fish and vegetables.',
        facts: [['2002', 'Ramsar site'], ['12,500 ha', 'of wetland']],
      },
      whole: {
        line: 'The city\'s kidneys, working for free, and most residents could not point to them on a map. The young climate crowd can: wetland walks, bird counts, and regular alarms about construction creeping in from the edges. Your fish curry probably started here.',
        genz: 'Free sewage treatment and it gives us fish. Protect this at all costs.',
        meters: m(2, 1, 3), tags: ['the city\'s kidneys', 'wetland walk', 'bheri fish'],
      },
    },
  ];
  if (typeof module !== 'undefined') module.exports = PK;
})(typeof window !== 'undefined' ? window : globalThis);
