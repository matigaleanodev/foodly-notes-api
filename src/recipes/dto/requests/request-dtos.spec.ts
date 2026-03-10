import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { IngredientsRequestDto } from './ingredients-request.dto';
import { LangQueryDto } from './lang-query.dto';
import { SearchRecipesQueryDto } from './search-recipes-query.dto';

describe('Recipe request DTOs', () => {
  it('normalizes query language values', async () => {
    const dto = plainToInstance(LangQueryDto, { lang: ' ES ' });
    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
    expect(dto.lang).toBe('es');
  });

  it('rejects blank search queries after trimming', async () => {
    const dto = plainToInstance(SearchRecipesQueryDto, { q: '   ' });
    const errors = await validate(dto);

    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('q');
  });

  it('keeps valid search queries trimmed', async () => {
    const dto = plainToInstance(SearchRecipesQueryDto, { q: '  pasta  ' });
    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
    expect(dto.q).toBe('pasta');
  });

  it('rejects duplicate ingredient source ids', async () => {
    const dto = plainToInstance(IngredientsRequestDto, {
      sourceIds: [12, 12],
    });
    const errors = await validate(dto);

    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('sourceIds');
  });

  it('normalizes ingredient language values', async () => {
    const dto = plainToInstance(IngredientsRequestDto, {
      sourceIds: [12],
      lang: ' ES ',
    });
    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
    expect(dto.lang).toBe('es');
  });
});
