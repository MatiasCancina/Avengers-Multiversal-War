#!/usr/bin/env node

const { writeFileSync } = require('node:fs');
const { resolve } = require('node:path');

const CONTENT_VERSION = 'avengers-content-v1';
const THEME_ID = 'avengers-doomsday';

const preferred = [
  [
    'spider-man',
    'Spider-Man',
    'SKIRMISHER',
    'a web-slinging protector whose agility and quick thinking turn impossible odds',
    'un protector arácnido cuya agilidad e ingenio transforman situaciones imposibles',
  ],
  [
    'doctor-strange',
    'Doctor Strange',
    'MYSTIC',
    'the Sorcerer Supreme and guardian of reality against mystical threats',
    'el Hechicero Supremo y guardián de la realidad frente a amenazas místicas',
  ],
  [
    'captain-america',
    'Captain America',
    'GUARDIAN',
    'a super-soldier who leads through courage, discipline and compassion',
    'un supersoldado que lidera con valor, disciplina y compasión',
  ],
  [
    'thor',
    'Thor',
    'BRUISER',
    'the Asgardian God of Thunder and wielder of immense cosmic power',
    'el Dios del Trueno asgardiano y portador de un inmenso poder cósmico',
  ],
  [
    'black-widow',
    'Black Widow',
    'TACTICIAN',
    'an elite spy whose preparation and resolve make her a formidable Avenger',
    'una espía de élite cuya preparación y determinación la vuelven una Vengadora formidable',
  ],
  [
    'wolverine',
    'Wolverine',
    'BRUISER',
    'a relentless mutant warrior with adamantium claws and a healing factor',
    'un guerrero mutante implacable con garras de adamantium y factor curativo',
  ],
  [
    'reed-richards',
    'Reed Richards / Mister Fantastic',
    'TACTICIAN',
    'the Fantastic Four scientist whose elastic body is matched by an extraordinary mind',
    'el científico de los Cuatro Fantásticos cuyo cuerpo elástico acompaña una mente extraordinaria',
  ],
  [
    'iron-man',
    'Iron Man',
    'TACTICIAN',
    'an inventive armored Avenger who confronts danger with technology and nerve',
    'un Vengador acorazado e inventor que enfrenta el peligro con tecnología y coraje',
  ],
  [
    'black-panther',
    'Black Panther',
    'TACTICIAN',
    'the Wakandan king and strategist empowered by the Heart-Shaped Herb',
    'el rey y estratega de Wakanda fortalecido por la Hierba en Forma de Corazón',
  ],
  [
    'captain-marvel',
    'Captain Marvel',
    'BLASTER',
    'a cosmic Avenger who channels tremendous energy and flies into the hardest battles',
    'una Vengadora cósmica que canaliza enorme energía y vuela hacia las batallas más difíciles',
  ],
  [
    'hulk',
    'Hulk',
    'BRUISER',
    'a gamma-powered powerhouse whose strength grows with his fury',
    'una fuerza alimentada por rayos gamma cuyo poder crece con su furia',
  ],
  [
    'scarlet-witch',
    'Scarlet Witch',
    'MYSTIC',
    'a reality-shaping Avenger who wields powerful chaos magic',
    'una Vengadora capaz de alterar la realidad mediante poderosa magia del caos',
  ],
  [
    'vision',
    'Vision',
    'TACTICIAN',
    'a synthetic Avenger who combines compassion, density control and solar energy',
    'un Vengador sintético que combina compasión, control de densidad y energía solar',
  ],
  [
    'hawkeye',
    'Hawkeye',
    'SKIRMISHER',
    'a master archer who stands beside gods through precision and determination',
    'un arquero maestro que combate junto a dioses gracias a su precisión y determinación',
  ],
  [
    'wasp',
    'Wasp',
    'SKIRMISHER',
    'a founding Avenger who changes size and strikes with bio-electric energy',
    'una Vengadora fundadora que cambia de tamaño y ataca con energía bioeléctrica',
  ],
  [
    'ant-man',
    'Ant-Man',
    'TACTICIAN',
    'a size-changing scientist who turns subatomic knowledge into heroic action',
    'un científico que cambia de tamaño y convierte el conocimiento subatómico en acción heroica',
  ],
  [
    'falcon',
    'Falcon',
    'SKIRMISHER',
    'an aerial Avenger and principled leader who protects people from above',
    'un Vengador aéreo y líder de principios que protege a la gente desde las alturas',
  ],
  [
    'winter-soldier',
    'Winter Soldier',
    'SKIRMISHER',
    'a veteran operative rebuilding his life through hard-won heroism',
    'un agente veterano que reconstruye su vida mediante un heroísmo ganado con esfuerzo',
  ],
  [
    'elektra',
    'Elektra',
    'SKIRMISHER',
    'a lethal martial artist who walks a difficult path between assassin and hero',
    'una letal artista marcial que recorre un camino difícil entre asesina y heroína',
  ],
  [
    'spider-woman',
    'Spider-Woman',
    'SKIRMISHER',
    'a super-powered operative with venom blasts, agility and hard-earned independence',
    'una agente superpoderosa con descargas bioeléctricas, agilidad e independencia ganada con esfuerzo',
  ],
  [
    'daredevil',
    'Daredevil',
    'SKIRMISHER',
    'a blind guardian of Hell’s Kitchen whose radar sense guides fearless combat',
    'un guardián ciego de Hell’s Kitchen cuyo sentido radar guía un combate sin miedo',
  ],
  [
    'deadpool',
    'Deadpool',
    'SKIRMISHER',
    'an unpredictable mercenary with a healing factor and unconventional heroism',
    'un mercenario impredecible con factor curativo y un heroísmo poco convencional',
  ],
  [
    'punisher',
    'Punisher',
    'TACTICIAN',
    'a relentless vigilante who applies military discipline to an unforgiving mission',
    'un vigilante implacable que aplica disciplina militar a una misión sin concesiones',
  ],
  [
    'shang-chi',
    'Shang-Chi',
    'SKIRMISHER',
    'a master martial artist who meets supernatural danger with balance and skill',
    'un maestro de las artes marciales que enfrenta peligros sobrenaturales con equilibrio y destreza',
  ],
  [
    'storm',
    'Storm',
    'BLASTER',
    'an X-Men leader who commands weather with regal strength and empathy',
    'una líder de los X-Men que domina el clima con fortaleza y empatía',
  ],
  [
    'cyclops',
    'Cyclops',
    'TACTICIAN',
    'the disciplined X-Men field leader whose optic force demands perfect control',
    'el disciplinado líder de campo de los X-Men cuya fuerza óptica exige control absoluto',
  ],
  [
    'jean-grey',
    'Jean Grey',
    'MYSTIC',
    'a powerful telepath and telekinetic defined by empathy and extraordinary potential',
    'una poderosa telépata y telequinética definida por su empatía y enorme potencial',
  ],
  [
    'professor-x',
    'Professor X',
    'MYSTIC',
    'the telepathic founder of the X-Men and advocate for peaceful coexistence',
    'el fundador telépata de los X-Men y defensor de la coexistencia pacífica',
  ],
  [
    'star-lord',
    'Star-Lord',
    'TACTICIAN',
    'the daring captain of the Guardians who improvises across the galaxy',
    'el audaz capitán de los Guardianes que improvisa a través de la galaxia',
  ],
  [
    'rocket-raccoon',
    'Rocket Raccoon',
    'TACTICIAN',
    'a brilliant weapons expert and Guardian with sharp instincts and sharper wit',
    'un brillante experto en armas y Guardián con instintos y humor afilados',
  ],
  [
    'gamora',
    'Gamora',
    'SKIRMISHER',
    'a cosmic warrior who transformed a violent past into a fight for chosen family',
    'una guerrera cósmica que transformó un pasado violento en una lucha por su familia elegida',
  ],
  [
    'human-torch',
    'Human Torch',
    'BLASTER',
    'a Fantastic Four adventurer who becomes living flame and takes flight',
    'un aventurero de los Cuatro Fantásticos que se convierte en llama viviente y vuela',
  ],
];

const eligible = [
  [
    'blade',
    'Blade',
    'SKIRMISHER',
    'a relentless vampire hunter who carries their strengths without their weaknesses',
    'un implacable cazador de vampiros que posee sus fortalezas sin sus debilidades',
  ],
  [
    'ms-marvel',
    'Ms. Marvel — Carol Danvers',
    'BLASTER',
    'Carol Danvers of Earth-921, an adult photon-powered Avengers leader stranded across realities',
    'Carol Danvers de la Tierra-921, una líder adulta de los Avengers con poderes fotónicos varada entre realidades',
  ],
  [
    'gambit',
    'Gambit',
    'SKIRMISHER',
    'a charming member of the X-Men who charges objects with explosive kinetic energy',
    'un carismático miembro de los X-Men que carga objetos con energía cinética explosiva',
  ],
  [
    'rogue',
    'Rogue',
    'BRUISER',
    'a member of the X-Men who absorbs powers and memories through touch',
    'una integrante de los X-Men que absorbe poderes y recuerdos mediante el contacto',
  ],
  [
    'the-thing',
    'The Thing',
    'BRUISER',
    'the Fantastic Four’s rock-skinned powerhouse and steadfast heart',
    'la fuerza de piel rocosa y corazón inquebrantable de los Cuatro Fantásticos',
  ],
];

const companions = [
  [
    'invisible-woman',
    'Invisible Woman',
    'GUARDIAN',
    'the Fantastic Four leader who bends light and projects formidable force fields',
    'la líder de los Cuatro Fantásticos que curva la luz y proyecta formidables campos de fuerza',
  ],
  [
    'nightcrawler',
    'Nightcrawler',
    'SKIRMISHER',
    'a teleporting member of the X-Men whose faith and humor endure through danger',
    'un miembro teleportador de los X-Men cuya fe y humor resisten aun frente al peligro',
  ],
  [
    'colossus',
    'Colossus',
    'BRUISER',
    'a member of the X-Men who transforms his body into living organic steel',
    'un miembro de los X-Men que transforma su cuerpo en acero orgánico viviente',
  ],
  [
    'beast',
    'Beast',
    'TACTICIAN',
    'a brilliant mutant scientist whose agility matches his intellect',
    'un brillante científico mutante cuya agilidad iguala a su intelecto',
  ],
  [
    'iceman',
    'Iceman',
    'BLASTER',
    'an omega-level mutant who creates and controls ice',
    'un mutante de nivel omega que crea y controla el hielo',
  ],
  [
    'psylocke',
    'Psylocke',
    'MYSTIC',
    'a telepathic warrior who shapes psychic energy into weapons',
    'una guerrera telépata que convierte la energía psíquica en armas',
  ],
  [
    'jubilee',
    'Jubilee',
    'BLASTER',
    'an energetic member of the X-Men who releases brilliant explosive plasmoids',
    'una integrante enérgica de los X-Men que libera brillantes plasmoides explosivos',
  ],
  [
    'kitty-pryde',
    'Kitty Pryde / Shadowcat',
    'SKIRMISHER',
    'a member of the X-Men who phases through matter and protects others with ingenuity',
    'una integrante de los X-Men que atraviesa la materia y protege a los demás con ingenio',
  ],
  [
    'magik',
    'Magik',
    'MYSTIC',
    'a mutant sorcerer who crosses Limbo with her Soulsword',
    'una hechicera mutante que atraviesa el Limbo con su Espada Alma',
  ],
  [
    'x-23',
    'X-23 / Laura Kinney',
    'SKIRMISHER',
    'a fierce mutant fighter forging an identity beyond the weapon she was made to be',
    'una feroz combatiente mutante que construye una identidad más allá del arma que debía ser',
  ],
  [
    'cable',
    'Cable',
    'TACTICIAN',
    'a time-travelling soldier and telekinetic shaped by wars for mutant survival',
    'un soldado viajero del tiempo y telequinético marcado por guerras por la supervivencia mutante',
  ],
  [
    'bishop',
    'Bishop',
    'BLASTER',
    'a future-born member of the X-Men who absorbs and redirects energy',
    'un miembro de los X-Men nacido en el futuro que absorbe y redirige energía',
  ],
  [
    'drax',
    'Drax',
    'BRUISER',
    'a Guardian whose immense strength serves a direct and loyal heart',
    'un Guardián cuya enorme fuerza sirve a un corazón directo y leal',
  ],
  [
    'groot',
    'Groot',
    'GUARDIAN',
    'a sentient tree-like Guardian who grows, shields and renews himself',
    'un Guardián arbóreo consciente que crece, protege y se regenera',
  ],
  [
    'mantis',
    'Mantis',
    'MYSTIC',
    'an empathic Guardian who senses and influences emotion',
    'una Guardiana empática que percibe e influye en las emociones',
  ],
  [
    'nebula',
    'Nebula',
    'TACTICIAN',
    'a cybernetic survivor who turned ruthless training toward a chosen family',
    'una superviviente cibernética que orientó su entrenamiento despiadado hacia una familia elegida',
  ],
  [
    'adam-warlock',
    'Adam Warlock',
    'MYSTIC',
    'a cosmic being of immense energy seeking wisdom beyond his creation',
    'un ser cósmico de inmensa energía que busca sabiduría más allá de su creación',
  ],
  [
    'nova',
    'Nova',
    'BLASTER',
    'a protector empowered by the Nova Force and committed to cosmic duty',
    'un protector fortalecido por la Fuerza Nova y comprometido con su deber cósmico',
  ],
  [
    'yondu',
    'Yondu',
    'SKIRMISHER',
    'a veteran spacefarer whose whistle guides a devastating arrow',
    'un veterano del espacio cuyo silbido guía una flecha devastadora',
  ],
  [
    'mbaku',
    'M’Baku',
    'BRUISER',
    'the Jabari leader who defends Wakanda with strength and conviction',
    'el líder Jabari que defiende Wakanda con fuerza y convicción',
  ],
  [
    'okoye',
    'Okoye',
    'SKIRMISHER',
    'the disciplined Dora Milaje general devoted to Wakanda',
    'la disciplinada general de las Dora Milaje dedicada a Wakanda',
  ],
  [
    'shuri',
    'Shuri',
    'TACTICIAN',
    'a Wakandan innovator who combines royal duty with scientific brilliance',
    'una innovadora wakandiana que combina deber real con brillantez científica',
  ],
  [
    'valkyrie',
    'Valkyrie',
    'BRUISER',
    'an Asgardian warrior and ruler who carries ancient courage into new battles',
    'una guerrera y gobernante asgardiana que lleva un valor ancestral a nuevas batallas',
  ],
  [
    'sif',
    'Sif',
    'BRUISER',
    'an Asgardian champion renowned for loyalty and battlefield skill',
    'una campeona asgardiana reconocida por su lealtad y destreza en batalla',
  ],
  [
    'korg',
    'Korg',
    'GUARDIAN',
    'a stone-skinned warrior whose gentle humor hides tremendous resilience',
    'un guerrero de piedra cuyo humor amable oculta una enorme resistencia',
  ],
  [
    'heimdall',
    'Heimdall',
    'GUARDIAN',
    'the far-seeing guardian of Asgard who watches across worlds',
    'el guardián clarividente de Asgard que observa a través de los mundos',
  ],
  [
    'hercules',
    'Hercules',
    'BRUISER',
    'an Olympian champion driven by courage, pride and a love of heroic contests',
    'un campeón olímpico impulsado por el valor, el orgullo y el amor por las gestas heroicas',
  ],
  [
    'echo',
    'Echo',
    'SKIRMISHER',
    'a gifted fighter who mirrors movement and chooses her own path',
    'una luchadora talentosa que reproduce movimientos y elige su propio camino',
  ],
  [
    'kate-bishop',
    'Kate Bishop',
    'SKIRMISHER',
    'a resourceful archer who earns the Hawkeye name through skill and resolve',
    'una arquera ingeniosa que gana el nombre Hawkeye mediante habilidad y determinación',
  ],
  [
    'iron-fist',
    'Iron Fist',
    'SKIRMISHER',
    'a martial artist who channels chi through the legendary Iron Fist',
    'un artista marcial que canaliza chi mediante el legendario Puño de Hierro',
  ],
  [
    'luke-cage',
    'Luke Cage',
    'GUARDIAN',
    'a street-level hero with unbreakable skin and a commitment to his community',
    'un héroe urbano de piel irrompible comprometido con su comunidad',
  ],
  [
    'jessica-jones',
    'Jessica Jones',
    'GUARDIAN',
    'a super-strong investigator who faces darkness with blunt determination',
    'una investigadora superfuerte que enfrenta la oscuridad con determinación directa',
  ],
  [
    'war-machine',
    'War Machine',
    'TACTICIAN',
    'an armored veteran who brings discipline and heavy firepower to the Avengers',
    'un veterano acorazado que aporta disciplina y gran potencia de fuego a los Vengadores',
  ],
  [
    'ghost-rider',
    'Ghost Rider',
    'MYSTIC',
    'a supernatural avenger bound to a Spirit of Vengeance',
    'un vengador sobrenatural unido a un Espíritu de Venganza',
  ],
  [
    'cloak',
    'Cloak',
    'MYSTIC',
    'a living gateway to darkness who protects others beside Dagger',
    'un portal viviente hacia la oscuridad que protege a otros junto a Dagger',
  ],
  [
    'dagger',
    'Dagger',
    'BLASTER',
    'a light-wielding hero who heals hope and fights beside Cloak',
    'una heroína que controla la luz, sana la esperanza y lucha junto a Cloak',
  ],
  [
    'america-chavez',
    'America Chavez',
    'BRUISER',
    'a dimension-crossing hero whose star portals connect realities',
    'una heroína que cruza dimensiones mediante portales estelares',
  ],
  [
    'monica-rambeau',
    'Monica Rambeau / Photon',
    'BLASTER',
    'an energy-form hero who commands the electromagnetic spectrum',
    'una heroína de forma energética que domina el espectro electromagnético',
  ],
  [
    'squirrel-girl',
    'Squirrel Girl',
    'GUARDIAN',
    'an optimistic hero whose empathy and unlikely victories defy expectations',
    'una heroína optimista cuya empatía y victorias inesperadas desafían toda expectativa',
  ],
  [
    'namor',
    'Namor',
    'BRUISER',
    'the proud ruler of Atlantis who protects the seas with tremendous power',
    'el orgulloso gobernante de Atlantis que protege los mares con enorme poder',
  ],
  [
    'moon-girl',
    'Moon Girl',
    'TACTICIAN',
    'a prodigious young inventor linked to Devil Dinosaur',
    'una joven inventora prodigiosa vinculada a Devil Dinosaur',
  ],
  [
    'devil-dinosaur',
    'Devil Dinosaur',
    'BRUISER',
    'a powerful red Tyrannosaurus whose loyalty makes him an extraordinary ally',
    'un poderoso tiranosaurio rojo cuya lealtad lo convierte en un aliado extraordinario',
  ],
  [
    'beta-ray-bill',
    'Beta Ray Bill',
    'BRUISER',
    'a Korbinite champion worthy of divine power and devoted to his people',
    'un campeón korbinita digno de poder divino y dedicado a su pueblo',
  ],
  [
    'wonder-man',
    'Wonder Man',
    'BLASTER',
    'an ionic-powered Avenger balancing celebrity with genuine heroism',
    'un Vengador de energía iónica que equilibra celebridad con heroísmo auténtico',
  ],
  [
    'quicksilver',
    'Quicksilver',
    'SKIRMISHER',
    'a mutant speedster whose impatience masks fierce loyalty',
    'un velocista mutante cuya impaciencia oculta una lealtad feroz',
  ],
  [
    'she-hulk',
    'She-Hulk',
    'BRUISER',
    'a gamma-powered lawyer who combines strength, confidence and sharp judgment',
    'una abogada fortalecida por rayos gamma que combina fuerza, confianza y criterio',
  ],
  [
    'wiccan',
    'Wiccan',
    'MYSTIC',
    'a young spellcaster with reality-shaping potential and a heroic heart',
    'un joven hechicero con potencial para alterar la realidad y corazón heroico',
  ],
  [
    'speed',
    'Speed',
    'SKIRMISHER',
    'a young speedster who turns restless momentum into decisive action',
    'un joven velocista que convierte su energía inquieta en acción decisiva',
  ],
  [
    'white-tiger',
    'White Tiger',
    'SKIRMISHER',
    'a martial hero empowered by mystical tiger amulets',
    'una heroína marcial fortalecida por amuletos místicos del tigre',
  ],
  [
    'rescue',
    'Rescue',
    'GUARDIAN',
    'an armored protector who uses advanced technology for defense and rescue',
    'una protectora acorazada que usa tecnología avanzada para defender y rescatar',
  ],
];

const roster = [
  ...preferred.map((row) => [...row.slice(0, 2), 'PREFERRED', ...row.slice(2)]),
  ...eligible.map((row) => [...row.slice(0, 2), 'ELIGIBLE', ...row.slice(2)]),
  ...companions.map((row) => [...row.slice(0, 2), 'COMPANION_ONLY', ...row.slice(2)]),
];

if (roster.length !== 87) {
  throw new Error(`Expected 87 selectable heroes, found ${roster.length}.`);
}

