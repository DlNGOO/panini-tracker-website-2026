// ============================================================
// Panini FIFA World Cup 2026 – Player Names Database
// Format: PLAYER_NAMES[countryCode][0] = Sticker #1 (Badge/Logo)
//         PLAYER_NAMES[countryCode][1] = Sticker #2 (Spieler 1)
//         ...
//         PLAYER_NAMES[countryCode][19] = Sticker #20 (Spieler 19)
// ============================================================

export const PLAYER_NAMES: Record<string, string[]> = {
  // FIFA World Cup Specials (no player names – venue/trophy cards)
  FWC: [
    "FIFA WC Trophy",        // FWC001
    "FIFA WC Logo",          // FWC002
    "Maskottchen",           // FWC003
    "MetLife Stadium",       // FWC004
    "SoFi Stadium",          // FWC005
    "AT&T Stadium",          // FWC006
    "Arrowhead Stadium",     // FWC007
    "Levi's Stadium",        // FWC008
    "Gillette Stadium",      // FWC009
    "Lincoln Financial",     // FWC010
    "NRG Stadium",           // FWC011
    "Rose Bowl",             // FWC012
    "State Farm Stadium",    // FWC013
    "Azteca Stadium",        // FWC014
    "Estadio Akron",         // FWC015
    "BC Place Vancouver",    // FWC016
    "BMO Field Toronto",     // FWC017
    "Estadio BBVA",          // FWC018
    "FIFA Spezial",          // FWC019
  ],

  GER: [
    "Wappen",                // GER001
    "Marc-André ter Stegen", // GER002
    "Manuel Neuer",          // GER003
    "Kevin Trapp",           // GER004
    "Joshua Kimmich",        // GER005
    "Antonio Rüdiger",       // GER006
    "Nico Schlotterbeck",    // GER007
    "David Raum",            // GER008
    "Jonathan Tah",          // GER009
    "Ilkay Gündogan",        // GER010
    "Leon Goretzka",         // GER011
    "Toni Kroos",            // GER012
    "Florian Wirtz",         // GER013
    "Jamal Musiala",         // GER014
    "Leroy Sané",            // GER015
    "Kai Havertz",           // GER016
    "Serge Gnabry",          // GER017
    "Niclas Füllkrug",       // GER018
    "Thomas Müller",         // GER019
    "Christopher Nkunku",    // GER020
  ],

  USA: [
    "Wappen",                // USA001
    "Matt Turner",           // USA002
    "Zack Steffen",          // USA003
    "Sean Johnson",          // USA004
    "Sergino Dest",          // USA005
    "Miles Robinson",        // USA006
    "Aaron Long",            // USA007
    "Antonee Robinson",      // USA008
    "Joe Scally",            // USA009
    "Weston McKennie",       // USA010
    "Tyler Adams",           // USA011
    "Yunus Musah",           // USA012
    "Christian Pulisic",     // USA013
    "Gio Reyna",             // USA014
    "Tim Weah",              // USA015
    "Brenden Aaronson",      // USA016
    "Josh Sargent",          // USA017
    "Ricardo Pepi",          // USA018
    "Folarin Balogun",       // USA019
    "Malik Tillman",         // USA020
  ],

  MEX: [
    "Wappen",                // MEX001
    "Guillermo Ochoa",       // MEX002
    "Luis Malagón",          // MEX003
    "Rodolfo Cota",          // MEX004
    "Jorge Sánchez",         // MEX005
    "César Montes",          // MEX006
    "Johan Vásquez",         // MEX007
    "Gerardo Arteaga",       // MEX008
    "Jesús Gallardo",        // MEX009
    "Edson Álvarez",         // MEX010
    "Andrés Guardado",       // MEX011
    "Héctor Herrera",        // MEX012
    "Hirving Lozano",        // MEX013
    "Jesús Corona",          // MEX014
    "Alexis Vega",           // MEX015
    "Roberto Alvarado",      // MEX016
    "Raúl Jiménez",          // MEX017
    "Santiago Giménez",      // MEX018
    "Henry Martín",          // MEX019
    "Orbelín Pineda",        // MEX020
  ],

  CAN: [
    "Wappen",                // CAN001
    "Maxime Crépeau",        // CAN002
    "Milan Borjan",          // CAN003
    "Dayne St. Clair",       // CAN004
    "Richie Laryea",         // CAN005
    "Kamal Miller",          // CAN006
    "Alistair Johnston",     // CAN007
    "Sam Adekugbe",          // CAN008
    "Derek Cornelius",       // CAN009
    "Alphonso Davies",       // CAN010
    "Stephen Eustáquio",     // CAN011
    "Mark-Anthony Kaye",     // CAN012
    "Jonathan Osorio",       // CAN013
    "Tajon Buchanan",        // CAN014
    "Liam Millar",           // CAN015
    "Junior Hoilett",        // CAN016
    "Cyle Larin",            // CAN017
    "Jonathan David",        // CAN018
    "Lucas Cavallini",       // CAN019
    "Ismaël Koné",           // CAN020
  ],

  ARG: [
    "Wappen",                // ARG001
    "Emiliano Martínez",     // ARG002
    "Franco Armani",         // ARG003
    "Juan Musso",            // ARG004
    "Nahuel Molina",         // ARG005
    "Cristian Romero",       // ARG006
    "Nicolás Otamendi",      // ARG007
    "Lisandro Martínez",     // ARG008
    "Nicolás Tagliafico",    // ARG009
    "Rodrigo De Paul",       // ARG010
    "Enzo Fernández",        // ARG011
    "Alexis Mac Allister",   // ARG012
    "Leandro Paredes",       // ARG013
    "Ángel Di María",        // ARG014
    "Paulo Dybala",          // ARG015
    "Julián Álvarez",        // ARG016
    "Lautaro Martínez",      // ARG017
    "Lionel Messi",          // ARG018
    "Thiago Almada",         // ARG019
    "Giovani Lo Celso",      // ARG020
  ],

  BRA: [
    "Wappen",                // BRA001
    "Alisson Becker",        // BRA002
    "Ederson",               // BRA003
    "Weverton",              // BRA004
    "Danilo",                // BRA005
    "Éder Militão",          // BRA006
    "Marquinhos",            // BRA007
    "Gabriel Magalhães",     // BRA008
    "Alex Sandro",           // BRA009
    "Casemiro",              // BRA010
    "Lucas Paquetá",         // BRA011
    "Bruno Guimarães",       // BRA012
    "Rodrygo",               // BRA013
    "Raphinha",              // BRA014
    "Vinícius Jr.",          // BRA015
    "Gabriel Martinelli",    // BRA016
    "Richarlison",           // BRA017
    "Gabriel Jesus",         // BRA018
    "Endrick",               // BRA019
    "Andreas Pereira",       // BRA020
  ],

  ECU: [
    "Wappen",                // ECU001
    "Hernán Galíndez",       // ECU002
    "Alexander Domínguez",   // ECU003
    "Wellington Ramírez",    // ECU004
    "Piero Hincapié",        // ECU005
    "Félix Torres",          // ECU006
    "Moisés Caicedo",        // ECU007
    "Byron Castillo",        // ECU008
    "Stiven Plaza",          // ECU009
    "Romario Ibarra",        // ECU010
    "Jeremy Sarmiento",      // ECU011
    "Gonzalo Plata",         // ECU012
    "Jhegson Méndez",        // ECU013
    "Alan Franco",           // ECU014
    "Ángelo Preciado",       // ECU015
    "Enner Valencia",        // ECU016
    "Djorkaeff Reasco",      // ECU017
    "Pervis Estupiñán",      // ECU018
    "Michael Estrada",       // ECU019
    "Kevin Rodríguez",       // ECU020
  ],

  FRA: [
    "Wappen",                // FRA001
    "Mike Maignan",          // FRA002
    "Hugo Lloris",           // FRA003
    "Alphonse Areola",       // FRA004
    "Benjamin Pavard",       // FRA005
    "Raphael Varane",        // FRA006
    "Ibrahima Konaté",       // FRA007
    "Théo Hernandez",        // FRA008
    "Lucas Hernandez",       // FRA009
    "Aurélien Tchouaméni",   // FRA010
    "Mattéo Guendouzi",      // FRA011
    "Adrien Rabiot",         // FRA012
    "Antoine Griezmann",     // FRA013
    "Kylian Mbappé",         // FRA014
    "Kingsley Coman",        // FRA015
    "Ousmane Dembélé",       // FRA016
    "Marcus Thuram",         // FRA017
    "Olivier Giroud",        // FRA018
    "Bradley Barcola",       // FRA019
    "William Saliba",        // FRA020
  ],

  ENG: [
    "Wappen",                // ENG001
    "Jordan Pickford",       // ENG002
    "Aaron Ramsdale",        // ENG003
    "Nick Pope",             // ENG004
    "Trent Alexander-Arnold",// ENG005
    "Kyle Walker",           // ENG006
    "John Stones",           // ENG007
    "Harry Maguire",         // ENG008
    "Luke Shaw",             // ENG009
    "Jude Bellingham",       // ENG010
    "Declan Rice",           // ENG011
    "Phil Foden",            // ENG012
    "Bukayo Saka",           // ENG013
    "Marcus Rashford",       // ENG014
    "Jack Grealish",         // ENG015
    "James Maddison",        // ENG016
    "Raheem Sterling",       // ENG017
    "Harry Kane",            // ENG018
    "Ollie Watkins",         // ENG019
    "Anthony Gordon",        // ENG020
  ],

  ESP: [
    "Wappen",                // ESP001
    "Unai Simón",            // ESP002
    "David Raya",            // ESP003
    "Robert Sánchez",        // ESP004
    "Dani Carvajal",         // ESP005
    "Laporte",               // ESP006
    "Pau Torres",            // ESP007
    "Alejandro Balde",       // ESP008
    "Jordi Alba",            // ESP009
    "Rodrigo (Rodri)",       // ESP010
    "Pedri",                 // ESP011
    "Gavi",                  // ESP012
    "Lamine Yamal",          // ESP013
    "Dani Olmo",             // ESP014
    "Fermín López",          // ESP015
    "Nico Williams",         // ESP016
    "Álvaro Morata",         // ESP017
    "Ferrán Torres",         // ESP018
    "Joselu",                // ESP019
    "Mikel Merino",          // ESP020
  ],

  POR: [
    "Wappen",                // POR001
    "Rui Patrício",          // POR002
    "Diogo Costa",           // POR003
    "José Sá",               // POR004
    "João Cancelo",          // POR005
    "Pepe",                  // POR006
    "Rúben Dias",            // POR007
    "Nuno Mendes",           // POR008
    "Raphaël Guerreiro",     // POR009
    "Bruno Fernandes",       // POR010
    "João Palhinha",         // POR011
    "Vitinha",               // POR012
    "Bernardo Silva",        // POR013
    "Cristiano Ronaldo",     // POR014
    "Rafael Leão",           // POR015
    "Diogo Jota",            // POR016
    "Gonçalo Ramos",         // POR017
    "Rúben Neves",           // POR018
    "Pedro Neto",            // POR019
    "João Félix",            // POR020
  ],

  BIH: [
    "Wappen",                // BIH001
    "Jasmin Šehić",          // BIH002
    "Ibrahim Šehić",         // BIH003
    "Ognjen Šćepanović",     // BIH004
    "Sead Kolašinac",        // BIH005
    "Anel Ahmedhodžić",      // BIH006
    "Ermin Bičakčić",        // BIH007
    "Toni Šunjić",           // BIH008
    "Elvis Sarić",           // BIH009
    "Miralem Pjanić",        // BIH010
    "Edin Višća",            // BIH011
    "Haris Duljevic",        // BIH012
    "Kenan Kodro",           // BIH013
    "Edin Džeko",            // BIH014
    "Haris Vranković",       // BIH015
    "Armin Hodžić",          // BIH016
    "Ervin Zukanović",       // BIH017
    "Amar Dedić",            // BIH018
    "Hadžikadunić",          // BIH019
    "Mensur Mujdža",         // BIH020
  ],

  CRO: [
    "Wappen",                // CRO001
    "Dominik Livaković",     // CRO002
    "Ivica Ivušić",          // CRO003
    "Lovre Kalinić",         // CRO004
    "Josip Juranović",       // CRO005
    "Joško Gvardiol",        // CRO006
    "Domagoj Vida",          // CRO007
    "Dejan Lovren",          // CRO008
    "Josip Šutalo",          // CRO009
    "Luka Modrić",           // CRO010
    "Mateo Kovačić",         // CRO011
    "Marcelo Brozović",      // CRO012
    "Ivan Perišić",          // CRO013
    "Nikola Vlašić",         // CRO014
    "Ante Budimir",          // CRO015
    "Andrej Kramarić",       // CRO016
    "Mario Pašalić",         // CRO017
    "Lovro Majer",           // CRO018
    "Martin Baturina",       // CRO019
    "Luka Ivanušec",         // CRO020
  ],

  NED: [
    "Wappen",                // NED001
    "Remko Pasveer",         // NED002
    "Mark Flekken",          // NED003
    "Bart Verbruggen",       // NED004
    "Denzel Dumfries",       // NED005
    "Stefan de Vrij",        // NED006
    "Virgil van Dijk",       // NED007
    "Matthijs de Ligt",      // NED008
    "Jurrien Timber",        // NED009
    "Frenkie de Jong",       // NED010
    "Tijjani Reijnders",     // NED011
    "Teun Koopmeiners",      // NED012
    "Memphis Depay",         // NED013
    "Cody Gakpo",            // NED014
    "Donyell Malen",         // NED015
    "Xavi Simons",           // NED016
    "Brian Brobbey",         // NED017
    "Wout Weghorst",         // NED018
    "Steven Bergwijn",       // NED019
    "Davy Klaassen",         // NED020
  ],

  BEL: [
    "Wappen",                // BEL001
    "Thibaut Courtois",      // BEL002
    "Simon Mignolet",        // BEL003
    "Koen Casteels",         // BEL004
    "Timothy Castagne",      // BEL005
    "Jan Vertonghen",        // BEL006
    "Toby Alderweireld",     // BEL007
    "Axel Witsel",           // BEL008
    "Yannick Carrasco",      // BEL009
    "Kevin De Bruyne",       // BEL010
    "Leandro Trossard",      // BEL011
    "Youri Tielemans",       // BEL012
    "Eden Hazard",           // BEL013
    "Dries Mertens",         // BEL014
    "Romelu Lukaku",         // BEL015
    "Lois Openda",           // BEL016
    "Johan Bakayoko",        // BEL017
    "Loïs Openda",           // BEL018
    "Arthur Theate",         // BEL019
    "Jeremy Doku",           // BEL020
  ],

  SUI: [
    "Wappen",                // SUI001
    "Yann Sommer",           // SUI002
    "Yvon Mvogo",            // SUI003
    "Jonas Omlin",           // SUI004
    "Manuel Akanji",         // SUI005
    "Nico Elvedi",           // SUI006
    "Ricardo Rodríguez",     // SUI007
    "Silvan Widmer",         // SUI008
    "Granit Xhaka",          // SUI009
    "Remo Freuler",          // SUI010
    "Denis Zakaria",         // SUI011
    "Xherdan Shaqiri",       // SUI012
    "Ruben Vargas",          // SUI013
    "Breel Embolo",          // SUI014
    "Haris Seferovic",       // SUI015
    "Noah Okafor",           // SUI016
    "Fabian Schär",          // SUI017
    "Dan Ndoye",             // SUI018
    "Zeki Amdouni",          // SUI019
    "Michel Aebischer",      // SUI020
  ],

  AUT: [
    "Wappen",                // AUT001
    "Patrick Pentz",         // AUT002
    "Heinz Lindner",         // AUT003
    "Alexander Schlager",    // AUT004
    "Stefan Posch",          // AUT005
    "Maximilian Wöber",      // AUT006
    "Philipp Lienhart",      // AUT007
    "Philipp Mwene",         // AUT008
    "Konrad Laimer",         // AUT009
    "Nicolas Seiwald",       // AUT010
    "Marcel Sabitzer",       // AUT011
    "Christoph Baumgartner", // AUT012
    "Xaver Schlager",        // AUT013
    "Florian Kainz",         // AUT014
    "Patrick Wimmer",        // AUT015
    "Michael Gregoritsch",   // AUT016
    "Marko Arnautović",      // AUT017
    "Sasa Kalajdzic",        // AUT018
    "Romano Schmid",         // AUT019
    "Christoph Trauner",     // AUT020
  ],

  TUR: [
    "Wappen",                // TUR001
    "Mert Günok",            // TUR002
    "Altay Bayındır",        // TUR003
    "Uğurcan Çakır",         // TUR004
    "Zeki Çelik",            // TUR005
    "Merih Demiral",         // TUR006
    "Samet Akaydin",         // TUR007
    "Ferdi Kadıoğlu",        // TUR008
    "Müldür Eren",           // TUR009
    "Hakan Çalhanoğlu",      // TUR010
    "Okay Yokuşlu",          // TUR011
    "Salih Özcan",           // TUR012
    "Arda Güler",            // TUR013
    "Kerem Aktürkoğlu",      // TUR014
    "Ferdi Kadıoğlu",        // TUR015
    "Yusuf Yazıcı",          // TUR016
    "İrfan Can Kahveci",     // TUR017
    "Berk Yıldız",           // TUR018
    "Cenk Tosun",            // TUR019
    "Burak Yılmaz",          // TUR020
  ],

  CZE: [
    "Wappen",                // CZE001
    "Jiří Pavlenka",         // CZE002
    "Tomáš Vaclík",          // CZE003
    "Matěj Kovář",           // CZE004
    "Vladimir Coufal",       // CZE005
    "Tomáš Holeš",           // CZE006
    "Ondřej Čelůstka",       // CZE007
    "David Zima",            // CZE008
    "Lukáš Masopust",        // CZE009
    "Tomáš Souček",          // CZE010
    "Ladislav Krejčí",       // CZE011
    "Lukáš Hejda",           // CZE012
    "Adam Hložek",           // CZE013
    "Patrik Schick",         // CZE014
    "Ondřej Lingr",          // CZE015
    "Jan Kuchta",            // CZE016
    "Tomáš Chorý",           // CZE017
    "Matěj Jurásek",         // CZE018
    "Lukáš Sadílek",         // CZE019
    "Alex Král",             // CZE020
  ],

  NOR: [
    "Wappen",                // NOR001
    "Ørjan Nyland",          // NOR002
    "Rune Jarstein",         // NOR003
    "Stefansen",             // NOR004
    "Kristoffer Ajer",       // NOR005
    "Stian Gregersen",       // NOR006
    "Leo Østigård",          // NOR007
    "Marcus Holmgren Pedersen",// NOR008
    "Birger Meling",         // NOR009
    "Martin Ødegaard",       // NOR010
    "Sander Berge",          // NOR011
    "Morten Thorsby",        // NOR012
    "Fredrik Aursnes",       // NOR013
    "Erling Haaland",        // NOR014
    "Alexander Sørloth",     // NOR015
    "Jørgen Strand Larsen",  // NOR016
    "Lars Lagerbäck",        // NOR017
    "Mohamed Elyounoussi",   // NOR018
    "Antonio Nusa",          // NOR019
    "Mathias Normann",       // NOR020
  ],

  SCO: [
    "Wappen",                // SCO001
    "Craig Gordon",          // SCO002
    "Liam Kelly",            // SCO003
    "Jon McLaughlin",        // SCO004
    "Andy Robertson",        // SCO005
    "Grant Hanley",          // SCO006
    "Scott McTominay",       // SCO007
    "Kieran Tierney",        // SCO008
    "John McGinn",           // SCO009
    "Callum McGregor",       // SCO010
    "Billy Gilmour",         // SCO011
    "Stuart Armstrong",      // SCO012
    "Ryan Christie",         // SCO013
    "Lyndon Dykes",          // SCO014
    "Che Adams",             // SCO015
    "Kevin Nisbet",          // SCO016
    "Ryan Jack",             // SCO017
    "Ryan Fraser",           // SCO018
    "Liam Cooper",           // SCO019
    "Stephen Kingsley",      // SCO020
  ],

  NZL: [
    "Wappen",                // NZL001
    "Stefan Marinovic",      // NZL002
    "Oli Sail",              // NZL003
    "Michael Woud",          // NZL004
    "Liberato Cacace",       // NZL005
    "Winston Reid",          // NZL006
    "Tommy Smith",           // NZL007
    "Cameron Devlin",        // NZL008
    "Ryan Thomas",           // NZL009
    "Joe Bell",              // NZL010
    "Clayton Lewis",         // NZL011
    "Sarpreet Singh",        // NZL012
    "Chris Wood",            // NZL013
    "Burnley Kosta Barbarouses",// NZL014
    "Matthew Garbett",       // NZL015
    "Marko Stijelja",        // NZL016
    "Elijah Just",           // NZL017
    "Callan Elliot",         // NZL018
    "Phoenix Papadopoulos",  // NZL019
    "Samuel Sutton",         // NZL020
  ],

  SWE: [
    "Wappen",                // SWE001
    "Robin Olsen",           // SWE002
    "Karl-Johan Johnsson",   // SWE003
    "Andreas Linde",         // SWE004
    "Emil Krafth",           // SWE005
    "Victor Lindelöf",       // SWE006
    "Ludwig Augustinsson",   // SWE007
    "Carl Starfelt",         // SWE008
    "Mikael Lustig",         // SWE009
    "Albin Ekdal",           // SWE010
    "Sebastian Larsson",     // SWE011
    "Dejan Kulusevski",      // SWE012
    "Emil Forsberg",         // SWE013
    "Alexander Isak",        // SWE014
    "Marcus Berg",           // SWE015
    "Sam Larsson",           // SWE016
    "Robin Quaison",         // SWE017
    "Anthony Elanga",        // SWE018
    "Viktor Gyökeres",       // SWE019
    "Jesper Karlsson",       // SWE020
  ],

  COL: [
    "Wappen",                // COL001
    "David Ospina",          // COL002
    "Camilo Vargas",         // COL003
    "Aldair Quintana",       // COL004
    "Santiago Arias",        // COL005
    "Yerry Mina",            // COL006
    "Dávinson Sánchez",      // COL007
    "William Tesillo",       // COL008
    "Juan Guillermo Cuadrado",// COL009
    "Mateus Uribe",          // COL010
    "Wilmar Barrios",        // COL011
    "James Rodríguez",       // COL012
    "Luis Díaz",             // COL013
    "Rafael Santos Borré",   // COL014
    "Duván Zapata",          // COL015
    "Miguel Ángel Borja",    // COL016
    "Jhon Córdoba",          // COL017
    "Radamel Falcao",        // COL018
    "Eder Álvarez Balanta",  // COL019
    "Jorge Carrascal",       // COL020
  ],

  URU: [
    "Wappen",                // URU001
    "Fernando Muslera",      // URU002
    "Sebastián Sosa",        // URU003
    "Martín Campaña",        // URU004
    "Nahitan Nández",        // URU005
    "Diego Godín",           // URU006
    "José Giménez",          // URU007
    "Ronald Araújo",         // URU008
    "Martín Cáceres",        // URU009
    "Lucas Torreira",        // URU010
    "Rodrigo Bentancur",     // URU011
    "Federico Valverde",     // URU012
    "Matías Vecino",         // URU013
    "Giorgian De Arrascaeta",// URU014
    "Luis Suárez",           // URU015
    "Edinson Cavani",        // URU016
    "Darwin Núñez",          // URU017
    "Facundo Pellistri",     // URU018
    "Maxi Gómez",            // URU019
    "Facundo Torres",        // URU020
  ],

  MAR: [
    "Wappen",                // MAR001
    "Yassine Bounou (Bono)", // MAR002
    "Ahmed Tagnaouti",       // MAR003
    "Munir El Kajoui",       // MAR004
    "Achraf Hakimi",         // MAR005
    "Romain Saïss",          // MAR006
    "Nayef Aguerd",          // MAR007
    "Noussair Mazraoui",     // MAR008
    "Adam Masina",           // MAR009
    "Sofyan Amrabat",        // MAR010
    "Azzedine Ounahi",       // MAR011
    "Hakim Ziyech",          // MAR012
    "Selim Amallah",         // MAR013
    "Zakaria Aboukhlal",     // MAR014
    "Youssef En-Nesyri",     // MAR015
    "Abdelhamid Sabiri",     // MAR016
    "Ilias Chair",           // MAR017
    "Abde Ezzalzouli",       // MAR018
    "Walid Cheddira",        // MAR019
    "Ibrahim Diaz",          // MAR020
  ],

  TUN: [
    "Wappen",                // TUN001
    "Aymen Dahmen",          // TUN002
    "Bechir Ben Said",       // TUN003
    "Mouez Hassen",          // TUN004
    "Dylan Bronn",           // TUN005
    "Yassine Meriah",        // TUN006
    "Ali Maaloul",           // TUN007
    "Nader Ghandri",         // TUN008
    "Ellyes Skhiri",         // TUN009
    "Anis Ben Slimane",      // TUN010
    "Ferjani Sassi",         // TUN011
    "Naïm Sliti",            // TUN012
    "Khazri Wahbi",          // TUN013
    "Youssef Msakni",        // TUN014
    "Seifeddine Jaziri",     // TUN015
    "Hamza Mathlouthi",      // TUN016
    "Hannibal Mejbri",       // TUN017
    "Aissa Laïdouni",        // TUN018
    "Mohamed Drager",        // TUN019
    "Montassar Talbi",       // TUN020
  ],

  EGY: [
    "Wappen",                // EGY001
    "Mohamed Abou Gabal",    // EGY002
    "Mohamed El Shenawy",    // EGY003
    "Ahmed El Shenawy",      // EGY004
    "Ahmed Hegazy",          // EGY005
    "Mohamed Abdel-Shafy",   // EGY006
    "Ayman Ashraf",          // EGY007
    "Akram Tawfik",          // EGY008
    "Omar Gaber",            // EGY009
    "Emam Ashour",           // EGY010
    "Ahmed El-Sheikh",       // EGY011
    "Hamdi Fathi",           // EGY012
    "Mohamed Salah",         // EGY013
    "Trezeguet",             // EGY014
    "Omar Marmoush",         // EGY015
    "Mostafa Mohamed",       // EGY016
    "Ramadan Sobhi",         // EGY017
    "Ahmed Sayed Zizo",      // EGY018
    "Mahmoud Hassan (Trezeguet)", // EGY019
    "Amr El Sulaya",         // EGY020
  ],

  ALG: [
    "Wappen",                // ALG001
    "Raïs M'Bolhi",          // ALG002
    "Alexandre Oukidja",     // ALG003
    "Anthony Mandrea",       // ALG004
    "Mehdi Zeffane",         // ALG005
    "Ramy Bensebaini",       // ALG006
    "Aïssa Mandi",           // ALG007
    "Djamel Benlamri",       // ALG008
    "Hicham Boudaoui",       // ALG009
    "Ismaël Bennacer",       // ALG010
    "Nabil Bentaleb",        // ALG011
    "Sofiane Feghouli",      // ALG012
    "Riyad Mahrez",          // ALG013
    "Youcef Atal",           // ALG014
    "Islam Slimani",         // ALG015
    "Youssef Belaïli",       // ALG016
    "Baghdad Bounedjah",     // ALG017
    "Houssem Aouar",         // ALG018
    "Andy Delort",           // ALG019
    "Adam Ounas",            // ALG020
  ],

  JOR: [
    "Wappen",                // JOR001
    "Amer Shafi",            // JOR002
    "Mahmoud Shnaishel",     // JOR003
    "Yazeed Abo Laila",      // JOR004
    "Mohammad Al-Dmeiri",    // JOR005
    "Motaz Salhani",         // JOR006
    "Baha Faisal",           // JOR007
    "Ahmad Ibrahim",         // JOR008
    "Mohammad Abu Laban",    // JOR009
    "Musa Suleiman",         // JOR010
    "Yazan Al-Naimat",       // JOR011
    "Nizar Al-Rashdan",      // JOR012
    "Hamza Al-Dardour",      // JOR013
    "Ahmad Hayel",           // JOR014
    "Mohammad Younes",       // JOR015
    "Osama Rashid",          // JOR016
    "Saad Natour",           // JOR017
    "Ali Olwan",             // JOR018
    "Hasan Abdel-Fattah",    // JOR019
    "Yousuf Jabor",          // JOR020
  ],

  GHA: [
    "Wappen",                // GHA001
    "Lawrence Ati-Zigi",     // GHA002
    "Joe Wollacott",         // GHA003
    "Ibrahim Danlad",        // GHA004
    "Tariq Lamptey",         // GHA005
    "Daniel Amartey",        // GHA006
    "Alexander Djiku",       // GHA007
    "Denis Odoi",            // GHA008
    "Baba Rahman",           // GHA009
    "Thomas Partey",         // GHA010
    "Mohammed Kudus",        // GHA011
    "Jordan Ayew",           // GHA012
    "André Ayew",            // GHA013
    "Osman Bukari",          // GHA014
    "Joseph Paintsil",       // GHA015
    "Abdul Fatawu",          // GHA016
    "Antoine Semenyo",       // GHA017
    "Caleb Ekuban",          // GHA018
    "Inaki Williams",        // GHA019
    "Kamaldeen Sulemana",    // GHA020
  ],

  SEN: [
    "Wappen",                // SEN001
    "Edouard Mendy",         // SEN002
    "Alfred Gomis",          // SEN003
    "Seny Dieng",            // SEN004
    "Kalidou Koulibaly",     // SEN005
    "Saliou Ciss",           // SEN006
    "Pape Abou Cissé",       // SEN007
    "Abdou Diallo",          // SEN008
    "Fodé Ballo-Touré",      // SEN009
    "Cheikhou Kouyaté",      // SEN010
    "Pape Matar Sarr",       // SEN011
    "Idrissa Gana Gueye",    // SEN012
    "Sadio Mané",            // SEN013
    "Ismaïla Sarr",          // SEN014
    "Famara Diédhiou",       // SEN015
    "Nicolas Jackson",       // SEN016
    "Habib Diallo",          // SEN017
    "Bamba Dieng",           // SEN018
    "Lamine Camara",         // SEN019
    "Formose Mendy",         // SEN020
  ],

  CUW: [
    "Wappen",                // CUW001
    "Eloy Room",             // CUW002
    "Cuco Martina",          // CUW003
    "Leandro Bacuna",        // CUW004
    "Jurien Gaari",          // CUW005
    "Vito van Crooij",       // CUW006
    "Jarchinio Antonia",     // CUW007
    "Rubio Rubin",           // CUW008
    "Darryl Lachman",        // CUW009
    "Gino van Kessel",       // CUW010
    "Genero Zeefuik",        // CUW011
    "Coryolan Osenga",       // CUW012
    "Quentin Mouthaan",      // CUW013
    "Juniorcito Wilsheid",   // CUW014
    "Gevero Markiet",        // CUW015
    "Raily Ignacio",         // CUW016
    "Thijmen Goppel",        // CUW017
    "Thierry Zwijsen",       // CUW018
    "Leandro Bacuna",        // CUW019
    "Rangelo Janga",         // CUW020
  ],

  RSA: [
    "Wappen",                // RSA001
    "Ronwen Williams",       // RSA002
    "Bruce Bvuma",           // RSA003
    "Veli Mothwa",           // RSA004
    "Reeve Frosler",         // RSA005
    "Thibang Phete",         // RSA006
    "Rushine De Reuck",      // RSA007
    "Bongani Zungu",         // RSA008
    "Teboho Mokoena",        // RSA009
    "Themba Zwane",          // RSA010
    "Evidence Makgopa",      // RSA011
    "Percy Tau",             // RSA012
    "Lebogang Manyama",      // RSA013
    "Teko Modise",           // RSA014
    "Lyle Foster",           // RSA015
    "Bafana Bafana",         // RSA016
    "Hugo Broos",            // RSA017
    "Bradley Grobler",       // RSA018
    "Thapelo Morena",        // RSA019
    "Grant Kekana",          // RSA020
  ],

  CPV: [
    "Wappen",                // CPV001
    "Vozinha",               // CPV002
    "Kiti",                  // CPV003
    "Marco Soares",          // CPV004
    "Stopira",               // CPV005
    "Dylan Tavares",         // CPV006
    "Garry Rodrigues",       // CPV007
    "Jamiro Monteiro",       // CPV008
    "Ryan Mendes",           // CPV009
    "Patrick Andrade",       // CPV010
    "Helder Costa",          // CPV011
    "Julio Tavares",         // CPV012
    "Kenny Rocha",           // CPV013
    "Steven Fortes",         // CPV014
    "Willy Semedo",          // CPV015
    "Diogo Tavares",         // CPV016
    "Carlos Ponck",          // CPV017
    "Héldon Ramos",          // CPV018
    "Ângelo",                // CPV019
    "Kevin Fidalgo",         // CPV020
  ],

  COD: [
    "Wappen",                // COD001
    "Joël Kiassumbua",       // COD002
    "Parfait Mandanda",      // COD003
    "Lionel Mpasi",          // COD004
    "Chancel Mbemba",        // COD005
    "Arthur Masuaku",        // COD006
    "Marcel Tisserand",      // COD007
    "Gaël Kakuta",           // COD008
    "Jordan Ikoko",          // COD009
    "Yannick Bolasie",       // COD010
    "Dieumerci Mbokani",     // COD011
    "Cédric Bakambu",        // COD012
    "Britt Assombalonga",    // COD013
    "Fiston Mayele",         // COD014
    "Jonathan Bolingi",      // COD015
    "Firmin Mubele",         // COD016
    "Silas Katompa",         // COD017
    "Samuel Bastien",        // COD018
    "Théo Bongonda",         // COD019
    "Pierre Kalulu",         // COD020
  ],

  CIV: [
    "Wappen",                // CIV001
    "Badra Ali Sangaré",     // CIV002
    "Sylvain Gbohouo",       // CIV003
    "Ali Badra Sangaré",     // CIV004
    "Serge Aurier",          // CIV005
    "Wilfried Kanon",        // CIV006
    "Simon Deli",            // CIV007
    "Ghislain Konan",        // CIV008
    "Eric Bailly",           // CIV009
    "Franck Kessié",         // CIV010
    "Ibrahim Sangaré",       // CIV011
    "Jean-Philippe Gbamin",  // CIV012
    "Wilfried Zaha",         // CIV013
    "Maxwel Cornet",         // CIV014
    "Nicolas Pépé",          // CIV015
    "Sébastien Haller",      // CIV016
    "Wilfried Bony",         // CIV017
    "Oumar Diakité",         // CIV018
    "Max-Alain Gradel",      // CIV019
    "Jeremie Boga",          // CIV020
  ],

  JPN: [
    "Wappen",                // JPN001
    "Shuichi Gonda",         // JPN002
    "Eiji Kawashima",        // JPN003
    "Daniel Schmidt",        // JPN004
    "Hiroki Sakai",          // JPN005
    "Takehiro Tomiyasu",     // JPN006
    "Maya Yoshida",          // JPN007
    "Ko Itakura",            // JPN008
    "Yuto Nagatomo",         // JPN009
    "Junya Ito",             // JPN010
    "Wataru Endo",           // JPN011
    "Hidemasa Morita",       // JPN012
    "Takuma Asano",          // JPN013
    "Daichi Kamada",         // JPN014
    "Takefusa Kubo",         // JPN015
    "Ritsu Doan",            // JPN016
    "Kaoru Mitoma",          // JPN017
    "Ayase Ueda",            // JPN018
    "Reo Hatate",            // JPN019
    "Keito Nakamura",        // JPN020
  ],

  KOR: [
    "Wappen",                // KOR001
    "Kim Seung-gyu",         // KOR002
    "Jo Hyeon-woo",          // KOR003
    "Kim Jung-hoon",         // KOR004
    "Kim Tae-hwan",          // KOR005
    "Kim Min-jae",           // KOR006
    "Kim Young-gwon",        // KOR007
    "Kim Jin-su",            // KOR008
    "Lee Yong",              // KOR009
    "Hwang In-beom",         // KOR010
    "Jung Woo-young",        // KOR011
    "Lee Jae-sung",          // KOR012
    "Son Heung-min",         // KOR013
    "Lee Kang-in",           // KOR014
    "Hwang Hee-chan",         // KOR015
    "Cho Gue-sung",          // KOR016
    "Oh Hyeon-gyu",          // KOR017
    "Kwon Chang-hoon",       // KOR018
    "Moon Seon-min",         // KOR019
    "Jeong Woo-yeong",       // KOR020
  ],

  AUS: [
    "Wappen",                // AUS001
    "Mat Ryan",              // AUS002
    "Danny Vukovic",         // AUS003
    "Andrew Redmayne",       // AUS004
    "Milos Degenek",         // AUS005
    "Harry Souttar",         // AUS006
    "Bailey Wright",         // AUS007
    "Nathaniel Atkinson",    // AUS008
    "Aziz Behich",           // AUS009
    "Aaron Mooy",            // AUS010
    "Jackson Irvine",        // AUS011
    "Riley McGree",          // AUS012
    "Mathew Leckie",         // AUS013
    "Ajdin Hrustic",         // AUS014
    "Awer Mabil",            // AUS015
    "Jamie Maclaren",        // AUS016
    "Martin Boyle",          // AUS017
    "Craig Goodwin",         // AUS018
    "Garang Kuol",           // AUS019
    "Lachlan Wales",         // AUS020
  ],

  IRN: [
    "Wappen",                // IRN001
    "Alireza Beiranvand",    // IRN002
    "Hossein Hosseini",      // IRN003
    "Mehdi Shiri",           // IRN004
    "Sadegh Moharrami",      // IRN005
    "Ehsan Hajsafi",         // IRN006
    "Milad Mohammadi",       // IRN007
    "Shojae Khalilzadeh",    // IRN008
    "Majid Hosseini",        // IRN009
    "Saeid Ezatolahi",       // IRN010
    "Ahmad Noorollahi",      // IRN011
    "Ali Gholizadeh",        // IRN012
    "Sardar Azmoun",         // IRN013
    "Mehdi Taremi",          // IRN014
    "Allahyar Sayyadmanesh", // IRN015
    "Saman Ghoddos",         // IRN016
    "Karim Ansarifard",      // IRN017
    "Ramin Rezaeian",        // IRN018
    "Mehdi Torabi",          // IRN019
    "Roozbeh Cheshmi",       // IRN020
  ],

  KSA: [
    "Wappen",                // KSA001
    "Mohammed Al-Owais",     // KSA002
    "Fawaz Al-Qarni",        // KSA003
    "Abdullah Al-Mayouf",    // KSA004
    "Saud Abdulhamid",       // KSA005
    "Ali Al-Bulayhi",        // KSA006
    "Hassan Tambal",         // KSA007
    "Sultan Al-Ghannam",     // KSA008
    "Mohammed Al-Burayk",    // KSA009
    "Salman Al-Faraj",       // KSA010
    "Mohammed Kanno",        // KSA011
    "Abdulellah Al-Malki",   // KSA012
    "Salem Al-Dawsari",      // KSA013
    "Abdullah Al-Hamdan",    // KSA014
    "Hattan Bahebri",        // KSA015
    "Firas Al-Buraikan",     // KSA016
    "Saleh Al-Shehri",       // KSA017
    "Ali Al-Hassan",         // KSA018
    "Abdulrahman Ghareeb",   // KSA019
    "Sami Al-Najei",         // KSA020
  ],

  IRQ: [
    "Wappen",                // IRQ001
    "Jalal Hassan",          // IRQ002
    "Dhurgham Ismail",       // IRQ003
    "Farhan Shakor",         // IRQ004
    "Ahmad Ibrahim",         // IRQ005
    "Amjad Attwan",          // IRQ006
    "Ali Adnan",             // IRQ007
    "Safa Hadzic",           // IRQ008
    "Alaa Abdelzehra",       // IRQ009
    "Saad Abdul Amir",       // IRQ010
    "Mohanad Ali",           // IRQ011
    "Osama Rashid",          // IRQ012
    "Aymen Hussein",         // IRQ013
    "Humam Tariq",           // IRQ014
    "Ali Faez",              // IRQ015
    "Hussein Ali",           // IRQ016
    "Makwan Aziz",           // IRQ017
    "Bashar Resan",          // IRQ018
    "Ibrahim Bayesh",        // IRQ019
    "Ahmad Basim",           // IRQ020
  ],

  UZB: [
    "Wappen",                // UZB001
    "Shukhrat Ashurmatov",   // UZB002
    "Abdusalom Abdullayev",  // UZB003
    "Dilshod Yusupov",       // UZB004
    "Dostonbek Khamdamov",   // UZB005
    "Khojiakbar Alijonov",   // UZB006
    "Davron Tursunov",       // UZB007
    "Bekhruzbek Komilов",    // UZB008
    "Jaloliddin Masharipov", // UZB009
    "Eldor Shomurodov",      // UZB010
    "Otabek Shukurov",       // UZB011
    "Boburjon Abdullayev",   // UZB012
    "Abbosbek Fayzullayev",  // UZB013
    "Asilbek Mirzayev",      // UZB014
    "Jasurbek Yakhshiboyev", // UZB015
    "Sherzod Nasimov",       // UZB016
    "Husan Kholmatov",       // UZB017
    "Odil Ahmedov",          // UZB018
    "Azizjon Ganiev",        // UZB019
    "Ibrokhim Qodirov",      // UZB020
  ],

  QAT: [
    "Wappen",                // QAT001
    "Saad Al Sheeb",         // QAT002
    "Meshaal Barsham",       // QAT003
    "Yousuf Hassan",         // QAT004
    "Pedro Miguel",          // QAT005
    "Boualem Khoukhi",       // QAT006
    "Tarek Salman",          // QAT007
    "Abdelkarim Hassan",     // QAT008
    "Bassam Al-Rawi",        // QAT009
    "Karim Boudiaf",         // QAT010
    "Assim Madibo",          // QAT011
    "Homam Ahmed",           // QAT012
    "Hassan Al-Haydos",      // QAT013
    "Akram Afif",            // QAT014
    "Almoez Ali",            // QAT015
    "Mohammed Muntari",      // QAT016
    "Ismail Mohamad",        // QAT017
    "Salem Al-Hajri",        // QAT018
    "Ali Asad",              // QAT019
    "Yousuf Abdurisag",      // QAT020
  ],

  PAN: [
    "Wappen",                // PAN001
    "Luis Mejía",            // PAN002
    "Orlando Mosquera",      // PAN003
    "Jael Villarreal",       // PAN004
    "Michael Amir Murillo",  // PAN005
    "Fidel Escobar",         // PAN006
    "Anibal Godoy",          // PAN007
    "Rodolfo Austin",        // PAN008
    "Eric Davis",            // PAN009
    "Adalberto Carrasquilla",// PAN010
    "Rolando Blackburn",     // PAN011
    "Gabriel Torres",        // PAN012
    "Abdiel Ayarza",         // PAN013
    "Cristian Martínez",     // PAN014
    "Edgar Bárcenas",        // PAN015
    "Cecilio Waterman",      // PAN016
    "José Fajardo",          // PAN017
    "Ismael Díaz",           // PAN018
    "Alberto Quintero",      // PAN019
    "Eduardo Del Valle",     // PAN020
  ],

  PAR: [
    "Wappen",                // PAR001
    "Roberto Fernández",     // PAR002
    "Antony Silva",          // PAR003
    "Alfredo Aguilar",       // PAR004
    "Santiago Arzamendia",   // PAR005
    "Gustavo Gómez",         // PAR006
    "Omar Alderete",         // PAR007
    "Gabriel Avalos",        // PAR008
    "Fabián Balbuena",       // PAR009
    "Richard Sánchez",       // PAR010
    "Miguel Almirón",        // PAR011
    "Braian Samudio",        // PAR012
    "Jesús Medina",          // PAR013
    "Julio Enciso",          // PAR014
    "Carlos González",       // PAR015
    "Antonio Sanabria",      // PAR016
    "Adam Bareiro",          // PAR017
    "Rodrigo Rojas",         // PAR018
    "Marcelo Perez",         // PAR019
    "Juan Villalba",         // PAR020
  ],

  HAI: [
    "Wappen",                // HAI001
    "Josué Duverger",        // HAI002
    "Duckens Nazon",         // HAI003
    "Derrick Etienne",       // HAI004
    "Kevin Lafrance",        // HAI005
    "Jade Rose",             // HAI006
    "Mechack Jérôme",        // HAI007
    "Wilde-Donald Guerrier", // HAI008
    "James Doré",            // HAI009
    "Frantzdy Pierrot",      // HAI010
    "Duckens Nazon",         // HAI011
    "Steeven Saba",          // HAI012
    "Bernardo Coquelin",     // HAI013
    "Jems Geffrard",         // HAI014
    "Hervé Bazile",          // HAI015
    "Carlens Arcus",         // HAI016
    "Widlener Prophète",     // HAI017
    "Stanley Nsiala",        // HAI018
    "Kervens Belfort",       // HAI019
    "Frantzdy Pierrot",      // HAI020
  ],
};

