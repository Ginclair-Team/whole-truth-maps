/* Whole Truth Maps: Bengaluru - places and copy.
   truth  = the checkable part (dates, names, numbers). Keep it verifiable.
   whole  = the lived part: what people do there, what is changing, how under-25s talk about it. Editorial voice.
   bn     = the name in Kannada (field name kept from the shared app).
   at     = [i, j] cell on the map, z = pin height in px above ground.
   meters = always the same three, 1..5: Old Bangalore, Traffic, Reel-worthy. */
(function (root) {
  'use strict';
  const PK = (root.PK = root.PK || {});
  const C = 'Central Bengaluru', P = 'Pete and the old south', N = 'North', S = 'The startup belt', T = 'The tech edge';
  const m = (a, b, c) => [['Old Bangalore', a], ['Traffic', b], ['Reel-worthy', c]];

  PK.areas = [C, P, N, S, T];
  PK.places = [
    {
      id: 'vidhana-soudha', name: 'Vidhana Soudha', bn: 'ವಿಧಾನ ಸೌಧ', area: C, at: [36.5, 31.6], z: 61, zoom: 3.2,
      keywords: 'legislature granite assembly government kengal hanumanthaiah',
      truth: {
        line: 'The seat of Karnataka\'s legislature, completed in 1956 under chief minister Kengal Hanumanthaiah in granite and a neo-Dravidian style. The words over the entrance read "Government work is God\'s work".',
        facts: [['1956', 'completed'], ['4', 'floors of granite']],
      },
      whole: {
        line: 'The inscription is the city\'s longest-running joke and everybody in a queue knows it by heart. For most people this is a drive-past monument: you see it lit up on Sunday evenings and holidays, you slow down, someone behind you honks. It looks best from the back seat of an auto.',
        genz: 'Government work is God\'s work, so it happens in God\'s own time.',
        meters: m(5, 3, 4), tags: ['Sunday lights', 'drive-by heritage', 'God\'s own time'],
      },
    },
    {
      id: 'high-court', name: 'High Court, Attara Kacheri', bn: 'ಅಠಾರ ಕಚೇರಿ', area: C, at: [37, 41], z: 22, zoom: 3.4,
      keywords: 'attara kacheri red building court cubbon',
      truth: {
        line: 'A long red colonnaded building finished in 1868 to hold the eighteen departments of the Mysore government. Attara means eighteen, kacheri means department. It has housed the High Court since the 1950s.',
        facts: [['1868', 'completed'], ['18', 'departments, hence the name']],
      },
      whole: {
        line: 'It stares straight at Vidhana Soudha across the road, so the court and the government have been giving each other looks for seventy years. In the 1980s it was nearly pulled down, and people fought to keep it. Saving old things by suing somebody is a proper Bengaluru hobby.',
        genz: 'The red one opposite the big one. Yes, it has a name. Yes, I looked it up.',
        meters: m(5, 3, 3), tags: ['nearly demolished', 'staring contest', 'red all over'],
      },
    },
    {
      id: 'cubbon', name: 'Cubbon Park', bn: 'ಕಬ್ಬನ್ ಪಾರ್ಕ್', area: C, at: [57.6, 35.6], z: 19, zoom: 3,
      keywords: 'park reads reading running dogs bandstand library trees tabebuia sankey',
      truth: {
        line: 'Laid out in 1870 under Richard Sankey, then chief engineer of Mysore, and officially named Sri Chamarajendra Park. It covers about 300 acres in the middle of the city.',
        facts: [['1870', 'laid out'], ['300', 'acres, roughly'], ['60+', 'Cubbon Reads chapters']],
      },
      whole: {
        line: 'On weekend mornings the park runs on clubs. Cubbon Reads, where strangers lie on the grass and read in silence, spread from here to cities across the world. Run clubs, dog meets, sketch groups and jam circles fill in the gaps. When the tabebuia blooms, the entire city stands under one tree taking the same photo, and it still works.',
        genz: 'I came to read. I read two pages, patted nine dogs and made a friend.',
        meters: m(5, 1, 5), tags: ['Cubbon Reads', 'run club Sunday', 'pink tree season'],
      },
    },
    {
      id: 'chinnaswamy', name: 'M. Chinnaswamy Stadium', bn: 'ಚಿನ್ನಸ್ವಾಮಿ ಕ್ರೀಡಾಂಗಣ', area: C, at: [63.5, 41.5], z: 16, zoom: 3.2,
      keywords: 'cricket rcb ipl royal challengers kohli ee sala cup namde',
      truth: {
        line: 'The city\'s cricket ground since 1969 and the home of Royal Challengers Bengaluru, who won the IPL in 2025 and again in 2026. In June 2025, eleven people died in a crush outside during the title celebrations. The ground was cleared to host matches again for the 2026 season.',
        facts: [['1969', 'established'], ['2025', 'first IPL title'], ['2026', 'second IPL title']],
      },
      whole: {
        line: 'Eighteen years of "Ee sala cup namde" and then it was true, twice in a row. The joy arrived with grief attached and people here do not separate the two. On match nights Cubbon Road still turns red, the DJ still plays everything too loud, and strangers still hug. They also check where the exits are now.',
        genz: 'We waited 18 years. Nobody told us what to feel when it actually came.',
        meters: m(4, 5, 5), tags: ['Ee sala cup namdu', 'red everywhere', 'never forget June 4'],
      },
    },
    {
      id: 'mg-road', name: 'MG Road and the Purple Line', bn: 'ಎಂ.ಜಿ. ರಸ್ತೆ', area: C, at: [82, 47.6], z: 24, zoom: 3.5,
      keywords: 'namma metro mahatma gandhi road boulevard rangoli brigade',
      truth: {
        line: 'The first stretch of Namma Metro, the first metro in south India, opened here in October 2011 between MG Road and Baiyappanahalli.',
        facts: [['2011', 'metro opens'], ['1st', 'metro in south India']],
      },
      whole: {
        line: 'Anyone over thirty will tell you about the trees and the boulevard that stood where the pillars are. Anyone under thirty will tell you it is 25 minutes to Indiranagar by road and seven by train. Both are right, and the argument takes about as long as the traffic.',
        genz: 'My parents miss the old MG Road. I miss nothing, I get a seat at 8 pm.',
        meters: m(4, 4, 3), tags: ['before the metro', 'window seat east', 'Brigade on Friday'],
      },
    },
    {
      id: 'church-street', name: 'Church Street', bn: 'ಚರ್ಚ್ ಸ್ಟ್ರೀಟ್', area: C, at: [80, 42.4], z: 8, zoom: 3.8,
      keywords: 'blossom bookworm books koshys pubs buskers gig indie rock metal',
      truth: {
        line: 'A short street behind MG Road, relaid in cobblestone in 2018. It is home to Blossom Book House and a run of second-hand bookshops, with Koshy\'s, founded in 1940, around the corner on St Mark\'s Road.',
        facts: [['2018', 'cobblestones laid'], ['1940', 'Koshy\'s opens']],
      },
      whole: {
        line: 'Four floors of used books, then a beer, then somebody with a guitar and a portable amp playing Coldplay at you. This is where the city taught itself rock music, where every second person over forty claims to have been in a band, and where everyone under twenty-five is currently in one.',
        genz: 'Bought three books, heard Wonderwall twice, tipped once. Balanced evening.',
        meters: m(4, 3, 5), tags: ['Blossom haul', 'buskers', 'one beer (four)'],
      },
    },
    {
      id: 'shivajinagar', name: 'Commercial Street and Russell Market', bn: 'ಶಿವಾಜಿನಗರ', area: C, at: [89, 30], z: 14, zoom: 3.5,
      keywords: 'shivajinagar russell market ramzan shopping basilica street food',
      truth: {
        line: 'The old cantonment bazaar. Russell Market was built in 1927 and still trades in flowers, fruit, meat and antiques, a few minutes from the shops of Commercial Street.',
        facts: [['1927', 'Russell Market built']],
      },
      whole: {
        line: 'Commercial Street is where your mother bargains and you hold the bags. Cross over during Ramzan and the same lanes turn into the best night out in the city: haleem, seekh, samosas, a crowd that does not thin until two. Nobody drives. Nobody who has driven drives again.',
        genz: 'Ramzan food walk: 11 stalls, 4 friends, 1 pair of elastic waistbands.',
        meters: m(5, 5, 4), tags: ['Ramzan nights', 'last price aunty', 'do not drive'],
      },
    },
    {
      id: 'auto', name: 'The auto', bn: 'ಆಟೋ', area: C, at: [91, 45], z: 8, zoom: 5,
      keywords: 'autorickshaw rickshaw meter namma yatri fare green yellow',
      truth: {
        line: 'The green and yellow three-wheeler. The official fare rose in August 2025 to 36 rupees for the first two kilometres and 18 rupees for each one after.',
        facts: [['Rs 36', 'official minimum'], ['Rs 18', 'per km after that']],
      },
      whole: {
        line: 'Nobody has seen the meter in years. What you get instead is a UPI sticker on the dash, a philosophy of life painted on the back, and a driver who may well be running a better startup than yours. Say "meter haaki" anyway. It is good manners.',
        genz: 'He quoted double, I said one line in Kannada, we are now family.',
        meters: m(4, 5, 5), tags: ['one and a half', 'meter haaki', 'back-of-auto poetry'],
      },
    },
    {
      id: 'ulsoor', name: 'Ulsoor Lake', bn: 'ಹಲಸೂರು ಕೆರೆ', area: C, at: [103.5, 36], z: 4, zoom: 3.2,
      keywords: 'halasuru lake islands boating someshwara temple',
      truth: {
        line: 'A lake of about 50 hectares dotted with islands, dating to the Kempe Gowda line of chieftains who founded the city. Halasuru Someshwara temple nearby is one of its oldest.',
        facts: [['50 ha', 'of water'], ['1537', 'city founded']],
      },
      whole: {
        line: 'Halasuru, named for jackfruit, mispronounced Ulsoor for two centuries and counting. Old Tamil families, army quarters, temple drums and a new cafe every fortnight share one shoreline. People come for the sunset, complain about the smell, and come back for the next one.',
        genz: 'Sky was doing that pink thing again so we just stood there.',
        meters: m(5, 3, 4), tags: ['pink sky club', 'it is Halasuru', 'pedal boats'],
      },
    },
    {
      id: 'majestic', name: 'Majestic', bn: 'ಮೆಜೆಸ್ಟಿಕ್', area: C, at: [12, 39], z: 10, zoom: 3,
      keywords: 'kempegowda bus station ksr railway city bus bmtc ksrtc interchange',
      truth: {
        line: 'The transport heart of the city: the KSR railway station, Kempegowda bus station and, since 2017, the metro interchange of the Purple and Green lines. The area takes its name from a cinema.',
        facts: [['2017', 'metro lines cross'], ['1', 'cinema that named it']],
      },
      whole: {
        line: 'The cinema is gone, the name is permanent. Everyone\'s Bengaluru story starts here, stepping off a night bus with one bag at 5 am while six autos shout the same number at you. Sleeper buses to everywhere leave from here at eleven, which is why the last hour of every Friday belongs to Majestic.',
        genz: 'Friday 11 pm, Majestic, tote bag, earphones, going home for the weekend.',
        meters: m(5, 5, 2), tags: ['5 am arrivals', 'sleeper bus Friday', 'film posters'],
      },
    },
    {
      id: 'kr-market', name: 'KR Market', bn: 'ಕೆ.ಆರ್. ಮಾರುಕಟ್ಟೆ', area: P, at: [9, 56], z: 14, zoom: 3.4,
      keywords: 'krishnarajendra city market flowers pete flower market',
      truth: {
        line: 'Krishnarajendra Market opened in 1928 and is named for the Mysore king. It is the city\'s largest wholesale flower market and sits at the edge of the Pete, the trading town laid out in 1537.',
        facts: [['1928', 'opened'], ['1537', 'the Pete laid out']],
      },
      whole: {
        line: 'Look down from the first floor at 6 am: circles of marigold, rose and jasmine, men asleep on sacks between them, every photographer in the city leaning on the same railing. Walk the Pete lanes behind it and you can buy one brass bell, forty metres of silk or a single screw.',
        genz: 'Woke up at 5 for the first-floor shot. So did 200 other people with cameras.',
        meters: m(5, 5, 5), tags: ['first-floor shot', 'mallige by the arm', 'Pete walk'],
      },
    },
    {
      id: 'tipu', name: 'Tipu Sultan\'s Summer Palace', bn: 'ಟಿಪ್ಪು ಬೇಸಿಗೆ ಅರಮನೆ', area: P, at: [16, 64], z: 12, zoom: 3.6,
      keywords: 'palace teak hyder ali fort',
      truth: {
        line: 'Begun by Hyder Ali in 1781 and finished by Tipu Sultan in 1791, built almost entirely of teak with carved arches and painted walls.',
        facts: [['1781', 'begun'], ['1791', 'finished']],
      },
      whole: {
        line: 'A palace you can walk past without noticing, between a hospital and a traffic jam. Inside it is cool, wooden and quiet in a way nothing around it is. Pair it with the market in the morning and the old fort gate, and you have seen more of the city than most people who work here for ten years.',
        genz: 'Whole palace made of wood, and I live in a PG made of regret.',
        meters: m(5, 4, 3), tags: ['teak everything', 'hidden in plain sight'],
      },
    },
    {
      id: 'lalbagh', name: 'Lalbagh', bn: 'ಲಾಲ್‌ಬಾಗ್', area: P, at: [37, 57], z: 20, zoom: 3,
      keywords: 'botanical garden glass house flower show rock tunnel road protest hyder ali',
      truth: {
        line: 'A botanical garden of 240 acres, begun by Hyder Ali in 1760. The Glass House dates to 1889, and the rock hill is gneiss roughly three billion years old, protected as a national geological monument.',
        facts: [['1760', 'begun'], ['1889', 'Glass House'], ['3 bn', 'years, the rock']],
      },
      whole: {
        line: 'This year the rock got hugged. When the planned Hebbal to Silk Board tunnel road looked like it would come up inside the garden, thousands turned up to form human chains, and the government has since said it will leave Lalbagh land alone. People are still watching. Otherwise it is walkers at six, flower shows twice a year and couples on the rock at sunset.',
        genz: 'Three billion years old and they wanted to put a ramp in it.',
        meters: m(5, 2, 4), tags: ['hug the rock', 'flower show', 'no tunnel here'],
      },
    },
    {
      id: 'basavanagudi', name: 'Bull Temple, Basavanagudi', bn: 'ದೊಡ್ಡ ಬಸವಣ್ಣನ ಗುಡಿ', area: P, at: [7, 78.5], z: 25, zoom: 3.4,
      keywords: 'bull temple nandi kadalekai parishe groundnut fair dodda basavana gudi',
      truth: {
        line: 'A temple from 1537 built around a single-stone Nandi about 4.5 metres tall. Each year, around the last Monday of the Kartika month, the streets outside host Kadalekai Parishe, the groundnut fair.',
        facts: [['1537', 'built'], ['4.5 m', 'of carved bull']],
      },
      whole: {
        line: 'The legend says the bull kept raiding the groundnut fields, so farmers built a temple and promised the first crop. Centuries later it is a fair of peanuts in every form, toys, Ferris wheels and lakhs of people. In 2025 it was stretched from two days to five because the city simply would not go home.',
        genz: 'A whole festival because a cow liked snacks. Relatable deity.',
        meters: m(5, 4, 4), tags: ['Kadalekai Parishe', 'peanuts, all forms', 'south side pride'],
      },
    },
    {
      id: 'vidyarthi', name: 'Vidyarthi Bhavan, Gandhi Bazaar', bn: 'ವಿದ್ಯಾರ್ಥಿ ಭವನ', area: P, at: [17, 86], z: 10, zoom: 4,
      keywords: 'masala dosa gandhi bazaar filter coffee darshini breakfast',
      truth: {
        line: 'A restaurant on Gandhi Bazaar main road, serving masala dosa since 1943.',
        facts: [['1943', 'first dosa']],
      },
      whole: {
        line: 'A waiter carries a tower of dosas stacked along one arm and does not look down. You wait outside for your name, you share a table with strangers, you eat in eleven minutes, you drink coffee from a steel tumbler and you leave. The dosa is thick, red and beyond discussion, though people from Malleswaram will try.',
        genz: 'Forty minutes in line for an eleven-minute breakfast. Would queue again.',
        meters: m(5, 3, 5), tags: ['dosa tower', 'by-two coffee', 'versus CTR'],
      },
    },
    {
      id: 'vv-puram', name: 'VV Puram Thindi Beedi', bn: 'ತಿಂಡಿ ಬೀದಿ', area: P, at: [15, 75], z: 8, zoom: 4,
      keywords: 'food street thindi beedi avarekai mela bakery congress',
      truth: {
        line: 'A single street of vegetarian food stalls that opens every evening. VB Bakery at its mouth has been there since 1953.',
        facts: [['1953', 'VB Bakery']],
      },
      whole: {
        line: 'Dosa, holige straight off the tawa, gulkand with ice cream, potato twisters for the camera. You stand, you eat, you say you are full, you turn around and eat your way back. In winter the avarekai bean takes over and appears in things it has no business being in, including sweets.',
        genz: 'Dinner was nine snacks in a trench coat.',
        meters: m(4, 4, 5), tags: ['avarekai season', 'holige hot', 'nine snacks'],
      },
    },
    {
      id: 'jayanagar', name: 'Jayanagar 4th Block', bn: 'ಜಯನಗರ', area: P, at: [34.2, 80], z: 17, zoom: 3.2,
      keywords: 'jayanagar shopping complex layout south bangalore',
      truth: {
        line: 'One of the earliest planned neighbourhoods of independent India, founded in 1948 and laid out in numbered blocks around parks and a central market.',
        facts: [['1948', 'founded']],
      },
      whole: {
        line: 'Wide roads, big trees, uncles on park benches with strong views on everything since 1974. To grow up in Jayanagar is to believe quietly that the rest of the city is a mistake. The young ones move to Indiranagar, pay double for half the space, and come home every Sunday for lunch.',
        genz: 'Left for Koramangala. Came back for the trees and my mother\'s saaru.',
        meters: m(5, 3, 2), tags: ['block supremacy', 'shade tax free', 'Sunday saaru'],
      },
    },
    {
      id: 'ranga-shankara', name: 'Ranga Shankara', bn: 'ರಂಗಶಂಕರ', area: P, at: [38, 90], z: 12, zoom: 3.8,
      keywords: 'theatre play jp nagar arundhati nag akki roti',
      truth: {
        line: 'A theatre in JP Nagar founded by Arundhati Nag and opened in 2004 in memory of the actor and director Shankar Nag.',
        facts: [['2004', 'opened']],
      },
      whole: {
        line: 'Doors shut on time and nobody, including you, gets in late. Plays in Kannada, Hindi, English and whatever is being attempted that month, at prices a student can manage, followed by akki roti in the cafe. Half the city\'s actors sold tickets here before anyone paid to see them.',
        genz: 'Late by two minutes because of traffic. Watched the door instead.',
        meters: m(4, 3, 3), tags: ['no late entry', 'akki roti after', 'Shankar Nag forever'],
      },
    },
    {
      id: 'pink-line', name: 'The Pink Line', bn: 'ಗುಲಾಬಿ ಮಾರ್ಗ', area: P, at: [48, 84], z: 22, zoom: 3.6,
      keywords: 'namma metro pink line kalena agrahara bannerghatta road jayadeva new',
      truth: {
        line: 'The newest line of Namma Metro. Its first 7.5 km, six elevated stations along Bannerghatta Road, opened to the public on 14 November 2026. The full 21.3 km line will run north to Nagawara, mostly underground.',
        facts: [['14 Nov', '2026, opened'], ['7.5 km', 'so far'], ['6', 'stations']],
      },
      whole: {
        line: 'The city waited so long that the pillars became landmarks and people gave directions by them. Opening weekend was a crowd riding end to end for no reason, filming the platform. The colour is perfect: this is the only city that would get a train to match its trees.',
        genz: 'Rode it twice on day one. Had nowhere to be. That was the point.',
        meters: m(1, 2, 5), tags: ['just opened', 'matches the tabebuia', 'joyride'],
      },
    },
    {
      id: 'malleswaram', name: 'Malleswaram', bn: 'ಮಲ್ಲೇಶ್ವರಂ', area: N, at: [36, 19], z: 8, zoom: 3.4,
      keywords: 'ctr benne dosa 8th cross sampige road margosa temple flowers',
      truth: {
        line: 'A planned suburb laid out after the plague of 1898, named for the 17th-century Kadu Malleshwara temple. Its streets carry the names of trees, Sampige and Margosa among them.',
        facts: [['1898', 'the plague that began it']],
      },
      whole: {
        line: 'Flower sellers on 8th Cross, concerts in living rooms, and the benne dosa at CTR, which its people will defend against Vidyarthi Bhavan until the end of time. The new flats are tall but the old grandmothers on the old verandas still know exactly whose child you are.',
        genz: 'Benne is not an ingredient. Benne is a belief system.',
        meters: m(5, 4, 4), tags: ['CTR loyalists', '8th Cross', 'grandmother network'],
      },
    },
    {
      id: 'sankey', name: 'Sankey Tank', bn: 'ಸ್ಯಾಂಕಿ ಕೆರೆ', area: N, at: [31, 13], z: 4, zoom: 3.4,
      keywords: 'lake tank walk sadashivanagar',
      truth: {
        line: 'A man-made lake built by Richard Sankey in 1882 to store water for the city. It covers about 37 acres.',
        facts: [['1882', 'built'], ['37', 'acres']],
      },
      whole: {
        line: 'The walking track has lanes in practice if not in law: aunties inside, joggers outside, founders on calls in the middle of everything. When a flyover threatened the trees on the road beside it, residents came out with placards and made it very hard to look away.',
        genz: 'Overheard a term sheet being negotiated between two ducks.',
        meters: m(4, 2, 3), tags: ['aunty lane', 'save the trees', 'calls on laps'],
      },
    },
    {
      id: 'iisc', name: 'Indian Institute of Science', bn: 'ಭಾರತೀಯ ವಿಜ್ಞಾನ ಸಂಸ್ಥೆ', area: N, at: [40, 4.7], z: 31, zoom: 3.4,
      keywords: 'iisc tata institute science raman campus',
      truth: {
        line: 'Founded in 1909 with the support of Jamsetji Tata and the Mysore royal family. CV Raman became its first Indian director in 1933.',
        facts: [['1909', 'founded'], ['1933', 'Raman takes over']],
      },
      whole: {
        line: 'Autos still call it Tata Institute. Inside is a forest with laboratories in it, where the cycles outnumber the people and everyone looks as if they are thinking about something you would not understand. Open Day once a year is the hottest ticket in town for anyone under twelve.',
        genz: 'Walked in, felt my IQ rise, walked out, it stayed there.',
        meters: m(4, 1, 2), tags: ['Tata Institute, please', 'forest of labs', 'Open Day'],
      },
    },
    {
      id: 'iskcon', name: 'ISKCON Temple', bn: 'ಇಸ್ಕಾನ್ ದೇವಾಲಯ', area: N, at: [11.5, 8], z: 61, zoom: 3.2,
      keywords: 'iskcon krishna temple rajajinagar akshaya patra hill',
      truth: {
        line: 'A temple complex on Hare Krishna Hill in Rajajinagar, inaugurated in 1997. The Akshaya Patra school meal programme began from here in 2000.',
        facts: [['1997', 'inaugurated'], ['2000', 'school meals begin']],
      },
      whole: {
        line: 'Glass, gold and gopurams, with a queue that is also a sort of moving meditation. People come for darshan and leave through a food hall that has converted more sceptics than the sermons. From the steps you can see the metro, the mall and the hills all at once.',
        genz: 'Came for peace, stayed for the puliyogare.',
        meters: m(2, 4, 3), tags: ['prasada first', 'hilltop view', 'Vaikuntha Ekadashi queue'],
      },
    },
    {
      id: 'palace', name: 'Bangalore Palace', bn: 'ಬೆಂಗಳೂರು ಅರಮನೆ', area: N, at: [58.4, 8.2], z: 35, zoom: 3.2,
      keywords: 'palace grounds concert gig wadiyar tudor metal bandland',
      truth: {
        line: 'A Tudor-style palace completed in 1878 and owned by the Wadiyars, the former royal family of Mysore. The grounds around it became the city\'s largest concert venue.',
        facts: [['1878', 'completed']],
      },
      whole: {
        line: 'Say "Palace Grounds" to anyone here and they will name a band: Iron Maiden in 2007, Metallica in 2011. The city earned its name as India\'s metal capital in this mud, in the rain, in black T-shirts. A legal dispute ended the big shows, the tours moved to venues further out, and the old crowd will tell you it is not the same.',
        genz: 'My dad moshed here. He now tells me to drive carefully.',
        meters: m(5, 4, 5), tags: ['metal capital', 'mud and black tees', 'horns up'],
      },
    },
    {
      id: 'hebbal', name: 'Hebbal', bn: 'ಹೆಬ್ಬಾಳ', area: N, at: [83.5, 11], z: 12, zoom: 3.2,
      keywords: 'flyover lake manyata tech park airport road birds',
      truth: {
        line: 'A flyover on the road to the airport beside a lake first built in 1537. The lake is one of three made in the time of Kempe Gowda and a stop for migratory birds.',
        facts: [['1537', 'the lake'], ['2003', 'the flyover']],
      },
      whole: {
        line: 'Everyone who has ever missed a flight missed it here. The flyover is permanently being extended, widened or apologised for, and now sits at one end of the most argued-about tunnel in the country. Meanwhile, right below it, pelicans land on the lake without checking the map.',
        genz: 'Flight at 9, left at 5, reached Hebbal, made peace with it.',
        meters: m(2, 5, 2), tags: ['leave at 4 am', 'pelicans below', 'tunnel talk'],
      },
    },
    {
      id: 'airport', name: 'Kempegowda Airport, Terminal 2', bn: 'ಕೆಂಪೇಗೌಡ ವಿಮಾನ ನಿಲ್ದಾಣ', area: N, at: [102, 16], z: 10, zoom: 3.2,
      keywords: 'airport t2 garden terminal bamboo devanahalli flight blr',
      truth: {
        line: 'The airport opened in 2008. Terminal 2, inaugurated in November 2022, is built around hanging gardens and bamboo, and won a Prix Versailles world prize in 2023.',
        facts: [['2008', 'airport opens'], ['2022', 'Terminal 2']],
      },
      whole: {
        line: 'A forest with boarding gates. People arrive three hours early on purpose, sit under the bamboo, and photograph a waterfall before a forty-minute flight to Chennai. Getting there costs about as much as the ticket, which is also part of the experience.',
        genz: 'The cab cost more than the flight, but the airport has a waterfall.',
        meters: m(1, 5, 5), tags: ['terminal in a garden', 'cab > ticket', 'bamboo ceiling'],
      },
    },
    {
      id: 'nandi', name: 'Nandi Hills', bn: 'ನಂದಿ ಬೆಟ್ಟ', area: N, at: [113.2, 6], z: 57, zoom: 3,
      keywords: 'nandi hills sunrise fog ropeway ride bikers tipu drop',
      truth: {
        line: 'A granite hill fort 1,478 metres high and about 60 km north of the city. A 2.93 km ropeway has been approved and was still waiting for environmental clearance in July 2026.',
        facts: [['1,478 m', 'high'], ['60 km', 'from town']],
      },
      whole: {
        line: 'The default answer to "what should we do this weekend". Leave at 3 am, queue in a convoy of bikes and cars at the gate, climb into a cloud, see either the sunrise of your life or a white wall. Then breakfast on the highway, which is secretly the reason for the trip.',
        genz: 'Four hours of travel for twelve minutes of fog. 10/10, no notes.',
        meters: m(3, 4, 5), tags: ['3 am plan', 'sea of clouds', 'highway breakfast'],
      },
    },
    {
      id: 'koramangala', name: 'Koramangala', bn: 'ಕೋರಮಂಗಲ', area: S, at: [60, 59], z: 12, zoom: 3.2,
      keywords: 'startup flipkart founders cafe vc sony signal forum mall',
      truth: {
        line: 'A planned residential layout that became the centre of Indian startups. Flipkart began in an apartment here in 2007.',
        facts: [['2007', 'Flipkart begins'], ['8', 'numbered blocks']],
      },
      whole: {
        line: 'Every table has a deck on it. Your server is building something, your landlord invests, and the couple breaking up beside you are actually co-founders. Cloud kitchens, coffee at 280 rupees, rent deposits at ten months. On Friday nights the same people are on the same street, arguing about the same idea with a drink in hand.',
        genz: 'Overheard "pre-seed" before I got my water.',
        meters: m(1, 5, 4), tags: ['10-month deposit', 'cofounder breakup', 'deck on table 4'],
      },
    },
    {
      id: 'indiranagar', name: 'Indiranagar', bn: 'ಇಂದಿರಾನಗರ', area: S, at: [84, 59], z: 12, zoom: 3.2,
      keywords: 'toit brewery pub 100 feet road 12th main craft beer microbrewery',
      truth: {
        line: 'A residential layout from the late 1970s named after Indira Gandhi. Toit, one of the city\'s first brewpubs, opened on 100 Feet Road in 2010.',
        facts: [['2010', 'Toit opens']],
      },
      whole: {
        line: 'Bungalows with a brewery on the ground floor. Residents want sleep, the street wants one more round, and this has been in court more than once. 12th Main is where you go to be seen not trying. By one in the morning it is all shawarma, cab cancellations and people vowing to take the metro next time.',
        genz: 'Said one pitcher. It is never one pitcher.',
        meters: m(3, 5, 5), tags: ['one pitcher', '12th Main fits', 'cab cancelled'],
      },
    },
    {
      id: 'hsr', name: 'HSR Layout', bn: 'ಎಚ್.ಎಸ್.ಆರ್. ಬಡಾವಣೆ', area: S, at: [58, 85], z: 12, zoom: 3.2,
      keywords: 'hsr 27th main startups padel cafe run club sector',
      truth: {
        line: 'Named for the two roads it lies between, Hosur and Sarjapur, and divided into seven sectors.',
        facts: [['7', 'sectors'], ['H, S, R', 'Hosur Sarjapur Road']],
      },
      whole: {
        line: 'Koramangala with parking, people say, and then there was no parking. It has a run club, a pickleball court and a matcha place for each resident. Ten-minute delivery was tested on these streets and it shows: nobody here has bought coriander in person since 2021.',
        genz: 'Ordered one lemon. It came in six minutes. I felt nothing.',
        meters: m(1, 4, 4), tags: ['10-minute everything', 'pickleball', '27th Main'],
      },
    },
    {
      id: 'silk-board', name: 'Silk Board Junction', bn: 'ಸಿಲ್ಕ್ ಬೋರ್ಡ್', area: S, at: [72, 72], z: 26, zoom: 3.4,
      keywords: 'traffic jam junction signal yellow line double decker flyover orr',
      truth: {
        line: 'A junction named for the Central Silk Board office beside it. Its double-decker flyover opened in stages from July 2024 and was fully running by April 2026. The Yellow Line metro began stopping here in August 2025.',
        facts: [['2026', 'flyover fully open'], ['2025', 'Yellow Line arrives']],
      },
      whole: {
        line: 'Not a place so much as a duration. Books have been finished here, calls taken, relationships reviewed. There are memes, T-shirts and people who give their location as simply "Silk Board, 40 minutes". The train now glides over the top, and the people inside look down at the people outside with great tenderness.',
        genz: 'I have aged here.',
        meters: m(2, 5, 4), tags: ['a duration', 'meme capital', 'take the Yellow Line'],
      },
    },
    {
      id: 'bellandur', name: 'Bellandur Lake', bn: 'ಬೆಳ್ಳಂದೂರು ಕೆರೆ', area: T, at: [83.5, 87], z: 4, zoom: 3,
      keywords: 'foam froth fire lake orr ecospace tech park pollution',
      truth: {
        line: 'A lake of roughly 900 acres that receives a large share of the city\'s sewage. It foamed, and caught fire, in 2017 and 2018. Desilting ordered by the National Green Tribunal has missed several deadlines.',
        facts: [['900', 'acres, roughly'], ['2018', 'the second big fire']],
      },
      whole: {
        line: 'A lake that caught fire, next to offices that build the future. The froth comes back with the rains and so do the cameras. But the people who show up with test kits, petitions and drone footage year after year are mostly residents with day jobs, and that stubbornness is the best thing about the place.',
        genz: 'We have an app for everything except this.',
        meters: m(1, 5, 3), tags: ['snow in July (foam)', 'lake warriors', 'ORR at 6 pm'],
      },
    },
    {
      id: 'whitefield', name: 'Whitefield', bn: 'ವೈಟ್‌ಫೀಲ್ಡ್', area: T, at: [105.3, 54.3], z: 72, zoom: 3,
      keywords: 'itpl tech park anglo indian settlement purple line inner circle',
      truth: {
        line: 'Founded in 1882 as a settlement for Anglo-Indians and named for its planner, DS White. The International Tech Park turned it into an IT suburb in the 1990s, and the Purple Line reached it in 2023.',
        facts: [['1882', 'founded'], ['2023', 'metro arrives']],
      },
      whole: {
        line: 'For years, living here and having friends in Indiranagar was technically a long-distance relationship. Then the metro came and people discovered the rest of the city, and the rest of the city discovered it did not mind. Somewhere behind the glass, the Inner Circle still has cottages, hedges and a very good bakery.',
        genz: 'We broke up over distance. He was in Jayanagar.',
        meters: m(2, 5, 2), tags: ['long distance', 'metro saved us', 'Inner Circle'],
      },
    },
    {
      id: 'electronic-city', name: 'Electronic City', bn: 'ಎಲೆಕ್ಟ್ರಾನಿಕ್ ಸಿಟಿ', area: T, at: [107.5, 84.5], z: 32, zoom: 3,
      keywords: 'infosys pyramid keonics baliga it park yellow line expressway campus',
      truth: {
        line: 'Conceived in the 1970s by RK Baliga, the first head of Keonics, who wanted to make the city the Silicon Valley of India. The Infosys campus and its glass pyramid are here, and the Yellow Line arrived in 2025.',
        facts: [['1978', 'founded'], ['2025', 'Yellow Line']],
      },
      whole: {
        line: 'Where a generation of engineers got their first lanyard. Campus training, first salary, first flatmate who does not do dishes. It is another city with better roads and earlier nights, and everybody who started here speaks of it the way people speak of school.',
        genz: 'First job, first salary, first time paying for my own biryani.',
        meters: m(2, 4, 2), tags: ['lanyard era', 'fresher batch', 'glass pyramid'],
      },
    },
  ];
  if (typeof module !== 'undefined') module.exports = PK;
})(typeof window !== 'undefined' ? window : globalThis);
