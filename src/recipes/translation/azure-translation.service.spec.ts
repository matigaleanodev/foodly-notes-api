import { Test, TestingModule } from '@nestjs/testing';
import { AzureTranslationService } from './azure-translation.service';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { BadGatewayException } from '@nestjs/common';

describe('AzureTranslationService', () => {
  let service: AzureTranslationService;
  let httpService: HttpService;
  let configService: ConfigService;

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
            get: jest.fn((key: string) => {
              if (key === 'AZURE_TRANSLATOR_ENDPOINT') {
                return 'https://custom-translator.cognitiveservices.azure.com';
              }

              return undefined;
            }),
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
    configService = module.get(ConfigService);
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
    const postMock = jest.spyOn(httpService.axiosRef, 'post');
    postMock.mockResolvedValueOnce({
      data: [
        { translations: [{ text: 'Hola' }] },
        { translations: [{ text: 'Mundo' }] },
      ],
    });

    const result = await service.translate(['Hello', 'World'], 'es');

    expect(result).toEqual(['Hola', 'Mundo']);
    expect(postMock).toHaveBeenCalledWith(
      'https://custom-translator.cognitiveservices.azure.com/translate',
      [{ text: 'Hello' }, { text: 'World' }],
      expect.any(Object),
    );
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

  it('debería usar el endpoint por defecto cuando la configuración no existe', async () => {
    const postMock = jest.spyOn(httpService.axiosRef, 'post');
    jest.spyOn(configService, 'get').mockReturnValueOnce(undefined);
    postMock.mockResolvedValueOnce({
      data: [{ translations: [{ text: 'Hola' }] }],
    });

    await service.translate(['Hello'], 'es');

    expect(postMock).toHaveBeenCalledWith(
      'https://api.cognitive.microsofttranslator.com/translate',
      [{ text: 'Hello' }],
      expect.any(Object),
    );
  });

  it('debería mapear errores axios a BadGatewayException', async () => {
    jest.spyOn(httpService.axiosRef, 'post').mockRejectedValueOnce({
      isAxiosError: true,
    });

    await expect(service.translate(['Hello'], 'es')).rejects.toBeInstanceOf(
      BadGatewayException,
    );
  });
});
