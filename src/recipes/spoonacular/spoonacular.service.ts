import { Injectable, NotFoundException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { SpoonacularRecipeDetail } from './spoonacular.types';

@Injectable()
export class SpoonacularService {
  constructor(
    private readonly httpService: HttpService,
    private readonly config: ConfigService,
  ) {}

  private get apiKey(): string {
    return this.config.getOrThrow<string>('SPOONACULAR_API_KEY');
  }

  private get baseURL(): string {
    return this.config.getOrThrow<string>('SPOONACULAR_BASE_URL');
  }

  async getDailyRecipes(number = 12) {
    const { data } = await this.httpService.axiosRef.get<{
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
    });

    return data.recipes.map((r) => ({
      id: r.id,
      title: r.title,
      image: r.image,
    }));
  }

  async getRecipeById(id: number) {
    try {
      const { data } =
        await this.httpService.axiosRef.get<SpoonacularRecipeDetail>(
          `${this.baseURL}/recipes/${id}/information`,
          {
            params: {
              apiKey: this.apiKey,
            },
          },
        );

      return data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        throw new NotFoundException('Receta no encontrada');
      }
      throw error;
    }
  }

  async getSimilarRecipes(id: number, number = 6) {
    const { data } = await this.httpService.axiosRef.get<
      { id: number; title: string; imageType: string }[]
    >(`${this.baseURL}/recipes/${id}/similar`, {
      params: {
        apiKey: this.apiKey,
        number,
      },
    });

    return data.map((r) => ({
      sourceId: r.id,
      title: r.title,
      image: this.buildImage(r.id, r.imageType),
    }));
  }

  async searchRecipes(query: string, limit = 12) {
    const { data } = await this.httpService.axiosRef.get<{
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
    });

    return data.results.map((r) => ({
      id: r.id,
      title: r.title,
      image: this.buildImage(r.id, r.imageType),
    }));
  }

  private buildImage(id: number, imageType?: string) {
    return imageType
      ? `https://img.spoonacular.com/recipes/${id}-556x370.${imageType}`
      : null;
  }
}