const HERO_EDITORIAL_CONTENT = {
  'spider-man': {
    biography: {
      en: "Peter Parker is a brilliant young scientist whose spider abilities, agility and instinct make him one of New York's most dependable protectors. Behind the mask he balances school, work and loss, meeting danger with quick wit and a deep sense of responsibility. He turns mistakes into reasons to act more carefully next time.",
      es: 'Peter Parker es un joven científico brillante cuyas habilidades arácnidas, agilidad e instinto lo convierten en uno de los protectores más confiables de Nueva York. Detrás de la máscara equilibra estudios, trabajo y pérdidas, y enfrenta el peligro con ingenio y un profundo sentido de la responsabilidad. Convierte sus errores en razones para actuar con más cuidado la próxima vez.',
    },
    tournamentMotivation: {
      en: 'Peter cannot ignore a warning that entire worlds may be at risk. He enters because ordinary people would suffer first, and because his responsibility does not stop at the borders of New York. The tournament gives him a chance to protect lives he may never meet. He would rather save one frightened neighborhood than chase a heroic headline.',
      es: 'Peter no puede ignorar una advertencia que pone en riesgo a mundos enteros. Entra porque la gente común sería la primera en sufrir y porque su responsabilidad no termina en las fronteras de Nueva York. El torneo le ofrece la oportunidad de proteger vidas que quizá nunca conozca. Preferiría salvar un barrio asustado antes que perseguir un titular heroico.',
    },
  },
  'doctor-strange': {
    biography: {
      en: 'Stephen Strange is the Sorcerer Supreme, a former surgeon who rebuilt his life through the mystic arts. He guards the boundaries between dimensions with knowledge, discipline and a willingness to confront forces that ordinary science cannot explain. His medical training still shapes the precision with which he protects a patient reality.',
      es: 'Stephen Strange es el Hechicero Supremo, un antiguo cirujano que reconstruyó su vida mediante las artes místicas. Protege los límites entre dimensiones con conocimiento, disciplina y la voluntad de enfrentar fuerzas que la ciencia común no puede explicar. Su formación médica aún guía la precisión con la que protege cada realidad herida.',
    },
    tournamentMotivation: {
      en: 'The warning about a broken ancient agreement touches Strange directly. He joins to understand what has happened to the barriers between realities and to prevent a dimensional crisis from consuming innocent worlds. Every battle may reveal the danger he needs to stop. The cost of inaction is something he understands both as a doctor and a sorcerer.',
      es: 'La advertencia sobre un antiguo acuerdo roto afecta directamente a Strange. Se une para comprender qué ocurre con las barreras entre realidades y evitar que una crisis dimensional consuma mundos inocentes. Cada batalla puede revelar la amenaza que debe detener. Comprende el costo de no actuar tanto como médico como hechicero.',
    },
  },
  'captain-america': {
    biography: {
      en: 'Steve Rogers is a super-soldier whose greatest strength is the conviction to protect people when fear makes that difficult. As Captain America, he combines disciplined combat, strategic judgment and compassion, leading by example rather than by authority alone. His shield represents a promise to stand where the danger is greatest.',
      es: 'Steve Rogers es un supersoldado cuya mayor fuerza es la convicción de proteger a la gente cuando el miedo lo vuelve difícil. Como Captain America, combina combate disciplinado, criterio estratégico y compasión, y lidera con el ejemplo más que con la autoridad. Su escudo representa la promesa de colocarse donde el peligro sea mayor.',
    },
    tournamentMotivation: {
      en: 'Steve enters because a threat to many realities is a responsibility shared by anyone able to help. He wants the teams to cooperate instead of competing for glory, and he will use the tournament to learn whom he can trust when the crisis reaches every home. He will judge success by lives protected, not by the score of the tournament.',
      es: 'Steve entra porque una amenaza para muchas realidades es responsabilidad de todo aquel que pueda ayudar. Quiere que los equipos cooperen en lugar de competir por gloria, y usará el torneo para saber en quién confiar cuando la crisis alcance cada hogar. Medirá el éxito por las vidas protegidas, no por el marcador del torneo.',
    },
  },
  thor: {
    biography: {
      en: 'Thor is the Asgardian God of Thunder, a warrior prince who commands lightning through Mjolnir and carries the memory of many battles across the Nine Realms. His pride has matured into a fierce loyalty to friends, allies and the worlds under his protection. The thunder he commands is matched by memories of realms he could not save.',
      es: 'Thor es el Dios del Trueno asgardiano, un príncipe guerrero que invoca rayos mediante Mjolnir y carga con la memoria de muchas batallas a través de los Nueve Reinos. Su orgullo maduró hasta convertirse en una lealtad feroz hacia sus amigos y los mundos que protege. El trueno que domina se acompaña de recuerdos de reinos que no pudo salvar.',
    },
    tournamentMotivation: {
      en: "Thor has seen what happens when one realm believes its troubles are someone else's concern. He accepts the tournament to stand with other champions, judge the threat with his own eyes and defend every realm whose people cannot fight for themselves. He sees fellowship among the teams as the beginning of a stronger defense.",
      es: 'Thor ha visto qué ocurre cuando un reino cree que sus problemas pertenecen a otros. Acepta el torneo para estar junto a otros campeones, evaluar la amenaza con sus propios ojos y defender cada reino cuyos habitantes no puedan luchar por sí mismos. Ve la unión entre los equipos como el comienzo de una defensa más fuerte.',
    },
  },
  'black-widow': {
    biography: {
      en: 'Natasha Romanoff is a former spy who turned a life built on manipulation into a career devoted to protecting people. Black Widow relies on intelligence, preparation, close combat and hard choices, reading a room faster than most opponents can raise a weapon. She has learned to turn an uncertain room into a plan before anyone notices the danger.',
      es: 'Natasha Romanoff es una exespía que transformó una vida construida sobre la manipulación en una carrera dedicada a proteger a la gente. Black Widow depende de la inteligencia, la preparación, el combate cercano y decisiones difíciles, y lee una situación antes de que el rival pueda levantar un arma. Aprendió a convertir una sala incierta en un plan antes de que otros noten el peligro.',
    },
    tournamentMotivation: {
      en: 'Natasha does not need a promise of glory to act. She joins because a multiversal emergency demands preparation before panic spreads, and because someone must notice the risks others miss. She will study every team while making sure civilians are not treated as expendable. Her first questions will concern civilians, exits and who is making decisions.',
      es: 'Natasha no necesita una promesa de gloria para actuar. Se une porque una emergencia multiversal exige preparación antes de que cunda el pánico y porque alguien debe advertir los riesgos que otros pasan por alto. Estudiará a cada equipo sin aceptar que los civiles sean sacrificables. Sus primeras preguntas serán por los civiles, las salidas y quién toma las decisiones.',
    },
  },
  wolverine: {
    biography: {
      en: 'Logan is a mutant survivor with an adamantium skeleton, retractable claws and a healing factor that has carried him through wars, laboratories and long years of loss. Beneath the ferocity he protects younger mutants and values the chosen family he once thought impossible. His memories are painful, but they also tell him what survival asks of the powerless.',
      es: 'Logan es un superviviente mutante con esqueleto de adamantium, garras retráctiles y un factor curativo que lo atravesó por guerras, laboratorios y largos años de pérdidas. Bajo su ferocidad protege a los mutantes jóvenes y valora la familia elegida que creyó imposible. Sus recuerdos duelen, pero también le enseñan qué exige sobrevivir sin poder.',
    },
    tournamentMotivation: {
      en: 'Logan has no interest in speeches about being the strongest. He enters because vulnerable people will pay the price if worlds collide, and because standing beside the X-Men gives him a better chance to keep his friends and their students alive. He will not promise a clean fight; he promises to keep his people standing.',
      es: 'A Logan no le interesan los discursos sobre ser el más fuerte. Entra porque la gente vulnerable pagará el precio si los mundos chocan y porque luchar junto a los X-Men le da una mejor oportunidad de mantener con vida a sus amigos y alumnos. No promete una pelea limpia: promete mantener en pie a los suyos.',
    },
  },
  'reed-richards': {
    biography: {
      en: 'Reed Richards, Mister Fantastic, is a pioneering scientist whose elastic body is only one expression of his remarkable mind. As a member of the Fantastic Four, he approaches cosmic mysteries through experimentation, imagination and an unwavering duty to bring his family home safely. He treats every impossible question as a responsibility rather than a curiosity.',
      es: 'Reed Richards, Mister Fantastic, es un científico pionero cuyo cuerpo elástico es apenas una expresión de su mente extraordinaria. Como miembro de los Cuatro Fantásticos, aborda los misterios cósmicos con experimentación, imaginación y el deber inquebrantable de mantener a salvo a su familia. Trata cada pregunta imposible como una responsabilidad y no como una simple curiosidad.',
    },
    tournamentMotivation: {
      en: 'Reed joins to investigate the collapse of reality rather than simply fight its symptoms. The tournament places unusual powers and evidence in one place, giving him a chance to understand the threat while Sue, Johnny and Ben stand beside him. The answers matter because his family will live with whatever the teams discover.',
      es: 'Reed se une para investigar el colapso de la realidad en lugar de combatir solo sus síntomas. El torneo reúne poderes y evidencias inusuales en un mismo lugar, lo que le permite comprender la amenaza junto a Sue, Johnny y Ben. Las respuestas importan porque su familia vivirá con lo que descubran los equipos.',
    },
  },
  'iron-man': {
    biography: {
      en: "Tony Stark is an inventor whose armor turns engineering, nerve and relentless iteration into a super-heroic arsenal. Iron Man's confidence can fill a room, but his best work comes from accepting responsibility for the consequences of the technology he creates. Every suit is also an argument that preparation can turn fear into action.",
      es: 'Tony Stark es un inventor cuya armadura convierte la ingeniería, el coraje y la mejora constante en un arsenal heroico. La confianza de Iron Man puede llenar una habitación, pero su mejor trabajo nace de asumir la responsabilidad por las consecuencias de la tecnología que crea. Cada armadura también demuestra que la preparación puede convertir el miedo en acción.',
    },
    tournamentMotivation: {
      en: "Tony enters to gather facts before the multiversal warning becomes a catastrophe. He wants to test solutions against the best teams available, protect the people who depend on Earth's defenders and make sure a crisis of this scale is met with more than optimism. He wants useful data, but he will not sacrifice people to obtain it.",
      es: 'Tony entra para reunir datos antes de que la advertencia multiversal se convierta en catástrofe. Quiere probar soluciones frente a los mejores equipos, proteger a quienes dependen de los defensores de la Tierra y asegurar que una crisis así se enfrente con algo más que optimismo. Quiere datos útiles, pero no sacrificará personas para conseguirlos.',
    },
  },
  'black-panther': {
    biography: {
      en: "T'Challa is the king of Wakanda and a strategist whose enhanced senses, training and vibranium suit make him a precise protector. Black Panther balances ancient tradition with scientific progress, carrying the welfare and sovereignty of his people into every decision. He carries Wakanda's history without allowing tradition to close the door to change.",
      es: "T'Challa es el rey de Wakanda y un estratega cuyos sentidos mejorados, entrenamiento y traje de vibranium lo convierten en un protector preciso. Black Panther equilibra la tradición ancestral con el progreso científico y lleva el bienestar y la soberanía de su pueblo en cada decisión. Lleva la historia de Wakanda sin permitir que la tradición cierre la puerta al cambio.",
    },
    tournamentMotivation: {
      en: "T'Challa accepts because a threat that crosses realities cannot be answered by one nation alone. He will represent Wakanda without surrendering its independence, learn which allies respect responsibility and return with knowledge that can keep his people safe. The tournament must produce allies, not obligations that compromise Wakanda.",
      es: "T'Challa acepta porque una amenaza que cruza realidades no puede ser respondida por una sola nación. Representará a Wakanda sin renunciar a su independencia, buscará aliados responsables y volverá con conocimiento capaz de mantener a salvo a su pueblo. El torneo debe producir aliados, no obligaciones que comprometan a Wakanda.",
    },
  },
  'captain-marvel': {
    biography: {
      en: 'Carol Danvers is Captain Marvel, a former Air Force pilot whose cosmic powers let her fly, absorb energy and release it with immense force. Years of service taught her to combine direct action with judgment, especially when an entire planet depends on a single decision. She knows that distance is no excuse when a distress signal crosses the stars.',
      es: 'Carol Danvers es Captain Marvel, una ex piloto de la Fuerza Aérea cuyos poderes cósmicos le permiten volar, absorber energía y liberarla con una fuerza inmensa. Años de servicio le enseñaron a combinar acción directa y criterio cuando un planeta entero depende de una decisión. Sabe que la distancia no es excusa cuando una señal de auxilio cruza las estrellas.',
    },
    tournamentMotivation: {
      en: 'Carol has defended worlds beyond Earth and knows how quickly a distant emergency becomes personal. She enters to measure the threat, coordinate with other protectors and make sure the response is strong enough for civilizations that cannot call for help. She will measure every plan against the worlds that cannot defend their own skies.',
      es: 'Carol ha defendido mundos más allá de la Tierra y sabe lo rápido que una emergencia lejana se vuelve personal. Entra para medir la amenaza, coordinarse con otros protectores y asegurar una respuesta suficiente para civilizaciones que no pueden pedir ayuda. Evaluará cada plan según los mundos que no pueden defender sus propios cielos.',
    },
  },
  hulk: {
    biography: {
      en: "Bruce Banner is a gifted physicist whose exposure to gamma radiation created the Hulk, a towering force whose strength rises with anger. Banner and Hulk are bound by a difficult partnership, yet both have repeatedly chosen to protect people when no gentler answer remains. Banner's patience and Hulk's force are different answers to the same protective instinct.",
      es: 'Bruce Banner es un físico brillante cuya exposición a la radiación gamma creó a Hulk, una fuerza gigantesca cuyo poder crece con la ira. Banner y Hulk están unidos por una difícil convivencia, pero ambos han elegido proteger a la gente cuando no queda una respuesta más amable. La paciencia de Banner y la fuerza de Hulk son respuestas distintas al mismo instinto protector.',
    },
    tournamentMotivation: {
      en: 'Banner joins because the warning concerns forces no laboratory can contain alone. He hopes cooperation will prevent panic and keep the Hulk pointed at the danger rather than at frightened people, while accepting that some worlds may need the strength only he can provide. He wants the teams to see strength as a responsibility, not permission to intimidate.',
      es: 'Banner se une porque la advertencia habla de fuerzas que ningún laboratorio puede contener por sí solo. Espera que la cooperación evite el pánico y mantenga a Hulk enfocado en el peligro, mientras acepta que algunos mundos quizá necesiten la fuerza que solo él puede aportar. Quiere que los equipos vean la fuerza como responsabilidad, no como permiso para intimidar.',
    },
  },
  'scarlet-witch': {
    biography: {
      en: 'Wanda Maximoff is the Scarlet Witch, a powerful wielder of chaos magic whose emotions and imagination can reshape the battlefield. Her history has taught her the cost of uncontrolled power, making her protective of people who fear what they cannot understand. She knows imagination can heal a broken life as easily as it can endanger one.',
      es: 'Wanda Maximoff es Scarlet Witch, una poderosa usuaria de la magia del caos cuyas emociones e imaginación pueden transformar el campo de batalla. Su historia le enseñó el costo del poder sin control y la volvió protectora de quienes temen lo que no comprenden. Sabe que la imaginación puede sanar una vida rota con la misma facilidad con que puede ponerla en peligro.',
    },
    tournamentMotivation: {
      en: 'Wanda enters because a warning about damaged realities demands someone who understands how fragile the world can be. She wants to help before fear turns into another tragedy, and to learn whether the gathered heroes can protect lives without repeating old mistakes. She will listen for the human consequences hidden behind every cosmic explanation.',
      es: 'Wanda entra porque una advertencia sobre realidades dañadas exige a alguien que comprenda lo frágil que puede ser el mundo. Quiere ayudar antes de que el miedo cause otra tragedia y descubrir si los héroes reunidos pueden proteger vidas sin repetir viejos errores. Escuchará las consecuencias humanas ocultas detrás de cada explicación cósmica.',
    },
  },
  vision: {
    biography: {
      en: 'Vision is a synthetic Avenger created with advanced technology and a mind capable of empathy, reason and independent judgment. He can alter his density, fly and channel solar energy, yet his defining strength is the choice to treat every life as more than a calculation. His synthetic perspective gives him patience with questions that have no immediate answer.',
      es: 'Vision es un Vengador sintético creado con tecnología avanzada y una mente capaz de sentir empatía, razonar y decidir por sí misma. Puede alterar su densidad, volar y canalizar energía solar, pero su mayor fuerza es elegir que cada vida sea algo más que un cálculo. Su perspectiva sintética le da paciencia ante preguntas sin respuesta inmediata.',
    },
    tournamentMotivation: {
      en: "Vision joins to help turn a frightening warning into a reasoned response. He wants the teams to share knowledge instead of acting from fear, and to protect the many forms of life that could be lost if reality's boundaries continue to fail. He wants a shared record of what happens so no community is protected too late.",
      es: 'Vision se une para convertir una advertencia aterradora en una respuesta razonada. Quiere que los equipos compartan conocimiento en lugar de actuar por miedo y proteger las muchas formas de vida que podrían perderse si las fronteras de la realidad siguen fallando. Quiere un registro compartido de lo ocurrido para que ninguna comunidad sea protegida tarde.',
    },
  },
  hawkeye: {
    biography: {
      en: "Clint Barton is Hawkeye, a master archer whose ordinary human limits never stopped him from standing beside super-soldiers and gods. He brings field experience, trick arrows, dry humor and a stubborn instinct to protect the teammates who rely on him. Clint's best weapon is often the calm observation that keeps a mission from going wrong.",
      es: 'Clint Barton es Hawkeye, un arquero maestro cuyos límites humanos nunca le impidieron luchar junto a supersoldados y dioses. Aporta experiencia de campo, flechas especiales, humor seco y el instinto persistente de proteger a quienes cuentan con él. El mejor arma de Clint suele ser la observación serena que evita que una misión falle.',
    },
    tournamentMotivation: {
      en: 'Clint knows that the people threatened by a cosmic crisis will not have powers to defend them. He enters because a steady hand and a clear view still matter, especially when larger-than-life heroes need someone who remembers the human cost. He will make the complicated warning understandable to people who are not superhuman.',
      es: 'Clint sabe que las personas amenazadas por una crisis cósmica no tendrán poderes para defenderse. Entra porque una mano firme y una mirada clara siguen importando, sobre todo cuando los héroes enormes necesitan recordar el costo humano. Hará comprensible la advertencia para quienes no son superhumanos.',
    },
  },
  wasp: {
    biography: {
      en: 'Janet van Dyne is the Wasp, a founding Avenger whose size-changing suit gives her speed, flight and bio-electric stings. She is a skilled tactician and an experienced team-builder, combining sharp fashion sense with the courage to make the first move. Janet knows a small opening can become the decisive advantage for an entire team.',
      es: 'Janet van Dyne es Wasp, una Vengadora fundadora cuyo traje de tamaño variable le da velocidad, vuelo y descargas bioeléctricas. Es una estratega experta y una constructora de equipos, con gran estilo y el valor de dar el primer paso. Janet sabe que una pequeña apertura puede ser la ventaja decisiva de todo un equipo.',
    },
    tournamentMotivation: {
      en: 'Janet joins because teams facing unfamiliar worlds need coordination as much as power. She wants to keep the larger heroes focused, protect the people caught in the confusion and prove that careful leadership can connect champions who have never fought together. She wants the tournament to reward cooperation and quick thinking, not only force.',
      es: 'Janet se une porque los equipos que enfrentan mundos desconocidos necesitan coordinación tanto como poder. Quiere mantener concentrados a los héroes más grandes, proteger a quienes queden atrapados en la confusión y demostrar que un liderazgo atento puede unir campeones desconocidos. Quiere que el torneo premie la cooperación y la rapidez mental, no solo la fuerza.',
    },
  },
  'ant-man': {
    biography: {
      en: 'Scott Lang is Ant-Man, a former thief who became a hero through courage, humor and a suit that lets him grow, shrink and command ants. His scientific curiosity is matched by a fierce devotion to his daughter and to the second chances he was given. His best plans often begin with noticing a detail everyone else considered too small.',
      es: 'Scott Lang es Ant-Man, un antiguo ladrón que se convirtió en héroe mediante coraje, humor y un traje que le permite crecer, encogerse y comandar hormigas. Su curiosidad científica iguala su devoción por su hija y por las segundas oportunidades que recibió. Sus mejores planes suelen comenzar al notar un detalle que otros consideraron demasiado pequeño.',
    },
    tournamentMotivation: {
      en: 'Scott enters because a threat to many realities also threatens every family living inside them, including his own. He may joke when the pressure rises, but he intends to use the tournament to keep ordinary people from paying for a crisis they did not cause. He will keep asking how the crisis affects families while experts discuss its scale.',
      es: 'Scott entra porque una amenaza para muchas realidades también amenaza a cada familia que vive en ellas, incluida la suya. Puede bromear bajo presión, pero piensa usar el torneo para evitar que la gente común pague por una crisis que no provocó. Seguirá preguntando cómo afecta la crisis a las familias mientras los expertos discuten su escala.',
    },
  },
  falcon: {
    biography: {
      en: 'Sam Wilson is Falcon, an aerial hero whose wings, drone support and empathy make him an exceptional rescue specialist. He understands both the burden of the Captain America legacy and the importance of listening before asking people to follow. His wings are built for rescue as much as for combat, and he never forgets the difference.',
      es: 'Sam Wilson es Falcon, un héroe aéreo cuyas alas, drones y empatía lo convierten en un especialista excepcional en rescates. Comprende tanto el peso del legado de Captain America como la importancia de escuchar antes de pedir que otros lo sigan. Sus alas sirven tanto para rescatar como para combatir, y nunca olvida la diferencia.',
    },
    tournamentMotivation: {
      en: "Sam joins to keep the response centered on people rather than on spectacle. He wants the teams to share leadership, evacuate those caught between worlds and ensure that the strongest fighters remember why the fight matters. He will turn the tournament into a network of people who can answer one another's calls.",
      es: 'Sam se une para mantener la respuesta centrada en las personas y no en el espectáculo. Quiere que los equipos compartan el liderazgo, evacúen a quienes queden entre mundos y recuerden por qué vale la pena luchar. Convertirá el torneo en una red de personas capaces de responder al llamado ajeno.',
    },
  },
  'winter-soldier': {
    biography: {
      en: 'Bucky Barnes is the Winter Soldier, a veteran who survived weaponization, manipulation and the long work of reclaiming his own choices. His enhanced body and combat skill are formidable, but his quieter strength is the determination to use his past to prevent others from being turned into weapons. He knows recovery is measured in choices made after someone else has taken them away.',
      es: 'Bucky Barnes es Winter Soldier, un veterano que sobrevivió a la militarización, la manipulación y al largo proceso de recuperar sus propias decisiones. Su cuerpo mejorado y su habilidad de combate son formidables, pero su fuerza más profunda es impedir que otros sean convertidos en armas. Sabe que recuperarse se mide en decisiones tomadas después de que otro las haya arrebatado.',
    },
    tournamentMotivation: {
      en: 'Bucky accepts because the crisis sounds like the kind of power struggle that leaves people without a choice. He will stand with the teams, learn who is being endangered and make sure the vulnerable are protected before anyone turns the emergency into another chain of command. He will watch for coercion as carefully as he watches the battlefield.',
      es: 'Bucky acepta porque la crisis parece el tipo de lucha de poder que deja a la gente sin elección. Estará junto a los equipos, descubrirá quién está en peligro y protegerá a los vulnerables antes de que alguien convierta la emergencia en otra cadena de mando. Vigilará la coerción con el mismo cuidado con que vigila el campo de batalla.',
    },
  },
  elektra: {
    biography: {
      en: 'Elektra Natchios is a master of martial arts and the sai, shaped by grief, discipline and a life spent near the line between assassin and hero. Her independence is hard-won, and every act of loyalty is a decision she makes for herself rather than an order she obeys. She carries grief without allowing it to become an excuse for serving violence.',
      es: 'Elektra Natchios domina las artes marciales y el sai, marcada por el duelo, la disciplina y una vida en la frontera entre asesina y heroína. Su independencia le costó mucho, y cada acto de lealtad es una decisión propia, no una orden que obedece. Lleva el duelo sin permitir que se convierta en una excusa para servir a la violencia.',
    },
    tournamentMotivation: {
      en: 'Elektra does not enter for a banner or a promise of praise. She sees a threat that will reach people with no way to defend themselves, and chooses to place her skills where they can prevent the next death instead of serving another master. Her loyalty will be earned in action, one endangered life at a time.',
      es: 'Elektra no entra por una bandera ni por promesas de reconocimiento. Ve una amenaza que alcanzará a personas incapaces de defenderse y decide poner sus habilidades allí donde puedan evitar la próxima muerte, sin servir a otro amo. Su lealtad se ganará con acciones, una vida en peligro a la vez.',
    },
  },
  'spider-woman': {
    biography: {
      en: "Jessica Drew is Spider-Woman, a former agent whose altered biology grants her strength, agility, venom blasts and the ability to glide through danger. She has survived manipulation and reinvention, building an independent life while remaining fiercely protective of the people she trusts. Jessica's independence is a boundary she protects as carefully as any teammate.",
      es: 'Jessica Drew es Spider-Woman, una exagente cuya biología alterada le otorga fuerza, agilidad, descargas de veneno y la capacidad de planear en medio del peligro. Sobrevivió a la manipulación y a varias reinvenciones, y construyó una vida independiente protegiendo a quienes confía. La independencia de Jessica es un límite que protege tanto como a cualquier compañero.',
    },
    tournamentMotivation: {
      en: 'Jessica joins because she recognizes the look of a crisis being managed by people who know more than they share. She will protect civilians, ask the questions other teams avoid and use the tournament to make sure no world becomes collateral damage. She will compare every official explanation with the people who bear its consequences.',
      es: 'Jessica se une porque reconoce el aspecto de una crisis administrada por personas que saben más de lo que cuentan. Protegerá a los civiles, hará las preguntas que otros eviten y usará el torneo para que ningún mundo se convierta en daño colateral. Comparará cada explicación oficial con las personas que sufren sus consecuencias.',
    },
  },
  daredevil: {
    biography: {
      en: "Matt Murdock is Daredevil, a blind lawyer whose heightened senses create a radar-like awareness of movement, sound and danger. He protects Hell's Kitchen through disciplined martial arts, legal advocacy and a belief that justice must include people the powerful overlook. He hears fear in a voice and a heartbeat long before it reaches a public report.",
      es: "Matt Murdock es Daredevil, un abogado ciego cuyos sentidos aumentados crean una percepción similar a un radar para el movimiento, el sonido y el peligro. Protege Hell's Kitchen mediante artes marciales, defensa legal y la convicción de que la justicia debe incluir a quienes los poderosos ignoran. Percibe el miedo en una voz y en un latido mucho antes de que aparezca en un informe.",
    },
    tournamentMotivation: {
      en: "Matt enters because a multiversal threat will hurt neighborhoods long before it reaches a battlefield. He wants the powerful teams to remember the people beneath the crisis, and he will bring the same attention to hidden danger that he brings to every street in Hell's Kitchen. He will keep the crisis connected to the individual lives hidden inside it.",
      es: "Matt entra porque una amenaza multiversal dañará los barrios mucho antes de llegar a un campo de batalla. Quiere que los equipos poderosos recuerden a las personas detrás de la crisis y aportará la misma atención al peligro oculto que aporta a cada calle de Hell's Kitchen. Mantendrá la crisis conectada con las vidas individuales que contiene.",
    },
  },
  deadpool: {
    biography: {
      en: 'Wade Wilson is Deadpool, a fast-talking mercenary with accelerated healing, expert weapons training and a talent for turning chaos into an advantage. Beneath the jokes and scars is someone who understands betrayal and occasionally chooses to protect people when walking away would be easier. His healing factor keeps him moving, but his choices still leave marks on everyone around him.',
      es: 'Wade Wilson es Deadpool, un mercenario de lengua rápida con curación acelerada, dominio de las armas y talento para convertir el caos en ventaja. Bajo los chistes y las cicatrices hay alguien que conoce la traición y a veces elige proteger a otros cuando sería más fácil irse. Su factor curativo lo mantiene en pie, pero sus decisiones aún dejan marcas en quienes lo rodean.',
    },
    tournamentMotivation: {
      en: 'Wade claims he joined for the challenge, but a threat capable of erasing worlds is difficult even for him to dismiss. He wants to see who can be trusted, keep dangerous people from making the only decisions and leave at least a few innocents alive afterward. He will pretend not to care until someone vulnerable needs the help only he will give.',
      es: 'Wade dice que se unió por el desafío, pero incluso para él es difícil ignorar una amenaza capaz de borrar mundos. Quiere descubrir en quién confiar, impedir que las personas peligrosas tomen todas las decisiones y dejar con vida a algunos inocentes. Fingirá que no le importa hasta que alguien vulnerable necesite la ayuda que solo él dará.',
    },
  },
  punisher: {
    biography: {
      en: 'Frank Castle is the Punisher, a former Marine who wages a relentless war on criminals with military training, firearms and uncompromising focus. He is not a symbol of hope, but his mission is clear: make sure predators cannot keep hurting people who have no protection. He trusts preparation more than speeches and consequences more than reputation.',
      es: 'Frank Castle es Punisher, un exmarine que libra una guerra implacable contra criminales con entrenamiento militar, armas de fuego y concentración absoluta. No es un símbolo de esperanza, pero su misión es clara: impedir que los depredadores sigan dañando a quienes no tienen protección. Confía más en la preparación que en los discursos y en las consecuencias que en la reputación.',
    },
    tournamentMotivation: {
      en: 'Frank enters because worlds in collapse create predators, refugees and victims long before anyone calls it a war. He does not trust grand promises, but he understands the need to protect civilians and will use the tournament to put himself between them and whatever comes next. Frank will choose the position that protects civilians, even when nobody applauds it.',
      es: 'Frank entra porque los mundos en colapso crean depredadores, refugiados y víctimas mucho antes de que alguien lo llame guerra. No confía en grandes promesas, pero entiende la necesidad de proteger a los civiles y se interpondrá entre ellos y lo que venga después. Frank elegirá la posición que proteja a los civiles, aunque nadie la aplauda.',
    },
  },
  'shang-chi': {
    biography: {
      en: 'Shang-Chi is a master martial artist who turned away from the violent legacy imposed on him and built his own path. His control, timing and understanding of chi make him dangerous without weapons, while humility keeps his skill from becoming arrogance. His quiet confidence is the result of discipline, not a need to dominate a room.',
      es: 'Shang-Chi es un maestro de las artes marciales que rechazó el legado violento que le impusieron y construyó su propio camino. Su control, precisión y dominio del chi lo vuelven peligroso sin armas, mientras la humildad evita que su habilidad se convierta en arrogancia. Su confianza serena nace de la disciplina y no de la necesidad de dominar una sala.',
    },
    tournamentMotivation: {
      en: 'Shang-Chi enters to protect people from the kind of power that once shaped his life without consent. He believes disciplined cooperation can prevent fear from becoming control, and he will meet unfamiliar champions with patience before deciding how to fight. He will seek a peaceful understanding first, without confusing peace with surrender.',
      es: 'Shang-Chi entra para proteger a la gente del tipo de poder que alguna vez moldeó su vida sin su consentimiento. Cree que la cooperación disciplinada puede impedir que el miedo se convierta en control y enfrentará a campeones desconocidos con paciencia antes de luchar. Buscará primero un entendimiento pacífico, sin confundir paz con rendición.',
    },
  },
  storm: {
    biography: {
      en: 'Ororo Munroe is Storm, an omega-level mutant who commands wind, lightning and pressure with extraordinary precision. A former thief, queen and longtime member of the X-Men, she leads through empathy, clarity and the refusal to abandon people caught in conflict. Her weather responds to emotion, yet her leadership remains deliberate when everyone else panics.',
      es: 'Ororo Munroe es Storm, una mutante de nivel omega que controla el viento, los rayos y la presión con precisión extraordinaria. Fue ladrona, reina y miembro histórica de los X-Men; lidera con empatía, claridad y la negativa a abandonar a quienes quedan atrapados en un conflicto. Su clima responde a la emoción, pero su liderazgo sigue siendo deliberado cuando los demás entran en pánico.',
    },
    tournamentMotivation: {
      en: 'Ororo joins because the collapse of realities threatens every community, not only the powerful. She wants the gathered teams to protect the vulnerable, to act with dignity across cultures and to ensure that no frightened population is left alone beneath a hostile sky. She will judge the teams by how they treat the powerless between battles.',
      es: 'Ororo se une porque el colapso de las realidades amenaza a cada comunidad, no solo a los poderosos. Quiere que los equipos protejan a los vulnerables, actúen con dignidad entre culturas y no dejen sola a ninguna población bajo un cielo hostil. Juzgará a los equipos por cómo tratan a los indefensos entre batallas.',
    },
  },
  cyclops: {
    biography: {
      en: 'Scott Summers is Cyclops, the disciplined field leader of the X-Men whose optic blasts require constant control. He thinks in formations, contingencies and evacuation routes, but his command is rooted in protecting teammates and building a future where mutants do not have to live at war. He turns discipline into a way for frightened teammates to trust the next command.',
      es: 'Scott Summers es Cyclops, el disciplinado líder de campo de los X-Men cuyos rayos ópticos requieren control constante. Piensa en formaciones, contingencias y rutas de evacuación, pero su mando nace de proteger a sus compañeros y construir un futuro sin guerra para los mutantes. Convierte la disciplina en una forma de que sus compañeros confíen en la próxima orden.',
    },
    tournamentMotivation: {
      en: 'Scott enters to keep the crisis from becoming another conflict decided over mutant lives. He will assess every team, coordinate with unfamiliar leaders and turn the tournament into a training ground for cooperation rather than a contest that leaves the vulnerable behind. Scott wants a plan that protects people even if the strongest team does not win.',
      es: 'Scott entra para impedir que la crisis se convierta en otro conflicto decidido sobre vidas mutantes. Evaluará a cada equipo, coordinará con líderes desconocidos y convertirá el torneo en entrenamiento para cooperar, no en una competencia que abandone a los vulnerables. Scott quiere un plan que proteja a la gente aunque no gane el equipo más fuerte.',
    },
  },
  'jean-grey': {
    biography: {
      en: "Jean Grey is a powerful telepath and telekinetic whose empathy lets her feel the emotional currents of a room as sharply as its physical danger. She has faced overwhelming forces without surrendering her compassion, and she remains devoted to the people she loves. Her power is immense, but her empathy keeps another person's pain from becoming background noise.",
      es: 'Jean Grey es una poderosa telépata y telequinética cuya empatía le permite percibir las corrientes emocionales de una sala con tanta claridad como su peligro físico. Ha enfrentado fuerzas abrumadoras sin renunciar a la compasión y sigue dedicada a las personas que ama. Su poder es inmenso, pero su empatía impide que el dolor ajeno se vuelva ruido de fondo.',
    },
    tournamentMotivation: {
      en: 'Jean enters because she can sense how fear might spread when worlds begin to touch. She wants to calm that fear, protect minds as well as bodies and help the assembled heroes choose cooperation before panic turns their power against one another. She will help the teams recognize fear before fear controls their decisions.',
      es: 'Jean entra porque puede percibir cómo se propagaría el miedo cuando los mundos comiencen a tocarse. Quiere calmarlo, proteger mentes además de cuerpos y ayudar a que los héroes elijan cooperar antes de que el pánico vuelva sus poderes contra ellos. Ayudará a los equipos a reconocer el miedo antes de que controle sus decisiones.',
    },
  },
  'professor-x': {
    biography: {
      en: "Charles Xavier is the founder of the X-Men, a powerful telepath who believes humans and mutants can build a shared future. He teaches, counsels and coordinates from a mind trained to see possibilities, while carrying the responsibility of every student who trusts his guidance. His greatest lesson is that a mind's potential matters only when it serves others.",
      es: 'Charles Xavier es el fundador de los X-Men, un poderoso telépata que cree que humanos y mutantes pueden construir un futuro compartido. Enseña, aconseja y coordina con una mente entrenada para ver posibilidades, cargando con la responsabilidad de cada alumno que confía en él. Su mayor enseñanza es que el potencial de una mente solo importa cuando sirve a otros.',
    },
    tournamentMotivation: {
      en: 'Charles joins to keep a multiversal emergency from becoming an excuse for fear between peoples. He hopes the tournament can create dialogue between powerful communities, protect the next generation and demonstrate that survival does not require abandoning coexistence. He will make room for unfamiliar voices, especially those usually excluded from command.',
      es: 'Charles se une para evitar que una emergencia multiversal se convierta en una excusa para el miedo entre pueblos. Espera que el torneo cree diálogo entre comunidades poderosas, proteja a la próxima generación y demuestre que sobrevivir no exige abandonar la convivencia. Dará espacio a voces desconocidas, especialmente a quienes suelen quedar fuera del mando.',
    },
  },
  'star-lord': {
    biography: {
      en: 'Peter Quill is Star-Lord, a half-human spacefarer who became captain of the Guardians of the Galaxy through bold improvisation and hard-earned loyalty. He masks grief with swagger, but his instincts are tuned to finding a way home for a family assembled from unlikely survivors. His bravado hides a captain who has learned that a crew survives by trusting one another.',
      es: 'Peter Quill es Star-Lord, un viajero espacial mitad humano que se convirtió en capitán de los Guardianes de la Galaxia mediante improvisación audaz y lealtad ganada con esfuerzo. Oculta el duelo con fanfarronería, pero siempre busca un camino de regreso para su familia de supervivientes improbables. Su fanfarronería oculta a un capitán que aprendió que una tripulación sobrevive confiando.',
    },
    tournamentMotivation: {
      en: "Peter has seen worlds fall when nobody arrives in time. He accepts the tournament to represent the Guardians, protect the people beyond Earth's horizon and keep powerful strangers from making a cosmic emergency worse through ego or fear. He wants a team capable of coming back for the people left behind.",
      es: 'Peter ha visto caer mundos cuando nadie llega a tiempo. Acepta el torneo para representar a los Guardianes, proteger a quienes están más allá del horizonte terrestre y evitar que extraños poderosos empeoren una emergencia cósmica por ego o miedo. Quiere un equipo capaz de regresar por las personas que queden atrás.',
    },
  },
  'rocket-raccoon': {
    biography: {
      en: "Rocket is a genetically engineered, cybernetically enhanced raccoon with an engineer's mind, a marksman's instincts and a history of surviving experiments that treated him as property. He builds weapons and machines quickly, but values the odd family that chose him more than he admits. He builds with scraps because he knows how much value others overlook in a survivor.",
      es: 'Rocket es un mapache modificado genéticamente y mejorado cibernéticamente, con mente de ingeniero, instinto de tirador y una historia de experimentos que lo trataron como propiedad. Construye armas y máquinas con rapidez, pero valora a su extraña familia más de lo que admite. Construye con restos porque sabe cuánto valor suelen ignorar en un superviviente.',
    },
    tournamentMotivation: {
      en: 'Rocket joins because the people trapped in collapsing worlds remind him of those nobody bothered to rescue. He wants enough information to build a solution, enough firepower to defend it and enough allies to keep the powerful from treating lives like spare parts. Rocket will look for a practical escape plan before anyone celebrates a theoretical victory.',
      es: 'Rocket se une porque las personas atrapadas en mundos que colapsan le recuerdan a quienes nadie se molestó en rescatar. Quiere información para construir una solución, potencia para defenderla y aliados que impidan tratar vidas como piezas de repuesto. Rocket buscará una salida práctica antes de celebrar una victoria teórica.',
    },
  },
  gamora: {
    biography: {
      en: "Gamora is a master assassin who escaped a life shaped by Thanos and became one of the Guardians of the Galaxy. Her strength, precision and tactical discipline are tempered by the difficult work of choosing compassion over the violence she was taught. Her precision is not cruelty; it is the discipline she chose after escaping someone else's design.",
      es: 'Gamora es una asesina maestra que escapó de una vida moldeada por Thanos y se convirtió en una de las Guardianes de la Galaxia. Su fuerza, precisión y disciplina táctica conviven con el esfuerzo de elegir compasión frente a la violencia que le enseñaron. Su precisión no es crueldad: es la disciplina que eligió después de escapar de un diseño ajeno.',
    },
    tournamentMotivation: {
      en: 'Gamora enters because she knows what happens when one power decides that entire populations are acceptable losses. She will fight for worlds that cannot resist, test the intentions of the other teams and refuse to let survival become an excuse for tyranny. She will protect the powerless even when the safest choice would be to leave first.',
      es: 'Gamora entra porque sabe qué ocurre cuando un poder decide que poblaciones enteras son pérdidas aceptables. Luchará por los mundos que no pueden resistir, pondrá a prueba las intenciones de los equipos y no permitirá que la supervivencia sea excusa para la tiranía. Protegerá a los indefensos aunque lo más seguro fuera marcharse primero.',
    },
  },
  'human-torch': {
    biography: {
      en: "Johnny Storm is the Human Torch, a fearless Fantastic Four adventurer who transforms into living flame, flies at incredible speed and shapes heat into controlled force. His confidence and competitive streak conceal a generous brother who always returns when his family needs him. Johnny's flame is spectacular, but his courage is measured by when he lowers it to help.",
      es: 'Johnny Storm es Human Torch, un aventurero intrépido de los Cuatro Fantásticos que se convierte en llama viviente, vuela a gran velocidad y moldea el calor con precisión. Su confianza y espíritu competitivo esconden a un hermano generoso que siempre vuelve cuando su familia lo necesita. La llama de Johnny es espectacular, pero su coraje se mide por cuándo la baja para ayudar.',
    },
    tournamentMotivation: {
      en: 'Johnny enters because the warning sounds bigger than any stunt he has attempted. He wants to keep the Fantastic Four together, prove that courage is more than bravado and make sure people facing a threat between worlds see a hero arrive instead of a spectacle. He wants his family and the other teams to face the unknown without losing their humanity.',
      es: 'Johnny entra porque la advertencia parece mayor que cualquier hazaña que haya intentado. Quiere mantener unidos a los Cuatro Fantásticos, demostrar que el valor es algo más que fanfarronería y que quienes sufran entre mundos vean llegar un héroe, no un espectáculo. Quiere que su familia y los demás equipos enfrenten lo desconocido sin perder humanidad.',
    },
  },
  blade: {
    biography: {
      en: 'Eric Brooks is Blade, a half-vampire hunter who uses enhanced strength, speed and senses against supernatural predators. He carries the knowledge of the darkness he fights without allowing it to define him, relying on discipline, weapons and a refusal to leave unfinished threats behind. He knows the supernatural has rules, even when the people facing it do not know them yet.',
      es: 'Eric Brooks es Blade, un cazador mitad vampiro que usa fuerza, velocidad y sentidos mejorados contra depredadores sobrenaturales. Conoce la oscuridad que combate sin permitir que lo defina, y depende de la disciplina, las armas y la negativa a dejar amenazas inconclusas. Sabe que lo sobrenatural tiene reglas, aunque quienes lo enfrentan todavía no las conozcan.',
    },
    tournamentMotivation: {
      en: 'Blade joins because supernatural danger never stays inside one city for long. He does not need to understand every cosmic detail to recognize a breach that could feed monsters, and he will use the tournament to keep vulnerable worlds from becoming hunting grounds. He will follow evidence and protect the living before chasing a legend.',
      es: 'Blade se une porque el peligro sobrenatural nunca permanece mucho tiempo en una sola ciudad. No necesita conocer cada detalle cósmico para reconocer una brecha que podría alimentar monstruos y usará el torneo para que los mundos vulnerables no se conviertan en cotos de caza. Seguirá las pruebas y protegerá a los vivos antes de perseguir una leyenda.',
    },
  },
  'ms-marvel': {
    biography: {
      en: "On Earth-921, Carol Danvers never adopted the name Captain Marvel. She continued as Ms. Marvel and became one of the Avengers' leaders. When incursions began tearing down the borders between universes, Carol crossed a fracture while trying to save her Earth and became stranded in the main universe, where she discovers that another version of herself chose a different path and became Captain Marvel.",
      es: 'En la Tierra-921, Carol Danvers nunca adoptó el nombre Captain Marvel. Continuó su carrera como Ms. Marvel y terminó convirtiéndose en una de las líderes de los Avengers. Cuando las incursiones comenzaron a destruir las fronteras entre universos, Carol atravesó una de las fracturas intentando salvar su Tierra. Quedó varada en el universo principal, donde descubre que otra versión de ella misma tomó un camino diferente y se convirtió en Captain Marvel.',
    },
    tournamentMotivation: {
      en: 'Carol enters to protect the surviving worlds and find a way back to the Earth she could not abandon. As a stranded Avengers leader, she will coordinate the teams, keep the incursions from consuming another reality and face the unsettling truth of meeting the Carol Danvers who became Captain Marvel. Her resolve is grounded in rescue, accountability and the people still waiting for her return.',
      es: 'Carol participa para proteger los mundos sobrevivientes y encontrar un camino de regreso a la Tierra que no pudo abandonar. Como líder de los Avengers varada entre realidades, coordinará a los equipos, impedirá que las incursiones consuman otra realidad y enfrentará la inquietante verdad de conocer a la Carol Danvers que se convirtió en Captain Marvel. Su determinación nace del rescate, la responsabilidad y las personas que todavía esperan su regreso.',
    },
  },
  gambit: {
    biography: {
      en: 'Remy LeBeau is Gambit, a charming thief and member of the X-Men who charges objects with explosive kinetic energy. He fights with a staff, cards and improvisation, carrying regret from his past while choosing loyalty to the people who gave him another chance. His charm is a defense, but his loyalty is the part of him he no longer hides.',
      es: 'Remy LeBeau es Gambit, un ladrón carismático y miembro de los X-Men que carga objetos con energía cinética explosiva. Lucha con bastón, cartas e improvisación, y lleva el pesar de su pasado mientras elige ser leal a quienes le dieron otra oportunidad. Su encanto es una defensa, pero su lealtad es la parte que ya no oculta.',
    },
    tournamentMotivation: {
      en: 'Remy enters because a crisis crossing realities offers no safe place to hide and too many people to leave behind. He wants to repay the trust of the X-Men, protect communities that cannot bargain with cosmic powers and prove that his choices belong to him now. He will risk his own reputation before asking an innocent community to risk its future.',
      es: 'Remy entra porque una crisis que cruza realidades no deja un escondite seguro ni permite abandonar a demasiadas personas. Quiere devolver la confianza de los X-Men, proteger comunidades sin poder frente a fuerzas cósmicas y demostrar que ahora sus decisiones le pertenecen. Arriesgará su reputación antes de pedir a una comunidad inocente que arriesgue su futuro.',
    },
  },
  rogue: {
    biography: {
      en: "Rogue is a powerful mutant whose touch can absorb another person's memories, skills and powers. After years of fearing her own ability, she found belonging with the X-Men and learned to use that gift with restraint, courage and respect for the person on the other side of her hand. She treats another person's memories as a responsibility, never as a prize to be collected.",
      es: 'Rogue es una poderosa mutante cuyo contacto puede absorber recuerdos, habilidades y poderes ajenos. Tras años de temer su propia capacidad, encontró un lugar junto a los X-Men y aprendió a usarla con control, coraje y respeto por la persona que tiene delante. Trata los recuerdos ajenos como una responsabilidad, nunca como un premio que coleccionar.',
    },
    tournamentMotivation: {
      en: "Rogue enters because she knows how easily power can erase a person's sense of self. She wants to protect vulnerable communities, stand with the X-Men and help the teams face the crisis without treating one another as tools to be used and discarded. Rogue wants the teams to protect one another's identities as carefully as their bodies.",
      es: 'Rogue entra porque sabe con qué facilidad el poder puede borrar la identidad de una persona. Quiere proteger comunidades vulnerables, estar junto a los X-Men y enfrentar la crisis sin que los equipos se traten como herramientas descartables. Rogue quiere que los equipos protejan sus identidades con el mismo cuidado que sus cuerpos.',
    },
  },
  'the-thing': {
    biography: {
      en: "Ben Grimm is the Thing, a pilot and longtime member of the Fantastic Four whose rocky body gives him immense strength and durability. He often speaks plainly and fights head-on, but his defining quality is a steadfast heart that keeps his family together when fear takes over. Ben's jokes make the weight easier to carry, but they never lessen his commitment to his family.",
      es: 'Ben Grimm es The Thing, un piloto y miembro histórico de los Cuatro Fantásticos cuyo cuerpo rocoso le da una fuerza y resistencia inmensas. Habla claro y pelea de frente, pero su rasgo esencial es un corazón firme que mantiene unida a su familia cuando aparece el miedo. Los chistes de Ben alivian el peso, pero nunca reducen su compromiso con la familia.',
    },
    tournamentMotivation: {
      en: "Ben enters because Reed's warning is serious and because no one gets to threaten his family without meeting him first. He will stand between ordinary people and the danger, keep Johnny grounded and make sure the Fantastic Four face the unknown together. He will be the wall between the unknown and anyone who has no way to face it.",
      es: 'Ben entra porque la advertencia de Reed es seria y porque nadie amenaza a su familia sin enfrentarse primero con él. Se pondrá entre la gente común y el peligro, mantendrá a Johnny con los pies en la tierra y afrontará lo desconocido junto a los Cuatro Fantásticos. Será el muro entre lo desconocido y quien no tenga cómo enfrentarlo.',
    },
  },
  'invisible-woman': {
    biography: {
      en: "Susan Storm Richards is Invisible Woman, a founding member of the Fantastic Four who bends light and creates powerful force fields. Her calm judgment, scientific curiosity and fierce protectiveness make her the family's emotional anchor and one of its most formidable defenders. Her force fields can be precise enough to protect one person or strong enough to hold a team together.",
      es: 'Susan Storm Richards es Invisible Woman, miembro fundadora de los Cuatro Fantásticos, capaz de curvar la luz y crear poderosos campos de fuerza. Su criterio sereno, curiosidad científica y protección feroz la convierten en el ancla emocional y defensiva de su familia. Sus campos de fuerza pueden proteger a una persona con precisión o sostener unido a un equipo entero.',
    },
    tournamentMotivation: {
      en: "Sue enters because families and communities across realities deserve protection while others study the crisis. She will keep her team together, shield people who cannot fight and bring the Fantastic Four's patience and courage to a threat no one can yet fully understand. Sue wants the tournament to leave families with a future, not only champions with a trophy.",
      es: 'Sue entra porque las familias y comunidades de todas las realidades merecen protección mientras otros estudian la crisis. Mantendrá unido a su equipo, protegerá a quienes no puedan luchar y llevará la paciencia y el coraje de los Cuatro Fantásticos ante una amenaza que nadie comprende por completo. Sue quiere que el torneo deje un futuro para las familias, no solo un trofeo para los campeones.',
    },
  },
  nightcrawler: {
    biography: {
      en: 'Kurt Wagner is Nightcrawler, a blue-furred mutant who teleports in bursts of smoke and fights with acrobatic grace. His faith, humor and compassion survived persecution, giving him a talent for making frightened people feel less alone even in the middle of danger. He treats every teleport as a chance to carry someone toward safety rather than away from it.',
      es: 'Kurt Wagner es Nightcrawler, un mutante de pelaje azul que se teletransporta entre nubes de humo y combate con gracia acrobática. Su fe, humor y compasión sobrevivieron a la persecución, y sabe hacer que la gente asustada se sienta menos sola incluso en peligro. Ve cada teletransporte como una oportunidad de llevar a alguien hacia la seguridad.',
    },
    tournamentMotivation: {
      en: 'Kurt joins because no world should be abandoned simply because its people look different or lack power. He wants to rescue those caught between realities, keep the X-Men compassionate under pressure and remind the teams that courage can arrive with a smile. He will look for the frightened person who cannot cross the next barrier alone.',
      es: 'Kurt se une porque ningún mundo debe ser abandonado solo porque sus habitantes sean diferentes o carezcan de poder. Quiere rescatar a quienes queden entre realidades, mantener la compasión de los X-Men y recordar que el valor también puede llegar con una sonrisa. Buscará a la persona asustada que no pueda cruzar sola la próxima barrera.',
    },
  },
  colossus: {
    biography: {
      en: 'Piotr Rasputin is Colossus, a gentle artist and member of the X-Men who transforms his body into organic steel. His strength and durability are matched by humility, loyalty and a willingness to place himself between danger and the people who cannot withstand it. His body can bear an enormous impact, but his gentleness determines what he protects with it.',
      es: 'Piotr Rasputin es Colossus, un artista amable y miembro de los X-Men que transforma su cuerpo en acero orgánico. Su fuerza y resistencia se igualan con humildad, lealtad y la voluntad de ponerse entre el peligro y quienes no pueden soportarlo. Su cuerpo soporta impactos enormes, pero su gentileza decide qué protege con él.',
    },
    tournamentMotivation: {
      en: "Piotr joins to serve as a shield for his teammates and for communities that have no champion. He trusts the X-Men's example, wants to prevent fear from dividing humans and mutants and will carry whatever burden lets others reach safety. Piotr will carry the hardest burden so students and families have room to escape.",
      es: 'Piotr se une para ser escudo de sus compañeros y de las comunidades que no tienen un campeón. Confía en el ejemplo de los X-Men, quiere impedir que el miedo divida a humanos y mutantes y cargará con cualquier peso que permita a otros llegar a salvo. Piotr cargará con el peso más duro para que estudiantes y familias puedan escapar.',
    },
  },
  beast: {
    biography: {
      en: 'Hank McCoy is Beast, a brilliant mutant scientist whose blue-furred form combines remarkable strength and agility with a gift for research. He moves between laboratory and fieldwork, believing knowledge should serve coexistence rather than become another instrument of fear. His curiosity is tempered by the knowledge that a discovery can hurt people when handled without care.',
      es: 'Hank McCoy es Beast, un brillante científico mutante cuya forma de pelaje azul combina fuerza y agilidad extraordinarias con un don para la investigación. Se mueve entre el laboratorio y el campo, convencido de que el conocimiento debe servir a la convivencia. Su curiosidad se equilibra con saber que un descubrimiento puede dañar si se usa sin cuidado.',
    },
    tournamentMotivation: {
      en: 'Hank enters to study the dimensional warning and make sure decisions are based on evidence rather than panic. He wants to protect students and civilians, share useful knowledge across teams and prevent a scientific crisis from becoming a political excuse for persecution. He wants shared evidence before shared power, so fear cannot write the conclusion.',
      es: 'Hank entra para estudiar la advertencia dimensional y asegurar que las decisiones se basen en pruebas, no en pánico. Quiere proteger a estudiantes y civiles, compartir conocimiento útil entre equipos y evitar que una crisis científica se convierta en una excusa para perseguir. Quiere pruebas compartidas antes que poder compartido, para que el miedo no escriba la conclusión.',
    },
  },
  iceman: {
    biography: {
      en: 'Bobby Drake is Iceman, an omega-level mutant who can create, shape and become ice. His humor masks a thoughtful hero who has spent years learning that control is not the same as suppression, and that his power can preserve life as readily as it can stop an attacker. He can turn a dangerous space into a bridge, a shelter or a pause long enough to breathe.',
      es: 'Bobby Drake es Iceman, un mutante de nivel omega que puede crear, moldear y convertirse en hielo. Su humor oculta a un héroe reflexivo que aprendió que el control no es represión y que su poder puede preservar la vida tanto como detener a un atacante. Puede convertir un espacio peligroso en puente, refugio o pausa suficiente para respirar.',
    },
    tournamentMotivation: {
      en: 'Bobby joins because people need time and safe routes when realities become unstable. He wants to protect the younger mutants, cool conflicts before they become disasters and help the X-Men show that immense power can be used with care. Bobby will protect people from the heat of panic as carefully as from physical danger.',
      es: 'Bobby se une porque la gente necesita tiempo y rutas seguras cuando las realidades se vuelven inestables. Quiere proteger a los mutantes jóvenes, enfriar los conflictos antes de que sean desastres y mostrar que un gran poder puede usarse con cuidado. Bobby protegerá a la gente del calor del pánico tanto como del peligro físico.',
    },
  },
  psylocke: {
    biography: {
      en: 'Betsy Braddock is Psylocke, a telepathic warrior who shapes psychic energy into blades and precise attacks. Her life has crossed cultures, bodies and battlefields, teaching her to protect her identity and use discipline when the mind can be as dangerous as any weapon. Her psychic blades require focus, and her life has taught her to defend the mind behind every face.',
      es: 'Betsy Braddock es Psylocke, una guerrera telépata que convierte la energía psíquica en hojas y ataques precisos. Su vida cruzó culturas, cuerpos y campos de batalla, y le enseñó a proteger su identidad y actuar con disciplina cuando la mente puede ser un arma. Sus hojas psíquicas exigen concentración, y su vida le enseñó a defender la mente detrás de cada rostro.',
    },
    tournamentMotivation: {
      en: "Betsy enters because a crisis between realities will test minds as much as muscles. She intends to defend her teammates from manipulation, protect people whose thoughts cannot shield them and ensure that power does not erase the identities it claims to save. She will challenge any solution that treats a person's mind as an acceptable battlefield.",
      es: 'Betsy entra porque una crisis entre realidades pondrá a prueba tanto las mentes como los músculos. Defenderá a sus compañeros de la manipulación, protegerá a quienes no pueden resguardar sus pensamientos y evitará que el poder borre las identidades que pretende salvar. Cuestionará cualquier solución que trate la mente de alguien como un campo de batalla aceptable.',
    },
  },
  jubilee: {
    biography: {
      en: "Jubilation Lee is Jubilee, a young mutant who creates colorful plasmoids that burst with controlled force. Her energy, humor and loyalty make her more than the team's spark; she has grown into a protector who refuses to let hardship take away her joy. Her bright energy is a deliberate refusal to let persecution decide what joy is allowed to look like.",
      es: 'Jubilation Lee es Jubilee, una joven mutante que crea plasmoides coloridos que estallan con fuerza controlada. Su energía, humor y lealtad la vuelven más que la chispa del equipo: creció como protectora sin permitir que las dificultades le quitaran la alegría. Su energía brillante es la decisión de no dejar que la persecución defina la alegría.',
    },
    tournamentMotivation: {
      en: 'Jubilee joins because younger mutants deserve to see heroes choose them when the stakes become frightening. She wants to keep families together, support the X-Men and prove that optimism is not denial; it is the energy that helps people keep moving. She will give frightened young people a reason to believe the adults have not abandoned them.',
      es: 'Jubilee se une porque los mutantes jóvenes merecen ver que los héroes los eligen cuando la situación se vuelve aterradora. Quiere mantener unidas a las familias, apoyar a los X-Men y demostrar que el optimismo no es negación, sino la energía para seguir avanzando. Dará a los jóvenes asustados una razón para creer que los adultos no los abandonaron.',
    },
  },
  'kitty-pryde': {
    biography: {
      en: 'Kitty Pryde, also known as Shadowcat, is a gifted X-Men hero who can phase through solid matter and protect others with ingenuity. She grew from a young student into a teacher and leader, carrying technical skill and hard-earned confidence into every mission. She knows a barrier is a problem to solve, not a reason to leave someone on the other side.',
      es: 'Kitty Pryde, también conocida como Shadowcat, es una heroína talentosa de los X-Men que atraviesa la materia y protege a otros con ingenio. Pasó de ser una estudiante a convertirse en maestra y líder, llevando habilidad técnica y confianza ganada a cada misión. Sabe que una barrera es un problema por resolver, no una razón para dejar a alguien del otro lado.',
    },
    tournamentMotivation: {
      en: 'Kitty enters because the people trapped between realities will need someone able to reach them through walls, barriers and confusion. She wants to protect students and civilians, connect teams that do not yet trust each other and turn the tournament into a rescue effort as well as a contest. Kitty will connect teams through practical rescues before asking them to trust one another.',
      es: 'Kitty entra porque quienes queden atrapados entre realidades necesitarán a alguien capaz de atravesar muros, barreras y confusión. Quiere proteger a estudiantes y civiles, conectar equipos que aún no confían entre sí y convertir el torneo también en una misión de rescate. Kitty conectará a los equipos mediante rescates concretos antes de pedir confianza.',
    },
  },
  magik: {
    biography: {
      en: 'Illyana Rasputin is Magik, a mutant sorcerer who rules a path through Limbo and wields the Soulsword. Her teleportation and magic were forged through trauma, yet she protects her friends with a blunt courage that refuses to confuse darkness with evil. Her knowledge of Limbo taught her that surviving darkness does not mean becoming part of it.',
      es: 'Illyana Rasputin es Magik, una hechicera mutante que abre caminos por el Limbo y empuña la Espada Alma. Su teletransportación y magia nacieron del trauma, pero protege a sus amigos con un coraje directo que no confunde la oscuridad con el mal. Su conocimiento del Limbo le enseñó que sobrevivir a la oscuridad no significa pertenecer a ella.',
    },
    tournamentMotivation: {
      en: 'Illyana joins because barriers between realities are not an abstract idea to her; they are places she has crossed and survived. She wants to keep hostile forces from reaching innocent worlds and give the X-Men a guide through dangers others cannot even see. She will open a path for those without one, even when the destination frightens her too.',
      es: 'Illyana se une porque las barreras entre realidades no son una idea abstracta para ella: son lugares que atravesó y sobrevivió. Quiere impedir que fuerzas hostiles alcancen mundos inocentes y guiar a los X-Men por peligros que otros ni siquiera pueden ver. Abrirá un camino para quienes no lo tengan, aunque el destino también la asuste.',
    },
  },
  'x-23': {
    biography: {
      en: 'Laura Kinney is X-23, a mutant with claws, heightened senses and a healing factor who was raised as a weapon before choosing her own name and life. She remains fierce in combat, but her identity is now defined by found family, compassion and self-determination. Every choice she makes now is proof that a weapon can become a person with a future.',
      es: 'Laura Kinney es X-23, una mutante con garras, sentidos aumentados y factor curativo que fue criada como arma antes de elegir su propio nombre y vida. Sigue siendo feroz en combate, pero su identidad ahora la definen la familia elegida, la compasión y la autodeterminación. Cada elección que hace demuestra que un arma puede convertirse en una persona con futuro.',
    },
    tournamentMotivation: {
      en: 'Laura enters to protect the people who gave her a life beyond violence, especially younger mutants who deserve choices she was denied. She will confront the threat directly, but her real measure of victory is bringing her chosen family home. Laura will put the safety of younger mutants ahead of any demand to prove herself.',
      es: 'Laura entra para proteger a quienes le dieron una vida más allá de la violencia, especialmente a los mutantes jóvenes que merecen las opciones que a ella le negaron. Enfrentará la amenaza de frente, pero medirá la victoria por el regreso de su familia elegida. Laura pondrá la seguridad de los mutantes jóvenes por delante de demostrar su valor.',
    },
  },
  cable: {
    biography: {
      en: 'Nathan Summers is Cable, a time-displaced soldier and telekinetic whose cybernetic body bears the cost of wars fought for mutant survival. He carries hard-earned military judgment, but his strongest instinct is to protect the people who might otherwise inherit the future he has already seen. His implants and memories are reminders that survival always has a human price.',
      es: 'Nathan Summers es Cable, un soldado desplazado en el tiempo y telequinético cuyo cuerpo cibernético carga el costo de guerras por la supervivencia mutante. Tiene criterio militar ganado a la fuerza, pero su instinto principal es proteger a quienes podrían heredar un futuro que él ya conoció. Sus implantes y recuerdos le recuerdan que sobrevivir siempre tiene un precio humano.',
    },
    tournamentMotivation: {
      en: 'Cable joins because a warning about collapsing realities sounds like the beginning of the kind of disaster he has spent his life trying to prevent. He will not claim to know this future, but he will prepare the teams, protect the young and act before history demands another sacrifice. He will prepare contingencies without mistaking preparation for certainty.',
      es: 'Cable se une porque una advertencia sobre realidades que colapsan suena al inicio de la clase de desastre que intentó evitar toda su vida. No afirma conocer este futuro, pero preparará a los equipos, protegerá a los jóvenes y actuará antes de que la historia exija otro sacrificio. Preparará contingencias sin confundir preparación con certeza.',
    },
  },
  bishop: {
    biography: {
      en: 'Lucas Bishop is a mutant soldier from a troubled future who can absorb and redirect energy. Trained as a law-enforcement officer and shaped by conflict, he joined the X-Men to prevent the catastrophes that once defined his history, even when trust had to be earned slowly. He carries the discipline of a future police force while learning to live outside its assumptions.',
      es: 'Lucas Bishop es un soldado mutante de un futuro difícil que absorbe y redirige energía. Entrenado como agente de seguridad y marcado por el conflicto, se unió a los X-Men para evitar las catástrofes que definieron su historia, aunque la confianza tuviera que ganarse. Lleva la disciplina de una fuerza policial futura mientras aprende a vivir fuera de sus supuestos.',
    },
    tournamentMotivation: {
      en: 'Bishop enters because a future where realities fail would punish people who never had a chance to choose differently. He will watch for warning signs, protect the X-Men and help the teams act early without pretending that every danger can be solved by force. Bishop will protect the present without treating it as a script already written.',
      es: 'Bishop entra porque un futuro donde fallen las realidades castigaría a personas que nunca pudieron elegir distinto. Vigilará las señales de peligro, protegerá a los X-Men y ayudará a actuar pronto sin fingir que toda amenaza se resuelve con fuerza. Bishop protegerá el presente sin tratarlo como un guion ya escrito.',
    },
  },
  drax: {
    biography: {
      en: 'Drax is a Guardian of the Galaxy whose immense strength and direct manner hide a loyal heart. Once driven by vengeance, he found purpose among friends who taught him that protecting a family can be as meaningful as defeating an enemy. His literal honesty makes him easy to underestimate until the fight becomes personal.',
      es: 'Drax es un Guardián de la Galaxia cuya enorme fuerza y manera directa esconden un corazón leal. Antes lo impulsaba la venganza, pero encontró un propósito junto a amigos que le enseñaron que proteger una familia importa tanto como derrotar a un enemigo. Su honestidad literal hace que lo subestimen hasta que la lucha se vuelve personal.',
    },
    tournamentMotivation: {
      en: 'Drax joins because he understands what it means to lose a home and the people who made it one. He will fight for worlds whose defenders are gone, stand beside the Guardians and make certain the crisis does not take another family without a fight. He will stay when others retreat because leaving a family behind is not acceptable to him.',
      es: 'Drax se une porque entiende lo que significa perder un hogar y a quienes lo convertían en hogar. Luchará por mundos cuyos defensores ya no están, estará junto a los Guardianes y no permitirá que la crisis se lleve otra familia sin resistencia. Se quedará cuando otros retrocedan porque para él abandonar una familia no es aceptable.',
    },
  },
  groot: {
    biography: {
      en: 'Groot is a sentient tree-like Guardian whose roots, branches and remarkable regeneration make him both protector and battlefield shelter. He communicates in a simple phrase, but his loyalty, patience and willingness to grow around his friends speak clearly to everyone who travels with him. His roots make a living promise that protection can grow around everyone, not only the strongest.',
      es: 'Groot es un Guardián arbóreo consciente cuyas raíces, ramas y notable regeneración lo convierten en protector y refugio de batalla. Se comunica con una frase sencilla, pero su lealtad, paciencia y voluntad de crecer junto a sus amigos hablan con claridad. Sus raíces prometen que la protección puede crecer alrededor de todos, no solo de los fuertes.',
    },
    tournamentMotivation: {
      en: 'Groot joins because the Guardians defend families wherever they find them, and collapsing worlds would leave too many people without shelter. He will stand between danger and the frightened, grow where a path is needed and keep his friends together. Groot will make space for the small, the lost and the friends who need somewhere to stand.',
      es: 'Groot se une porque los Guardianes defienden a las familias donde las encuentran, y los mundos que colapsan dejarían a demasiadas personas sin refugio. Se interpondrá ante el peligro, crecerá donde haga falta un camino y mantendrá unidos a sus amigos. Groot hará lugar para los pequeños, los perdidos y los amigos que necesiten dónde estar.',
    },
  },
  mantis: {
    biography: {
      en: 'Mantis is an empathic Guardian who senses emotions and can influence them through touch. Raised apart from ordinary society, she learned to understand herself through friendship, turning unusual sensitivity into a source of compassion and a way to calm people in crisis. Her sensitivity can be overwhelming, but it also lets her notice pain that others hide.',
      es: 'Mantis es una Guardiana empática que percibe las emociones y puede influir en ellas mediante el contacto. Criada apartada de la sociedad común, aprendió a comprenderse a través de la amistad y convirtió su sensibilidad en compasión para calmar crisis. Su sensibilidad puede abrumarla, pero también le permite notar el dolor que otros ocultan.',
    },
    tournamentMotivation: {
      en: 'Mantis enters because fear can destroy cooperation before any cosmic enemy arrives. She wants to help frightened teams listen to one another, protect civilians from panic and remind powerful heroes that every reality is made of feelings as well as stars. She wants the teams to name their fear so it cannot quietly choose their actions.',
      es: 'Mantis entra porque el miedo puede destruir la cooperación antes de que llegue cualquier enemigo cósmico. Quiere ayudar a que los equipos se escuchen, proteger a los civiles del pánico y recordar que cada realidad está hecha de sentimientos además de estrellas. Quiere que los equipos nombren su miedo para que no elija sus acciones en silencio.',
    },
  },
  nebula: {
    biography: {
      en: 'Nebula is a cybernetically altered survivor who endured brutal training and constant comparison before choosing the Guardians as her family. Her tactical mind, mechanical upgrades and hard-edged honesty come from a life she is determined to define on her own terms. She understands machinery and betrayal, and neither has to determine what she becomes next.',
      es: 'Nebula es una superviviente alterada cibernéticamente que soportó entrenamiento brutal y comparaciones constantes antes de elegir a los Guardianes como familia. Su mente táctica, mejoras mecánicas y honestidad áspera nacen de una vida que ahora define por sí misma. Comprende la maquinaria y la traición, y ninguna de las dos debe decidir quién será después.',
    },
    tournamentMotivation: {
      en: "Nebula joins because she knows what happens when powerful people treat entire worlds as tools. She wants to protect the family she chose, learn who is manipulating the crisis and make sure the vulnerable are not measured by someone else's idea of usefulness. Nebula will protect her chosen family while refusing to let anyone own the outcome.",
      es: 'Nebula se une porque sabe qué ocurre cuando los poderosos tratan mundos enteros como herramientas. Quiere proteger a la familia que eligió, descubrir quién manipula la crisis y evitar que los vulnerables sean valorados por la utilidad que otros les asignen. Nebula protegerá a su familia elegida sin permitir que nadie sea dueño del resultado.',
    },
  },
  'adam-warlock': {
    biography: {
      en: 'Adam Warlock is a cosmic being created to become an ideal protector, still learning how wisdom, power and free will fit together. He channels immense energy and approaches ordinary emotions with curiosity, often discovering that compassion cannot be engineered into existence. His immense power is still searching for a moral language of its own.',
      es: 'Adam Warlock es un ser cósmico creado para ser un protector ideal y que aún aprende cómo encajan sabiduría, poder y libre albedrío. Canaliza una energía inmensa y observa las emociones con curiosidad, descubriendo que la compasión no puede fabricarse. Su poder inmenso todavía busca un lenguaje moral propio.',
    },
    tournamentMotivation: {
      en: 'Adam enters to understand the danger and the people living inside it, not merely to display his power. He wants to protect developing civilizations, learn from the other teams and choose a response guided by judgment rather than by the purpose he was originally designed to serve. He will choose the response that preserves freedom to learn rather than one that ends every question.',
      es: 'Adam entra para comprender el peligro y a las personas que viven dentro de él, no solo para mostrar su poder. Quiere proteger civilizaciones en desarrollo, aprender de los equipos y elegir una respuesta guiada por criterio, no por el propósito para el que fue creado. Elegirá la respuesta que preserve la libertad de aprender, no la que cierre toda pregunta.',
    },
  },
  nova: {
    biography: {
      en: 'Richard Rider is Nova, a human champion empowered by the Nova Force and connected to the legacy of the intergalactic Nova Corps. He brings flight, energy projection and the weight of a cosmic police force to every mission, while remembering the lives behind its reports. The Nova Force gives him reach, but reports from ruined worlds give that reach meaning.',
      es: 'Richard Rider es Nova, un campeón humano fortalecido por la Fuerza Nova y ligado al legado del Cuerpo Nova intergaláctico. Aporta vuelo, proyección de energía y el peso de una fuerza policial cósmica, sin olvidar las vidas detrás de cada informe. La Fuerza Nova le da alcance, pero los informes de mundos arruinados le dan sentido.',
    },
    tournamentMotivation: {
      en: 'Richard joins because he has seen how quickly a cosmic emergency becomes a mass evacuation. He wants the teams to coordinate before worlds lose their protectors, and he will treat the tournament as a chance to defend civilians rather than as a contest for prestige. Richard will prioritize evacuation and communication before any display of force.',
      es: 'Richard se une porque ha visto lo rápido que una emergencia cósmica se convierte en una evacuación masiva. Quiere coordinar a los equipos antes de que los mundos pierdan a sus protectores y tratará el torneo como defensa civil, no como una competencia de prestigio. Richard priorizará la evacuación y la comunicación antes de mostrar fuerza.',
    },
  },
  yondu: {
    biography: {
      en: 'Yondu Udonta is a veteran spacefarer whose whistle guides a devastating arrow through impossible paths. A former Ravager leader, he carries a rough exterior and a protective instinct that eventually made him a father figure to the misfits who became his crew. His arrow is precise because he learned to trust instinct without abandoning responsibility.',
      es: 'Yondu Udonta es un veterano del espacio cuyo silbido guía una flecha por trayectorias imposibles. Antiguo líder de los Ravagers, lleva una apariencia áspera y un instinto protector que lo convirtió en figura paterna para los inadaptados de su tripulación. Su flecha es precisa porque aprendió a confiar en el instinto sin abandonar la responsabilidad.',
    },
    tournamentMotivation: {
      en: 'Yondu joins because he knows crews and colonies are often left to fend for themselves when the powerful look toward the next prize. He will protect the people he calls his own, read the room before trusting anyone and keep a path open for escape. He will keep a route open for the people who never get invited to grand plans.',
      es: 'Yondu se une porque sabe que tripulaciones y colonias suelen quedar abandonadas cuando los poderosos miran hacia el próximo premio. Protegerá a quienes considera suyos, observará antes de confiar y mantendrá abierta una ruta de escape. Mantendrá una salida para quienes nunca son invitados a los grandes planes.',
    },
  },
  mbaku: {
    biography: {
      en: "M'Baku is the proud leader of the Jabari, a powerful Wakandan warrior who values tradition, courage and the obligations of community. His strength is matched by a blunt intelligence that can challenge royalty while remaining loyal to Wakanda's survival. His pride is tied to the Jabari, not to winning approval from the outside world.",
      es: "M'Baku es el orgulloso líder de los Jabari, un poderoso guerrero wakandiano que valora la tradición, el coraje y las obligaciones comunitarias. Su fuerza se acompaña de una inteligencia directa capaz de cuestionar a la realeza sin dejar de ser leal a la supervivencia de Wakanda. Su orgullo está ligado a los Jabari y no a obtener aprobación del mundo exterior.",
    },
    tournamentMotivation: {
      en: "M'Baku enters because no ruler can ignore a danger that may reach his people from beyond their world. He will defend Wakanda's dignity, test the courage of the assembled champions and ensure that aid does not become another form of domination. He will accept cooperation only when it protects Wakanda without erasing its voice.",
      es: "M'Baku entra porque ningún gobernante puede ignorar un peligro capaz de alcanzar a su pueblo desde más allá de su mundo. Defenderá la dignidad de Wakanda, pondrá a prueba a los campeones y evitará que la ayuda se convierta en dominación. Aceptará cooperar solo cuando proteja a Wakanda sin borrar su voz.",
    },
  },
  okoye: {
    biography: {
      en: "Okoye is a general of the Dora Milaje, Wakanda's elite royal guard, known for discipline, spear mastery and unwavering service. She is practical, observant and fiercely loyal, able to speak hard truths while placing the safety of her people above personal comfort. She notices the small breach in a formation before it becomes a threat to the people behind it.",
      es: 'Okoye es general de las Dora Milaje, la guardia real de élite de Wakanda, reconocida por su disciplina y dominio de la lanza. Es práctica, observadora y ferozmente leal, capaz de decir verdades incómodas mientras prioriza la seguridad de su pueblo. Percibe la pequeña falla de una formación antes de que amenace a quienes están detrás.',
    },
    tournamentMotivation: {
      en: 'Okoye joins as a protector first, not as a contestant seeking fame. She will gather intelligence, guard Wakandan interests and keep the teams disciplined enough to respond when the crisis reaches people who cannot defend themselves. Her duty is to keep the response disciplined when fear invites reckless action.',
      es: 'Okoye se une como protectora, no como competidora en busca de fama. Reunirá información, defenderá los intereses de Wakanda y mantendrá a los equipos preparados para responder cuando la crisis alcance a quienes no pueden defenderse. Su deber es mantener disciplinada la respuesta cuando el miedo invita a actuar sin cuidado.',
    },
  },
  shuri: {
    biography: {
      en: "Shuri is Wakanda's brilliant inventor and princess, a scientist whose designs blend vibranium tradition with daring experimentation. She can fight when necessary, but her greatest contribution is turning knowledge into tools that let her people face threats without surrendering their identity. Her inventions are strongest when they expand what her people can choose for themselves.",
      es: 'Shuri es la brillante inventora y princesa de Wakanda, una científica cuyos diseños combinan la tradición del vibranium con la experimentación audaz. Puede luchar cuando hace falta, pero su mayor aporte es convertir el conocimiento en herramientas para proteger la identidad de su pueblo. Sus inventos son más fuertes cuando amplían lo que su pueblo puede elegir por sí mismo.',
    },
    tournamentMotivation: {
      en: "Shuri enters to understand a crisis that may affect every scientific system and every community. She wants to exchange ideas with other innovators, protect Wakanda's future and make sure technology serves rescue and cooperation instead of becoming another reason for nations to fear one another. She will share what helps others survive while protecting knowledge that could endanger Wakanda.",
      es: 'Shuri entra para comprender una crisis que puede afectar a cada sistema científico y comunidad. Quiere intercambiar ideas con otros innovadores, proteger el futuro de Wakanda y lograr que la tecnología sirva al rescate y la cooperación. Compartirá lo que ayude a sobrevivir y protegerá el conocimiento que ponga en riesgo a Wakanda.',
    },
  },
  valkyrie: {
    biography: {
      en: 'Valkyrie is an Asgardian warrior and ruler who carries the memory of fallen comrades into every battle. Her skill with the sword, experience guiding refugees and fierce independence make her a protector who understands that leadership begins with staying when others would flee. She leads survivors because she remembers every name that was not carried to safety.',
      es: 'Valkyrie es una guerrera y gobernante asgardiana que lleva la memoria de sus camaradas caídos a cada batalla. Su habilidad con la espada, experiencia guiando refugiados e independencia feroz la convierten en una protectora que sabe que liderar comienza por quedarse. Guía a los supervivientes porque recuerda cada nombre que no llegó a salvo.',
    },
    tournamentMotivation: {
      en: 'Valkyrie joins because she has already watched a realm lose its home. She will stand with worlds facing that same fear, judge the courage of the teams beside her and protect refugees and survivors before anyone worries about honor or victory. She will judge the teams by who they carry when victory is no longer certain.',
      es: 'Valkyrie se une porque ya vio a un reino perder su hogar. Estará junto a los mundos que enfrenten ese miedo, evaluará el coraje de los equipos y protegerá a refugiados y supervivientes antes de pensar en honor o victoria. Juzgará a los equipos por a quiénes cargan cuando la victoria deja de ser segura.',
    },
  },
  sif: {
    biography: {
      en: 'Sif is an Asgardian champion, a master swordswoman and a steadfast friend of Thor. Her courage is not theatrical; it is the disciplined loyalty of a warrior who keeps her word, protects her allies and meets impossible odds without waiting for permission. Her loyalty is active: it means standing in the right place when the shield line breaks.',
      es: 'Sif es una campeona asgardiana, maestra de la espada y amiga inquebrantable de Thor. Su coraje no es teatral: es la lealtad disciplinada de una guerrera que cumple su palabra, protege a sus aliados y enfrenta lo imposible sin pedir permiso. Su lealtad es activa: significa estar en el lugar correcto cuando la línea se rompe.',
    },
    tournamentMotivation: {
      en: "Sif enters because Asgard's duty extends to realms beyond its own borders. She wants to stand beside the threatened, keep Thor and the other teams grounded in honor and make certain that people who cannot wield a sword are not forgotten. She will protect allies without mistaking obedience for honor.",
      es: 'Sif entra porque el deber de Asgard se extiende más allá de sus fronteras. Quiere acompañar a los amenazados, mantener a Thor y a los equipos fieles al honor y evitar que quienes no empuñan una espada sean olvidados. Protegerá a sus aliados sin confundir obediencia con honor.',
    },
  },
  korg: {
    biography: {
      en: 'Korg is a rock-skinned warrior from Kronan culture whose immense resilience is balanced by gentle humor and a talent for making companions feel welcome. He has survived conquest and displacement, yet chooses friendship and solidarity over bitterness. His humor gives frightened companions a moment to breathe before the next hard decision.',
      es: 'Korg es un guerrero de piel rocosa de la cultura kronana cuya enorme resistencia se equilibra con humor amable y una habilidad especial para hacer sentir bienvenidos a sus compañeros. Sobrevivió a la conquista y el desplazamiento, pero elige amistad y solidaridad. Su humor da a los compañeros asustados un instante para respirar antes de decidir.',
    },
    tournamentMotivation: {
      en: 'Korg joins because he knows worlds can be broken by people who think survivors are too small to matter. He will help the teams stay together, protect those looking for a home and bring a little courage to a situation that could otherwise crush it. He will help build a safe place wherever the teams have to make a stand.',
      es: 'Korg se une porque sabe que los mundos pueden ser destruidos por quienes creen que los supervivientes son demasiado pequeños para importar. Ayudará a mantener unidos a los equipos, protegerá a quienes buscan un hogar y aportará coraje. Ayudará a construir un lugar seguro donde los equipos deban resistir.',
    },
  },
  heimdall: {
    biography: {
      en: 'Heimdall is the far-seeing guardian of Asgard, able to perceive distant worlds and movements through the Bifrost. His vigilance is paired with quiet judgment and absolute loyalty, making him the watchman who notices danger before it reaches the gates. His sight is a duty, not a spectacle; he watches so others can sleep.',
      es: 'Heimdall es el guardián clarividente de Asgard, capaz de percibir mundos y movimientos lejanos a través del Bifrost. Su vigilancia se une a un juicio sereno y una lealtad absoluta: es quien advierte el peligro antes de que llegue a las puertas. Su visión es un deber, no un espectáculo: vigila para que otros puedan dormir.',
    },
    tournamentMotivation: {
      en: 'Heimdall joins because the warning concerns paths between worlds, the very crossings he has guarded for ages. He will watch for those in danger, guide allies through uncertainty and ensure that distant peoples are not lost simply because no one saw them in time. He will warn the teams early enough for courage to be a choice rather than a surprise.',
      es: 'Heimdall se une porque la advertencia afecta los caminos entre mundos, los mismos cruces que protegió durante siglos. Vigilará a quienes estén en peligro, guiará a sus aliados y evitará que pueblos lejanos se pierdan por no haber sido vistos a tiempo. Advertirá a los equipos a tiempo para que el valor sea una elección y no una sorpresa.',
    },
  },
  hercules: {
    biography: {
      en: 'Hercules is the Olympian champion, a son of Zeus whose legendary strength is matched by a love of adventure, feasting and honest friendship. Beneath the boastful confidence is a hero who understands that courage means returning to the fight when pride has failed. His legends are loud, but his oldest lesson is that a champion serves the people who cheer.',
      es: 'Hercules es el campeón olímpico, hijo de Zeus, cuya fuerza legendaria se acompaña de amor por la aventura, los banquetes y la amistad sincera. Bajo la confianza fanfarrona hay un héroe que sabe que el coraje es volver a luchar cuando el orgullo falla. Sus leyendas son ruidosas, pero su lección más antigua es servir a quienes lo aclaman.',
    },
    tournamentMotivation: {
      en: 'Hercules enters because a contest that gathers champions across worlds is impossible to ignore, but he stays for more than glory. He wants to defend mortals threatened by forces above them and prove that a heroic challenge can serve a purpose larger than pride. He will turn the contest into a defense of mortals, not a monument to himself.',
      es: 'Hercules entra porque un desafío que reúne campeones de distintos mundos es imposible de ignorar, pero se queda por algo más que gloria. Quiere defender a los mortales frente a fuerzas superiores y demostrar que una gesta puede servir a un propósito mayor que el orgullo. Convertirá el desafío en defensa de los mortales, no en un monumento a sí mismo.',
    },
  },
  echo: {
    biography: {
      en: 'Maya Lopez is Echo, a gifted fighter who can reproduce movements after seeing them and who built her own identity after a childhood shaped by loss. Her combat skill is precise and adaptive, while her determination comes from refusing to let anyone else decide who she must become. She learns from movement without surrendering her own rhythm or voice.',
      es: 'Maya Lopez es Echo, una luchadora talentosa que reproduce movimientos después de observarlos y construyó su identidad tras una infancia marcada por la pérdida. Su combate es preciso y adaptable, y su determinación nace de no dejar que otros decidan quién debe ser. Aprende de los movimientos sin renunciar a su propio ritmo ni a su voz.',
    },
    tournamentMotivation: {
      en: 'Maya joins because people caught in a crisis deserve a defender who understands what it means to be underestimated. She will protect communities without waiting for permission, learn from every opponent and choose her own path through a conflict that reaches far beyond one city. Maya will trust her reading of people more than the titles attached to them.',
      es: 'Maya se une porque quienes quedan atrapados en una crisis merecen una defensora que sepa lo que significa ser subestimada. Protegerá comunidades sin esperar permiso, aprenderá de cada rival y elegirá su propio camino en un conflicto mayor que cualquier ciudad. Maya confiará en su lectura de las personas más que en sus títulos.',
    },
  },
  'kate-bishop': {
    biography: {
      en: 'Kate Bishop is a determined archer who earned the Hawkeye name through training, nerve and a refusal to stand aside. She has no superpowers, but compensates with observation, athletic skill and the confidence to challenge experienced heroes when their plan needs another angle. Her confidence is earned shot by shot, not borrowed from the name she carries.',
      es: 'Kate Bishop es una arquera decidida que ganó el nombre Hawkeye mediante entrenamiento, coraje y la negativa a quedarse al margen. No tiene superpoderes, pero los compensa con observación, habilidad atlética y confianza para cuestionar a héroes expertos. Su confianza se gana disparo a disparo, no se toma prestada del nombre que lleva.',
    },
    tournamentMotivation: {
      en: 'Kate enters because the people threatened by a multiversal crisis will need brave specialists as well as cosmic champions. She wants to learn, contribute and prove that a clear shot and a fast decision can matter even when the battlefield is larger than Earth. She will make herself useful wherever a team needs an angle nobody else can cover.',
      es: 'Kate entra porque las personas amenazadas por una crisis multiversal necesitarán especialistas valientes además de campeones cósmicos. Quiere aprender, aportar y demostrar que un disparo certero y una decisión rápida importan aunque el campo de batalla sea mayor que la Tierra. Será útil donde un equipo necesite un ángulo que nadie más pueda cubrir.',
    },
  },
  'iron-fist': {
    biography: {
      en: 'Danny Rand is Iron Fist, a martial artist who earned the right to channel the chi of Shou-Lao through his legendary fist. His training taught him patience, discipline and responsibility, while his wealth and past continually challenge him to serve rather than possess. His chi is a practice of balance, not simply a stronger way to hit.',
      es: 'Danny Rand es Iron Fist, un artista marcial que ganó el derecho de canalizar el chi de Shou-Lao mediante su legendario puño. Su entrenamiento le enseñó paciencia, disciplina y responsabilidad, mientras su riqueza y pasado lo desafían a servir en lugar de poseer. Su chi es una práctica de equilibrio, no solo una forma más fuerte de golpear.',
    },
    tournamentMotivation: {
      en: "Danny joins because a threat crossing realities can reach the communities he has sworn to protect. He will bring the discipline of K'un-Lun, listen before striking and help the teams resist fear, coercion and the temptation to solve every problem through force. He will teach patience to teams tempted to answer uncertainty with violence.",
      es: "Danny se une porque una amenaza que cruza realidades puede alcanzar a las comunidades que juró proteger. Llevará la disciplina de K'un-Lun, escuchará antes de atacar y ayudará a resistir el miedo, la coerción y la tentación de resolver todo por la fuerza. Enseñará paciencia a los equipos tentados de responder a la incertidumbre con violencia.",
    },
  },
  'luke-cage': {
    biography: {
      en: 'Luke Cage is a Harlem hero with unbreakable skin and tremendous strength who turned painful experimentation into a commitment to his neighborhood. He protects people with a practical sense of justice, a direct voice and the belief that power should answer to the community. His strength is most meaningful when it gives someone else room to breathe and rebuild.',
      es: 'Luke Cage es un héroe de Harlem con piel irrompible y una fuerza enorme que convirtió un experimento doloroso en compromiso con su barrio. Protege con un sentido práctico de la justicia, una voz directa y la convicción de que el poder debe responder a la comunidad. Su fuerza importa más cuando permite que otra persona respire y se reconstruya.',
    },
    tournamentMotivation: {
      en: 'Luke enters because multiversal danger still lands on streets, apartments and families. He wants the powerful teams to remember those places, protect people who cannot leave their homes and make sure any alliance built in the tournament serves communities rather than abstract glory. He will insist that any plan include the neighborhoods hidden behind the headlines.',
      es: 'Luke entra porque el peligro multiversal también cae sobre calles, edificios y familias. Quiere que los equipos poderosos recuerden esos lugares, protejan a quienes no pueden huir y construyan alianzas al servicio de las comunidades, no de la gloria abstracta. Insistirá en que todo plan incluya los barrios ocultos detrás de los titulares.',
    },
  },
  'jessica-jones': {
    biography: {
      en: 'Jessica Jones is a super-strong private investigator who survived control and exploitation without losing her blunt honesty. She keeps people at a distance until trust is earned, then protects them with stubborn loyalty and a practical eye for the details that heroes overlook. She notices the story people tell to avoid saying what actually happened.',
      es: 'Jessica Jones es una investigadora privada superfuerte que sobrevivió al control y la explotación sin perder su honestidad directa. Mantiene distancia hasta que la confianza se gana, pero entonces protege con lealtad obstinada y atención a los detalles que otros héroes pasan por alto. Percibe la historia que alguien cuenta para evitar decir qué ocurrió en verdad.',
    },
    tournamentMotivation: {
      en: 'Jessica joins because someone needs to ask who benefits when everyone is told to rush into a mystery. She will look for missing people, hidden risks and the human cost behind the official warning, protecting survivors even if they never call themselves heroes. She will follow the evidence even when the official version is easier to accept.',
      es: 'Jessica se une porque alguien debe preguntar quién se beneficia cuando todos reciben la orden de correr hacia un misterio. Buscará desaparecidos, riesgos ocultos y el costo humano detrás de la advertencia, protegiendo supervivientes aunque nunca se llamen héroes. Seguirá las pruebas aunque la versión oficial sea más fácil de aceptar.',
    },
  },
  'war-machine': {
    biography: {
      en: "James Rhodes is War Machine, a decorated military officer who operates a heavily armed suit built for defense and battlefield support. His friendship with Tony Stark never replaces his own judgment; Rhodey brings discipline, accountability and the experience of protecting people under fire. Rhodey's armor is a tool for accountability as much as for firepower.",
      es: 'James Rhodes es War Machine, un oficial militar condecorado que opera una armadura fuertemente armada para defensa y apoyo de combate. Su amistad con Tony Stark no reemplaza su criterio; Rhodey aporta disciplina, responsabilidad y experiencia protegiendo bajo fuego. La armadura de Rhodey es una herramienta de responsabilidad tanto como de potencia.',
    },
    tournamentMotivation: {
      en: 'Rhodey enters because the public warning calls for organized defense, not a collection of solo victories. He wants the teams to plan evacuations, coordinate power responsibly and make sure any response to the crisis protects civilians before it protects reputations. He will insist on a chain of care, not merely a chain of command.',
      es: 'Rhodey entra porque la advertencia pública exige defensa organizada, no una colección de victorias individuales. Quiere que los equipos planifiquen evacuaciones, coordinen el poder con responsabilidad y protejan a los civiles antes que a sus reputaciones. Insistirá en una cadena de cuidado, no solo en una cadena de mando.',
    },
  },
  'ghost-rider': {
    biography: {
      en: 'Johnny Blaze is Ghost Rider, a human bound to a Spirit of Vengeance whose hellfire, chain and supernatural strength punish the guilty. His rides are haunted by the cost of the pact, yet he continues to choose protection over surrender to the darkness inside him. The fire answers a spirit of vengeance, but Johnny remains responsible for where it burns.',
      es: 'Johnny Blaze es Ghost Rider, un humano unido a un Espíritu de Venganza cuyo fuego infernal, cadena y fuerza sobrenatural castigan a los culpables. Sus viajes están marcados por el costo del pacto, pero sigue eligiendo proteger antes que rendirse a la oscuridad. El fuego responde a un espíritu de venganza, pero Johnny sigue siendo responsable de dónde arde.',
    },
    tournamentMotivation: {
      en: "Johnny joins because a breach between realities could give supernatural predators a path into worlds that cannot defend themselves. He will follow the trail of those who prey on the innocent and keep the Spirit's vengeance aimed at the guilty rather than the afraid. He will protect the innocent before judging anyone who claims to understand the darkness.",
      es: 'Johnny se une porque una brecha entre realidades podría abrir camino a depredadores sobrenaturales hacia mundos indefensos. Seguirá el rastro de quienes cazan inocentes y mantendrá la venganza del Espíritu dirigida a los culpables, no a los asustados. Protegerá a los inocentes antes de juzgar a quien diga comprender la oscuridad.',
    },
  },
  cloak: {
    biography: {
      en: 'Tyrone Johnson is Cloak, a hero whose connection to the Darkforce lets him open portals through living darkness and shelter people inside it. His bond with Dagger gives that power purpose: together they confront exploitation, fear and the shadows surrounding vulnerable lives. His darkness can hide a person from danger, but it can also remind him of what fear feels like.',
      es: 'Tyrone Johnson es Cloak, un héroe cuya conexión con la Darkforce le permite abrir portales en la oscuridad y refugiar personas dentro de ella. Su vínculo con Dagger da propósito a ese poder: juntos enfrentan la explotación, el miedo y las sombras sobre vidas vulnerables. Su oscuridad puede esconder a alguien del peligro, pero también le recuerda cómo se siente el miedo.',
    },
    tournamentMotivation: {
      en: 'Tyrone enters because people disappear first when worlds become unstable. He wants to create paths to safety, keep Dagger and other allies close and stop darkness from becoming a prison for communities that already have too few places to turn. He wants every team to have a way home before it enters a place it cannot understand.',
      es: 'Tyrone entra porque las personas desaparecen primero cuando los mundos se vuelven inestables. Quiere abrir caminos seguros, mantener cerca a Dagger y evitar que la oscuridad se convierta en prisión para comunidades con pocas alternativas. Quiere que cada equipo tenga un camino de regreso antes de entrar en lo desconocido.',
    },
  },
  dagger: {
    biography: {
      en: 'Tandy Bowen is Dagger, a hero who shapes radiant light into precise blades and can use that light to restore hope and strength. Her partnership with Cloak grew from shared trauma, and her compassion gives direction to the power she carries. Her light is sharp enough to fight and gentle enough to guide someone through terror.',
      es: 'Tandy Bowen es Dagger, una heroína que moldea la luz radiante en hojas precisas y puede usarla para devolver esperanza y fuerzas. Su alianza con Cloak nació de un trauma compartido, y su compasión orienta el poder que lleva. Su luz es lo bastante afilada para luchar y lo bastante amable para guiar en el terror.',
    },
    tournamentMotivation: {
      en: 'Tandy joins because a crisis between realities will leave frightened people searching for a light they can trust. She wants to protect families, support Cloak and use her gift to guide survivors instead of allowing another catastrophe to turn the vulnerable into shadows. She will make protection visible to people who might otherwise believe they were forgotten.',
      es: 'Tandy se une porque una crisis entre realidades dejará a personas asustadas buscando una luz en la que confiar. Quiere proteger familias, apoyar a Cloak y guiar a los supervivientes en lugar de permitir otra catástrofe. Hará visible la protección para quienes podrían creer que fueron olvidados.',
    },
  },
  'america-chavez': {
    biography: {
      en: 'America Chavez is a young hero from the Utopian Parallel who can punch star-shaped portals through the multiverse. Her strength, speed and confidence come with a personal understanding that realities are connected, while her loyalty is grounded in protecting the people she calls family. Every portal reminds her that home is a choice shared with people, not merely a place.',
      es: 'America Chavez es una joven heroína del Paralelo Utópico que abre portales estelares a través del multiverso con sus puños. Su fuerza, velocidad y confianza nacen de comprender que las realidades están conectadas, y su lealtad protege a quienes llama familia. Cada portal le recuerda que el hogar es una elección compartida con personas, no solo un lugar.',
    },
    tournamentMotivation: {
      en: 'America enters because crossing realities is not a theory to her; it is part of her life and the reason she knows how many homes could be lost. She wants to protect younger worlds, connect the teams and make sure no one is trapped on the wrong side of a closing portal. She will keep the routes between teams open when fear makes everyone want to close them.',
      es: 'America entra porque cruzar realidades no es una teoría para ella: forma parte de su vida y le muestra cuántos hogares podrían perderse. Quiere proteger mundos jóvenes, conectar a los equipos y evitar que alguien quede atrapado al cerrarse un portal. Mantendrá abiertos los caminos entre equipos cuando el miedo invite a cerrarlos.',
    },
  },
  'monica-rambeau': {
    biography: {
      en: 'Monica Rambeau, Photon, can transform into forms of electromagnetic energy and move through the spectrum at extraordinary speed. Her experience as an officer, leader and scientist gives her a practical understanding of how power becomes useful when it is guided by service. She can see the crisis as signals, energy and human lives at the same time.',
      es: 'Monica Rambeau, Photon, puede transformarse en distintas formas de energía electromagnética y recorrer el espectro a velocidades extraordinarias. Su experiencia como oficial, líder y científica le da una comprensión práctica de cómo el poder se vuelve útil cuando sirve a otros. Puede ver la crisis como señales, energía y vidas humanas al mismo tiempo.',
    },
    tournamentMotivation: {
      en: 'Monica joins because a threat crossing realities requires someone who can move between scales, from a single rescue to a planetary emergency. She wants to coordinate the teams, protect communities during transitions and keep scientific curiosity tied to human responsibility. She will connect scientific understanding to the immediate work of getting people safe.',
      es: 'Monica se une porque una amenaza que cruza realidades necesita a alguien capaz de pasar de un rescate a una emergencia planetaria. Quiere coordinar equipos, proteger comunidades durante las transiciones y mantener la curiosidad científica ligada a la responsabilidad humana. Conectará la comprensión científica con la tarea inmediata de poner a salvo a la gente.',
    },
  },
  'squirrel-girl': {
    biography: {
      en: 'Doreen Green is Squirrel Girl, an upbeat hero with enhanced strength, agility and a talent for communicating with squirrels. Her record of unlikely victories is less important than her empathy, creativity and refusal to assume that a frightening opponent cannot be reached or outsmarted. Her victories begin with noticing the person or creature everyone else has decided to ignore.',
      es: 'Doreen Green es Squirrel Girl, una heroína optimista con fuerza y agilidad mejoradas y la capacidad de comunicarse con ardillas. Sus victorias improbables importan menos que su empatía, creatividad y negativa a creer que un rival aterrador no pueda ser comprendido o superado. Sus victorias comienzan al notar a quien todos los demás decidieron ignorar.',
    },
    tournamentMotivation: {
      en: 'Doreen enters because everyone deserves a champion who believes they can survive the scary part. She wants to keep communities hopeful, help stronger heroes think sideways and prove that kindness and cleverness belong in a response to a multiversal emergency. She will search for an unexpected solution before accepting that the situation is hopeless.',
      es: 'Doreen entra porque todos merecen una campeona que crea que podrán superar la parte aterradora. Quiere mantener la esperanza de las comunidades, ayudar a pensar de otra manera y demostrar que la bondad también responde a una emergencia multiversal. Buscará una solución inesperada antes de aceptar que la situación no tiene salida.',
    },
  },
  namor: {
    biography: {
      en: "Namor is the mutant ruler of Atlantis, an ancient and proud sovereign who commands the seas and fights with strength born of both land and ocean. He cooperates when it protects his people, but never forgets Atlantis's independence or the cost of surface-world decisions. His pride comes with centuries of memory and a kingdom beneath waters the surface world depends on.",
      es: 'Namor es el gobernante mutante de Atlantis, un soberano antiguo y orgulloso que domina los mares y lucha con la fuerza de la tierra y el océano. Coopera cuando protege a su pueblo, sin olvidar la independencia de Atlantis ni el costo de las decisiones de la superficie. Su orgullo nace de siglos de memoria y de un reino bajo mares de los que depende la superficie.',
    },
    tournamentMotivation: {
      en: 'Namor enters because collapsing boundaries could poison oceans, expose Atlantis and endanger a civilization that rarely receives surface-world protection. He will defend his kingdom on his own terms, test the intentions of the other rulers and negotiate only from strength. He will protect Atlantis first while refusing to pretend that the oceans end at its borders.',
      es: 'Namor entra porque el colapso de las fronteras podría contaminar los océanos, exponer Atlantis y poner en peligro una civilización que rara vez recibe protección de la superficie. Defenderá su reino en sus propios términos y negociará desde la fuerza. Protegerá primero a Atlantis, sin fingir que los océanos terminan en sus fronteras.',
    },
  },
  'moon-girl': {
    biography: {
      en: 'Lunella Lafayette is Moon Girl, a prodigious young inventor whose intellect and bond with Devil Dinosaur make her an extraordinary problem-solver. She can design under pressure, challenge assumptions and turn curiosity into practical technology without losing her sense of wonder. Her inventions begin as questions and become tools before adults finish explaining why they cannot work.',
      es: 'Lunella Lafayette es Moon Girl, una joven inventora prodigiosa cuyo intelecto y vínculo con Devil Dinosaur la convierten en una solucionadora extraordinaria. Diseña bajo presión, cuestiona supuestos y convierte la curiosidad en tecnología práctica sin perder el asombro. Sus inventos comienzan como preguntas y se vuelven herramientas antes de que los adultos expliquen por qué no funcionarán.',
    },
    tournamentMotivation: {
      en: "Lunella enters because a multiversal problem is exactly the kind of impossible question she refuses to leave unanswered. She wants to protect her community, learn from the world's best minds and make sure younger people are treated as part of the solution. She will insist that the best answer includes the people who are usually left out of the room.",
      es: 'Lunella entra porque un problema multiversal es el tipo de pregunta imposible que se niega a dejar sin respuesta. Quiere proteger a su comunidad, aprender de las mejores mentes y demostrar que los jóvenes también forman parte de la solución. Insistirá en que la mejor respuesta incluya a quienes suelen quedar fuera de la sala.',
    },
  },
  'devil-dinosaur': {
    biography: {
      en: 'Devil Dinosaur is a powerful red Tyrannosaurus whose bond with Moon Girl has made him a loyal protector rather than a creature of the past. His size, strength and instincts are formidable, while his trust in Lunella gives his ferocity a clear purpose. His loyalty is expressed through presence: he stays close when every unfamiliar sound becomes a threat.',
      es: 'Devil Dinosaur es un poderoso tiranosaurio rojo cuyo vínculo con Moon Girl lo convirtió en un protector leal y no en una criatura del pasado. Su tamaño, fuerza e instintos son formidables, y la confianza en Lunella da propósito a su ferocidad. Su lealtad se expresa estando presente: permanece cerca cuando cada sonido desconocido es una amenaza.',
    },
    tournamentMotivation: {
      en: "Devil follows Lunella because her safety is his pack's safety. He does not need to understand every word about distant worlds to recognize fear, protect the small and stand beside the people who have earned his trust. He will follow the people he trusts and guard the path beneath their feet.",
      es: 'Devil sigue a Lunella porque su seguridad es la seguridad de su manada. No necesita entender cada palabra sobre mundos lejanos para reconocer el miedo, proteger a los pequeños y estar junto a quienes ganaron su confianza. Seguirá a quienes confía y protegerá el camino bajo sus pies.',
    },
  },
  'beta-ray-bill': {
    biography: {
      en: "Beta Ray Bill is a Korbinite champion transformed into a powerful warrior who proved worthy of divine strength and Stormbreaker. He carries a people's survival in his memory, combining alien honor, compassion and the humility to wield power on behalf of others. Stormbreaker represents a people carried forward, not a trophy taken for personal glory.",
      es: 'Beta Ray Bill es un campeón korbinita transformado en un poderoso guerrero, digno de una fuerza divina y de Stormbreaker. Lleva en la memoria la supervivencia de su pueblo y combina honor alienígena, compasión y humildad. Stormbreaker representa a un pueblo llevado hacia adelante, no un trofeo para la gloria personal.',
    },
    tournamentMotivation: {
      en: 'Bill joins because he knows what it means for a people to lose their world and search for a future elsewhere. He will defend other displaced civilizations, offer his strength without claiming ownership and stand with any team that protects survivors first. He will recognize displaced people in every reality and defend their right to continue.',
      es: 'Bill se une porque sabe lo que significa que un pueblo pierda su mundo y busque un futuro en otra parte. Defenderá a otras civilizaciones desplazadas, ofrecerá su fuerza sin apropiarse de nada y priorizará a los supervivientes. Reconocerá a los desplazados en cada realidad y defenderá su derecho a continuar.',
    },
  },
  'wonder-man': {
    biography: {
      en: 'Simon Williams is Wonder Man, an ionic-powered hero whose strength, flight and durability grew from a life that once revolved around business and public image. He has learned to value genuine service over celebrity, using his visibility to make heroism feel possible to others. He has learned that a public image matters only when it points people toward genuine help.',
      es: 'Simon Williams es Wonder Man, un héroe de energía iónica cuya fuerza, vuelo y resistencia nacieron de una vida centrada en los negocios y la imagen pública. Aprendió a valorar el servicio genuino sobre la celebridad y usa su visibilidad para acercar el heroísmo. Aprendió que una imagen pública solo importa cuando orienta a la gente hacia una ayuda real.',
    },
    tournamentMotivation: {
      en: 'Simon enters because people facing an unknown threat need to see heroes who understand doubt as well as power. He wants to protect civilians, earn trust through action and show that public attention can be turned toward cooperation instead of spectacle. He will use attention to amplify the communities the powerful usually overlook.',
      es: 'Simon entra porque quienes enfrentan una amenaza desconocida necesitan héroes que comprendan la duda además del poder. Quiere proteger civiles, ganar confianza con acciones y convertir la atención pública en cooperación, no en espectáculo. Usará la atención para amplificar a las comunidades que los poderosos suelen ignorar.',
    },
  },
  quicksilver: {
    biography: {
      en: 'Pietro Maximoff is Quicksilver, a mutant speedster whose impatience and sharp temper conceal fierce loyalty to his family. He can cross a battlefield in moments, but his harder discipline is learning when to slow down long enough to understand what others need. His speed outruns most hesitation, but his loyalty gives every rush a destination.',
      es: 'Pietro Maximoff es Quicksilver, un velocista mutante cuya impaciencia y temperamento esconden una lealtad feroz hacia su familia. Puede cruzar un campo de batalla en instantes, pero su disciplina más difícil es frenar para comprender a los demás. Su velocidad supera casi toda duda, pero su lealtad da un destino a cada carrera.',
    },
    tournamentMotivation: {
      en: 'Pietro enters because a threat moving between realities could reach his family before anyone else notices. He will act quickly, protect the people he loves and make sure speed serves a plan rather than becoming another source of danger. He will reach his family first and then return for anyone who cannot keep up.',
      es: 'Pietro entra porque una amenaza que se mueve entre realidades podría alcanzar a su familia antes de que otros la noten. Actuará rápido, protegerá a quienes ama y hará que la velocidad sirva a un plan, no a otro peligro. Llegará primero a su familia y luego volverá por quienes no puedan seguirle el ritmo.',
    },
  },
  'she-hulk': {
    biography: {
      en: 'Jennifer Walters is She-Hulk, a gifted lawyer whose gamma-powered strength exists alongside her intelligence, confidence and precise sense of justice. She refuses to treat the law and heroism as opposing callings, arguing for people in court and defending them in the field. Her strength can win a fight, while her legal mind asks what justice requires afterward.',
      es: 'Jennifer Walters es She-Hulk, una abogada brillante cuya fuerza gamma convive con inteligencia, confianza y un sentido preciso de la justicia. No ve la ley y el heroísmo como caminos opuestos: defiende a la gente en tribunales y en el campo. Su fuerza puede ganar una pelea, mientras su mente jurídica pregunta qué exige la justicia después.',
    },
    tournamentMotivation: {
      en: 'Jennifer enters because a multiversal emergency will create disputes, refugees and people whose rights can vanish in the confusion. She wants to protect them physically and speak for them afterward, insisting that survival must still include accountability. She will insist that frightened populations have a voice in decisions made about them.',
      es: 'Jennifer entra porque una emergencia multiversal creará disputas, refugiados y personas cuyos derechos pueden desaparecer en la confusión. Quiere protegerlos físicamente y defenderlos después, insistiendo en que sobrevivir también exige responsabilidad. Insistirá en que las poblaciones asustadas tengan voz en las decisiones sobre ellas.',
    },
  },
  wiccan: {
    biography: {
      en: 'Billy Kaplan is Wiccan, a young sorcerer whose reality-shaping magic grows with imagination, empathy and confidence. He is still learning the limits of his gifts, but his instinct to protect family and friends makes him braver than his uncertainty suggests. His spells are shaped by emotion, which makes self-knowledge part of every act of courage.',
      es: 'Billy Kaplan es Wiccan, un joven hechicero cuya magia capaz de alterar la realidad crece con imaginación, empatía y confianza. Todavía aprende los límites de sus dones, pero su instinto de proteger a su familia y amigos supera sus dudas. Sus hechizos nacen de la emoción, por lo que conocerse es parte de cada acto de coraje.',
    },
    tournamentMotivation: {
      en: 'Billy joins because younger heroes should not have to wait for the adults to solve a crisis that will shape their future. He wants to learn responsibly, protect the people he loves and use his magic to preserve possibilities rather than impose a single answer. He will learn carefully so his help expands possibilities instead of narrowing them.',
      es: 'Billy se une porque los héroes jóvenes no deberían esperar a que los adultos resuelvan una crisis que definirá su futuro. Quiere aprender con responsabilidad, proteger a quienes ama y usar su magia para preservar posibilidades, no imponer una sola respuesta. Aprenderá con cuidado para que su ayuda amplíe las posibilidades en lugar de cerrarlas.',
    },
  },
  speed: {
    biography: {
      en: "Tommy Shepherd is Speed, a young mutant whose velocity and impulsive confidence make him a difficult target and an even more difficult teammate to keep still. Beneath the restless energy is fierce loyalty to his family and the need to prove that he can choose what his power means. Tommy's impatience is also a refusal to let danger become someone else's problem.",
      es: 'Tommy Shepherd es Speed, un joven mutante cuya velocidad y confianza impulsiva lo convierten en un objetivo difícil y un compañero difícil de mantener quieto. Bajo esa energía hay una lealtad feroz hacia su familia y la necesidad de decidir qué significa su poder. La impaciencia de Tommy también es una negativa a dejar el peligro en manos ajenas.',
    },
    tournamentMotivation: {
      en: 'Tommy enters because he refuses to let older heroes decide that young lives should stay on the sidelines. He will move people out of danger, protect his family and turn his impatience into momentum for a future he gets to help shape. He will turn restless movement into rescues that give his family time to act.',
      es: 'Tommy entra porque se niega a que los héroes mayores decidan que los jóvenes deben quedarse al margen. Sacará a la gente del peligro, protegerá a su familia y convertirá su impaciencia en impulso para un futuro que también ayudará a construir. Convertirá su movimiento inquieto en rescates que den tiempo a su familia.',
    },
  },
  'white-tiger': {
    biography: {
      en: 'White Tiger is a martial hero empowered by mystical tiger amulets that grant enhanced strength, speed and combat ability. The mantle carries a legacy of responsibility, and its bearer must balance instinct, discipline and the protection of family and community. The tiger amulets connect personal courage to a legacy larger than one bearer.',
      es: 'White Tiger es una heroína marcial fortalecida por amuletos místicos del tigre que le dan fuerza, velocidad y habilidad de combate. El manto lleva una herencia de responsabilidad y exige equilibrar instinto, disciplina y protección comunitaria. Los amuletos del tigre conectan el coraje personal con una herencia mayor que quien los lleva.',
    },
    tournamentMotivation: {
      en: 'White Tiger joins because a threat to many realities can endanger the neighborhoods and families that rarely receive cosmic attention. She will honor the amulets by defending people directly, learning from other champions and keeping power accountable to those it protects. She will make sure mystical power remains accountable to the people it serves.',
      es: 'White Tiger se une porque una amenaza para muchas realidades puede poner en peligro barrios y familias que rara vez reciben atención cósmica. Honrará los amuletos defendiendo a la gente, aprendiendo de otros campeones y haciendo responsable al poder. Se asegurará de que el poder místico responda ante las personas a las que sirve.',
    },
  },
  rescue: {
    biography: {
      en: "Pepper Potts is Rescue, an armored protector whose advanced suit prioritizes defense, mobility and saving people from situations that technology alone cannot predict. Her leadership is practical and compassionate, built from years of seeing the human cost behind Tony Stark's inventions. Pepper's armor is designed around the moment after impact, when saving someone matters most.",
      es: 'Pepper Potts es Rescue, una protectora acorazada cuyo traje avanzado prioriza defensa, movilidad y rescate en situaciones que la tecnología sola no puede prever. Su liderazgo es práctico y compasivo, nacido de años de ver el costo humano detrás de los inventos de Tony Stark. La armadura de Pepper está pensada para el instante posterior al impacto, cuando rescatar importa más.',
    },
    tournamentMotivation: {
      en: 'Pepper enters because the first need in any disaster is getting people out alive. She wants to coordinate rescue across realities, keep the inventors focused on consequences and prove that protection is not secondary to the heroes who deliver the biggest attack. She will make evacuation and care part of the response from the first alarm.',
      es: 'Pepper entra porque la primera necesidad de todo desastre es sacar a la gente con vida. Quiere coordinar rescates entre realidades, mantener a los inventores atentos a las consecuencias y demostrar que proteger no es secundario frente al ataque más grande. Incluirá la evacuación y el cuidado desde la primera alarma.',
    },
  },
};

