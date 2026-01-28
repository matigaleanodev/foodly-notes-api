import { Test, TestingModule } from '@nestjs/testing';
import { AzureTranslationService } from './azure-translation.service';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';

describe('AzureTranslationService', () => {
  let service: AzureTranslationService;
  let httpService: HttpService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AzureTranslationService,
        {
          provide: HttpService,
          useValue: {
            axiosRef: {
              post: jest.fn(),
            },
          },
        },
        {
          provide: ConfigService,
          useValue: {
            getOrThrow: jest.fn((key: string) => {
              if (key === 'AZURE_TRANSLATOR_KEY') return 'fake-key';
              if (key === 'AZURE_TRANSLATOR_REGION') return 'fake-region';
              return null;
            }),
          },
        },
      ],
    }).compile();

    service = module.get(AzureTranslationService);
    httpService = module.get(HttpService);
  });

  it('debería estar definido', () => {
    expect(service).toBeDefined();
  });

  it('debería devolver un array vacío si no hay textos', async () => {
    const postMock = jest.spyOn(httpService.axiosRef, 'post');

    const result = await service.translate([], 'es');

    expect(result).toEqual([]);
    expect(postMock).not.toHaveBeenCalled();
  });

  it('debería traducir una lista de textos', async () => {
    (httpService.axiosRef.post as jest.Mock).mockResolvedValueOnce({
      data: [
        { translations: [{ text: 'Hola' }] },
        { translations: [{ text: 'Mundo' }] },
      ],
    });

    const result = await service.translate(['Hello', 'World'], 'es');

    expect(result).toEqual(['Hola', 'Mundo']);
  });

  it('debería respetar el orden de traducción', async () => {
    jest.spyOn(httpService.axiosRef, 'post').mockResolvedValueOnce({
      data: [
        { translations: [{ text: 'Título' }] },
        { translations: [{ text: 'Resumen' }] },
        { translations: [{ text: 'Paso 1' }] },
      ],
    });

    const result = await service.translate(
      ['Title', 'Summary', 'Step 1'],
      'es',
    );

    expect(result).toEqual(['Título', 'Resumen', 'Paso 1']);
  });
});
