/**
 * Game Constants and Story Metadata for Ganesha — Stories of Wisdom
 */

import { ChapterId, ChapterMeta, FeastItemType, WorldLandmark } from '../types';

export const FEAST_ITEMS: FeastItemType[] = [
  // TARGET FOODS (+10 points)
  {
    id: 'modak',
    name: 'Modak',
    category: 'food',
    points: 10,
    color: '#fffae5',
    secondaryColor: '#f59e0b',
    description: 'Lord Ganesha\'s most beloved sweet dumpling'
  },
  {
    id: 'ladoo',
    name: 'Besan Ladoo',
    category: 'food',
    points: 10,
    color: '#f59e0b',
    secondaryColor: '#d97706',
    description: 'Aromatic golden chickpea sweet ball'
  },
  {
    id: 'banana',
    name: 'Ripe Banana',
    category: 'food',
    points: 10,
    color: '#fde047',
    secondaryColor: '#84cc16',
    description: 'Fresh festive fruit offering'
  },
  {
    id: 'mango',
    name: 'Golden Mango',
    category: 'food',
    points: 10,
    color: '#fb923c',
    secondaryColor: '#ea580c',
    description: 'Sweet royal ripe mango'
  },
  {
    id: 'payasam',
    name: 'Payasam Bowl',
    category: 'food',
    points: 10,
    color: '#fef3c7',
    secondaryColor: '#b45309',
    description: 'Sweet festive rice and milk kheer'
  },
  {
    id: 'pomegranate',
    name: 'Pomegranate',
    category: 'food',
    points: 10,
    color: '#ef4444',
    secondaryColor: '#991b1b',
    description: 'Ruby seeded festival fruit'
  },

  // DISTRACTING NON-FOOD OBJECTS (Lose 1 chance if selected)
  {
    id: 'thali',
    name: 'Brass Thali',
    category: 'distraction',
    points: 0,
    color: '#eab308',
    secondaryColor: '#ca8a04',
    description: 'Puja plate — do not consume!'
  },
  {
    id: 'flower',
    name: 'Marigold Flower',
    category: 'distraction',
    points: 0,
    color: '#f97316',
    secondaryColor: '#c2410c',
    description: 'Offering garland blossom'
  },
  {
    id: 'gold_coin',
    name: 'Kubera\'s Gold',
    category: 'distraction',
    points: 0,
    color: '#fbbf24',
    secondaryColor: '#f59e0b',
    description: 'Treasure of Kubera — not food'
  },
  {
    id: 'incense',
    name: 'Incense Burner',
    category: 'distraction',
    points: 0,
    color: '#78716c',
    secondaryColor: '#44403c',
    description: 'Fragrant dhoop stand'
  },
  {
    id: 'temple_bell',
    name: 'Brass Bell',
    category: 'distraction',
    points: 0,
    color: '#facc15',
    secondaryColor: '#a16207',
    description: 'Sacred ghanti bell'
  },
  {
    id: 'clay_diya',
    name: 'Burning Diya',
    category: 'distraction',
    points: 0,
    color: '#ea580c',
    secondaryColor: '#fed7aa',
    description: 'Sacred oil lamp flame'
  }
];