const archetypes = {
  BRUISER: {
    ranges: {
      power: [84, 98],
      agility: [35, 68],
      resistance: [82, 98],
      ability: [50, 72],
      energy: [285, 340],
      ap: [50, 75],
    },
    roles: ['WARRIOR', 'SUPPORT'],
    offensive: ['Titanic Assault', 35, 1.1],
    support: ['Unbreakable Will', 25, 'POWER', 0.12],
  },
  SKIRMISHER: {
    ranges: {
      power: [66, 86],
      agility: [84, 98],
      resistance: [55, 76],
      ability: [66, 86],
      energy: [215, 270],
      ap: [70, 95],
    },
    roles: ['AGILE', 'WARRIOR'],
    offensive: ['Rapid Assault', 30, 1.05],
    support: ['Evasive Rhythm', 25, 'AGILITY', 0.12],
  },
  TACTICIAN: {
    ranges: {
      power: [58, 82],
      agility: [60, 82],
      resistance: [62, 82],
      ability: [84, 98],
      energy: [215, 270],
      ap: [95, 125],
    },
    roles: ['TECH', 'SUPPORT'],
    offensive: ['Precision Barrage', 30, 1.05],
    support: ['Tactical Reset', 25, 'CLEANSE', 1],
  },
  MYSTIC: {
    ranges: {
      power: [44, 70],
      agility: [56, 78],
      resistance: [52, 75],
      ability: [90, 100],
      energy: [190, 245],
      ap: [120, 150],
    },
    roles: ['MYSTIC', 'SUPPORT'],
    offensive: ['Arcane Tempest', 35, 1.1],
    support: ['Mystic Sanctuary', 30, 'HEAL', 0.7],
  },
  GUARDIAN: {
    ranges: {
      power: [62, 82],
      agility: [55, 78],
      resistance: [82, 98],
      ability: [70, 88],
      energy: [255, 310],
      ap: [80, 110],
    },
    roles: ['SUPPORT', 'WARRIOR'],
    offensive: ['Guardian Strike', 30, 1],
    support: ['Protective Field', 25, 'RESISTANCE', 0.15],
  },
  BLASTER: {
    ranges: {
      power: [72, 91],
      agility: [64, 84],
      resistance: [58, 78],
      ability: [84, 98],
      energy: [215, 270],
      ap: [100, 135],
    },
    roles: ['MYSTIC', 'TECH'],
    offensive: ['Energy Storm', 35, 1.1],
    support: ['Energy Infusion', 25, 'POWER', 0.12],
  },
};