// Returns the full name of a sticker based on its code
export function getStickerName(code: string): string {
  const match = code.trim().toUpperCase().match(/^([A-Z]{3})([0-9]+)$/);
  if (!match) return "Unbekannter Sticker";
  const country = match[1];
  const num = parseInt(match[2], 10);
  const idx = num - 1; // 0-indexed

  const names = PLAYER_NAMES[country];
  if (names && names[idx]) {
    return names[idx];
  }

  // Fallback
  if (country === "FWC") {
    if (num === 1) return "FIFA World Cup Pokal";
    return `Spezial #${num}`;
  }
  if (num === 1) return "Wappen / Logo";
  return `Spieler #${num}`;
}

/**
 * Returns the URL to the sticker image.
 * Files are stored as "#GER001.webp", "#ARG010.webp", etc.
 * The code format in the app is "GER1", "ARG10", "FWC3", etc.
 */
export function getStickerImageUrl(code: string): string | null {
  const match = code.trim().toUpperCase().match(/^([A-Z]{3})([0-9]+)$/);
  if (!match) return null;
  const country = match[1];
  const num = parseInt(match[2], 10);
  const paddedNum = String(num).padStart(3, "0");
  // File is named e.g. "#GER001.webp" — the # is URL-encoded as %23
  return `/stickers/%23${country}${paddedNum}.webp`;
}

