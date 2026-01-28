export const DAILY_RECIPES_RESPONSE_EXAMPLE = [
  {
    sourceId: 636598,
    title: 'Butternut Squash Souffle',
    image: 'https://img.spoonacular.com/recipes/636598-556x370.jpg',
    ingredients: [
      {
        id: 1001,
        name: 'butter',
        original: 'Butter to grease the ramekins',
        amount: 1,
        unit: 'tbsp',
        image: 'butter-sliced.jpg',
      },
    ],
  },
];

export const RECIPE_DETAIL_RESPONSE_EXAMPLE = {
  sourceId: 636598,
  title: 'Butternut Squash Souffle',
  summary: '<p>Recipe summary</p>',
  instructions: [
    {
      name: '',
      steps: [{ number: 1, text: 'Step one' }],
    },
  ],
  ingredients: [],
  image: 'https://img.spoonacular.com/recipes/636598-556x370.jpg',
  readyInMinutes: 45,
  servings: 4,
  vegetarian: true,
  vegan: false,
  glutenFree: true,
  lang: 'en',
};

export const SIMILAR_RECIPES_RESPONSE_EXAMPLE = [
  {
    id: 123,
    title: 'Similar recipe',
    image: 'https://img.spoonacular.com/recipes/123-556x370.jpg',
  },
];

export const INGREDIENTS_RESPONSE_EXAMPLE = [
  {
    sourceId: 636598,
    title: 'Acompañamiento de soufflé de calabaza',
    ingredients: [
      {
        id: 1001,
        name: 'mantequilla',
        original: 'Butter to grease the ramekins',
        amount: 1,
        unit: 'tbsp',
        image: 'butter-sliced.jpg',
      },
    ],
  },
];

export const INGREDIENTS_SCHEMA = {
  type: 'object',
  properties: {
    sourceIds: {
      type: 'array',
      items: { type: 'number' },
      example: [636598, 123456],
    },
    lang: {
      type: 'string',
      enum: ['en', 'es'],
      example: 'es',
    },
  },
  required: ['sourceIds'],
};