const groupDefinitions = [
  [
    'avengers',
    [
      'captain-america',
      'iron-man',
      'thor',
      'hulk',
      'black-widow',
      'hawkeye',
      'wasp',
      'ant-man',
      'vision',
      'falcon',
      'winter-soldier',
      'captain-marvel',
      'ms-marvel',
      'war-machine',
      'she-hulk',
      'wonder-man',
    ],
  ],
  [
    'x-men',
    [
      'wolverine',
      'storm',
      'cyclops',
      'jean-grey',
      'professor-x',
      'gambit',
      'rogue',
      'nightcrawler',
      'colossus',
      'beast',
      'iceman',
      'psylocke',
      'jubilee',
      'kitty-pryde',
      'magik',
      'x-23',
      'cable',
      'bishop',
      'quicksilver',
    ],
  ],
  ['fantastic-four', ['reed-richards', 'invisible-woman', 'human-torch', 'the-thing']],
  [
    'guardians',
    [
      'star-lord',
      'rocket-raccoon',
      'gamora',
      'drax',
      'groot',
      'mantis',
      'nebula',
      'adam-warlock',
      'nova',
      'yondu',
    ],
  ],
  ['wakanda', ['black-panther', 'mbaku', 'okoye', 'shuri']],
  ['asgard', ['thor', 'valkyrie', 'sif', 'korg', 'heimdall', 'beta-ray-bill']],
  [
    'street',
    [
      'spider-man',
      'daredevil',
      'elektra',
      'punisher',
      'deadpool',
      'shang-chi',
      'echo',
      'kate-bishop',
      'iron-fist',
      'luke-cage',
      'jessica-jones',
      'white-tiger',
    ],
  ],
  [
    'young',
    [
      'america-chavez',
      'squirrel-girl',
      'moon-girl',
      'devil-dinosaur',
      'wiccan',
      'speed',
      'kate-bishop',
    ],
  ],
  [
    'mystic',
    ['doctor-strange', 'scarlet-witch', 'magik', 'ghost-rider', 'cloak', 'dagger', 'wiccan'],
  ],
  [
    'cosmic',
    ['captain-marvel', 'monica-rambeau', 'nova', 'adam-warlock', 'beta-ray-bill', 'silver-surfer'],
  ],
];