/**
 * Returns the placeholder image URL.
 */
export function getStickerPlaceholderUrl(): string {
  return `/stickers/%23PL000.webp`;
}

export const COUNTRY_ISO_MAP: Record<string, string> = {
  GER: "de", USA: "us", MEX: "mx", CAN: "ca", ARG: "ar", BRA: "br",
  ECU: "ec", FRA: "fr", ENG: "gb-eng", ESP: "es", POR: "pt", BIH: "ba",
  CRO: "hr", NED: "nl", BEL: "be", SUI: "ch", AUT: "at", TUR: "tr",
  CZE: "cz", NOR: "no", SCO: "gb-sct", NZL: "nz", SWE: "se", COL: "co",
  URU: "uy", MAR: "ma", TUN: "tn", EGY: "eg", ALG: "dz", JOR: "jo",
  GHA: "gh", SEN: "sn", CUW: "cw", RSA: "za", CPV: "cv", COD: "cd",
  CIV: "ci", JPN: "jp", KOR: "kr", AUS: "au", IRN: "ir", KSA: "sa",
  IRQ: "iq", UZB: "uz", QAT: "qa", PAN: "pa", PAR: "py", HAI: "ht",
};

export function getCountryFlagUrl(countryCode: string): string {
  const code = countryCode.trim().toUpperCase();
  if (code === "FWC") {
    return "https://upload.wikimedia.org/wikipedia/en/thumb/5/53/2026_FIFA_World_Cup_official_logo.svg/512px-2026_FIFA_World_Cup_official_logo.svg.png";
  }
  const iso = COUNTRY_ISO_MAP[code];
  if (iso) return `https://flagcdn.com/w80/${iso}.png`;
  return "https://flagcdn.com/w80/un.png";
}
