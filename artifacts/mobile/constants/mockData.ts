export interface QuizQuestion {
  quiz_id: string;
  question: string;
  options: string[];
  correct_option_index: number;
}

export interface Post {
  post_id: string;
  admin_name: string;
  content_text: string;
  screenshot_url: string;
  likes_count: number;
  shares_count: number;
  comments: { username: string; comment_text: string; timestamp: string }[];
  createdAt: string;
}

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    quiz_id: '1',
    question: 'What is the capital of France?',
    options: ['London', 'Berlin', 'Paris', 'Madrid'],
    correct_option_index: 2,
  },
  {
    quiz_id: '2',
    question: 'Which planet is closest to the Sun?',
    options: ['Venus', 'Mercury', 'Earth', 'Mars'],
    correct_option_index: 1,
  },
  {
    quiz_id: '3',
    question: 'What is 12 × 12?',
    options: ['124', '144', '132', '156'],
    correct_option_index: 1,
  },
  {
    quiz_id: '4',
    question: 'Who invented the telephone?',
    options: ['Edison', 'Tesla', 'Bell', 'Marconi'],
    correct_option_index: 2,
  },
  {
    quiz_id: '5',
    question: 'What is the largest ocean on Earth?',
    options: ['Atlantic', 'Indian', 'Arctic', 'Pacific'],
    correct_option_index: 3,
  },
  {
    quiz_id: '6',
    question: 'How many sides does a hexagon have?',
    options: ['5', '7', '6', '8'],
    correct_option_index: 2,
  },
  {
    quiz_id: '7',
    question: 'In which year did World War II end?',
    options: ['1943', '1944', '1946', '1945'],
    correct_option_index: 3,
  },
  {
    quiz_id: '8',
    question: 'Which element has the chemical symbol O?',
    options: ['Gold', 'Oxygen', 'Osmium', 'Oganesson'],
    correct_option_index: 1,
  },
  {
    quiz_id: '9',
    question: 'What is the speed of light (approx) in km/s?',
    options: ['200,000', '300,000', '400,000', '150,000'],
    correct_option_index: 1,
  },
  {
    quiz_id: '10',
    question: 'Which country has the largest population?',
    options: ['India', 'USA', 'China', 'Russia'],
    correct_option_index: 0,
  },
];

export const FEED_POSTS: Post[] = [
  {
    post_id: '1',
    admin_name: 'QuizBox Admin',
    content_text: 'Congratulations to all our top collectors this week! Keep playing, keep winning. New Gift Vouchers dropping every Friday.',
    screenshot_url: 'https://picsum.photos/seed/qb1/400/220',
    likes_count: 312,
    shares_count: 47,
    comments: [
      { username: 'Ali_K', comment_text: 'Great platform, love collecting tokens!', timestamp: new Date(Date.now() - 7200000).toISOString() },
      { username: 'Sara_M', comment_text: 'When is the next Mega Draw?', timestamp: new Date(Date.now() - 3600000).toISOString() },
    ],
    createdAt: new Date(Date.now() - 10800000).toISOString(),
  },
  {
    post_id: '2',
    admin_name: 'Reward Hub',
    content_text: 'Today\'s top players have been rewarded! 25 Gift Vouchers successfully processed. Play the Brain Quiz daily and spin the wheel to boost your token collection.',
    screenshot_url: 'https://picsum.photos/seed/qb2/400/220',
    likes_count: 198,
    shares_count: 31,
    comments: [
      { username: 'ZainQ', comment_text: 'Got my voucher, very fast!', timestamp: new Date(Date.now() - 1800000).toISOString() },
    ],
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    post_id: '3',
    admin_name: 'QuizBox Admin',
    content_text: 'New Captcha Solver module is now live! Complete 5 captchas and collect 20 bonus tokens. Stay sharp and keep collecting.',
    screenshot_url: 'https://picsum.photos/seed/qb3/400/220',
    likes_count: 421,
    shares_count: 68,
    comments: [],
    createdAt: new Date(Date.now() - 172800000).toISOString(),
  },
  {
    post_id: '4',
    admin_name: 'Reward Hub',
    content_text: 'Rs. 500 and Rs. 1000 Gift Vouchers processed today! Redeem via EasyPaisa and JazzCash. Check the Claim Rewards section for details.',
    screenshot_url: 'https://picsum.photos/seed/qb4/400/220',
    likes_count: 567,
    shares_count: 94,
    comments: [
      { username: 'Hassan_B', comment_text: 'Love this reward system!', timestamp: new Date(Date.now() - 5400000).toISOString() },
      { username: 'Nadia_R', comment_text: 'Almost at 5000 tokens!', timestamp: new Date(Date.now() - 900000).toISOString() },
    ],
    createdAt: new Date(Date.now() - 259200000).toISOString(),
  },
  {
    post_id: '5',
    admin_name: 'QuizBox Admin',
    content_text: 'Spin the Wheel daily for your FREE spins! Land on 100 tokens for a mega boost. Three free spins every day — watch a video for extra turns.',
    screenshot_url: 'https://picsum.photos/seed/qb5/400/220',
    likes_count: 289,
    shares_count: 42,
    comments: [],
    createdAt: new Date(Date.now() - 345600000).toISOString(),
  },
];

export const BANNED_WORDS = ['scam', 'fake', 'fraud', 'bakwas', 'chor', 'cheat', 'loot', 'bekar', 'worst', 'pathetic'];

export const SPIN_SEGMENTS = [
  { label: '10', tokens: 10, color: '#F5C842', textColor: '#0A0A14' },
  { label: 'Skip', tokens: 0, color: '#2A1A5E', textColor: '#A090FF' },
  { label: '20', tokens: 20, color: '#1A3A28', textColor: '#2ED573' },
  { label: '50', tokens: 50, color: '#FF6B35', textColor: '#FFFFFF' },
  { label: '10', tokens: 10, color: '#F5C842', textColor: '#0A0A14' },
  { label: 'Skip', tokens: 0, color: '#2A1A5E', textColor: '#A090FF' },
  { label: '100', tokens: 100, color: '#FF4757', textColor: '#FFFFFF' },
  { label: '20', tokens: 20, color: '#1A3A28', textColor: '#2ED573' },
];
