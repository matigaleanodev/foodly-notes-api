import { Test, TestingModule } from '@nestjs/testing';
import { TranslationService } from './translation.service';
import { AzureTranslationService } from './azure-translation.service';
import { RecipeDocument } from '../schemas/recipe.schema';

describe('TranslationService', () => {
  let service: TranslationService;
  let azure: jest.Mocked<AzureTranslationService>;

  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        TranslationService,
        {
          provide: AzureTranslationService,
          useValue: {
            translate: jest.fn(),
          },
        },
      ],
    }).compile();

    service = moduleRef.get(TranslationService);
    azure = moduleRef.get(AzureTranslationService);
  });

  it('debería estar definido', () => {
    expect(service).toBeDefined();
  });

  it('debería traducir una receta respetando el orden', async () => {
    const recipeDoc = {
      toObject: () => ({
        base: {
          title: 'Title',
          summary: 'Summary',
          instructions: [
            {
              name: '',
              steps: [{ number: 1, text: 'Step 1' }],
            },
          ],
          ingredients: [
            {
              id: 1,
              name: 'Salt',
              original: '1 tsp salt',
              amount: 1,
              unit: 'tsp',
              image: 'salt.png',
            },
          ],
        },
      }),
    } as unknown as RecipeDocument;

    azure.translate.mockResolvedValue([
      'Título',
      'Resumen',
      'Paso 1',
      'Sal',
      '1 cucharadita de sal',
    ]);

    const result = await service.translateRecipeToSpanish(recipeDoc);

    expect(result.title).toBe('Título');
    expect(result.summary).toBe('Resumen');
    expect(result.instructions[0].steps[0].text).toBe('Paso 1');
    expect(result.ingredients[0].name).toBe('Sal');
  });

  it('debería traducir una query de búsqueda a inglés', async () => {
    azure.translate.mockResolvedValue(['chicken soup']);

    const result = await service.translateSearchQueryToEnglish('sopa de pollo');

    expect(azure.translate).toHaveBeenCalledWith(['sopa de pollo'], 'en');
    expect(result).toBe('chicken soup');
  });
});