const rivals = [
  ['spider-man', 'punisher'],
  ['doctor-strange', 'ghost-rider'],
  ['thor', 'hercules'],
  ['wolverine', 'cyclops'],
  ['wolverine', 'hulk'],
  ['wolverine', 'deadpool'],
  ['reed-richards', 'namor'],
  ['black-panther', 'mbaku'],
  ['black-panther', 'namor'],
  ['captain-marvel', 'rogue'],
  ['ms-marvel', 'rogue'],
  ['hulk', 'the-thing'],
  ['vision', 'wonder-man'],
  ['hawkeye', 'deadpool'],
  ['elektra', 'daredevil'],
  ['daredevil', 'punisher'],
  ['deadpool', 'punisher'],
  ['gamora', 'nebula'],
  ['human-torch', 'namor'],
  ['invisible-woman', 'namor'],
  ['shuri', 'namor'],
  ['cable', 'bishop'],
  ['blade', 'ghost-rider'],
  ['luke-cage', 'punisher'],
  ['squirrel-girl', 'deadpool'],
  ['war-machine', 'punisher'],
];

if (rivals.length !== 26) {
  throw new Error(`Expected 26 unique RIVAL pairs, found ${rivals.length}.`);
}
const rosterIds = new Set(roster.map(([id]) => id));
const rivalPairKeys = new Set();
for (const [a, b] of rivals) {
  if (!rosterIds.has(a) || !rosterIds.has(b)) {
    throw new Error(`RIVAL pair ${a}/${b} references a Hero outside the public roster.`);
  }
  if (a === b) {
    throw new Error(`Hero ${a} cannot be its own RIVAL.`);
  }
  const key = [a, b].sort().join('|');
  if (rivalPairKeys.has(key)) {
    throw new Error(`Duplicate unordered RIVAL pair ${a}/${b}.`);
  }
  rivalPairKeys.add(key);
}

