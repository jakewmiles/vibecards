import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('users', (table) => {
    table.string('id').primary();
    table.string('name').notNullable();
  });

  await knex.schema.createTable('flashcards', (table) => {
    table.string('id').primary();
    table.string('topic').notNullable();
    table.text('question').notNullable();
    table.text('answer').notNullable();
  });

  await knex.schema.createTable('user_interests', (table) => {
    table.increments('id').primary();
    table.string('user_id').references('id').inTable('users');
    table.string('topic').notNullable();
    table.float('interest_score').notNullable();
    table.unique(['user_id', 'topic']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('user_interests');
  await knex.schema.dropTable('flashcards');
  await knex.schema.dropTable('users');
}
