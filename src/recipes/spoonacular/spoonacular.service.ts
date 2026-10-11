import {
  BadGatewayException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { SpoonacularRecipeDetail } from './spoonacular.types';
import { ProviderAccessService } from '../../security/provider-access.service';

@Injectable()
export class SpoonacularService {
  constructor(
    private readonly httpService: HttpService,
    private readonly config: ConfigService,
    private readonly access: ProviderAccessService,
  ) {}

  private get apiKey(): string {
    return this.config.getOrThrow<string>('SPOONACULAR_API_KEY');
  }

  private get baseURL(): string {
    const url = new URL(this.config.getOrThrow<string>('SPOONACULAR_BASE_URL'));
    if (url.protocol !== 'https:' || url.username || url.password)
      throw new Error('Spoonacular requires an HTTPS URL without credentials.');
    return url.href.replace(/\/+$/, '');
  }

  async getDailyRecipes(number = 12) {
    try {
      const { data } = await this.access.run('spoonacular', () =>
        this.httpService.axiosRef.get<{
          recipes: {
            id: number;
            title: string;
            image: string;
          }[];
        }>(`${this.baseURL}/recipes/random`, {
          params: {
            apiKey: this.apiKey,
            number,
            addRecipeInformation: true,
          },
        }),
      );

      return data.recipes.map((r) => ({
        id: r.id,
        title: r.title,
        image: r.image,
      }));
    } catch (error) {
      this.throwMappedProviderError(error);
    }
  }

  async getRecipeById(id: number) {
    try {
      const { data } = await this.access.run('spoonacular', () =>
        this.httpService.axiosRef.get<SpoonacularRecipeDetail>(
          `${this.baseURL}/recipes/${id}/information`,
          {
            params: {
              apiKey: this.apiKey,
            },
          },
        ),
      );

      return data;
    } catch (error) {
      this.throwMappedProviderError(error);
    }
  }

  async getSimilarRecipes(id: number, number = 6) {
    try {
      const { data } = await this.access.run('spoonacular', () =>
        this.httpService.axiosRef.get<
          { id: number; title: string; imageType: string }[]
        >(`${this.baseURL}/recipes/${id}/similar`, {
          params: {
            apiKey: this.apiKey,
            number,
          },
        }),
      );

      return data.map((r) => ({
        sourceId: r.id,
        title: r.title,
        image: this.buildImage(r.id, r.imageType),
      }));
    } catch (error) {
      this.throwMappedProviderError(error);
    }
  }

  async searchRecipes(query: string, limit = 12) {
    try {
      const { data } = await this.access.run('spoonacular', () =>
        this.httpService.axiosRef.get<{
          results: {
            id: number;
            title: string;
            imageType?: string;
          }[];
        }>(`${this.baseURL}/recipes/complexSearch`, {
          params: {
            apiKey: this.apiKey,
            query,
            number: Math.min(limit, 12),
            addRecipeInformation: true,
          },
        }),
      );

      return data.results.map((r) => ({
        id: r.id,
        title: r.title,
        image: this.buildImage(r.id, r.imageType),
      }));
    } catch (error) {
      this.throwMappedProviderError(error);
    }
  }

  private buildImage(id: number, imageType?: string) {
    return imageType
      ? `https://img.spoonacular.com/recipes/${id}-556x370.${imageType}`
      : null;
  }

  private throwMappedProviderError(error: unknown): never {
    if (error instanceof ServiceUnavailableException) throw error;
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      throw new NotFoundException('Recipe not found.');
    }

    throw new BadGatewayException('Recipe provider unavailable.');
  }
}
