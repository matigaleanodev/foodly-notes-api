import { HttpService } from '@nestjs/axios';
import { BadGatewayException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { ProviderAccessService } from '../../security/provider-access.service';

const AZURE_TRANSLATOR_BASE_URL =
  'https://api.cognitive.microsofttranslator.com/translate';

export type TranslationTargetLang = 'en' | 'es';

@Injectable()
export class AzureTranslationService {
  constructor(
    private readonly httpService: HttpService,
    private readonly config: ConfigService,
    private readonly access: ProviderAccessService,
  ) {}

  private get apiKey(): string {
    return this.config.getOrThrow<string>('AZURE_TRANSLATOR_KEY');
  }

  private get region(): string {
    return this.config.getOrThrow<string>('AZURE_TRANSLATOR_REGION');
  }

  private get endpoint(): string {
    const configuredEndpoint = this.config.get<string>(
      'AZURE_TRANSLATOR_ENDPOINT',
    );

    if (!configuredEndpoint?.trim()) {
      return AZURE_TRANSLATOR_BASE_URL;
    }

    const url = new URL(configuredEndpoint);
    if (url.protocol !== 'https:' || url.username || url.password)
      throw new Error(
        'Azure Translator requires an HTTPS URL without credentials.',
      );
    return `${url.href.replace(/\/+$/, '')}/translate`;
  }

  async translate(
    texts: string[],
    targetLang: TranslationTargetLang,
  ): Promise<string[]> {
    if (!texts.length) return [];
    const translated: string[] = [];
    for (let offset = 0; offset < texts.length; offset += 100) {
      const batch = texts.slice(offset, offset + 100);
      const characters = batch.reduce((sum, text) => sum + text.length, 0);
      if (characters > 50000)
        throw new BadGatewayException(
          'Translation input exceeds provider limits.',
        );
      translated.push(
        ...(await this.translateBatch(
          batch,
          targetLang,
          Math.max(1, characters),
        )),
      );
    }
    return translated;
  }

  private async translateBatch(
    texts: string[],
    targetLang: TranslationTargetLang,
    characters: number,
  ): Promise<string[]> {
    try {
      const { data } = await this.access.run(
        'azure',
        () =>
          this.httpService.axiosRef.post<
            {
              translations: { text: string }[];
            }[]
          >(
            this.endpoint,
            texts.map((text) => ({ text })),
            {
              params: {
                'api-version': '3.0',
                to: targetLang,
              },
              headers: {
                'Ocp-Apim-Subscription-Key': this.apiKey,
                'Ocp-Apim-Subscription-Region': this.region,
                'Content-Type': 'application/json',
              },
            },
          ),
        characters,
      );

      if (
        !Array.isArray(data) ||
        data.length !== texts.length ||
        data.some((item) => typeof item.translations?.[0]?.text !== 'string')
      )
        throw new BadGatewayException('Invalid translation provider response.');
      return data.map((item) => item.translations[0].text);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new BadGatewayException('Translation provider unavailable.');
      }

      throw error;
    }
  }
}
