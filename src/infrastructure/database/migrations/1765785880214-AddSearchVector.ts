import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSearchVector1765785880214 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    //  Add the tsvector column if it doesn't exist
    await queryRunner.query(`
          ALTER TABLE public.courses
          ADD COLUMN IF NOT EXISTS search_vector tsvector;
        `);

    //  Populate existing rows with weighted tsvector
    await queryRunner.query(`
          UPDATE public.courses
          SET search_vector =
            setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
            setweight(to_tsvector('english', coalesce(description, '')), 'B') ||
            setweight(to_tsvector('english', coalesce(category, '')), 'C') ||
            setweight(to_tsvector('english', coalesce("sub_category", '')), 'C') ||
            setweight(to_tsvector('english', coalesce(level, '')), 'D');
        `);

    //  Create trigger function to auto-update column
    await queryRunner.query(`
          CREATE OR REPLACE FUNCTION courses_search_vector_update() RETURNS trigger AS $$
          BEGIN
            NEW.search_vector :=
              setweight(to_tsvector('english', coalesce(NEW.title, '')), 'A') ||
              setweight(to_tsvector('english', coalesce(NEW.description, '')), 'B') ||
              setweight(to_tsvector('english', coalesce(NEW.category, '')), 'C') ||
              setweight(to_tsvector('english', coalesce(NEW."sub_category", '')), 'C') ||
              setweight(to_tsvector('english', coalesce(NEW.level, '')), 'D');
            RETURN NEW;
          END
          $$ LANGUAGE plpgsql;
        `);

    //  Create trigger to keep column in sync
    await queryRunner.query(`
          DROP TRIGGER IF EXISTS trg_courses_search_vector_update ON public.courses;
          CREATE TRIGGER trg_courses_search_vector_update
          BEFORE INSERT OR UPDATE ON public.courses
          FOR EACH ROW
          EXECUTE FUNCTION courses_search_vector_update();
        `);

    //  Create GIN index for full-text search
    await queryRunner.query(`
          CREATE INDEX IF NOT EXISTS idx_courses_fulltext_search
          ON public.courses
          USING GIN (search_vector);
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // rollback — drop index, trigger, function, and column
    await queryRunner.query(
      `DROP INDEX IF EXISTS idx_courses_fulltext_search;`,
    );
    await queryRunner.query(
      `DROP TRIGGER IF EXISTS trg_courses_search_vector_update ON public.courses;`,
    );
    await queryRunner.query(
      `DROP FUNCTION IF EXISTS courses_search_vector_update;`,
    );
    await queryRunner.query(
      `ALTER TABLE public.courses DROP COLUMN IF EXISTS search_vector;`,
    );
  }
}
