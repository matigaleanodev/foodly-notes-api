import { HttpService } from '@nestjs/axios';
import { BadGatewayException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

const AZURE_TRANSLATOR_BASE_URL =
  'https://api.cognitive.microsofttranslator.com/translate';

export type TranslationTargetLang = 'en' | 'es';

@Injectable()
export class AzureTranslationService {
  constructor(
    private readonly httpService: HttpService,
    private readonly config: ConfigService,
  ) {}

  private get apiKey(): string {
    return this.config.getOrThrow<string>('AZURE_TRANSLATOR_KEY');
  }

  private get region(): string {
    return this.config.getOrThrow<string>('AZURE_TRANSLATOR_REGION');
  }

  private get endpoint(): string {
    const configuredEndpoint = this.config.get<string>('AZURE_TRANSLATOR_ENDPOINT');

    if (!configuredEndpoint?.trim()) {
      return AZURE_TRANSLATOR_BASE_URL;
    }

    return `${configuredEndpoint.replace(/\/+$/, '')}/translate`;
  }

  async translate(
    texts: string[],
    targetLang: TranslationTargetLang,
  ): Promise<string[]> {
    if (!texts.length) return [];

    try {
      const { data } = await this.httpService.axiosRef.post<
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
      );

      return data.map((item) => item.translations[0].text);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new BadGatewayException('Translation provider unavailable.');
      }

      throw error;
    }
  }
}
