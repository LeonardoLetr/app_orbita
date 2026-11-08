import { Category } from '../models/category';

/**
 * Source of game categories. The game depends only on this contract,
 * so the local JSON can later be replaced by an API.
 */
export abstract class CategoryRepository {
  abstract getAll(): Promise<Category[]>;
}
