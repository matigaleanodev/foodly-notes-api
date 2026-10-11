import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { model } from 'mongoose';
import { IngredientsRequestDto } from './dto/requests/ingredients-request.dto';
import { RecipeIdParamDto } from './dto/requests/recipe-id-param.dto';
import { SearchRecipesQueryDto } from './dto/requests/search-recipes-query.dto';
import { StoredRecipesQueryDto } from './dto/requests/stored-recipes-query.dto';
import { DailyRecipeSchema } from './schemas/daily-recipe.schema';
import { RecipeSchema } from './schemas/recipe.schema';
import { mapRecipeDetailResponse } from './recipes.mapper';
import { safeHttpUrl, sanitizeSummary } from './recipe-content';

describe('Security contracts', () => {
  it.each([true, false, null, {}, 1.5, -1, 0, Number.MAX_SAFE_INTEGER + 1])(
    'rejects unsafe ingredient id %p',
    async (id) => {
      const dto = plainToInstance(IngredientsRequestDto, { sourceIds: [id] });
      expect(await validate(dto)).not.toHaveLength(0);
    },
  );

  it('bounds batches and search text', async () => {
    expect(
      await validate(
        plainToInstance(IngredientsRequestDto, {
          sourceIds: Array.from({ length: 21 }, (_, i) => i + 1),
        }),
      ),
    ).not.toHaveLength(0);
    for (const q of ['a'.repeat(201), 'soup\u0000']) {
      expect(
        await validate(plainToInstance(SearchRecipesQueryDto, { q })),
      ).not.toHaveLength(0);
    }
  });

  it('rejects unsafe and non-decimal path ids', async () => {
    for (const id of ['9007199254740993', '1e2', '0x10', true]) {
      expect(
        await validate(plainToInstance(RecipeIdParamDto, { id })),
      ).not.toHaveLength(0);
    }
    const dto = plainToInstance(RecipeIdParamDto, { id: '42' });
    expect(await validate(dto)).toHaveLength(0);
    expect(dto.id).toBe(42);
  });

  it('bounds pagination and defaults to 50', async () => {
    expect(plainToInstance(StoredRecipesQueryDto, {}).limit).toBe(50);
    expect(
      await validate(plainToInstance(StoredRecipesQueryDto, { limit: 101 })),
    ).not.toHaveLength(0);
  });

  it('keeps safe formatting and removes scripts, attributes and unsafe links', () => {
    const value = sanitizeSummary(
      '<p>Hello <strong>world</strong><img src=x onerror=alert(1)><script>alert(1)</script><a href="javascript:alert(1)">bad</a><a href="https://example.com" onclick="alert(1)">good</a></p>',
    );
    expect(value).toContain('<strong>world</strong>');
    expect(value).toContain('href="https://example.com"');
    expect(value).not.toMatch(/script|onerror|onclick|javascript:|<img/);
    expect(safeHttpUrl('javascript:alert(1)')).toBeUndefined();
    expect(safeHttpUrl('https://user:secret@example.com')).toBeUndefined();
  });

  it('maps real Mongoose subdocuments without internal fields', () => {
    const Recipe = model('ContractRecipe', RecipeSchema);
    const doc = new Recipe({
      sourceId: 42,
      base: {
        title: 'Soup',
        summary: '<img src=x onerror=alert(1)>',
        ingredients: [{ id: 1, name: 'salt' }],
        instructions: [{ name: '', steps: [{ number: 1, text: 'Mix' }] }],
      },
      meta: { sourceUrl: 'javascript:alert(1)' },
    });
    const response = mapRecipeDetailResponse(doc, 'en');
    expect(response.instructions[0]).toEqual({
      name: '',
      steps: [{ number: 1, text: 'Mix' }],
    });
    expect(JSON.stringify(response)).not.toMatch(
      /_id|\$__|onerror|javascript:/,
    );
    expect(response.sourceId).toBe(42);
    expect(
      new (model('ContractDaily', DailyRecipeSchema))({
        date: '2026-10-11',
        recipes: [{ sourceId: 42, title: 'Soup' }],
      }).recipes[0].sourceId,
    ).toBe(42);
  });
});