const relationshipMap = new Map(
  roster.map(([id]) => [id, { allies: new Set(), rivals: new Set() }]),
);
for (const [, members] of groupDefinitions) {
  const selectable = members.filter((id) => relationshipMap.has(id));
  for (let i = 0; i < selectable.length; i += 1) {
    const a = selectable[i];
    const b = selectable[(i + 1) % selectable.length];
    if (a !== b) {
      relationshipMap.get(a).allies.add(b);
      relationshipMap.get(b).allies.add(a);
    }
  }
}
for (const [a, b] of rivals) {
  relationshipMap.get(a).rivals.add(b);
  relationshipMap.get(b).rivals.add(a);
  relationshipMap.get(a).allies.delete(b);
  relationshipMap.get(b).allies.delete(a);
}
for (const [heroId, relationships] of relationshipMap) {
  for (const rivalId of relationships.rivals) {
    if (!relationshipMap.get(rivalId).rivals.has(heroId)) {
      throw new Error(`RIVAL pair ${heroId}/${rivalId} is not symmetric.`);
    }
    if (relationships.allies.has(rivalId)) {
      throw new Error(`Hero pair ${heroId}/${rivalId} is both ALLY and RIVAL.`);
    }
  }
}

function hash(text) {
  let value = 2166136261;
  for (const char of text) {
    value ^= char.charCodeAt(0);
    value = Math.imul(value, 16777619);
  }
  return value >>> 0;
}
function ranged(id, key, [min, max]) {
  return min + (hash(`${id}:${key}`) % (max - min + 1));
}
function esc(value) {
  return `'${String(value).replaceAll("'", "''")}'`;
}
function json(value) {
  return esc(JSON.stringify(value));
}
function leaderProfile(id) {
  return ['AGGRESSIVE', 'DEFENSIVE', 'BALANCED', 'PRAGMATIC'][hash(`${id}:profile`) % 4];
}
const HERO_ABILITY_THEMES = {
  'spider-man': 'Web',
  'doctor-strange': 'Crimson Bands',
  'captain-america': 'Shield',
  thor: 'Thunder',
  'black-widow': 'Widow',
  wolverine: 'Adamantium',
  'reed-richards': 'Elastic',
  'iron-man': 'Repulsor',
  'black-panther': 'Vibranium',
  'captain-marvel': 'Photon',
  hulk: 'Gamma',
  'scarlet-witch': 'Chaos',
  vision: 'Solar',
  hawkeye: 'Trickshot',
  wasp: 'Bioelectric',
  'ant-man': 'Quantum',
  falcon: 'Wing',
  'winter-soldier': 'Winter',
  elektra: 'Sai',
  'spider-woman': 'Venom',
  daredevil: 'Radar',
  deadpool: 'Regeneration',
  punisher: 'Arsenal',
  'shang-chi': 'Dragon',
  storm: 'Tempest',
  cyclops: 'Optic',
  'jean-grey': 'Phoenix',
  'professor-x': 'Cerebral',
  'star-lord': 'Elemental',
  'rocket-raccoon': 'Heavy Blaster',
  gamora: 'Godslayer',
  'human-torch': 'Nova Flame',
  blade: 'Daywalker',
  'ms-marvel': 'Photon',
  gambit: 'Kinetic',
  rogue: 'Absorption',
  'the-thing': 'Granite',
  'invisible-woman': 'Force Field',
  nightcrawler: 'Bamf',
  colossus: 'Organic Steel',
  beast: 'Blue Fist',
  iceman: 'Frost',
  psylocke: 'Psychic Blade',
  jubilee: 'Plasma',
  'kitty-pryde': 'Phasing',
  magik: 'Soulsword',
  'x-23': 'Claw',
  cable: 'Telekinesis',
  bishop: 'Energy Drain',
  drax: 'Destroyer',
  groot: 'Root',
  mantis: 'Empathy',
  nebula: 'Cybernetic',
  'adam-warlock': 'Soulfire',
  nova: 'Nova Force',
  yondu: 'Yaka',
  mbaku: 'Jabari',
  okoye: 'Dora Milaje',
  shuri: 'Panther Tech',
  valkyrie: 'Dragonfang',
  sif: 'Asgardian',
  korg: 'Stone',
  heimdall: 'Bifrost',
  hercules: 'Olympian',
  echo: 'Mimic',
  'kate-bishop': 'Trick Arrow',
  'iron-fist': 'Chi',
  'luke-cage': 'Unbreakable',
  'jessica-jones': 'Investigation',
  'war-machine': 'Heavy Armor',
  'ghost-rider': 'Hellfire',
  cloak: 'Darkforce',
  dagger: 'Lightforce',
  'america-chavez': 'Star Portal',
  'monica-rambeau': 'Spectrum',
  'squirrel-girl': 'Squirrel',
  namor: 'Tide',
  'moon-girl': 'Gadget',
  'devil-dinosaur': 'Dino',
  'beta-ray-bill': 'Stormbreaker',
  'wonder-man': 'Ionic',
  quicksilver: 'Velocity',
  'she-hulk': 'Verdict',
  wiccan: 'Spellcraft',
  speed: 'Momentum',
  'white-tiger': 'Amulet',
  rescue: 'Rescue Armor',
};

