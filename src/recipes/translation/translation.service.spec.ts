import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { TranslationService } from './translation.service';
import { AzureTranslationService } from './azure-translation.service';
import { RecipeDocument } from '../schemas/recipe.schema';
import { TranslationEntry } from '../schemas/translation-entry.schema';

describe('TranslationService', () => {
  let service: TranslationService;
  let azure: jest.Mocked<AzureTranslationService>;
  const translationEntryModelMock = {
    find: jest.fn(),
    updateOne: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        TranslationService,
        {
          provide: getModelToken(TranslationEntry.name),
          useValue: translationEntryModelMock,
        },
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

    translationEntryModelMock.find.mockReturnValue({
      exec: jest.fn().mockResolvedValue([]),
    });
    translationEntryModelMock.updateOne.mockReturnValue({
      exec: jest.fn().mockResolvedValue(undefined),
    });
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
    const translateMock = jest.spyOn(azure, 'translate');
    azure.translate.mockResolvedValue(['chicken soup']);

    const result = await service.translateSearchQueryToEnglish('sopa de pollo');

    expect(translateMock).toHaveBeenCalledWith(['sopa de pollo'], 'en');
    expect(result).toBe('chicken soup');
  });

  it('debería reutilizar cache de traducciones antes de llamar a Azure', async () => {
    const translateMock = jest.spyOn(azure, 'translate');
    translationEntryModelMock.find.mockReturnValue({
      exec: jest.fn().mockResolvedValue([
        {
          sourceText: 'Chicken Soup',
          translatedText: 'Sopa de pollo',
        },
      ]),
    });

    const result = await service.translateTexts(['Chicken Soup'], 'es');

    expect(translateMock).not.toHaveBeenCalled();
    expect(result).toEqual(['Sopa de pollo']);
  });

  it('debería persistir textos faltantes luego de traducirlos', async () => {
    const updateOneMock = translationEntryModelMock.updateOne;
    azure.translate.mockResolvedValue(['Sopa de pollo']);

    const result = await service.translateTexts(['Chicken Soup'], 'es');

    expect(updateOneMock).toHaveBeenCalledWith(
      { sourceText: 'Chicken Soup', targetLang: 'es' },
      {
        $set: {
          sourceText: 'Chicken Soup',
          targetLang: 'es',
          translatedText: 'Sopa de pollo',
        },
      },
      { upsert: true },
    );
    expect(result).toEqual(['Sopa de pollo']);
  });
});