export const CHAPTERS_DATA: Record<ChapterId, ChapterMeta> = {
  kubera_feast: {
    id: 'kubera_feast',
    title: 'Kubera’s Feast',
    subtitle: 'Catch the right food and avoid distractions.',
    locationName: 'The Golden Banquet Hall',
    icon: '🥟',
    storyParchment: {
      narrative: 'Inspired by the traditional story of Kubera inviting Ganesha to a grand feast and Ganesha’s extraordinary appetite.',
      moral: 'Inspired by the traditional story of Kubera inviting Ganesha to a grand feast and Ganesha’s extraordinary appetite.',
      instructions: [
        'Catch the right food and avoid distractions.',
        'Controls: Move / Touch'
      ],
      tips: 'Catch falling food in the golden thali and keep your combo alive!'
    },
    unlocked: true,
    highScore: 0,
    timesPlayed: 0
  },
  great_race: {
    id: 'great_race',
    title: 'Bappa’s Journey',
    subtitle: 'Help Mushika cross the river and collect modaks.',
    locationName: 'The Sacred River Crossing',
    icon: '🌊',
    storyParchment: {
      narrative: 'Inspired by the water journey associated with Ganesh Chaturthi and the traditional immersion of Ganesha idols.',
      moral: 'Inspired by the water journey associated with Ganesh Chaturthi and the traditional immersion of Ganesha idols.',
      instructions: [
        'Help Mushika cross the river and collect modaks.',
        'Controls: ← → / Touch'
      ],
      tips: 'Time your hops across logs and lotus pads to cross the sacred waters!'
    },
    unlocked: true,
    highScore: 0,
    timesPlayed: 0
  },
  mushaks_adventure: {
    id: 'mushaks_adventure',
    title: 'Mushika Run',
    subtitle: 'Run with Mushika, collect modaks and avoid obstacles.',
    locationName: 'The Endless Modak Trail',
    icon: '🐭',
    storyParchment: {
      narrative: 'Mushika is traditionally known as Ganesha’s vahana. This game turns Mushika’s journey into a playful run carrying offerings to Bappa.',
      moral: 'Mushika is traditionally known as Ganesha’s vahana. This game turns Mushika’s journey into a playful run carrying offerings to Bappa.',
      instructions: [
        'Run with Mushika, collect modaks and avoid obstacles.',
        'Controls: ← → / Touch'
      ],
      tips: 'Weave through barriers, survive with 5 hearts, and collect offerings for Bappa!'
    },
    unlocked: true,
    highScore: 0,
    timesPlayed: 0
  },
  unstoppable_scribe: {
    id: 'unstoppable_scribe',
    title: 'Bappa’s Book',
    subtitle: 'Help Ganesha write the Mahabharata before time runs out.',
    locationName: 'Hermitage of Sage Vyasa',
    icon: '📖',
    storyParchment: {
      narrative: 'Inspired by the traditional story of Sage Vyasa asking Ganesha to write the Mahabharata as he dictated it.',
      moral: 'Inspired by the traditional story of Sage Vyasa asking Ganesha to write the Mahabharata as he dictated it.',
      instructions: [
        'Help Ganesha write the Mahabharata before time runs out.',
        'Controls: Keyboard'
      ],
      tips: 'Type the sacred verses before time runs out to complete the epic manuscript.'
    },
    unlocked: true,
    highScore: 0,
    timesPlayed: 0
  },
  the_gatekeeper: {
    id: 'the_gatekeeper',
    title: 'Bappa Match',
    subtitle: 'Remember the cards and find matching Ganesha pairs.',
    locationName: 'Sacred Wisdom Archway',
    icon: '🎴',
    storyParchment: {
      narrative: 'Inspired by Ganesha’s traditional association with wisdom, knowledge and intelligence.',
      moral: 'Inspired by Ganesha’s traditional association with wisdom, knowledge and intelligence.',
      instructions: [
        'Remember the cards and find matching Ganesha pairs.',
        'Controls: Touch / Click'
      ],
      tips: 'Remember card positions to reveal all matching pairs before time expires.'
    },
    unlocked: true,
    highScore: 0,
    timesPlayed: 0
  }
};

// Hub World Landmark Positions in a cohesive 1280x800 festive village courtyard
export const WORLD_LANDMARKS: WorldLandmark[] = [
  {
    id: 'kubera_feast',
    name: 'Kubera’s Feast',
    subtitle: 'Golden Banquet Pavilion',
    icon: '🥟',
    x: 240,
    y: 190,
    radius: 70,
    color: '#f59e0b',
    bannerText: 'Kubera’s Feast'
  },
  {
    id: 'great_race',
    name: 'Bappa’s Journey',
    subtitle: 'Sacred River Crossing Pavilion',
    icon: '🌊',
    x: 240,
    y: 590,
    radius: 70,
    color: '#0284c7',
    bannerText: 'Bappa’s Journey'
  },
  {
    id: 'mushaks_adventure',
    name: 'Mushika Run',
    subtitle: 'The Endless Modak Trail',
    icon: '🐭',
    x: 640,
    y: 655,
    radius: 68,
    color: '#a855f7',
    bannerText: 'Mushika Run'
  },
  {
    id: 'unstoppable_scribe',
    name: 'Bappa’s Book',
    subtitle: 'Hermitage of Sage Vyasa',
    icon: '📖',
    x: 1040,
    y: 190,
    radius: 70,
    color: '#3b82f6',
    bannerText: 'Bappa’s Book'
  },
  {
    id: 'the_gatekeeper',
    name: 'Bappa Match',
    subtitle: 'Sacred Wisdom Archway',
    icon: '🎴',
    x: 1040,
    y: 590,
    radius: 70,
    color: '#ec4899',
    bannerText: 'Bappa Match'
  }
];

export const WORLD_BOUNDS = {
  width: 1280,
  height: 800,
  centerMandap: {
    x: 640,
    y: 380,
    width: 220,
    height: 220
  }
};