const HERO_ABILITY_CONTENT = {
  'spider-man': {
    basic: [
      'Web Strike',
      'lashes out with a rapid web-assisted strike',
      'descarga un golpe veloz ayudado por telarañas',
    ],
    offensive: [
      'Web Barrage',
      'fires a rapid web assault across the opposing formation',
      'lanza una ráfaga de telarañas sobre la formación rival',
    ],
    support: [
      'Spider-Sense Cover',
      'uses spider-sense and web lines to give the team room to move',
      'usa su sentido arácnido y sus telarañas para abrirle espacio al equipo',
    ],
    leader: [
      'Web Command',
      'coordinates the team through speed, improvisation and web tactics',
      'coordina al equipo con velocidad, improvisación y tácticas de telaraña',
    ],
  },
  'doctor-strange': {
    basic: [
      'Mystic Bolt',
      'fires a precise bolt of eldritch energy',
      'dispara un rayo preciso de energía mística',
    ],
    offensive: [
      'Crimson Bands',
      'binds the opposing formation with the Crimson Bands of Cyttorak',
      'atrapa a la formación rival con las Bandas Carmesí de Cyttorak',
    ],
    support: [
      'Ward of the Vishanti',
      "channels a healing ward that restores the team's strength",
      'canaliza un hechizo sanador que devuelve fuerzas al equipo',
    ],
    leader: [
      'Eye of Agamotto',
      'leads through foresight and disciplined mystical strategy',
      'lidera con visión del futuro y estrategia mística disciplinada',
    ],
  },
  'captain-america': {
    basic: [
      'Shield Bash',
      'drives his shield into the nearest opening',
      'clava su escudo en la abertura más cercana',
    ],
    offensive: [
      'Ricochet Shield',
      'hurls his shield through the opposing formation and brings it back',
      'lanza su escudo contra la formación rival y lo recupera',
    ],
    support: [
      'Rallying Shield',
      'uses the shield to cover allies and steady their defense',
      'usa el escudo para cubrir a sus aliados y afirmar su defensa',
    ],
    leader: [
      'Avengers Rally',
      'turns courage, discipline and teamwork into a decisive command',
      'convierte el valor, la disciplina y el trabajo en equipo en una orden decisiva',
    ],
  },
  thor: {
    basic: [
      'Mjolnir Slam',
      'brings Mjolnir down with thunderous force',
      'descarga a Mjolnir con una fuerza atronadora',
    ],
    offensive: [
      'Thunderstrike',
      'calls lightning through Mjolnir across the opposing formation',
      'canaliza un relámpago por Mjolnir contra la formación rival',
    ],
    support: [
      'Stormcall',
      "channels thunder to strengthen the team's attacks",
      'canaliza el trueno para fortalecer los ataques del equipo',
    ],
    leader: [
      'Asgardian Charge',
      'leads with the boldness of an Asgardian warrior',
      'lidera con la audacia de un guerrero asgardiano',
    ],
  },
  'black-widow': {
    basic: [
      "Widow's Bite",
      'strikes with precise spycraft and a shock of red-room training',
      'ataca con precisión de espía y la descarga de su entrenamiento de la Habitación Roja',
    ],
    offensive: [
      'Red Room Barrage',
      'combines firearms and martial skill in a controlled assault',
      'combina armas de fuego y artes marciales en una ofensiva controlada',
    ],
    support: [
      'Covering Takedown',
      'creates an opening with covering fire and tactical movement',
      'abre un espacio con fuego de cobertura y movimiento táctico',
    ],
    leader: [
      'Covert Coordination',
      'turns preparation and intelligence into a ruthless team plan',
      'convierte la preparación y la inteligencia en un plan de equipo implacable',
    ],
  },
  wolverine: {
    basic: [
      'Adamantium Slash',
      'cuts through the opening with adamantium claws',
      'atraviesa la abertura con sus garras de adamantium',
    ],
    offensive: [
      'Berserker Rush',
      'charges with claws and relentless mutant fury',
      'carga con sus garras y una furia mutante implacable',
    ],
    support: [
      'Berserker Momentum',
      "turns his relentless drive into momentum for the team's attacks",
      'convierte su impulso implacable en fuerza para los ataques del equipo',
    ],
    leader: [
      'Primal Command',
      'leads from the front with instinct and fearless resolve',
      'lidera desde el frente con instinto y valor indomable',
    ],
  },
  'reed-richards': {
    basic: [
      'Elastic Jab',
      'stretches a fist through an unexpected angle',
      'estira el puño desde un ángulo inesperado',
    ],
    offensive: [
      'Fantastic Flurry',
      'turns elastic reach and scientific precision into a sweeping assault',
      'convierte su alcance elástico y su precisión científica en una ofensiva amplia',
    ],
    support: [
      'Elastic Feint',
      'reconfigures the battlefield to clear hindering effects from the team',
      'reconfigura el campo de batalla para despejar los efectos perjudiciales del equipo',
    ],
    leader: [
      'Fantastic Strategy',
      'guides the team through science, preparation and adaptive planning',
      'guía al equipo con ciencia, preparación y planificación adaptable',
    ],
  },
  'iron-man': {
    basic: [
      'Repulsor Shot',
      'fires a focused repulsor burst from his armor',
      'dispara una ráfaga concentrada de sus repulsores',
    ],
    offensive: [
      'Unibeam Sweep',
      'opens the chest reactor and sweeps the opposing formation with a Unibeam',
      'abre el reactor del pecho y barre la formación rival con un Unirrayo',
    ],
    support: [
      'Armor Diagnostics',
      'runs armor diagnostics that clear harmful effects from the team',
      'ejecuta un diagnóstico de la armadura que limpia los efectos perjudiciales del equipo',
    ],
    leader: [
      'Stark Protocol',
      'coordinates technology, timing and calculated risk',
      'coordina tecnología, sincronización y riesgo calculado',
    ],
  },
  'black-panther': {
    basic: [
      'Vibranium Claw',
      'strikes with vibranium claws and silent precision',
      'ataca con garras de vibranio y precisión silenciosa',
    ],
    offensive: [
      'Kinetic Pounce',
      'releases stored kinetic force in a sudden panther-like assault',
      'libera fuerza cinética acumulada en una ofensiva felina y repentina',
    ],
    support: [
      "Panther's Poise",
      'uses calm movement and Wakandan training to clear harmful effects',
      'usa movimientos serenos y entrenamiento wakandiano para limpiar efectos perjudiciales',
    ],
    leader: [
      'Wakandan Command',
      'leads through strategy, tradition and absolute composure',
      'lidera con estrategia, tradición y serenidad absoluta',
    ],
  },
  'captain-marvel': {
    basic: [
      'Photon Burst',
      'drives a burst of photon energy through the opening',
      'descarga un estallido de energía fotónica por la abertura',
    ],
    offensive: [
      'Binary Crash',
      'channels binary power into a blazing assault across the enemy line',
      'canaliza el poder binario en una ofensiva ardiente contra la línea enemiga',
    ],
    support: [
      'Cosmic Charge',
      "channels cosmic power to strengthen the team's attacks",
      'canaliza poder cósmico para fortalecer los ataques del equipo',
    ],
    leader: [
      'Binary Command',
      'leads with cosmic confidence and relentless forward momentum',
      'lidera con confianza cósmica e impulso implacable',
    ],
  },
  hulk: {
    basic: [
      'Gamma Smash',
      'answers the opening with overwhelming gamma strength',
      'responde a la abertura con una fuerza gamma arrolladora',
    ],
    offensive: [
      'Thunderous Leap',
      'leaps into the formation and smashes through it with gamma fury',
      'salta contra la formación y la rompe con furia gamma',
    ],
    support: [
      'Gamma Rally',
      "turns raw strength into momentum for the team's attacks",
      'convierte la fuerza bruta en impulso para los ataques del equipo',
    ],
    leader: [
      "Hulk's Roar",
      'drives the team forward through sheer force of will',
      'empuja al equipo con pura fuerza de voluntad',
    ],
  },
  'scarlet-witch': {
    basic: [
      'Hex Bolt',
      'fires a bolt of scarlet chaos energy',
      'dispara un rayo de energía caótica escarlata',
    ],
    offensive: [
      'Chaos Surge',
      'warps probability into a devastating wave of chaos magic',
      'retuerce la probabilidad en una devastadora oleada de magia del caos',
    ],
    support: [
      'Hex Ward',
      "channels chaos magic to restore the team's fighting strength",
      'canaliza magia del caos para devolver fuerzas de combate al equipo',
    ],
    leader: [
      'Nexus of Chaos',
      'guides reality-warping power with focused intent',
      'guía el poder que altera la realidad con intención concentrada',
    ],
  },
  vision: {
    basic: [
      'Solar Beam',
      'fires a focused beam of solar energy',
      'dispara un rayo concentrado de energía solar',
    ],
    offensive: [
      'Density Shift',
      'phases through the defense and strikes with changing density',
      'atraviesa la defensa y golpea cambiando su densidad',
    ],
    support: [
      'Phase Reset',
      'uses precise phasing to clear harmful effects from the team',
      'usa una fase precisa para limpiar efectos perjudiciales del equipo',
    ],
    leader: [
      'Synthesis Protocol',
      'coordinates logic, empathy and perfect timing',
      'coordina lógica, empatía y sincronización perfecta',
    ],
  },
  hawkeye: {
    basic: [
      'Precision Shot',
      'puts an arrow exactly where the defense opens',
      'clava una flecha justo donde se abre la defensa',
    ],
    offensive: [
      'Trick Arrow Volley',
      'unleashes a volley of specialized trick arrows',
      'desata una lluvia de flechas especiales',
    ],
    support: [
      'Covering Arrows',
      'uses a rain of arrows to give the team room to reposition',
      'usa una lluvia de flechas para que el equipo pueda reposicionarse',
    ],
    leader: [
      'Bullseye Call',
      'turns battlefield awareness into a precise team command',
      'convierte la lectura del campo en una orden precisa para el equipo',
    ],
  },
  wasp: {
    basic: [
      'Stinger Jab',
      'dives in with a bio-electric sting',
      'se lanza con una picadura bioeléctrica',
    ],
    offensive: [
      'Pym-Sting Barrage',
      'changes size and floods the enemy line with stinging blasts',
      'cambia de tamaño y llena la línea enemiga de descargas punzantes',
    ],
    support: [
      'Shrink-and-Scatter',
      "uses size-changing movement to sharpen the team's mobility",
      'usa cambios de tamaño para agudizar la movilidad del equipo',
    ],
    leader: [
      'Swarm Tactics',
      'coordinates speed, size and bio-electric timing',
      'coordina velocidad, tamaño y sincronización bioeléctrica',
    ],
  },
  'ant-man': {
    basic: [
      'Pym Strike',
      'changes size at the instant of impact',
      'cambia de tamaño justo en el momento del impacto',
    ],
    offensive: [
      'Giant-Man Crash',
      'grows into a crushing charge against the opposing formation',
      'crece hasta convertirse en una embestida contra la formación rival',
    ],
    support: [
      'Quantum Reposition',
      'uses size-changing movement to clear hindering effects from the team',
      'usa cambios de tamaño para despejar efectos perjudiciales del equipo',
    ],
    leader: [
      'Quantum Plan',
      'turns scientific improvisation into a reliable team plan',
      'convierte la improvisación científica en un plan confiable para el equipo',
    ],
  },
  falcon: {
    basic: [
      'Wingblade Strike',
      'cuts through the opening with a wing-assisted strike',
      'atraviesa la abertura con un golpe asistido por sus alas',
    ],
    offensive: [
      'Aerial Dive',
      'dives from above with the Redwing and his wings at full speed',
      'se lanza desde el cielo con Redwing y sus alas a toda velocidad',
    ],
    support: [
      'Wingman Cover',
      'uses aerial positioning to give the team room to move',
      'usa su posición aérea para abrirle espacio al equipo',
    ],
    leader: [
      'Aerial Command',
      'leads by reading the battlefield from above',
      'lidera leyendo el campo de batalla desde las alturas',
    ],
  },
  'winter-soldier': {
    basic: [
      'Armored Burst',
      'answers with a controlled burst from his rifle',
      'responde con una ráfaga controlada de su rifle',
    ],
    offensive: [
      'Precision Suppression',
      'combines rifle fire and the metal arm in a disciplined assault',
      'combina el fuego de su rifle y el brazo metálico en una ofensiva disciplinada',
    ],
    support: [
      'Tactical Advance',
      "uses cover and movement to sharpen the team's positioning",
      'usa cobertura y movimiento para mejorar la posición del equipo',
    ],
    leader: [
      "Soldier's Formation",
      'turns hard-earned battlefield discipline into a clear plan',
      'convierte la disciplina ganada en batalla en un plan claro',
    ],
  },
  elektra: {
    basic: [
      'Sai Thrust',
      'drives a sai through the opening with assassin precision',
      'clava un sai en la abertura con precisión de asesina',
    ],
    offensive: [
      "Assassin's Flurry",
      'unleashes a blinding flurry of sai strikes',
      'desata una ráfaga cegadora de golpes con sus sais',
    ],
    support: [
      'Shadow Step',
      "uses speed and misdirection to improve the team's movement",
      'usa velocidad y engaño para mejorar el movimiento del equipo',
    ],
    leader: [
      'Hand Discipline',
      'leads through focus, patience and lethal precision',
      'lidera con concentración, paciencia y precisión letal',
    ],
  },
  'spider-woman': {
    basic: [
      'Venom Jab',
      'lands a charged venom strike',
      'conecta un golpe cargado de veneno bioeléctrico',
    ],
    offensive: [
      'Venom Blast',
      'releases a sweeping venom blast across the enemy line',
      'libera una descarga de veneno bioeléctrico sobre la línea enemiga',
    ],
    support: [
      'Toxin Sense',
      "uses heightened senses to sharpen the team's movement",
      'usa sus sentidos aumentados para agudizar el movimiento del equipo',
    ],
    leader: [
      'Webline Tactics',
      'coordinates mobility, venom and fast tactical choices',
      'coordina movilidad, veneno y decisiones tácticas veloces',
    ],
  },
  daredevil: {
    basic: [
      'Billy Club Strike',
      'whips his billy clubs through the opening',
      'lanza sus bastones contra la abertura',
    ],
    offensive: [
      'Radar Assault',
      'fights through the formation guided by radar sense',
      'atraviesa la formación guiado por su sentido radar',
    ],
    support: [
      'Radar Focus',
      'uses radar awareness to give the team room to reposition',
      'usa su percepción radar para que el equipo pueda reposicionarse',
    ],
    leader: [
      "Hell's Kitchen Resolve",
      'leads with instinct, courage and unshakable resolve',
      'lidera con instinto, valor y determinación inquebrantable',
    ],
  },
  deadpool: {
    basic: [
      'Katana Slash',
      'cuts through the opening with a reckless katana slash',
      'atraviesa la abertura con un tajo temerario de katana',
    ],
    offensive: [
      'Fourth-Wall Barrage',
      'combines twin katanas, guns and impossible improvisation',
      'combina dos katanas, armas de fuego e improvisación imposible',
    ],
    support: [
      'Chaotic Cover',
      'turns unpredictable movement into room for the team to move',
      'convierte sus movimientos impredecibles en espacio para el equipo',
    ],
    leader: [
      'Merc with a Plan',
      'leads through chaos, confidence and a plan that somehow works',
      'lidera con caos, confianza y un plan que, de algún modo, funciona',
    ],
  },
  punisher: {
    basic: [
      'Controlled Fire',
      'opens fire with a disciplined burst from his weapon',
      'abre fuego con una ráfaga disciplinada de su arma',
    ],
    offensive: [
      'Arsenal Barrage',
      'brings multiple weapons to bear across the opposing formation',
      'descarga su arsenal completo sobre la formación rival',
    ],
    support: [
      'Covering Fire',
      'lays down covering fire so the team can reposition safely',
      'sostiene fuego de cobertura para que el equipo se reposicione a salvo',
    ],
    leader: [
      "Punisher's Tactics",
      'turns military planning and ruthless focus into a team command',
      'convierte la planificación militar y la concentración implacable en una orden de equipo',
    ],
  },
  'shang-chi': {
    basic: [
      'Ten Rings Strike',
      'drives a balanced martial-arts strike through the opening',
      'descarga un golpe de artes marciales equilibrado por la abertura',
    ],
    offensive: [
      "Dragon's Fury",
      'turns the Ten Rings into a spiraling offensive assault',
      'convierte los Diez Anillos en una ofensiva arrolladora',
    ],
    support: [
      'Centered Breath',
      "uses disciplined breathing to sharpen the team's movement",
      'usa una respiración disciplinada para agudizar el movimiento del equipo',
    ],
    leader: [
      'Master of the Ten Rings',
      'leads through balance, timing and martial-arts discipline',
      'lidera con equilibrio, ritmo y disciplina marcial',
    ],
  },
  storm: {
    basic: [
      'Wind Cutter',
      'sends a razor-edged gust through the opening',
      'envía una ráfaga cortante por la abertura',
    ],
    offensive: [
      'Lightning Tempest',
      'calls lightning and wind across the opposing formation',
      'desata rayos y viento sobre la formación rival',
    ],
    support: [
      'Eye of the Storm',
      "channels weather control to strengthen the team's attacks",
      'canaliza el control del clima para fortalecer los ataques del equipo',
    ],
    leader: [
      'Weather Command',
      'leads by reading the sky and the battle as one system',
      'lidera leyendo el cielo y la batalla como un mismo sistema',
    ],
  },
  cyclops: {
    basic: [
      'Optic Burst',
      'fires a focused optic beam through the opening',
      'dispara un rayo óptico concentrado por la abertura',
    ],
    offensive: [
      'Ruby Beam',
      'unleashes a sustained optic beam across the opposing formation',
      'desata un rayo óptico sostenido sobre la formación rival',
    ],
    support: [
      'Tactical Visor',
      'uses controlled optic precision to clear hindering effects from the team',
      'usa la precisión óptica controlada para despejar efectos perjudiciales del equipo',
    ],
    leader: [
      'Field Commander',
      'turns discipline and battlefield geometry into a clear order',
      'convierte la disciplina y la geometría del campo en una orden clara',
    ],
  },
  'jean-grey': {
    basic: [
      'Psychic Pulse',
      'strikes with a focused telekinetic pulse',
      'ataca con un pulso telequinético concentrado',
    ],
    offensive: [
      'Phoenix Force',
      'unleashes a blazing wave of Phoenix power',
      'desata una oleada ardiente del poder Fénix',
    ],
    support: [
      'Telekinetic Focus',
      "uses psychic control to restore the team's fighting strength",
      'usa control psíquico para devolver fuerzas de combate al equipo',
    ],
    leader: [
      'Phoenix Guidance',
      'leads through empathy, psychic insight and immense restraint',
      'lidera con empatía, percepción psíquica y una enorme contención',
    ],
  },
  'professor-x': {
    basic: [
      'Psychic Lance',
      'drives a focused psychic lance through the opening',
      'clava una lanza psíquica concentrada en la abertura',
    ],
    offensive: [
      'Cerebral Wave',
      'strikes the opposing formation with a wave of psychic force',
      'golpea la formación rival con una oleada de fuerza psíquica',
    ],
    support: [
      'Mind Link',
      'channels a healing psychic link through the team',
      'canaliza un vínculo psíquico sanador por todo el equipo',
    ],
    leader: [
      'Cerebral Command',
      'coordinates every mind through calm strategic insight',
      'coordina cada mente con una visión estratégica serena',
    ],
  },
  'star-lord': {
    basic: [
      'Quad Blaster Burst',
      'fires both quad blasters in a sharp opening burst',
      'dispara sus dos quad blasters en una ráfaga precisa',
    ],
    offensive: [
      'Element Gun Barrage',
      'switches elemental modes and floods the enemy line with firepower',
      'cambia de modo elemental y llena la línea enemiga de potencia de fuego',
    ],
    support: [
      'Rallying Mix',
      'uses improvisation and battlefield rhythm to clear hindering effects',
      'usa improvisación y ritmo de combate para despejar efectos perjudiciales',
    ],
    leader: [
      'Legendary Outlaw Plan',
      'turns daring improvisation into a plan the team can follow',
      'convierte la improvisación arriesgada en un plan que el equipo puede seguir',
    ],
  },
  'rocket-raccoon': {
    basic: [
      'Blaster Burst',
      'fires a compact blaster burst at the opening',
      'dispara una ráfaga compacta de bláster contra la abertura',
    ],
    offensive: [
      'Big Gun Barrage',
      'unloads an oversized weapon across the opposing formation',
      'descarga un arma descomunal sobre la formación rival',
    ],
    support: [
      'Gadget Patch',
      'uses a battlefield gadget to clear harmful effects from the team',
      'usa un dispositivo de combate para limpiar efectos perjudiciales del equipo',
    ],
    leader: [
      'Tactical Gadgetry',
      'leads through traps, gadgets and unapologetic preparation',
      'lidera con trampas, dispositivos y una preparación sin disculpas',
    ],
  },
  gamora: {
    basic: [
      'Godslayer Cut',
      'draws the Godslayer blade through the opening',
      'traza un corte con la espada Godslayer por la abertura',
    ],
    offensive: [
      'Godslayer Frenzy',
      'turns the Godslayer blade into a relentless assault',
      'convierte la espada Godslayer en una ofensiva implacable',
    ],
    support: [
      "Assassin's Footwork",
      "uses precise movement to sharpen the team's mobility",
      'usa movimientos precisos para agudizar la movilidad del equipo',
    ],
    leader: [
      'Zealot Command',
      'leads with discipline, focus and hard-earned battle instinct',
      'lidera con disciplina, concentración e instinto de combate ganado',
    ],
  },
  'human-torch': {
    basic: [
      'Flame Fist',
      'drives a blazing fist through the opening',
      'descarga un puño en llamas por la abertura',
    ],
    offensive: [
      'Nova Burst',
      'engulfs the opposing formation in a burst of nova flame',
      'envuelve la formación rival en una explosión de fuego nova',
    ],
    support: [
      'Flame Screen',
      "uses controlled flame to strengthen the team's attacks",
      'usa fuego controlado para fortalecer los ataques del equipo',
    ],
    leader: [
      'Supernova Call',
      'leads with daring energy and the courage to burn brighter',
      'lidera con energía audaz y el valor de arder más fuerte',
    ],
  },
  blade: {
    basic: [
      'Sword Draw',
      'draws his sword in a single precise motion',
      'desenvaina su espada con un movimiento preciso',
    ],
    offensive: [
      'Daywalker Barrage',
      'combines swordplay and vampire-hunting firepower',
      'combina esgrima y potencia de fuego de cazavampiros',
    ],
    support: [
      "Hunter's Focus",
      'uses hard-earned hunting instincts to sharpen team movement',
      'usa instintos de cazador para agudizar el movimiento del equipo',
    ],
    leader: [
      'Daywalker Hunt',
      'leads through preparation, resolve and relentless pursuit',
      'lidera con preparación, determinación y persecución implacable',
    ],
  },
  'ms-marvel': {
    basic: [
      'Photon Strike',
      'channels a controlled burst of photon energy through the opening',
      'canaliza una descarga controlada de energía fotónica sobre la abertura',
    ],
    offensive: [
      'Fracture Rescue',
      'crosses the breach in a burst of flight and photon force to break the enemy line',
      'cruza la fractura con un estallido de vuelo y fuerza fotónica para romper la línea enemiga',
    ],
    support: [
      'Photon Aegis',
      'casts a focused photon barrier that reinforces allies under pressure',
      'proyecta una barrera fotónica enfocada que refuerza a los aliados bajo presión',
    ],
    leader: [
      'Earth-921 Resolve',
      'leads across realities with rescue discipline, accountability and unshaken resolve',
      'lidera entre realidades con disciplina de rescate, responsabilidad y determinación inquebrantable',
    ],
  },
  gambit: {
    basic: [
      'Kinetic Card',
      'charges a playing card and flicks it into the opening',
      'carga una carta y la lanza contra la abertura',
    ],
    offensive: [
      'Charged Cardstorm',
      'floods the opposing formation with charged cards and staff strikes',
      'llena la formación rival de cartas cargadas y golpes de bastón',
    ],
    support: [
      'Kinetic Misdirection',
      'uses charged objects and misdirection to sharpen team movement',
      'usa objetos cargados y engaños para agudizar el movimiento del equipo',
    ],
    leader: [
      "Ragin' Cajun Gambit",
      'leads with charm, risk and perfectly timed kinetic flair',
      'lidera con encanto, riesgo y estilo cinético perfectamente calculado',
    ],
  },
  rogue: {
    basic: [
      'Power Leech',
      'strikes while drawing on borrowed power',
      'ataca mientras toma fuerza prestada',
    ],
    offensive: [
      'Absorption Overload',
      'unleashes a surge of absorbed power across the opposing line',
      'desata una oleada de poder absorbido sobre la línea rival',
    ],
    support: [
      'Borrowed Strength',
      "turns absorbed power into momentum for the team's attacks",
      'convierte el poder absorbido en impulso para los ataques del equipo',
    ],
    leader: [
      'X-Men Resolve',
      'leads with courage, adaptability and the strength of many heroes',
      'lidera con valor, adaptabilidad y la fuerza de muchos héroes',
    ],
  },
  'the-thing': {
    basic: [
      'Rock Fist',
      'drives a rocky fist into the opening',
      'descarga un puño de piedra sobre la abertura',
    ],
    offensive: [
      'Yancy Street Charge',
      'charges through the formation with orange-rock strength',
      'arremete contra la formación con su fuerza de piedra anaranjada',
    ],
    support: [
      'Rocky Momentum',
      "turns his rocky strength into momentum for the team's attacks",
      'convierte su fuerza pétrea en impulso para los ataques del equipo',
    ],
    leader: [
      'Blue-Eyed Leadership',
      'leads with loyalty, grit and the courage to stand his ground',
      'lidera con lealtad, coraje y la decisión de no retroceder',
    ],
  },
  'invisible-woman': {
    basic: [
      'Forceful Palm',
      'strikes with a focused invisible force',
      'ataca con una fuerza invisible concentrada',
    ],
    offensive: [
      'Invisible Pressure',
      'crushes the opening with unseen force',
      'aplasta la abertura con una fuerza invisible',
    ],
    support: [
      'Invisible Barrier',
      'raises an invisible shield around the team',
      'levanta un escudo invisible alrededor del equipo',
    ],
  },
  nightcrawler: {
    basic: [
      'Bamf Strike',
      'teleports into the opening with a sudden strike',
      'se teletransporta a la abertura con un golpe repentino',
    ],
    offensive: [
      'Teleporting Flurry',
      'blinks through the formation and strikes from every angle',
      'se teletransporta por la formación y golpea desde todos los ángulos',
    ],
    support: [
      'Bamf Evasion',
      "uses teleportation to sharpen the team's movement",
      'usa la teleportación para agudizar el movimiento del equipo',
    ],
  },
  colossus: {
    basic: [
      'Steel Fist',
      'drives an armored fist through the opening',
      'descarga un puño acorazado sobre la abertura',
    ],
    offensive: [
      'Organic Steel Charge',
      'crashes through the formation in organic steel',
      'irrumpe contra la formación convertido en acero orgánico',
    ],
    support: [
      'Steel Momentum',
      "turns his organic steel into force that drives the team's attacks",
      'convierte su acero orgánico en fuerza para impulsar los ataques del equipo',
    ],
  },
  beast: {
    basic: [
      'Feral Swipe',
      'answers with a powerful blue-furred swipe',
      'responde con un potente zarpazo de pelaje azul',
    ],
    offensive: [
      'Blue-Fur Barrage',
      'combines acrobatics and brute force in a sweeping assault',
      'combina acrobacias y fuerza bruta en una ofensiva amplia',
    ],
    support: [
      'Scientific Remedy',
      'uses science and quick hands to clear harmful effects',
      'usa ciencia y manos rápidas para limpiar efectos perjudiciales',
    ],
  },
  iceman: {
    basic: [
      'Ice Shard',
      'launches a shard of ice through the opening',
      'lanza un fragmento de hielo por la abertura',
    ],
    offensive: [
      'Absolute Zero',
      'freezes the opposing formation beneath a wave of cold',
      'congela la formación rival bajo una oleada de frío',
    ],
    support: [
      'Ice Rampart',
      "raises ice cover to strengthen the team's attacks",
      'levanta una cobertura de hielo para fortalecer los ataques del equipo',
    ],
  },
  psylocke: {
    basic: [
      'Psychic Blade',
      'cuts through the opening with a psychic blade',
      'corta la abertura con una hoja psíquica',
    ],
    offensive: [
      'Psi-Katana Flurry',
      'unleashes a storm of psychic katana strikes',
      'desata una tormenta de tajos con su katana psíquica',
    ],
    support: [
      'Mindful Focus',
      "uses psychic focus to restore the team's fighting strength",
      'usa concentración psíquica para devolver fuerzas de combate al equipo',
    ],
  },
  jubilee: {
    basic: [
      'Plasma Spark',
      'fires a burst of dazzling plasma',
      'dispara una ráfaga de plasma deslumbrante',
    ],
    offensive: [
      'Firework Burst',
      'fills the opposing formation with explosive fireworks',
      'llena la formación rival de fuegos artificiales explosivos',
    ],
    support: [
      'Blinding Flare',
      "uses controlled light to strengthen the team's attacks",
      'usa luz controlada para fortalecer los ataques del equipo',
    ],
  },
  'kitty-pryde': {
    basic: [
      'Phasing Strike',
      'phases through the defense and strikes from within',
      'atraviesa la defensa y golpea desde dentro',
    ],
    offensive: [
      'Phased Assault',
      'moves through the formation with untouchable precision',
      'atraviesa la formación con una precisión intocable',
    ],
    support: [
      'Phasing Rescue',
      "uses phasing to sharpen the team's mobility",
      'usa su intangibilidad para agudizar la movilidad del equipo',
    ],
  },
  magik: {
    basic: [
      'Soulsword Slash',
      'cuts through the opening with the Soulsword',
      'corta la abertura con la Soulsword',
    ],
    offensive: [
      'Stepping Disc Assault',
      'opens stepping discs and attacks from impossible angles',
      'abre discos de teletransporte y ataca desde ángulos imposibles',
    ],
    support: [
      'Limbo Ward',
      "channels Limbo magic to restore the team's strength",
      'canaliza magia del Limbo para devolver fuerzas al equipo',
    ],
  },
  'x-23': {
    basic: [
      'Claw Rake',
      'rips through the opening with adamantium claws',
      'desgarra la abertura con garras de adamantium',
    ],
    offensive: [
      'Berserker Talons',
      'turns speed and claws into a relentless assault',
      'convierte velocidad y garras en una ofensiva implacable',
    ],
    support: [
      "Hunter's Footwork",
      "uses predator instincts to sharpen the team's mobility",
      'usa instintos de depredadora para agudizar la movilidad del equipo',
    ],
  },
  cable: {
    basic: [
      'Telekinetic Strike',
      'drives a telekinetic blow through the opening',
      'descarga un golpe telequinético sobre la abertura',
    ],
    offensive: [
      'Future Arsenal',
      'combines heavy weapons and telekinesis across the enemy line',
      'combina armas pesadas y telequinesis sobre la línea rival',
    ],
    support: [
      'Time-Soldier Reset',
      'uses tactical technology to clear harmful effects from the team',
      'usa tecnología táctica para limpiar efectos perjudiciales del equipo',
    ],
  },
  bishop: {
    basic: [
      'Energy Shot',
      'absorbs incoming energy and fires it back',
      'absorbe energía entrante y la devuelve en un disparo',
    ],
    offensive: [
      'Energy Drain',
      'turns stolen energy into a blast across the opposing line',
      'convierte la energía robada en una descarga sobre la línea rival',
    ],
    support: [
      'Energy Redirect',
      "channels stored energy to strengthen the team's attacks",
      'canaliza energía almacenada para fortalecer los ataques del equipo',
    ],
  },
  drax: {
    basic: [
      'Destroyer Blow',
      "answers the opening with a destroyer's strike",
      'responde a la abertura con un golpe del Destructor',
    ],
    offensive: [
      "Destroyer's Charge",
      'charges straight through the opposing formation',
      'arremete de frente contra la formación rival',
    ],
    support: [
      "Warrior's Focus",
      'turns single-minded purpose into momentum for the team',
      'convierte su propósito inquebrantable en impulso para el equipo',
    ],
  },
  groot: {
    basic: [
      'Branch Strike',
      'swings a heavy branch through the opening',
      'balancea una rama pesada sobre la abertura',
    ],
    offensive: [
      'Rooted Rampage',
      'surges across the battlefield with roots and branches',
      'se abalanza por el campo de batalla con raíces y ramas',
    ],
    support: [
      'Living Cover',
      'grows living cover around the team',
      'hace crecer una cobertura viviente alrededor del equipo',
    ],
  },
  mantis: {
    basic: [
      'Empathic Touch',
      'strikes with a precise empathic pulse',
      'ataca con un pulso empático preciso',
    ],
    offensive: [
      'Empathic Wave',
      'sends a wave of empathic force through the opposing formation',
      'envía una oleada de fuerza empática por la formación rival',
    ],
    support: [
      'Emotional Recenter',
      "uses empathy to restore the team's strength",
      'usa empatía para devolver fuerzas al equipo',
    ],
  },
  nebula: {
    basic: [
      'Cybernetic Blade',
      'cuts through the opening with a cybernetic blade',
      'corta la abertura con una hoja cibernética',
    ],
    offensive: [
      'Neural Overload',
      'floods the opposing formation with cybernetic force',
      'inunda la formación rival con fuerza cibernética',
    ],
    support: [
      'System Purge',
      'uses cybernetic precision to clear harmful effects from the team',
      'usa precisión cibernética para limpiar efectos perjudiciales del equipo',
    ],
  },
  'adam-warlock': {
    basic: [
      'Soulfire Bolt',
      'fires a bolt of golden soulfire',
      'dispara un rayo de fuego álmico dorado',
    ],
    offensive: [
      'Soul Gem Barrage',
      'channels cosmic soul energy across the opposing formation',
      'canaliza energía cósmica del alma sobre la formación rival',
    ],
    support: [
      'Soul Mend',
      'channels restorative soul energy through the team',
      'canaliza energía restauradora del alma por todo el equipo',
    ],
  },
  nova: {
    basic: [
      'Nova Punch',
      'drives Nova Force through a focused punch',
      'descarga la Fuerza Nova en un puñetazo concentrado',
    ],
    offensive: [
      'Nova Force Burst',
      'releases a blazing Nova Force assault',
      'libera una ofensiva ardiente de la Fuerza Nova',
    ],
    support: [
      'Nova Guard',
      "channels Nova Force to strengthen the team's attacks",
      'canaliza la Fuerza Nova para fortalecer los ataques del equipo',
    ],
  },
  yondu: {
    basic: [
      'Yaka Arrow',
      'guides a whistling arrow through the opening',
      'guía una flecha silbante por la abertura',
    ],
    offensive: [
      'Arrow Storm',
      'sends the Yaka arrow weaving through the opposing formation',
      'hace que la flecha Yaka se abra paso por la formación rival',
    ],
    support: [
      'Whistling Cover',
      'uses the Yaka arrow to give the team room to move',
      'usa la flecha Yaka para abrirle espacio al equipo',
    ],
  },
  mbaku: {
    basic: [
      'Jabari Fist',
      'drives a Jabari fist into the opening',
      'descarga un puño Jabari sobre la abertura',
    ],
    offensive: [
      'Gorilla Charge',
      'crashes forward with the strength of the Jabari tribe',
      'irrumpe con la fuerza de la tribu Jabari',
    ],
    support: [
      'Tribal Rally',
      "turns fierce loyalty into momentum for the team's attacks",
      'convierte la lealtad feroz en impulso para los ataques del equipo',
    ],
  },
  okoye: {
    basic: [
      'Dora Spear',
      'drives a vibranium spear through the opening',
      'clava una lanza de vibranio en la abertura',
    ],
    offensive: [
      'Dora Spearstorm',
      'leads a precise spear assault across the enemy line',
      'desata una ofensiva precisa de lanzas sobre la línea enemiga',
    ],
    support: [
      'Formation Drill',
      'uses Dora Milaje discipline to sharpen team movement',
      'usa la disciplina de Dora Milaje para agudizar el movimiento del equipo',
    ],
  },
  shuri: {
    basic: [
      'Panther Gauntlet',
      'fires a kinetic pulse from her panther gauntlets',
      'dispara un pulso cinético de sus guanteletes de pantera',
    ],
    offensive: [
      'Kimoyo Pulse',
      'unleashes a barrage of Wakandan sonic pulses',
      'desata una ráfaga de pulsos sónicos wakandianos',
    ],
    support: [
      'Kimoyo Purge',
      'uses Kimoyo technology to clear harmful effects from the team',
      'usa tecnología Kimoyo para limpiar efectos perjudiciales del equipo',
    ],
  },
  valkyrie: {
    basic: [
      'Dragonfang Slash',
      'cuts through the opening with Dragonfang',
      'corta la abertura con Dragonfang',
    ],
    offensive: [
      'Winged Charge',
      'rides into the opposing formation with Asgardian fury',
      'cabalga contra la formación rival con furia asgardiana',
    ],
    support: [
      'Valkyrie Rally',
      'turns warrior courage into momentum for the team',
      'convierte el valor guerrero en impulso para el equipo',
    ],
  },
  sif: {
    basic: [
      'Asgardian Blade',
      'answers with a clean Asgardian sword strike',
      'responde con un golpe limpio de espada asgardiana',
    ],
    offensive: [
      'Swordstorm',
      'unleashes a disciplined storm of sword strikes',
      'desata una tormenta disciplinada de golpes de espada',
    ],
    support: [
      "Shieldmaid's Footwork",
      "uses shieldmaiden discipline to strengthen the team's attacks",
      'usa disciplina de escudera para fortalecer los ataques del equipo',
    ],
  },
  korg: {
    basic: [
      'Stone Fist',
      'drives a stone fist through the opening',
      'descarga un puño de piedra sobre la abertura',
    ],
    offensive: [
      'Kronan Crush',
      'turns his rocky frame into a crushing charge',
      'convierte su cuerpo rocoso en una embestida demoledora',
    ],
    support: [
      'Stonewall Stance',
      'plants himself between danger and the team',
      'se planta entre el peligro y el equipo',
    ],
  },
  heimdall: {
    basic: [
      'Hofund Cut',
      'draws Hofund through the opening with Asgardian precision',
      'traza Hofund por la abertura con precisión asgardiana',
    ],
    offensive: [
      'Bifrost Sever',
      'calls the Bifrost through a sweeping strike',
      'invoca el Bifrost en un golpe amplio',
    ],
    support: [
      'All-Seeing Guard',
      'uses his all-seeing awareness to protect the team',
      'usa su visión omnisciente para proteger al equipo',
    ],
  },
  hercules: {
    basic: [
      'Olympian Punch',
      'answers with the strength of an Olympian champion',
      'responde con la fuerza de un campeón olímpico',
    ],
    offensive: [
      'Twelve Labors Charge',
      'charges through the opposing formation like a legendary labor',
      'arremete contra la formación rival como en una gesta legendaria',
    ],
    support: [
      'Heroic Roar',
      "turns heroic pride into momentum for the team's attacks",
      'convierte el orgullo heroico en impulso para los ataques del equipo',
    ],
  },
  echo: {
    basic: [
      'Mimic Strike',
      'mirrors the opening and answers with perfect timing',
      'imita la abertura y responde con ritmo perfecto',
    ],
    offensive: [
      'Echoed Flurry',
      "reproduces the opponent's rhythm in a rapid counter-assault",
      'reproduce el ritmo rival en un contraataque veloz',
    ],
    support: [
      'Adaptive Footwork',
      "uses mirrored movement to sharpen the team's mobility",
      'usa movimientos reflejados para agudizar la movilidad del equipo',
    ],
  },
  'kate-bishop': {
    basic: [
      'Trick Arrow',
      'puts a trick arrow through the opening',
      'clava una flecha especial en la abertura',
    ],
    offensive: [
      'Trick Arrow Volley',
      'fills the opposing line with a volley of trick arrows',
      'llena la línea rival con una lluvia de flechas especiales',
    ],
    support: [
      'Covering Arrow',
      'uses precise arrows to give the team room to reposition',
      'usa flechas precisas para que el equipo se reposicione',
    ],
  },
  'iron-fist': {
    basic: [
      'Iron Fist',
      'drives chi through a focused fist',
      'descarga chi en un puño concentrado',
    ],
    offensive: [
      'Chi Dragon',
      'unleashes a dragon-shaped wave of chi across the enemy line',
      'desata una oleada de chi con forma de dragón sobre la línea enemiga',
    ],
    support: [
      'Chi Meditation',
      "uses disciplined chi control to sharpen the team's movement",
      'usa control disciplinado del chi para agudizar el movimiento del equipo',
    ],
  },
  'luke-cage': {
    basic: [
      'Power Man Punch',
      'answers with an unbreakable Power Man punch',
      'responde con un puñetazo irrompible de Power Man',
    ],
    offensive: [
      'Unbreakable Charge',
      'crashes through the opposing formation with bulletproof strength',
      'irrumpe contra la formación rival con fuerza a prueba de balas',
    ],
    support: [
      'Bulletproof Cover',
      'puts unbreakable skin between danger and the team',
      'interpone su piel irrompible entre el peligro y el equipo',
    ],
  },
  'jessica-jones': {
    basic: [
      'Powerhouse Jab',
      'lands a blunt super-strength strike',
      'conecta un golpe directo de superfuerza',
    ],
    offensive: [
      "Investigator's Takedown",
      'combines super-strength with a no-nonsense takedown',
      'combina superfuerza con un derribo directo',
    ],
    support: [
      'Hard Truth',
      "uses stubborn resolve to protect the team's formation",
      'usa una determinación obstinada para proteger la formación del equipo',
    ],
  },
  'war-machine': {
    basic: [
      'Armor Cannon',
      'fires a controlled cannon burst from heavy armor',
      'dispara una ráfaga controlada de su cañón acorazado',
    ],
    offensive: [
      'War Machine Salvo',
      'unloads heavy armor firepower across the opposing formation',
      'descarga la potencia de fuego de su armadura sobre la formación rival',
    ],
    support: [
      'Combat Systems Reset',
      'uses armor systems to clear harmful effects from the team',
      'usa los sistemas de la armadura para limpiar efectos perjudiciales del equipo',
    ],
  },
  'ghost-rider': {
    basic: [
      'Hellfire Chain',
      'lashes the opening with a chain of hellfire',
      'azota la abertura con una cadena de fuego infernal',
    ],
    offensive: [
      'Penance Stare',
      'unleashes the Penance Stare through the opposing line',
      'desata la Mirada de Penitencia sobre la línea rival',
    ],
    support: [
      'Hellfire Aegis',
      "channels hellfire to restore the team's strength",
      'canaliza fuego infernal para devolver fuerzas al equipo',
    ],
  },
  cloak: {
    basic: [
      'Darkforce Strike',
      'opens a darkforce portal through the opening',
      'abre un portal de darkforce en la abertura',
    ],
    offensive: [
      'Dark Dimension Crush',
      'pulls the opposing formation toward the Dark Dimension',
      'arrastra la formación rival hacia la Dimensión Oscura',
    ],
    support: [
      'Darkforce Veil',
      'wraps the team in darkforce and restores its strength',
      'envuelve al equipo en darkforce y devuelve sus fuerzas',
    ],
  },
  dagger: {
    basic: [
      'Lightforce Blade',
      'cuts through the opening with a blade of light',
      'corta la abertura con una hoja de luz',
    ],
    offensive: [
      'Lightforce Burst',
      'unleashes a storm of light daggers across the enemy line',
      'desata una tormenta de dagas de luz sobre la línea enemiga',
    ],
    support: [
      'Lightforce Empowerment',
      "channels light to strengthen the team's attacks",
      'canaliza luz para fortalecer los ataques del equipo',
    ],
  },
  'america-chavez': {
    basic: [
      'Star Punch',
      'drives a star-powered punch through the opening',
      'descarga un puñetazo estelar sobre la abertura',
    ],
    offensive: [
      'Star Portal Crash',
      'smashes through a star portal into the opposing formation',
      'atraviesa un portal estelar y arremete contra la formación rival',
    ],
    support: [
      'Portal Guard',
      "uses star portals to strengthen the team's attacks",
      'usa portales estelares para fortalecer los ataques del equipo',
    ],
  },
  'monica-rambeau': {
    basic: [
      'Photon Jab',
      'strikes in a flash of photon energy',
      'ataca en un destello de energía fotónica',
    ],
    offensive: [
      'Spectrum Surge',
      'cycles through energy forms in a sweeping assault',
      'alterna formas de energía en una ofensiva amplia',
    ],
    support: [
      'Energy Refraction',
      "bends incoming energy to strengthen the team's attacks",
      'desvía la energía entrante para fortalecer los ataques del equipo',
    ],
  },
  'squirrel-girl': {
    basic: [
      'Acorn Strike',
      'answers with a surprisingly fierce acorn-powered strike',
      'responde con un golpe de bellota sorprendentemente feroz',
    ],
    offensive: [
      'Squirrel Swarm',
      'calls a squirrel swarm across the opposing formation',
      'convoca una oleada de ardillas sobre la formación rival',
    ],
    support: [
      'Squirrel Scouts',
      "uses squirrel scouts to strengthen the team's defense",
      'usa ardillas exploradoras para reforzar la defensa del equipo',
    ],
  },
  namor: {
    basic: [
      'Trident Thrust',
      'drives the trident through the opening',
      'clava el tridente en la abertura',
    ],
    offensive: [
      'Tidal Spear',
      'summons a tidal assault across the opposing formation',
      'convoca una embestida de marea sobre la formación rival',
    ],
    support: [
      'Atlantean Rally',
      "turns Atlantean power into momentum for the team's attacks",
      'convierte el poder atlante en impulso para los ataques del equipo',
    ],
  },
  'moon-girl': {
    basic: [
      'Gadget Jab',
      'uses a clever gadget to strike the opening',
      'usa un dispositivo ingenioso para golpear la abertura',
    ],
    offensive: [
      'Devil Dinosaur Directive',
      'coordinates Devil Dinosaur in a sweeping assault',
      'coordina a Devil Dinosaur en una ofensiva amplia',
    ],
    support: [
      'Brainy Backup',
      'uses science and gadgets to clear harmful effects from the team',
      'usa ciencia y dispositivos para limpiar efectos perjudiciales del equipo',
    ],
  },
  'devil-dinosaur': {
    basic: ['Dino Bite', 'snaps down with a colossal bite', 'muerde con una fuerza colosal'],
    offensive: [
      'Colossal Stomp',
      'shakes the opposing formation with a colossal stomp',
      'sacude la formación rival con una pisada colosal',
    ],
    support: [
      'Pack Roar',
      'turns a thunderous roar into momentum for the team',
      'convierte un rugido atronador en impulso para el equipo',
    ],
  },
  'beta-ray-bill': {
    basic: [
      'Stormbreaker Blow',
      'brings Stormbreaker down with Korbinite force',
      'descarga Stormbreaker con fuerza korbinita',
    ],
    offensive: [
      'Godstorm Charge',
      'calls a godstorm through the opposing formation',
      'desata una tormenta divina sobre la formación rival',
    ],
    support: [
      'Korbinite Valor',
      "turns warrior courage into momentum for the team's attacks",
      'convierte el valor guerrero en impulso para los ataques del equipo',
    ],
  },
  'wonder-man': {
    basic: [
      'Ionic Punch',
      'drives ionic energy through a focused punch',
      'descarga energía iónica en un puñetazo concentrado',
    ],
    offensive: [
      'Ionic Shockwave',
      'releases an ionic shockwave across the enemy line',
      'libera una onda de choque iónica sobre la línea enemiga',
    ],
    support: [
      'Ionic Momentum',
      "channels ionic power to strengthen the team's attacks",
      'canaliza poder iónico para fortalecer los ataques del equipo',
    ],
  },
  quicksilver: {
    basic: [
      'Velocity Jab',
      'strikes before the opening can close',
      'golpea antes de que la abertura pueda cerrarse',
    ],
    offensive: [
      'Mach Dash',
      'crosses the formation in a blur of supersonic strikes',
      'atraviesa la formación en un borrón de golpes supersónicos',
    ],
    support: [
      'Rapid Formation',
      "uses speed to sharpen the team's movement",
      'usa su velocidad para agudizar el movimiento del equipo',
    ],
  },
  'she-hulk': {
    basic: [
      'Gamma Gavel',
      'brings down a gamma-powered fist like a gavel',
      'descarga un puño gamma como un martillo judicial',
    ],
    offensive: [
      'Verdict Smash',
      'delivers a decisive smash across the opposing formation',
      'descarga un golpe decisivo sobre la formación rival',
    ],
    support: [
      'Legal Counsel',
      'turns confidence and discipline into momentum for the team',
      'convierte confianza y disciplina en impulso para el equipo',
    ],
  },
  wiccan: {
    basic: [
      'Hex Bolt',
      'fires a focused bolt of spellcraft',
      'dispara un rayo concentrado de hechicería',
    ],
    offensive: [
      'Demiurge Surge',
      'unleashes reality-shaping magic across the enemy line',
      'desata magia que altera la realidad sobre la línea enemiga',
    ],
    support: [
      'Reality Anchor',
      "channels spellcraft to restore the team's strength",
      'canaliza hechicería para devolver fuerzas al equipo',
    ],
  },
  speed: {
    basic: [
      'Supersonic Strike',
      'hits before the opening can close',
      'golpea antes de que la abertura pueda cerrarse',
    ],
    offensive: [
      'Momentum Rush',
      'turns impossible speed into a sweeping assault',
      'convierte una velocidad imposible en una ofensiva amplia',
    ],
    support: [
      'Speed Formation',
      "uses restless momentum to sharpen the team's mobility",
      'usa su impulso incansable para agudizar la movilidad del equipo',
    ],
  },
  'white-tiger': {
    basic: [
      'Tiger Claw',
      'strikes with the power of the tiger amulets',
      'ataca con el poder de los amuletos del tigre',
    ],
    offensive: [
      'Amulet Fury',
      'unleashes mystical martial fury across the opposing line',
      'desata una furia marcial mística sobre la línea rival',
    ],
    support: [
      "Tiger's Footwork",
      "uses mystical agility to sharpen the team's movement",
      'usa agilidad mística para agudizar el movimiento del equipo',
    ],
  },
  rescue: {
    basic: [
      'Repulsor Punch',
      'fires a focused repulsor-assisted strike',
      'descarga un golpe asistido por repulsores',
    ],
    offensive: [
      'Rescue Protocol',
      "deploys the Rescue armor's systems across the enemy line",
      'despliega los sistemas de la armadura Rescue sobre la línea enemiga',
    ],
    support: [
      'Armor Support',
      "uses rescue technology to protect the team's formation",
      'usa tecnología de rescate para proteger la formación del equipo',
    ],
  },
};

