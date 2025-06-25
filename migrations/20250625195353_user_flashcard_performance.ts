import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('user_flashcard_performance', (table) => {
    table.increments('id').primary();
    table.string('user_id').references('id').inTable('users');
    table.string('flashcard_id').references('id').inTable('flashcards');
    table.float('ease_factor').notNullable().defaultTo(2.5);
    table.integer('interval').notNullable().defaultTo(1);
    table.date('next_review_date').notNullable();
    table.unique(['user_id', 'flashcard_id']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('user_flashcard_performance');
}