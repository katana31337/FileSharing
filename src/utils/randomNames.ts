// Генерация случайных имён в стиле Docker
// Формат: прилагательное_существительное_число

const ADJECTIVES = [
  'adoring', 'affectionate', 'agitated', 'amazing', 'angry', 'awesome',
  'beautiful', 'blissful', 'bold', 'brave', 'busy', 'charming',
  'clever', 'compassionate', 'competent', 'condescending', 'confident',
  'cool', 'cranky', 'crazy', 'dazzling', 'determined', 'distracted',
  'dreamy', 'eager', 'ecstatic', 'elastic', 'elated', 'elegant',
  'eloquent', 'epic', 'exciting', 'fervent', 'festive', 'flamboyant',
  'focused', 'friendly', 'frosty', 'funny', 'gallant', 'gifted',
  'goofy', 'gracious', 'happy', 'hardcore', 'heuristic', 'hopeful',
  'hungry', 'infallible', 'inspiring', 'intelligent', 'interesting',
  'jolly', 'jovial', 'keen', 'kind', 'laughing', 'loving',
  'lucid', 'magical', 'modest', 'musing', 'mystifying', 'naughty',
  'nervous', 'nice', 'nifty', 'nostalgic', 'objective', 'optimistic',
  'peaceful', 'pedantic', 'pensive', 'practical', 'priceless', 'quirky',
  'quizzical', 'recursing', 'relaxed', 'reverent', 'romantic', 'sad',
  'serene', 'sharp', 'silly', 'sleepy', 'stoic', 'strange',
  'stupefied', 'suspicious', 'sweet', 'tender', 'thirsty', 'trusting',
  'unruffled', 'upbeat', 'vibrant', 'vigilant', 'vigorous', 'wizardly',
  'wonderful', 'xenodochial', 'youthful', 'zealous', 'zen'
];

const NOUNS = [
  'albattani', 'allen', 'almeida', 'antonelli', 'archimedes', 'ardinghelli',
  'aryabhata', 'austin', 'babbage', 'banach', 'banzai', 'bardeen',
  'bartik', 'bassi', 'beaver', 'bell', 'benz', 'bhabha',
  'bhaskara', 'blackburn', 'blackwell', 'bohr', 'booth', 'borg',
  'bose', 'boyd', 'brahmagupta', 'brattain', 'brown', 'buck',
  'burnell', 'cannon', 'carson', 'cartwright', 'carver', 'cerf',
  'chandrasekhar', 'chaplygin', 'chatelet', 'chatterjee', 'chebyshev', 'cohen',
  'chaum', 'clarke', 'colden', 'cori', 'cray', 'curran',
  'curie', 'darwin', 'davinci', 'dewdney', 'dhawan', 'diffie',
  'dijkstra', 'dirac', 'driscoll', 'dubinsky', 'easley', 'edison',
  'einstein', 'elbakyan', 'elgamal', 'elion', 'ellis', 'engelbart',
  'euclid', 'euler', 'faraday', 'feistel', 'fermat', 'fermi',
  'feynman', 'franklin', 'gagarin', 'galileo', 'galois', 'ganguly',
  'gates', 'gauss', 'germain', 'goldberg', 'goldstine', 'goldwasser',
  'golick', 'goodall', 'gould', 'greider', 'grothendieck', 'haibt',
  'hamilton', 'haslett', 'hawking', 'hellman', 'heisenberg', 'hermann',
  'herschel', 'hertz', 'heyrovsky', 'hodgkin', 'hofstadter', 'hoover',
  'hopper', 'hugle', 'hypatia', 'ishizaka', 'jackson', 'jang',
  'jennings', 'jepsen', 'johnson', 'joliot', 'jones', 'kalam',
  'kapitsa', 'kare', 'keldysh', 'keller', 'kepler', 'khayyam',
  'khorana', 'kilby', 'kirchhoff', 'knuth', 'kowalevski', 'lalande',
  'lamarr', 'lamport', 'leakey', 'leavitt', 'lederberg', 'lehmann',
  'lewin', 'lichterman', 'liskov', 'lovelace', 'lumiere', 'mahavira',
  'margulis', 'matsumoto', 'maxwell', 'mayer', 'mccarthy', 'mcclintock',
  'mclaren', 'mclean', 'mcnulty', 'mendel', 'mendeleev', 'meitner',
  'meninsky', 'merkle', 'mestorf', 'minsky', 'mirzakhani', 'montalcini',
  'moore', 'morse', 'murdock', 'moser', 'napier', 'nash',
  'neumann', 'newton', 'nightingale', 'nobel', 'noether', 'northcutt',
  'noyce', 'panini', 'pare', 'pascal', 'pasteur', 'payne',
  'perlman', 'pike', 'poincare', 'poitras', 'proskuriakova', 'ptolemy',
  'raman', 'ramanujan', 'ride', 'ritchie', 'rhodes', 'robinson',
  'roentgen', 'rosalind', 'rubin', 'saha', 'sammet', 'sanderson',
  'satoshi', 'shamir', 'shannon', 'shaw', 'shirley', 'shockley',
  'shtern', 'snyder', 'solomon', 'spence', 'stonebraker', 'sutherland',
  'swanson', 'swartz', 'swirles', 'taussig', 'tereshkova', 'tesla',
  'tharp', 'thompson', 'torvalds', 'tu', 'turing', 'varahamihira',
  'vaughan', 'villani', 'visvesvaraya', 'volhard', 'wescoff', 'wilbur',
  'wiles', 'williams', 'williamson', 'wilson', 'wing', 'wozniak',
  'wright', 'wu', 'yalow', 'yalow', 'yang', 'yawner',
  'zhukovsky'
];

export function generateRandomName(): string {
  const adjective = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  const number = Math.floor(Math.random() * 1000);
  return `${adjective}_${noun}_${number}`;
}

export function generateDatabaseUser(): string {
  return generateRandomName();
}

export function generateDatabasePassword(): string {
  // Генерируем безопасный пароль для БД
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < 32; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}