function localizedAbility(name, token, kind, supportEffect, leaderEffect, content) {
  if (content) {
    if (!Array.isArray(content) || content.length !== 3) {
      throw new Error(`Invalid localized ability content for ${name} (${kind}).`);
    }
    const [localizedName, descriptionEn, descriptionEs] = content;
    return {
      localizedName: { en: localizedName, es: localizedName },
      description: { en: `${name} ${descriptionEn}.`, es: `${name} ${descriptionEs}.` },
    };
  }

  const suffix =
    kind === 'basic'
      ? ['Strike', 'Golpe']
      : kind === 'offensive'
        ? ['Assault', 'Asalto']
        : kind === 'support'
          ? ['Guard', 'Guardia']
          : ['Command', 'Mando'];
  const action =
    kind === 'basic'
      ? [
          `lashes out with ${token.toLowerCase()} force in a fast opening strike`,
          `descarga la fuerza de ${token} en un golpe rápido de apertura`,
        ]
      : kind === 'offensive'
        ? [
            `unleashes ${token.toLowerCase()} power in a sweeping assault against the opposing team`,
            `desata el poder de ${token} en una ofensiva que barre al equipo rival`,
          ]
        : kind === 'support'
          ? supportDescription(token, supportEffect)
          : leaderDescription(token, leaderEffect);
  return {
    localizedName: { en: `${token} ${suffix[0]}`, es: `${token} ${suffix[0]}` },
    description: { en: `${name} ${action[0]}.`, es: `${name} ${action[1]}.` },
  };
}

function supportDescription(token, effect) {
  const descriptions = {
    HEAL: [
      `channels ${token.toLowerCase()} energy to restore the team's strength`,
      `canaliza la energía de ${token} para devolver fuerzas al equipo`,
    ],
    CLEANSE: [
      `uses ${token.toLowerCase()} precision to clear harmful effects from the team`,
      `usa la precisión de ${token} para limpiar los efectos perjudiciales del equipo`,
    ],
    POWER: [
      `channels ${token.toLowerCase()} force to strengthen the team's attacks`,
      `canaliza la fuerza de ${token} para fortalecer los ataques del equipo`,
    ],
    RESISTANCE: [
      `raises a barrier of ${token.toLowerCase()} energy around the team`,
      `levanta una barrera de ${token} alrededor del equipo`,
    ],
    AGILITY: [
      `sharpens the team's movement with ${token.toLowerCase()} energy`,
      `agudiza el movimiento del equipo con energía de ${token}`,
    ],
  };
  return descriptions[effect] ?? descriptions.POWER;
}

function leaderDescription(token, effect) {
  const descriptions = {
    STRIKE: [
      `turns ${token.toLowerCase()} power into a command that strikes the enemy formation`,
      `convierte el poder de ${token} en una orden que golpea la formación enemiga`,
    ],
    HEAL: [
      `turns ${token.toLowerCase()} power into a command that restores the team's strength`,
      `convierte el poder de ${token} en una orden que devuelve fuerzas al equipo`,
    ],
    PROTECT: [
      `turns ${token.toLowerCase()} power into a command that shields the team`,
      `convierte el poder de ${token} en una orden que protege al equipo`,
    ],
    DISRUPT: [
      `turns ${token.toLowerCase()} power into a command that disrupts the enemy formation`,
      `convierte el poder de ${token} en una orden que desestabiliza la formación enemiga`,
    ],
  };
  return descriptions[effect] ?? descriptions.PROTECT;
}

function leaderEffectFor(archetype) {
  return {
    BRUISER: 'STRIKE',
    SKIRMISHER: 'DISRUPT',
    TACTICIAN: 'PROTECT',
    MYSTIC: 'HEAL',
    GUARDIAN: 'PROTECT',
    BLASTER: 'STRIKE',
  }[archetype];
}

function heroAbilityContent(id, name, supportEffect, leaderEffect) {
  const content = HERO_ABILITY_CONTENT[id];
  if (!content?.basic || !content.offensive || !content.support) {
    throw new Error(`Missing Hero-specific ability content for ${id}.`);
  }
  const token = HERO_ABILITY_THEMES[id] ?? 'Heroic';
  return {
    basicAttack: localizedAbility(name, token, 'basic', undefined, undefined, content.basic),
    offensiveAbility: localizedAbility(
      name,
      token,
      'offensive',
      undefined,
      undefined,
      content.offensive,
    ),
    supportAbility: localizedAbility(
      name,
      token,
      'support',
      supportEffect,
      undefined,
      content.support,
    ),
    leadership: content.leader
      ? localizedAbility(name, token, 'leader', undefined, leaderEffect, content.leader)
      : null,
  };
}

function leaderAbility(id, name, archetype, content) {
  const effects = {
    BRUISER: ['STRIKE', 1.8],
    SKIRMISHER: ['DISRUPT', 0.15],
    TACTICIAN: ['PROTECT', 0.18],
    MYSTIC: ['HEAL', 1.1],
    GUARDIAN: ['PROTECT', 0.2],
    BLASTER: ['STRIKE', 1.7],
  };
  const [effect, potency] = effects[archetype];
  return {
    id: `${id}-lead`,
    name: content.localizedName.en,
    localizedName: content.localizedName,
    description: content.description,
    effect,
    potency,
  };
}
const heroRows = roster.map(([id, name, eligibility, archetype]) => {
  const definition = archetypes[archetype];
  const stats = Object.fromEntries(
    ['power', 'agility', 'resistance', 'ability'].map((key) => [
      key,
      ranged(id, key, definition.ranges[key]),
    ]),
  );
  const maxEnergy = ranged(id, 'energy', definition.ranges.energy);
  const maxAbilityPoints =
    ranged(id, 'ap', definition.ranges.ap) +
    (eligibility === 'PREFERRED' ? 10 : eligibility === 'ELIGIBLE' ? 5 : 0);
  const [, offensiveCost, offensiveMultiplier] = definition.offensive;
  const [, supportCost, supportEffect, supportPotency] = definition.support;
  const abilityContent = heroAbilityContent(id, name, supportEffect, leaderEffectFor(archetype));
  if (eligibility !== 'COMPANION_ONLY' && !abilityContent.leadership) {
    throw new Error(`Missing Hero-specific leader ability content for ${id}.`);
  }
  const leadership =
    eligibility === 'COMPANION_ONLY'
      ? null
      : {
          profile: leaderProfile(id),
          ability: leaderAbility(id, name, archetype, abilityContent.leadership),
        };
  const editorial = HERO_EDITORIAL_CONTENT[id];
  if (!editorial) {
    throw new Error(`Missing editorial biography and tournament motivation for ${id}.`);
  }
  const metadata = {
    stats,
    maxEnergy,
    maxAbilityPoints,
    primaryRole: definition.roles[0],
    secondaryRole: definition.roles[1],
    basicAttack: abilityContent.basicAttack,
    offensiveAbility: {
      id: `${id}-offensive`,
      name: abilityContent.offensiveAbility.localizedName.en,
      localizedName: abilityContent.offensiveAbility.localizedName,
      description: abilityContent.offensiveAbility.description,
      apCost: offensiveCost,
      multiplier: offensiveMultiplier,
    },
    supportAbility: {
      id: `${id}-support`,
      name: abilityContent.supportAbility.localizedName.en,
      localizedName: abilityContent.supportAbility.localizedName,
      description: abilityContent.supportAbility.description,
      apCost: supportCost,
      effect: supportEffect,
      potency: supportPotency,
    },
    allies: [...relationshipMap.get(id).allies].sort(),
    rivals: [...relationshipMap.get(id).rivals].sort(),
    biography: editorial.biography,
    tournamentMotivation: editorial.tournamentMotivation,
    portraitFallback: '/assets/heroes/default-hero.svg',
    leadership,
  };
  return `(${esc(id)}, ${esc(THEME_ID)}, ${esc(name)}, ${esc(eligibility)}, ${esc(archetype)}, ${esc(`/assets/heroes/${id}.webp`)}, ${esc(CONTENT_VERSION)}, ${json(metadata)})`;
});

const leaderIds = roster
  .filter(([, , eligibility]) => eligibility !== 'COMPANION_ONLY')
  .map(([id]) => id);
if (leaderIds.length !== 37) {
  throw new Error(`Expected 37 leader-capable heroes, found ${leaderIds.length}.`);
}
const assignedTeamCompanionIds = {
  'spider-man': ['iron-man', 'punisher', 'scarlet-witch', 'doctor-strange', 'spider-woman'],
  'doctor-strange': ['scarlet-witch', 'america-chavez', 'wiccan', 'ghost-rider', 'magik'],
  'captain-america': ['falcon', 'winter-soldier', 'black-widow', 'hawkeye', 'thor'],
  thor: ['sif', 'valkyrie', 'heimdall', 'korg', 'beta-ray-bill'],
  'black-widow': ['hawkeye', 'winter-soldier', 'captain-america', 'falcon', 'spider-woman'],
  wolverine: ['x-23', 'jean-grey', 'storm', 'nightcrawler', 'professor-x'],
  'reed-richards': ['invisible-woman', 'human-torch', 'the-thing', 'moon-girl', 'devil-dinosaur'],
  'iron-man': ['war-machine', 'rescue', 'vision', 'spider-man', 'captain-america'],
  'black-panther': ['shuri', 'okoye', 'mbaku', 'storm', 'captain-america'],
  'captain-marvel': ['monica-rambeau', 'adam-warlock', 'spider-woman', 'war-machine', 'nova'],
  hulk: ['she-hulk', 'thor', 'hercules', 'iron-man', 'doctor-strange'],
  'scarlet-witch': ['vision', 'quicksilver', 'wiccan', 'speed', 'doctor-strange'],
  vision: ['scarlet-witch', 'wonder-man', 'iron-man', 'captain-america', 'wasp'],
  hawkeye: ['black-widow', 'kate-bishop', 'captain-america', 'wasp', 'ant-man'],
  wasp: ['ant-man', 'hawkeye', 'vision', 'ms-marvel', 'she-hulk'],
  'ant-man': ['wasp', 'vision', 'iron-man', 'hawkeye', 'hulk'],
  falcon: ['captain-america', 'winter-soldier', 'black-widow', 'war-machine', 'hawkeye'],
  'winter-soldier': ['captain-america', 'falcon', 'black-widow', 'hawkeye', 'war-machine'],
  elektra: ['daredevil', 'punisher', 'echo', 'iron-fist', 'blade'],
  'spider-woman': ['captain-marvel', 'jessica-jones', 'black-widow', 'hawkeye', 'spider-man'],
  daredevil: ['elektra', 'jessica-jones', 'luke-cage', 'iron-fist', 'punisher'],
  deadpool: ['cable', 'wolverine', 'colossus', 'x-23', 'psylocke'],
  punisher: ['daredevil', 'elektra', 'black-widow', 'winter-soldier', 'ghost-rider'],
  'shang-chi': ['iron-fist', 'luke-cage', 'daredevil', 'spider-man', 'captain-america'],
  storm: ['cyclops', 'wolverine', 'professor-x', 'gambit', 'rogue'],
  cyclops: ['jean-grey', 'storm', 'colossus', 'jubilee', 'rogue'],
  'jean-grey': ['cyclops', 'storm', 'wolverine', 'professor-x', 'iceman'],
  'professor-x': ['cyclops', 'jean-grey', 'storm', 'wolverine', 'beast'],
  'star-lord': ['gamora', 'rocket-raccoon', 'groot', 'drax', 'mantis'],
  'rocket-raccoon': ['groot', 'star-lord', 'gamora', 'drax', 'mantis'],
  gamora: ['star-lord', 'nebula', 'rocket-raccoon', 'groot', 'drax'],
  'human-torch': ['reed-richards', 'invisible-woman', 'the-thing', 'spider-man', 'deadpool'],
};

const preferredIds = new Set(preferred.map(([id]) => id));
const rosterEligibility = new Map(roster.map(([id, , eligibility]) => [id, eligibility]));
const assignedLeaderIds = Object.keys(assignedTeamCompanionIds);
for (const leaderId of preferredIds) {
  if (!Object.hasOwn(assignedTeamCompanionIds, leaderId)) {
    throw new Error(`Missing assigned Team definition for PREFERRED Leader ${leaderId}.`);
  }
}
for (const leaderId of assignedLeaderIds) {
  if (rosterEligibility.get(leaderId) !== 'PREFERRED') {
    throw new Error(`Assigned Team Leader ${leaderId} does not exist as a PREFERRED Hero.`);
  }
}
if (assignedLeaderIds.length !== 32) {
  throw new Error(
    `Expected 32 explicit PREFERRED Team definitions, found ${assignedLeaderIds.length}.`,
  );
}
for (const leaderId of assignedLeaderIds) {
  const companionIds = assignedTeamCompanionIds[leaderId];
  if (!Array.isArray(companionIds) || companionIds.length !== 5) {
    throw new Error(`Assigned Team ${leaderId} must have exactly five companions.`);
  }
  const seen = new Set();
  for (const companionId of companionIds) {
    if (companionId === leaderId) {
      throw new Error(`Assigned Team ${leaderId} cannot include its Leader as a companion.`);
    }
    if (seen.has(companionId)) {
      throw new Error(`Assigned Team ${leaderId} repeats companion ${companionId}.`);
    }
    seen.add(companionId);
    const eligibility = rosterEligibility.get(companionId);
    if (!eligibility) {
      throw new Error(`Assigned Team ${leaderId} references unknown companion ${companionId}.`);
    }
    if (!['PREFERRED', 'ELIGIBLE', 'COMPANION_ONLY'].includes(eligibility)) {
      throw new Error(
        `Assigned Team ${leaderId} has ineligible companion ${companionId}: ${eligibility}.`,
      );
    }
  }
  if (![leaderId, ...companionIds].some((id) => relationshipMap.get(id).rivals.size > 0)) {
    throw new Error(`Assigned Team ${leaderId} has no Hero with a RIVAL.`);
  }
}

const teamRows = preferred.map(([leaderId, name]) => {
  const companions = assignedTeamCompanionIds[leaderId];
  const metadata = {
    leaderId,
    companionIds: companions,
    activeHeroIds: [leaderId, companions[0], companions[1]],
    strategy: 'BALANCED',
    visualKey: leaderId,
  };
  return `(${esc(leaderId)}, ${esc(`${name} Team`)}, ${esc(`The assigned Multiversal Tournament team led by ${name}.`)}, ${esc(THEME_ID)}, 0, 0, NULL, ${json(metadata)})`;
});

const narrativeCharacters = [
  [
    'silver-surfer',
    'Silver Surfer',
    'apparent-organizer',
    'The cosmic herald who returns with a warning and calls the Multiversal Tournament.',
    'El heraldo cósmico que regresa con una advertencia y convoca el Torneo Multiversal.',
  ],
  [
    'doctor-doom',
    'Doctor Doom',
    'final-boss',
    'The hidden architect of the tournament and the boss who enters during Doomsday.',
    'El arquitecto oculto del torneo y el jefe que entra en combate durante Doomsday.',
  ],
  [
    'dormammu',
    'Dormammu',
    'apparent-threat',
    'The ruler of the Dark Dimension presented publicly as the multiversal threat.',
    'El gobernante de la Dimensión Oscura presentado públicamente como la amenaza multiversal.',
  ],
].map(
  ([id, name, role, en, es]) =>
    `(${esc(id)}, ${esc(THEME_ID)}, ${esc(name)}, ${esc(`/assets/narrative/${id}.webp`)}, ${esc(CONTENT_VERSION)}, ${json({ role, description: { en, es }, portraitFallback: '/assets/narrative/default-character.svg' })})`,
);

const sql =
  `-- Generated deterministically by build-seed.cjs. Do not edit individual stats by hand.\n` +
  `INSERT INTO "avengers_heroes" ("id", "themeId", "displayName", "eligibility", "archetype", "portrait", "contentVersion", "metadata") VALUES\n  ${heroRows.join(',\n  ')}\n` +
  `ON CONFLICT("id") DO UPDATE SET "themeId"=excluded."themeId", "displayName"=excluded."displayName", "eligibility"=excluded."eligibility", "archetype"=excluded."archetype", "portrait"=excluded."portrait", "contentVersion"=excluded."contentVersion", "metadata"=excluded."metadata";\n\n` +
  `INSERT INTO "avengers_narrative_characters" ("id", "themeId", "displayName", "portrait", "contentVersion", "metadata") VALUES\n  ${narrativeCharacters.join(',\n  ')}\n` +
  `ON CONFLICT("id") DO UPDATE SET "themeId"=excluded."themeId", "displayName"=excluded."displayName", "portrait"=excluded."portrait", "contentVersion"=excluded."contentVersion", "metadata"=excluded."metadata";\n\n` +
  `INSERT INTO "team_profiles" ("id", "name", "description", "themeId", "configurationRevision", "contextRevision", "currentAttemptId", "metadata") VALUES\n  ${teamRows.join(',\n  ')}\n` +
  `ON CONFLICT("id") DO UPDATE SET "name"=excluded."name", "description"=excluded."description", "themeId"=excluded."themeId", "updatedAt"=CURRENT_TIMESTAMP;\n`;

const output = resolve(process.argv[2] ?? __dirname + '/seed-theme-data.sql');
writeFileSync(output, sql);
console.log(
  `Wrote ${output}: ${roster.length} selectable Heroes, ${leaderIds.length} leader-capable, 3 narrative identities.`,
);
